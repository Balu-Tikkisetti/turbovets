import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StatisticsState } from './statistics.reducer';

export const selectStatisticsState = createFeatureSelector<StatisticsState>('statistics');

export const selectTaskStatistics = createSelector(
  selectStatisticsState,
  (state) => state.taskStatistics
);

export const selectDepartmentStatistics = createSelector(
  selectStatisticsState,
  (state) => state.departmentStatistics
);

export const selectStatisticsLoading = createSelector(
  selectStatisticsState,
  (state) => state.loading
);

export const selectStatisticsError = createSelector(
  selectStatisticsState,
  (state) => state.error
);

export const selectStatisticsLastUpdated = createSelector(
  selectStatisticsState,
  (state) => state.lastUpdated
);

// Computed selectors
export const selectTotalWorkTasks = createSelector(
  selectTaskStatistics,
  (statistics) => statistics?.totalWorkTasks || 0
);

export const selectCompletedTasks = createSelector(
  selectTaskStatistics,
  (statistics) => statistics?.completedTasks || 0
);

export const selectPendingTasks = createSelector(
  selectTaskStatistics,
  (statistics) => statistics?.pendingTasks || 0
);

export const selectInProgressTasks = createSelector(
  selectTaskStatistics,
  (statistics) => statistics?.inProgressTasks || 0
);

export const selectHighPriorityTasks = createSelector(
  selectTaskStatistics,
  (statistics) => statistics?.highPriorityTasks || 0
);

export const selectOverdueTasks = createSelector(
  selectTaskStatistics,
  (statistics) => statistics?.overdueTasks || 0
);

export const selectCompletionRate = createSelector(
  selectTaskStatistics,
  (statistics) => statistics?.completionRate || 0
);

export const selectTasksByDepartment = createSelector(
  selectTaskStatistics,
  (statistics) => statistics?.tasksByDepartment || {}
);

export const selectTasksByStatus = createSelector(
  selectTaskStatistics,
  (statistics) => statistics?.tasksByStatus || {}
);

export const selectTasksByPriority = createSelector(
  selectTaskStatistics,
  (statistics) => statistics?.tasksByPriority || {}
);
