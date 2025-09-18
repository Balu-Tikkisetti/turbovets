import { createReducer, on } from '@ngrx/store';
import * as TaskActions from './task.actions';

export interface TaskState {
  tasks: any[];
  loading: boolean;
  error: any;
}

export const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

export const taskReducer = createReducer(
  initialState,

  on(TaskActions.loadTasks, state => ({ ...state, loading: true, error: null })),
  on(TaskActions.loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks,
    loading: false,
  })),
  on(TaskActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(TaskActions.createNewTask, state => ({ ...state, loading: true, error: null })),
  on(TaskActions.createNewTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task],
    loading: false,
  })),
  on(TaskActions.createNewTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(TaskActions.updateTask, state => ({ ...state, loading: true, error: null })),
  on(TaskActions.updateTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map(t => (t.id === task.id ? task : t)),
    loading: false,
  })),
  on(TaskActions.updateTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);