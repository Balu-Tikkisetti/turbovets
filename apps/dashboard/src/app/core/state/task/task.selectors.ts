import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TaskState } from './task.reducer';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '@turbovets/data';

export const selectTaskState = createFeatureSelector<TaskState>('tasks');

// Basic selectors
export const selectAllTasks = createSelector(
  selectTaskState,
  (state: TaskState) => state.tasks
);

export const selectFilteredTasks = createSelector(
  selectTaskState,
  (state: TaskState) => state.filteredTasks
);

export const selectTasksLoading = createSelector(
  selectTaskState,
  (state: TaskState) => state.loading
);

export const selectTasksError = createSelector(
  selectTaskState,
  (state: TaskState) => state.error
);

export const selectTaskFilters = createSelector(
  selectTaskState,
  (state: TaskState) => state.filters
);

export const selectTaskSort = createSelector(
  selectTaskState,
  (state: TaskState) => state.sort
);

export const selectLastUpdated = createSelector(
  selectTaskState,
  (state: TaskState) => state.lastUpdated
);

// Computed selectors
export const selectTasksByCategory = createSelector(
  selectAllTasks,
  (tasks: Task[]) => {
    return tasks.reduce((acc, task) => {
      const category = task.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(task);
      return acc;
    }, {} as Record<TaskCategory, Task[]>);
  }
);

export const selectTasksByStatus = createSelector(
  selectAllTasks,
  (tasks: Task[]) => {
    return tasks.reduce((acc, task) => {
      const status = task.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    }, {} as Record<TaskStatus, Task[]>);
  }
);

export const selectTasksByPriority = createSelector(
  selectAllTasks,
  (tasks: Task[]) => {
    return tasks.reduce((acc, task) => {
      const priority = task.priority;
      if (!acc[priority]) {
        acc[priority] = [];
      }
      acc[priority].push(task);
      return acc;
    }, {} as Record<TaskPriority, Task[]>);
  }
);

export const selectUserTasks = createSelector(
  selectAllTasks,
  (tasks: Task[], userId: string) => {
    return tasks.filter(task => task.creatorId === userId || task.assigneeId === userId);
  }
);

export const selectTasksByAssignee = createSelector(
  selectAllTasks,
  (tasks: Task[]) => {
    return tasks.reduce((acc, task) => {
      const assigneeId = task.assigneeId || 'unassigned';
      if (!acc[assigneeId]) {
        acc[assigneeId] = [];
      }
      acc[assigneeId].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
  }
);

// Statistics selectors
export const selectTaskStats = createSelector(
  selectAllTasks,
  (tasks: Task[]) => {
    const stats = {
      total: tasks.length,
      byCategory: {} as Record<TaskCategory, number>,
      byStatus: {} as Record<TaskStatus, number>,
      byPriority: {} as Record<TaskPriority, number>,
      overdue: 0,
      dueToday: 0,
      dueThisWeek: 0
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    tasks.forEach(task => {
      // Count by category
      stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
      
      // Count by status
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      
      // Count by priority
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      
      // Count due dates
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        if (dueDate < today) {
          stats.overdue++;
        } else if (dueDate.getTime() === today.getTime()) {
          stats.dueToday++;
        } else if (dueDate <= weekFromNow) {
          stats.dueThisWeek++;
        }
      }
    });
    
    return stats;
  }
);

// Filtered statistics
export const selectFilteredTaskStats = createSelector(
  selectFilteredTasks,
  (tasks: Task[]) => {
    const stats = {
      total: tasks.length,
      byCategory: {} as Record<TaskCategory, number>,
      byStatus: {} as Record<TaskStatus, number>,
      byPriority: {} as Record<TaskPriority, number>
    };
    
    tasks.forEach(task => {
      stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
    });
    
    return stats;
  }
);

// Recent tasks
export const selectRecentTasks = createSelector(
  selectAllTasks,
  (tasks: Task[], count: number = 5) => {
    return tasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, count);
  }
);

// Upcoming tasks
export const selectUpcomingTasks = createSelector(
  selectAllTasks,
  (tasks: Task[], days: number = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter(task => 
        task.dueDate && 
        new Date(task.dueDate) > now && 
        new Date(task.dueDate) <= futureDate &&
        task.status !== 'completed'
      )
      .sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return aDate - bDate;
      });
  }
);

// Overdue tasks
export const selectOverdueTasks = createSelector(
  selectAllTasks,
  (tasks: Task[]) => {
    const now = new Date();
    return tasks
      .filter(task => 
        task.dueDate && 
        new Date(task.dueDate) < now && 
        task.status !== 'completed'
      )
      .sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return aDate - bDate;
      });
  }
);