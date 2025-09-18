import { createAction, props } from '@ngrx/store';

export const loadTasks = createAction('[Task] Load Tasks');

export const loadTasksSuccess = createAction(
  '[Task] Load Tasks Success',
  props<{ tasks: any[] }>()
);

export const loadTasksFailure = createAction(
  '[Task] Load Tasks Failure',
  props<{ error: any }>()
);

export const createNewTask = createAction(
  '[Task] Create New Task',
  props<{ task: any }>()
);

export const createNewTaskSuccess = createAction(
  '[Task] Create New Task Success',
  props<{ task: any }>()
);

export const createNewTaskFailure = createAction(
  '[Task] Create New Task Failure',
  props<{ error: any }>()
);

export const updateTask = createAction(
  '[Task] Update Task',
  props<{ task: any }>()
);

export const updateTaskSuccess = createAction(
  '[Task] Update Task Success',
  props<{ task: any }>()
);

export const updateTaskFailure = createAction(
  '[Task] Update Task Failure',
  props<{ error: any }>()
);