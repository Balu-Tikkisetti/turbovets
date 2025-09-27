import { createAction, props } from '@ngrx/store';

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

export interface DepartmentStatistics {
  department: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  averageTasksPerUser: number;
}

// Load Task Statistics
export const loadTaskStatistics = createAction(
  '[Statistics] Load Task Statistics'
);

export const loadTaskStatisticsSuccess = createAction(
  '[Statistics] Load Task Statistics Success',
  props<{ statistics: TaskStatistics }>()
);

export const loadTaskStatisticsFailure = createAction(
  '[Statistics] Load Task Statistics Failure',
  props<{ error: string }>()
);

// Load Department Statistics
export const loadDepartmentStatistics = createAction(
  '[Statistics] Load Department Statistics'
);

export const loadDepartmentStatisticsSuccess = createAction(
  '[Statistics] Load Department Statistics Success',
  props<{ departmentStatistics: DepartmentStatistics[] }>()
);

export const loadDepartmentStatisticsFailure = createAction(
  '[Statistics] Load Department Statistics Failure',
  props<{ error: string }>()
);

// Refresh Statistics
export const refreshStatistics = createAction(
  '[Statistics] Refresh Statistics'
);
