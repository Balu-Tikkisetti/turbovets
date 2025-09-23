import { createReducer, on } from '@ngrx/store';
import { 
  loadAnalytics, 
  loadAnalyticsSuccess, 
  loadAnalyticsFailure,
  loadUserActivity,
  loadUserActivitySuccess,
  loadUserActivityFailure,
  loadActivityLogs,
  loadActivityLogsSuccess,
  loadActivityLogsFailure,
  loadDepartmentStats,
  loadDepartmentStatsSuccess,
  loadDepartmentStatsFailure,
  setAnalyticsFilters,
  clearAnalyticsFilters,
  exportAnalytics,
  exportAnalyticsSuccess,
  exportAnalyticsFailure,
  analyticsUpdateReceived
} from './analytics.actions';
import { AnalyticsData, AnalyticsFilters, UserActivityData, ActivityLog, DepartmentStats } from './analytics.actions';

export interface AnalyticsState {
  data: AnalyticsData | null;
  filters: AnalyticsFilters;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const initialAnalyticsState: AnalyticsState = {
  data: null,
  filters: {
    timeRange: '30',
    startDate: undefined,
    endDate: undefined
  },
  loading: false,
  error: null,
  lastUpdated: null
};

export const analyticsReducer = createReducer(
  initialAnalyticsState,

  // Load Analytics - Simplified for audit logs only
  on(loadAnalytics, (state, { filters }) => ({
    ...state,
    loading: true,
    error: null,
    filters: filters ? { ...state.filters, ...filters } : state.filters
  })),

  on(loadAnalyticsSuccess, (state, { data }) => ({
    ...state,
    data,
    loading: false,
    error: null,
    lastUpdated: new Date()
  })),

  on(loadAnalyticsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),

  // Filters
  on(setAnalyticsFilters, (state, { filters }) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  })),

  on(clearAnalyticsFilters, (state) => ({
    ...state,
    filters: initialAnalyticsState.filters
  }))
);
