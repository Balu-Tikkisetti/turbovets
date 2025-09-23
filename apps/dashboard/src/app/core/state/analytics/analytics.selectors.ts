import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AnalyticsState } from './analytics.reducer';

export const selectAnalyticsState = createFeatureSelector<AnalyticsState>('analytics');

// Basic selectors - Simplified for audit logs only
export const selectAnalyticsData = createSelector(
  selectAnalyticsState,
  (state) => state.data
);

export const selectAnalyticsFilters = createSelector(
  selectAnalyticsState,
  (state) => state.filters
);

export const selectAnalyticsLoading = createSelector(
  selectAnalyticsState,
  (state) => state.loading
);

export const selectAnalyticsError = createSelector(
  selectAnalyticsState,
  (state) => state.error
);

export const selectAnalyticsLastUpdated = createSelector(
  selectAnalyticsState,
  (state) => state.lastUpdated
);

// Computed selectors - Simplified for audit logs only
export const selectAuditLogs = createSelector(
  selectAnalyticsData,
  (data) => data?.auditLogs || []
);

export const selectTotalCount = createSelector(
  selectAnalyticsData,
  (data) => data?.totalCount || 0
);
