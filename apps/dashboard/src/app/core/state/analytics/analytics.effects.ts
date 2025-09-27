import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of, interval } from 'rxjs';
import { map, switchMap, catchError, withLatestFrom, takeUntil } from 'rxjs/operators';
import { AnalyticsService } from '../../services/analytics.service';
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
  exportAnalytics,
  exportAnalyticsSuccess,
  exportAnalyticsFailure,
  subscribeToAnalyticsUpdates,
  unsubscribeFromAnalyticsUpdates,
  analyticsUpdateReceived
} from './analytics.actions';
import { selectAnalyticsFilters } from './analytics.selectors';

@Injectable()
export class AnalyticsEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private analyticsService = inject(AnalyticsService);

  // Load Analytics Effect - Simplified for audit logs only
  loadAnalytics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAnalytics),
      withLatestFrom(this.store.select(selectAnalyticsFilters)),
      switchMap(([action, filters]) => {

        return this.analyticsService.getAnalytics(filters).pipe(
          map((response) => {
      
            return loadAnalyticsSuccess({ data: response.data });
          }),
          catchError((error) => {
            console.error('Analytics Effect: Error loading analytics:', error);
            return of(loadAnalyticsFailure({ error: error.message || 'Failed to load audit data' }));
          })
        );
      })
    )
  );

  // Load User Activity Effect
  loadUserActivity$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUserActivity),
      withLatestFrom(this.store.select(selectAnalyticsFilters)),
      switchMap(([, filters]) => {
        return this.analyticsService.getUserActivity(filters).pipe(
          map((response) => loadUserActivitySuccess({ userActivity: response.data })),
          catchError((error) => of(loadUserActivityFailure({ error: error.message || 'Failed to load user activity' })))
        );
      })
    )
  );

  // Load Activity Logs Effect
  loadActivityLogs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadActivityLogs),
      withLatestFrom(this.store.select(selectAnalyticsFilters)),
      switchMap(([, filters]) => {
        return this.analyticsService.getActivityLogs(filters).pipe(
          map((response) => loadActivityLogsSuccess({ activityLogs: response.data })),
          catchError((error) => of(loadActivityLogsFailure({ error: error.message || 'Failed to load activity logs' })))
        );
      })
    )
  );

  // Load Department Stats Effect
  loadDepartmentStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadDepartmentStats),
      withLatestFrom(this.store.select(selectAnalyticsFilters)),
      switchMap(([, filters]) => {
        return this.analyticsService.getDepartmentStats(filters).pipe(
          map((response) => loadDepartmentStatsSuccess({ departmentStats: response.data })),
          catchError((error) => of(loadDepartmentStatsFailure({ error: error.message || 'Failed to load department stats' })))
        );
      })
    )
  );

  // Export Analytics Effect
  exportAnalytics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(exportAnalytics),
      switchMap(({ format, filters }) => {
        return this.analyticsService.exportAnalytics(format, filters).pipe(
          map((response) => exportAnalyticsSuccess({ downloadUrl: response.downloadUrl })),
          catchError((error) => of(exportAnalyticsFailure({ error: error.message || 'Failed to export analytics' })))
        );
      })
    )
  );

  // Real-time Updates Effect - Simplified (removed for now)
}
