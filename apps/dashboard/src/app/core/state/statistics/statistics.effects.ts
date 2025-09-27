import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { catchError, map, switchMap, withLatestFrom, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
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
import { selectStatisticsLastUpdated } from './statistics.selectors';

@Injectable()
export class StatisticsEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private store = inject(Store);

  // Load Task Statistics Effect
  loadTaskStatistics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTaskStatistics, refreshStatistics),
      withLatestFrom(this.store.select(selectStatisticsLastUpdated)),
      filter(([action, lastUpdated]) => {
        // Only load if data is older than 5 minutes or if it's a refresh
        if (action.type === '[Statistics] Refresh Statistics') {
          return true;
        }
        return !lastUpdated || (Date.now() - lastUpdated) > 5 * 60 * 1000;
      }),
      switchMap(() => {

        return this.http.get<TaskStatistics>('/api/tasks/statistics').pipe(
          map((statistics) => {
      
            return loadTaskStatisticsSuccess({ statistics });
          }),
          catchError((error) => {
            console.error('❌ Failed to load task statistics:', error);
            return of(loadTaskStatisticsFailure({ 
              error: error.message || 'Failed to load task statistics' 
            }));
          })
        );
      })
    )
  );

  // Load Department Statistics Effect
  loadDepartmentStatistics$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadDepartmentStatistics, refreshStatistics),
      withLatestFrom(this.store.select(selectStatisticsLastUpdated)),
      filter(([action, lastUpdated]) => {
        // Only load if data is older than 5 minutes or if it's a refresh
        if (action.type === '[Statistics] Refresh Statistics') {
          return true;
        }
        return !lastUpdated || (Date.now() - lastUpdated) > 5 * 60 * 1000;
      }),
      switchMap(() => {

        return this.http.get<DepartmentStatistics[]>('/api/statistics/departments').pipe(
          map((departmentStatistics) => {
     
            return loadDepartmentStatisticsSuccess({ departmentStatistics });
          }),
          catchError((error) => {
            console.error(' Failed to load department statistics:', error);
            return of(loadDepartmentStatisticsFailure({ 
              error: error.message || 'Failed to load department statistics' 
            }));
          })
        );
      })
    )
  );
}
