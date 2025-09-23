import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { AuditLog, AuditAction, AuditResource, AuditSeverity } from '../entities/audit-log.entity';
import { Role, TaskStatus, TaskPriority, TaskCategory } from '@turbovets/data';

export interface AnalyticsFilters {
  timeRange?: string;
  department?: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UserActivityData {
  userId: string;
  username: string;
  role: string;
  department: string;
  lastLogin: Date;
  totalTasks: number;
  completedTasks: number;
  loginCount: number;
  isActive: boolean;
  sessionDuration: number;
  pageViews: number;
  actionsPerformed: number;
  productivityScore: number;
}

export interface DepartmentStats {
  department: string;
  totalUsers: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageTaskDuration: number;
  productivityScore: number;
  totalHours: number;
  averageHoursPerUser: number;
}

export interface TaskTrendData {
  date: string;
  created: number;
  completed: number;
  overdue: number;
  inProgress: number;
  cancelled: number;
}

export interface SystemMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeSessions: number;
  totalRequests: number;
  averageResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface AnalyticsData {
  totalUsers: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: { [key: string]: number };
  tasksByPriority: { [key: string]: number };
  tasksByCategory: { [key: string]: number };
  tasksByDepartment: { [key: string]: number };
  userActivity: UserActivityData[];
  recentActivity: AuditLog[];
  taskTrends: TaskTrendData[];
  departmentStats: DepartmentStats[];
  systemMetrics: SystemMetrics;
  performanceMetrics: {
    averageTaskCompletionTime: number;
    userEngagementScore: number;
    systemHealthScore: number;
    productivityIndex: number;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async getAnalyticsData(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<AnalyticsData> {
    const dateRange = this.getDateRange(filters.timeRange, filters.startDate, filters.endDate);
    const [totalUsers, totalTasks, completedTasks, overdueTasks] = await Promise.all([
      this.getTotalUsers(filters, userRole, userDepartment),
      this.getTotalTasks(filters, userRole, userDepartment),
      this.getCompletedTasks(filters, userRole, userDepartment),
      this.getOverdueTasks(filters, userRole, userDepartment),
    ]);

    const [tasksByStatus, tasksByPriority, tasksByCategory, tasksByDepartment] = await Promise.all([
      this.getTasksByStatus(filters, userRole, userDepartment),
      this.getTasksByPriority(filters, userRole, userDepartment),
      this.getTasksByCategory(filters, userRole, userDepartment),
      this.getTasksByDepartment(filters, userRole, userDepartment),
    ]);

    const [userActivity, recentActivity, taskTrends, departmentStats, systemMetrics] = await Promise.all([
      this.getUserActivity(filters, userRole, userDepartment),
      this.getRecentActivity(filters, userRole, userDepartment),
      this.getTaskTrends(filters, userRole, userDepartment),
      this.getDepartmentStats(filters, userRole, userDepartment),
      this.getSystemMetrics(),
    ]);

    const performanceMetrics = await this.calculatePerformanceMetrics(filters, userRole, userDepartment);

    return {
      totalUsers,
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksByStatus,
      tasksByPriority,
      tasksByCategory,
      tasksByDepartment,
      userActivity,
      recentActivity,
      taskTrends,
      departmentStats,
      systemMetrics,
      performanceMetrics,
    };
  }

  async getUserActivity(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<UserActivityData[]> {
    const dateRange = this.getDateRange(filters.timeRange, filters.startDate, filters.endDate);
    
    let userQuery = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.assignedTasks', 'task')
      .leftJoin('user.auditLogs', 'auditLog', 
        dateRange.start && dateRange.end 
          ? 'auditLog.createdAt BETWEEN :startDate AND :endDate' 
          : '1=1',
        dateRange.start && dateRange.end 
          ? { startDate: dateRange.start, endDate: dateRange.end }
          : {}
      );

    // Apply role-based filtering
    if (userRole === Role.Admin && userDepartment) {
      userQuery = userQuery.where('user.department = :department', { department: userDepartment });
    } else if (userRole === Role.Viewer) {
      userQuery = userQuery.where('user.id = :userId', { userId: filters.userId });
    }

    const users = await userQuery.getMany();

    // Get audit logs for each user separately to ensure we get all logs
    const userActivityPromises = users.map(async (user) => {
      let auditLogQuery = this.auditLogRepository.createQueryBuilder('auditLog')
        .where('auditLog.userId = :userId', { userId: user.id });

      // Apply date filtering
      if (dateRange.start && dateRange.end) {
        auditLogQuery = auditLogQuery.andWhere('auditLog.createdAt BETWEEN :startDate AND :endDate', {
          startDate: dateRange.start,
          endDate: dateRange.end,
        });
      }

      const auditLogs = await auditLogQuery.getMany();

      const totalTasks = user.assignedTasks?.length || 0;
      const completedTasks = user.assignedTasks?.filter(task => task.status === TaskStatus.Completed).length || 0;
      const loginCount = auditLogs.filter(log => log.action === AuditAction.LOGIN).length;
      const lastLogin = auditLogs
        .filter(log => log.action === AuditAction.LOGIN)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt;
      
      const sessionDuration = this.calculateAverageSessionDuration(auditLogs);
      const pageViews = auditLogs.filter(log => log.action === AuditAction.VIEW).length;
      const actionsPerformed = auditLogs.length;
      const productivityScore = this.calculateProductivityScore(completedTasks, totalTasks, actionsPerformed);

      return {
        userId: user.id,
        username: user.username,
        role: user.role,
        department: user.department || 'Unknown',
        lastLogin: lastLogin || new Date(),
        totalTasks,
        completedTasks,
        loginCount,
        isActive: this.isUserActive(auditLogs),
        sessionDuration,
        pageViews,
        actionsPerformed,
        productivityScore,
      };
    });

    return Promise.all(userActivityPromises);
  }

  async getDepartmentStats(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<DepartmentStats[]> {
    const dateRange = this.getDateRange(filters.timeRange, filters.startDate, filters.endDate);
    
    let query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.tasks', 'task')
      .select([
        'user.department',
        'COUNT(DISTINCT user.id) as totalUsers',
        'COUNT(task.id) as totalTasks',
        'COUNT(CASE WHEN task.status = :completed THEN 1 END) as completedTasks',
        'COUNT(CASE WHEN task.dueDate < NOW() AND task.status != :completed THEN 1 END) as overdueTasks',
      ])
      .setParameter('completed', TaskStatus.Completed)
      .groupBy('user.department');

    // Apply role-based filtering
    if (userRole === Role.Admin && userDepartment) {
      query = query.where('user.department = :department', { department: userDepartment });
    }

    // Apply date filtering
    if (dateRange.start && dateRange.end) {
      query = query.andWhere('task.createdAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
    }

    const results = await query.getRawMany();

    return results.map(result => {
      const totalUsers = parseInt(result.totalUsers) || 0;
      const totalTasks = parseInt(result.totalTasks) || 0;
      const completedTasks = parseInt(result.completedTasks) || 0;
      const overdueTasks = parseInt(result.overdueTasks) || 0;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      return {
        department: result.user_department || 'Unknown',
        totalUsers,
        totalTasks,
        completedTasks,
        overdueTasks,
        completionRate,
        averageTaskDuration: 0, // Calculate based on task completion times
        productivityScore: this.calculateDepartmentProductivityScore(completionRate, overdueTasks, totalUsers),
        totalHours: 0, // Calculate based on time tracking
        averageHoursPerUser: 0, // Calculate based on time tracking
      };
    });
  }

  async getTaskTrends(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<TaskTrendData[]> {
    const dateRange = this.getDateRange(filters.timeRange, filters.startDate, filters.endDate);
    const trends: TaskTrendData[] = [];
    
    const days = this.getDaysInRange(dateRange.start, dateRange.end);
    
    for (const day of days) {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      let query = this.taskRepository.createQueryBuilder('task')
        .select([
          'COUNT(CASE WHEN task.createdAt BETWEEN :start AND :end THEN 1 END) as created',
          'COUNT(CASE WHEN task.updatedAt BETWEEN :start AND :end AND task.status = :completed THEN 1 END) as completed',
          'COUNT(CASE WHEN task.dueDate < :end AND task.status != :completed THEN 1 END) as overdue',
          'COUNT(CASE WHEN task.status = :inProgress THEN 1 END) as inProgress',
          'COUNT(CASE WHEN task.status = :cancelled THEN 1 END) as cancelled',
        ])
        .setParameter('start', dayStart)
        .setParameter('end', dayEnd)
        .setParameter('completed', TaskStatus.Completed)
        .setParameter('inProgress', TaskStatus.Ongoing)
        .setParameter('cancelled', 'cancelled');

      // Apply role-based filtering
      if (userRole === Role.Admin && userDepartment) {
        query = query.leftJoin('task.assignee', 'user')
          .where('user.department = :department', { department: userDepartment });
      }

      const result = await query.getRawOne();

      trends.push({
        date: day.toISOString().split('T')[0],
        created: parseInt(result.created) || 0,
        completed: parseInt(result.completed) || 0,
        overdue: parseInt(result.overdue) || 0,
        inProgress: parseInt(result.inProgress) || 0,
        cancelled: parseInt(result.cancelled) || 0,
      });
    }

    return trends;
  }

  async getRecentActivity(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<AuditLog[]> {
    // Retrieve recent audit activity based on filters and user permissions
    const dateRange = this.getDateRange(filters.timeRange, filters.startDate, filters.endDate);
    
    let query = this.auditLogRepository.createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .orderBy('auditLog.createdAt', 'DESC')
      .limit(100);

    // Apply role-based filtering
    if (userRole === Role.Admin && userDepartment) {
      query = query.where('user.department = :department', { department: userDepartment });
    } else if (userRole === Role.Viewer) {
      query = query.where('auditLog.userId = :userId', { userId: filters.userId });
    }

    // Apply date filtering
    if (dateRange.start && dateRange.end) {
      query = query.andWhere('auditLog.createdAt BETWEEN :startDate AND :endDate', {
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
    }

    const auditLogs = await query.getMany();

    // Transform audit logs to standardized format
    const transformedLogs = auditLogs.map(log => ({
      ...log,
      id: log.id,
      action: log.action,
      resource: log.resource,
      resourceId: log.resourceId,
      description: log.description || `${log.action} ${log.resource}`,
      userId: log.userId,
      username: log.username || log.user?.username || 'Unknown',
      userRole: log.userRole || log.user?.role || 'Unknown',
      department: log.department || log.user?.department || 'Unknown',
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
      metadata: log.metadata,
      severity: log.severity,
    }));

    return transformedLogs;
  }

  async exportAnalytics(format: string, filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<string> {
    const data = await this.getAnalyticsData(filters, userRole, userDepartment);
    
    // Log the export action
    await this.auditLogRepository.save({
      action: AuditAction.EXPORT,
      resource: AuditResource.ANALYTICS,
      userId: filters.userId,
      description: `Exported analytics data in ${format.toUpperCase()} format`,
      metadata: { format, filters },
      severity: AuditSeverity.LOW,
      isSuccess: true,
    });

    // In a real implementation, you would generate the actual file
    // For now, return a mock download URL
    return `/api/analytics/export/download?format=${format}&timestamp=${Date.now()}`;
  }

  private async getTotalUsers(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<number> {
    let query = this.userRepository.createQueryBuilder('user');
    
    if (userRole === Role.Admin && userDepartment) {
      query = query.where('user.department = :department', { department: userDepartment });
    }
    
    return query.getCount();
  }

  private async getTotalTasks(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<number> {
    let query = this.taskRepository.createQueryBuilder('task');
    
    if (userRole === Role.Admin && userDepartment) {
      query = query.leftJoin('task.assignee', 'user')
        .where('user.department = :department', { department: userDepartment });
    }
    
    return query.getCount();
  }

  private async getCompletedTasks(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<number> {
    let query = this.taskRepository.createQueryBuilder('task')
      .where('task.status = :status', { status: TaskStatus.Completed });
    
    if (userRole === Role.Admin && userDepartment) {
      query = query.leftJoin('task.assignee', 'user')
        .andWhere('user.department = :department', { department: userDepartment });
    }
    
    return query.getCount();
  }

  private async getOverdueTasks(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<number> {
    let query = this.taskRepository.createQueryBuilder('task')
      .where('task.dueDate < NOW()')
      .andWhere('task.status != :status', { status: TaskStatus.Completed });
    
    if (userRole === Role.Admin && userDepartment) {
      query = query.leftJoin('task.assignee', 'user')
        .andWhere('user.department = :department', { department: userDepartment });
    }
    
    return query.getCount();
  }

  private async getTasksByStatus(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<{ [key: string]: number }> {
    let query = this.taskRepository.createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.status');
    
    if (userRole === Role.Admin && userDepartment) {
      query = query.leftJoin('task.assignee', 'user')
        .where('user.department = :department', { department: userDepartment });
    }
    
    const results = await query.getRawMany();
    return results.reduce((acc, result) => {
      acc[result.status] = parseInt(result.count);
      return acc;
    }, {});
  }

  private async getTasksByPriority(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<{ [key: string]: number }> {
    let query = this.taskRepository.createQueryBuilder('task')
      .select('task.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.priority');
    
    if (userRole === Role.Admin && userDepartment) {
      query = query.leftJoin('task.assignee', 'user')
        .where('user.department = :department', { department: userDepartment });
    }
    
    const results = await query.getRawMany();
    return results.reduce((acc, result) => {
      acc[result.priority] = parseInt(result.count);
      return acc;
    }, {});
  }

  private async getTasksByCategory(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<{ [key: string]: number }> {
    let query = this.taskRepository.createQueryBuilder('task')
      .select('task.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.category');
    
    if (userRole === Role.Admin && userDepartment) {
      query = query.leftJoin('task.assignee', 'user')
        .where('user.department = :department', { department: userDepartment });
    }
    
    const results = await query.getRawMany();
    return results.reduce((acc, result) => {
      acc[result.category] = parseInt(result.count);
      return acc;
    }, {});
  }

  private async getTasksByDepartment(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<{ [key: string]: number }> {
    let query = this.taskRepository.createQueryBuilder('task')
      .leftJoin('task.assignee', 'user')
      .select('user.department', 'department')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.department');
    
    if (userRole === Role.Admin && userDepartment) {
      query = query.where('user.department = :department', { department: userDepartment });
    }
    
    const results = await query.getRawMany();
    return results.reduce((acc, result) => {
      acc[result.department || 'Unassigned'] = parseInt(result.count);
      return acc;
    }, {});
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    // Get metrics from audit logs for the last 24 hours
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const [totalRequests, errorCount, avgResponseTime, activeSessions] = await Promise.all([
      this.auditLogRepository.count({
        where: { createdAt: Between(last24Hours, new Date()) }
      }),
      this.auditLogRepository.count({
        where: { 
          createdAt: Between(last24Hours, new Date()),
          isSuccess: false 
        }
      }),
      this.auditLogRepository
        .createQueryBuilder('auditLog')
        .select('AVG(auditLog.duration)', 'avgDuration')
        .where('auditLog.createdAt >= :date', { date: last24Hours })
        .andWhere('auditLog.duration > 0')
        .getRawOne(),
      this.auditLogRepository
        .createQueryBuilder('auditLog')
        .select('COUNT(DISTINCT auditLog.sessionId)', 'activeSessions')
        .where('auditLog.createdAt >= :date', { date: last24Hours })
        .andWhere('auditLog.sessionId IS NOT NULL')
        .getRawOne()
    ]);

    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    const averageResponseTime = avgResponseTime?.avgDuration ? parseFloat(avgResponseTime.avgDuration) : 0;

    return {
      uptime: 99.9, // This would come from system monitoring
      responseTime: averageResponseTime,
      errorRate: Math.round(errorRate * 100) / 100,
      activeSessions: parseInt(activeSessions?.activeSessions) || 0,
      totalRequests,
      averageResponseTime,
      memoryUsage: 68.5, // This would come from system monitoring
      cpuUsage: 23.2, // This would come from system monitoring
    };
  }

  private async calculatePerformanceMetrics(filters: AnalyticsFilters, userRole: Role, userDepartment?: string): Promise<any> {
    // Calculate various performance metrics
    const totalTasks = await this.getTotalTasks(filters, userRole, userDepartment);
    const completedTasks = await this.getCompletedTasks(filters, userRole, userDepartment);
    
    return {
      averageTaskCompletionTime: 2.5, // days
      userEngagementScore: 8.7,
      systemHealthScore: 9.2,
      productivityIndex: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }

  private getDateRange(timeRange?: string, startDate?: Date, endDate?: Date): { start: Date; end: Date } {
    const end = endDate || new Date();
    let start: Date;

    if (startDate) {
      start = startDate;
    } else {
      const days = parseInt(timeRange || '30');
      start = new Date();
      start.setDate(start.getDate() - days);
    }

    return { start, end };
  }

  private getDaysInRange(start: Date, end: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }

  private calculateAverageSessionDuration(auditLogs: AuditLog[]): number {
    // Calculate average session duration based on login/logout pairs
    const sessions: number[] = [];
    let loginTime: Date | null = null;

    for (const log of auditLogs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())) {
      if (log.action === AuditAction.LOGIN) {
        loginTime = new Date(log.createdAt);
      } else if (log.action === AuditAction.LOGOUT && loginTime) {
        const duration = new Date(log.createdAt).getTime() - loginTime.getTime();
        sessions.push(duration);
        loginTime = null;
      }
    }

    return sessions.length > 0 ? sessions.reduce((a, b) => a + b, 0) / sessions.length : 0;
  }

  private isUserActive(auditLogs: AuditLog[]): boolean {
    const lastActivity = auditLogs
      ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    if (!lastActivity) return false;
    
    const hoursSinceLastActivity = (new Date().getTime() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceLastActivity < 24; // Active if last activity was within 24 hours
  }

  private calculateProductivityScore(completedTasks: number, totalTasks: number, actionsPerformed: number): number {
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const activityScore = Math.min(actionsPerformed / 10, 10); // Cap at 10
    return Math.round((completionRate * 0.7 + activityScore * 0.3) * 10) / 10;
  }

  private calculateDepartmentProductivityScore(completionRate: number, overdueTasks: number, totalUsers: number): number {
    const overduePenalty = Math.min(overdueTasks * 2, 20); // Max penalty of 20
    const userEfficiency = totalUsers > 0 ? Math.min(totalUsers / 5, 10) : 0; // Cap at 10
    return Math.round((completionRate * 0.6 + userEfficiency * 0.4 - overduePenalty) * 10) / 10;
  }
}
