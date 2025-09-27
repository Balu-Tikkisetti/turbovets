import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { User } from '../entities/user.entity';
import { TaskCategory } from '@turbovets/data';

export interface TaskStatistics {
  totalWorkTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  highPriorityTasks: number;
  overdueTasks: number;
  tasksByDepartment: { [department: string]: number };
  tasksByStatus: { [status: string]: number };
  tasksByPriority: { [priority: string]: number };
  completionRate: number;
  averageTasksPerUser: number;
}


@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getTaskStatisticsCount(): Promise<TaskStatistics> {
    // Get all work tasks across the organization
    const allWorkTasks = await this.taskRepository.find({
      where: { 
        category: TaskCategory.Work 
      }
    });

    // Get total active users
    const totalUsers = await this.userRepository.count({
      where: { isActive: true }
    });

    // Calculate basic statistics
    const totalWorkTasks = allWorkTasks.length;
    const completedTasks = allWorkTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = allWorkTasks.filter(task => task.status !== 'completed').length;
    const inProgressTasks = allWorkTasks.filter(task => 
      task.status === 'ongoing' || task.status === 'started'
    ).length;
    const highPriorityTasks = allWorkTasks.filter(task => 
      task.priority === 'high' || task.priority === 'critical'
    ).length;
    
    // Calculate overdue tasks
    const now = new Date();
    const overdueTasks = allWorkTasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'completed'
    ).length;
    
    // Group by department
    const tasksByDepartment: { [department: string]: number } = {};
    allWorkTasks.forEach(task => {
      const dept = task.department || 'Unassigned';
      tasksByDepartment[dept] = (tasksByDepartment[dept] || 0) + 1;
    });
    
    // Group by status
    const tasksByStatus: { [status: string]: number } = {};
    allWorkTasks.forEach(task => {
      const status = task.status || 'to-do';
      tasksByStatus[status] = (tasksByStatus[status] || 0) + 1;
    });

    // Group by priority
    const tasksByPriority: { [priority: string]: number } = {};
    allWorkTasks.forEach(task => {
      const priority = task.priority || 'medium';
      tasksByPriority[priority] = (tasksByPriority[priority] || 0) + 1;
    });
    
    // Calculate completion rate
    const completionRate = totalWorkTasks > 0 ? (completedTasks / totalWorkTasks) * 100 : 0;
    
    // Calculate average tasks per user
    const averageTasksPerUser = totalUsers > 0 ? totalWorkTasks / totalUsers : 0;
    
    return {
      totalWorkTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      highPriorityTasks,
      overdueTasks,
      tasksByDepartment,
      tasksByStatus,
      tasksByPriority,
      completionRate: Math.round(completionRate * 100) / 100,
      averageTasksPerUser: Math.round(averageTasksPerUser * 100) / 100
    };
  }

}
