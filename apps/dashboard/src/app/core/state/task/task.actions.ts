import { createAction, props } from '@ngrx/store';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '@turbovets/data';

export interface TaskFilters {
  searchTerm: string;
  category: TaskCategory | '';
  status: TaskStatus | '';
  priority: TaskPriority | '';
  assigneeId: string | '';
  creatorId: string | '';
  department: string | '';
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface TaskSortOptions {
  field: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title' | 'status';
  direction: 'asc' | 'desc';
}

// Load Tasks Actions
export const loadTasks = createAction('[Tasks] Load Tasks');
export const loadTasksSuccess = createAction(
  '[Tasks] Load Tasks Success',
  props<{ tasks: Task[] }>()
);
export const loadTasksFailure = createAction(
  '[Tasks] Load Tasks Failure',
  props<{ error: string }>()
);

// Load My Tasks Actions
export const loadMyTasks = createAction('[Tasks] Load My Tasks');
export const loadMyTasksSuccess = createAction(
  '[Tasks] Load My Tasks Success',
  props<{ tasks: Task[] }>()
);
export const loadMyTasksFailure = createAction(
  '[Tasks] Load My Tasks Failure',
  props<{ error: string }>()
);

// Load Task Statistics Actions
export const loadTaskStatistics = createAction('[Tasks] Load Task Statistics');
export const loadTaskStatisticsSuccess = createAction(
  '[Tasks] Load Task Statistics Success',
  props<{ statistics: any }>()
);
export const loadTaskStatisticsFailure = createAction(
  '[Tasks] Load Task Statistics Failure',
  props<{ error: string }>()
);

// Create Task Actions
export const createTask = createAction(
  '[Tasks] Create Task',
  props<{ task: Partial<Task> }>()
);
export const createTaskSuccess = createAction(
  '[Tasks] Create Task Success',
  props<{ task: Task }>()
);
export const createTaskFailure = createAction(
  '[Tasks] Create Task Failure',
  props<{ error: string }>()
);

// Update Task Actions
export const updateTask = createAction(
  '[Tasks] Update Task',
  props<{ taskId: string; updates: Partial<Task> }>()
);
export const updateTaskSuccess = createAction(
  '[Tasks] Update Task Success',
  props<{ task: Task }>()
);
export const updateTaskFailure = createAction(
  '[Tasks] Update Task Failure',
  props<{ error: string }>()
);

// Delete Task Actions
export const deleteTask = createAction(
  '[Tasks] Delete Task',
  props<{ taskId: string }>()
);
export const deleteTaskSuccess = createAction(
  '[Tasks] Delete Task Success',
  props<{ taskId: string }>()
);
export const deleteTaskFailure = createAction(
  '[Tasks] Delete Task Failure',
  props<{ error: string }>()
);

// Filter and Sort Actions
export const setTaskFilters = createAction(
  '[Tasks] Set Filters',
  props<{ filters: Partial<TaskFilters> }>()
);
export const clearTaskFilters = createAction('[Tasks] Clear Filters');

export const setTaskSort = createAction(
  '[Tasks] Set Sort',
  props<{ sort: TaskSortOptions }>()
);

// Bulk Actions
export const bulkUpdateTasks = createAction(
  '[Tasks] Bulk Update Tasks',
  props<{ taskIds: string[]; updates: Partial<Task> }>()
);
export const bulkUpdateTasksSuccess = createAction(
  '[Tasks] Bulk Update Tasks Success',
  props<{ tasks: Task[] }>()
);
export const bulkUpdateTasksFailure = createAction(
  '[Tasks] Bulk Update Tasks Failure',
  props<{ error: string }>()
);

export const bulkDeleteTasks = createAction(
  '[Tasks] Bulk Delete Tasks',
  props<{ taskIds: string[] }>()
);
export const bulkDeleteTasksSuccess = createAction(
  '[Tasks] Bulk Delete Tasks Success',
  props<{ taskIds: string[] }>()
);
export const bulkDeleteTasksFailure = createAction(
  '[Tasks] Bulk Delete Tasks Failure',
  props<{ error: string }>()
);

// Bulk Status Update Actions
export const bulkUpdateTaskStatus = createAction(
  '[Tasks] Bulk Update Task Status',
  props<{ taskIds: string[]; status: TaskStatus }>()
);
export const bulkUpdateTaskStatusSuccess = createAction(
  '[Tasks] Bulk Update Task Status Success',
  props<{ tasks: Task[] }>()
);
export const bulkUpdateTaskStatusFailure = createAction(
  '[Tasks] Bulk Update Task Status Failure',
  props<{ error: string }>()
);

// User-specific Actions
export const loadUserTasks = createAction(
  '[Tasks] Load User Tasks',
  props<{ userId: string }>()
);
export const loadTasksByCategory = createAction(
  '[Tasks] Load Tasks By Category',
  props<{ category: TaskCategory }>()
);

// Move Task Between Departments
export const moveTaskToDepartment = createAction(
  '[Tasks] Move Task To Department',
  props<{ taskId: string; department: string }>()
);
export const moveTaskToDepartmentSuccess = createAction(
  '[Tasks] Move Task To Department Success',
  props<{ task: Task }>()
);
export const moveTaskToDepartmentFailure = createAction(
  '[Tasks] Move Task To Department Failure',
  props<{ error: string }>()
);

// Assign Task Actions
export const assignTask = createAction(
  '[Tasks] Assign Task',
  props<{ taskId: string; assigneeId: string }>()
);
export const assignTaskSuccess = createAction(
  '[Tasks] Assign Task Success',
  props<{ task: Task }>()
);
export const assignTaskFailure = createAction(
  '[Tasks] Assign Task Failure',
  props<{ error: string }>()
);