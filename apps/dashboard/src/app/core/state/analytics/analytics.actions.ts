import { createAction, props } from '@ngrx/store';

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

export interface ActivityLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  userId: string;
  username: string;
  userRole: string;
  department: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  metadata?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TaskTrendData {
  date: string;
  created: number;
  completed: number;
  overdue: number;
  inProgress: number;
  cancelled: number;
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
  auditLogs: ActivityLog[];
  totalCount: number;
  timeRange: string;
  filters: AnalyticsFilters;
}

// Load Analytics Actions
export const loadAnalytics = createAction(
  '[Analytics] Load Analytics',
  props<{ filters?: Partial<AnalyticsFilters> }>()
);
export const loadAnalyticsSuccess = createAction(
  '[Analytics] Load Analytics Success',
  props<{ data: AnalyticsData }>()
);
export const loadAnalyticsFailure = createAction(
  '[Analytics] Load Analytics Failure',
  props<{ error: string }>()
);

// Load User Activity Actions
export const loadUserActivity = createAction(
  '[Analytics] Load User Activity',
  props<{ filters?: Partial<AnalyticsFilters> }>()
);
export const loadUserActivitySuccess = createAction(
  '[Analytics] Load User Activity Success',
  props<{ userActivity: UserActivityData[] }>()
);
export const loadUserActivityFailure = createAction(
  '[Analytics] Load User Activity Failure',
  props<{ error: string }>()
);

// Load Activity Logs Actions
export const loadActivityLogs = createAction(
  '[Analytics] Load Activity Logs',
  props<{ filters?: Partial<AnalyticsFilters> }>()
);
export const loadActivityLogsSuccess = createAction(
  '[Analytics] Load Activity Logs Success',
  props<{ activityLogs: ActivityLog[] }>()
);
export const loadActivityLogsFailure = createAction(
  '[Analytics] Load Activity Logs Failure',
  props<{ error: string }>()
);

// Load Department Stats Actions
export const loadDepartmentStats = createAction(
  '[Analytics] Load Department Stats',
  props<{ filters?: Partial<AnalyticsFilters> }>()
);
export const loadDepartmentStatsSuccess = createAction(
  '[Analytics] Load Department Stats Success',
  props<{ departmentStats: DepartmentStats[] }>()
);
export const loadDepartmentStatsFailure = createAction(
  '[Analytics] Load Department Stats Failure',
  props<{ error: string }>()
);

// Filter Actions
export const setAnalyticsFilters = createAction(
  '[Analytics] Set Filters',
  props<{ filters: Partial<AnalyticsFilters> }>()
);
export const clearAnalyticsFilters = createAction('[Analytics] Clear Filters');

// Export Actions
export const exportAnalytics = createAction(
  '[Analytics] Export Analytics',
  props<{ format: 'csv' | 'pdf' | 'excel'; filters?: Partial<AnalyticsFilters> }>()
);
export const exportAnalyticsSuccess = createAction(
  '[Analytics] Export Analytics Success',
  props<{ downloadUrl: string }>()
);
export const exportAnalyticsFailure = createAction(
  '[Analytics] Export Analytics Failure',
  props<{ error: string }>()
);

// Real-time Updates
export const subscribeToAnalyticsUpdates = createAction('[Analytics] Subscribe to Updates');
export const unsubscribeFromAnalyticsUpdates = createAction('[Analytics] Unsubscribe from Updates');
export const analyticsUpdateReceived = createAction(
  '[Analytics] Update Received',
  props<{ data: Partial<AnalyticsData> }>()
);
