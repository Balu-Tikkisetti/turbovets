import { createReducer, on } from '@ngrx/store';
import { 
  loadTaskStatistics, 
  loadTaskStatisticsSuccess, 
  loadTaskStatisticsFailure,
  loadDepartmentStatistics,
  loadDepartmentStatisticsSuccess,
  loadDepartmentStatisticsFailure,
  refreshStatistics,
  TaskStatistics,
  DepartmentStatistics
} from './statistics.actions';

export interface StatisticsState {
  taskStatistics: TaskStatistics | null;
  departmentStatistics: DepartmentStatistics[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export const initialState: StatisticsState = {
  taskStatistics: null,
  departmentStatistics: [],
  loading: false,
  error: null,
  lastUpdated: null
};

export const statisticsReducer = createReducer(
  initialState,
  
  // Load Task Statistics
  on(loadTaskStatistics, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(loadTaskStatisticsSuccess, (state, { statistics }) => ({
    ...state,
    taskStatistics: statistics,
    loading: false,
    error: null,
    lastUpdated: Date.now()
  })),
  
  on(loadTaskStatisticsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Load Department Statistics
  on(loadDepartmentStatistics, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(loadDepartmentStatisticsSuccess, (state, { departmentStatistics }) => ({
    ...state,
    departmentStatistics,
    loading: false,
    error: null,
    lastUpdated: Date.now()
  })),
  
  on(loadDepartmentStatisticsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Refresh Statistics
  on(refreshStatistics, (state) => ({
    ...state,
    loading: true,
    error: null
  }))
);
