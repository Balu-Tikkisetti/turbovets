import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditResource, AuditSeverity } from '../entities/audit-log.entity';
import { Role } from '@turbovets/data';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(
    action: AuditAction,
    resource: AuditResource,
    userId: string,
    resourceId?: string,
    description?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
    severity?: AuditSeverity,
    username?: string,
    userRole?: string,
    department?: string,
    sessionId?: string,
    duration?: number,
    isSuccess?: boolean,
    errorMessage?: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      action,
      resource,
      resourceId,
      description,
      metadata,
      ipAddress,
      userAgent,
      userId,
      severity: severity || AuditSeverity.LOW,
      username,
      userRole,
      department,
      sessionId,
      duration,
      isSuccess: isSuccess !== undefined ? isSuccess : true,
      errorMessage,
    });

    return this.auditLogRepository.save(auditLog);
  }

  async findAll(
    userId: string,
    userRole: Role,
    userDepartment?: string,
    page = 1,
    limit = 50,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .orderBy('auditLog.createdAt', 'DESC');

    // Owner can see all audit logs
    if (userRole === Role.Owner) {
      // No additional filters for owner
    }
    // Admin can see audit logs for their department
    else if (userRole === Role.Admin && userDepartment) {
      queryBuilder.andWhere('user.department = :department', { department: userDepartment });
    }
    // Viewer can only see their own audit logs
    else if (userRole === Role.Viewer) {
      queryBuilder.andWhere('auditLog.userId = :userId', { userId });
    }

    const [logs, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }

  async findByResource(
    resource: AuditResource,
    resourceId: string,
    userId: string,
    userRole: Role,
    userDepartment?: string,
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .where('auditLog.resource = :resource', { resource })
      .andWhere('auditLog.resourceId = :resourceId', { resourceId })
      .orderBy('auditLog.createdAt', 'DESC');

    // Apply role-based filtering
    if (userRole === Role.Owner) {
      // Owner can see all logs for any resource
    } else if (userRole === Role.Admin && userDepartment) {
      queryBuilder.andWhere('user.department = :department', { department: userDepartment });
    } else if (userRole === Role.Viewer) {
      queryBuilder.andWhere('auditLog.userId = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async getCriticalActivities(
    userId: string,
    userRole: Role,
    userDepartment?: string,
    limit = 20,
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .where('auditLog.severity IN (:...severities)', { 
        severities: [AuditSeverity.HIGH, AuditSeverity.CRITICAL] 
      })
      .orderBy('auditLog.createdAt', 'DESC')
      .limit(limit);

    // Apply role-based filtering
    if (userRole === Role.Owner) {
      // Owner can see all critical activities
    } else if (userRole === Role.Admin && userDepartment) {
      queryBuilder.andWhere('user.department = :department', { department: userDepartment });
    } else if (userRole === Role.Viewer) {
      queryBuilder.andWhere('auditLog.userId = :userId', { userId });
    }

    return queryBuilder.getMany();
  }

  async getUserActivityMetrics(
    userId: string,
    userRole: Role,
    userDepartment?: string,
    timeRange = 30, // days
  ): Promise<{
    totalActions: number;
    loginCount: number;
    lastLogin: Date | null;
    averageSessionDuration: number;
    mostActiveHours: number[];
    topActions: { action: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    let queryBuilder = this.auditLogRepository
      .createQueryBuilder('auditLog')
      .where('auditLog.createdAt >= :startDate', { startDate });

    // Apply role-based filtering
    if (userRole === Role.Admin && userDepartment) {
      queryBuilder = queryBuilder.leftJoin('auditLog.user', 'user')
        .andWhere('user.department = :department', { department: userDepartment });
    } else if (userRole === Role.Viewer) {
      queryBuilder = queryBuilder.andWhere('auditLog.userId = :userId', { userId });
    }

    const logs = await queryBuilder.getMany();

    // Calculate metrics
    const totalActions = logs.length;
    const loginCount = logs.filter(log => log.action === AuditAction.LOGIN).length;
    const lastLoginLog = logs
      .filter(log => log.action === AuditAction.LOGIN)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const lastLogin = lastLoginLog ? lastLoginLog.createdAt : null;

    // Calculate average session duration
    const sessions: number[] = [];
    let loginTime: Date | null = null;
    for (const log of logs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())) {
      if (log.action === AuditAction.LOGIN) {
        loginTime = new Date(log.createdAt);
      } else if (log.action === AuditAction.LOGOUT && loginTime) {
        const duration = new Date(log.createdAt).getTime() - loginTime.getTime();
        sessions.push(duration);
        loginTime = null;
      }
    }
    const averageSessionDuration = sessions.length > 0 
      ? sessions.reduce((a, b) => a + b, 0) / sessions.length 
      : 0;

    // Calculate most active hours
    const hourCounts: { [hour: number]: number } = {};
    logs.forEach(log => {
      const hour = new Date(log.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const mostActiveHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Calculate top actions
    const actionCounts: { [action: string]: number } = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));

    return {
      totalActions,
      loginCount,
      lastLogin,
      averageSessionDuration,
      mostActiveHours,
      topActions,
    };
  }

  async getSystemHealthMetrics(timeRange= 7): Promise<{
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    criticalErrors: number;
    systemUptime: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    const logs = await this.auditLogRepository
      .createQueryBuilder('auditLog')
      .where('auditLog.createdAt >= :startDate', { startDate })
      .getMany();

    const totalRequests = logs.length;
    const errorCount = logs.filter(log => !log.isSuccess).length;
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
    const criticalErrors = logs.filter(log => 
      log.severity === AuditSeverity.CRITICAL && !log.isSuccess
    ).length;

    // Calculate average response time from duration field
    const logsWithDuration = logs.filter(log => log.duration > 0);
    const averageResponseTime = logsWithDuration.length > 0
      ? logsWithDuration.reduce((sum, log) => sum + log.duration, 0) / logsWithDuration.length
      : 0;

    // Calculate system uptime (simplified - in real implementation, this would come from system monitoring)
    const systemUptime = 99.9; // This would be calculated from actual system metrics

    return {
      totalRequests,
      errorRate,
      averageResponseTime,
      criticalErrors,
      systemUptime,
    };
  }
}
