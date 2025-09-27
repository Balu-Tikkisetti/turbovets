import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, switchMap, withLatestFrom, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { DepartmentService } from '../../services/department.service';
import { UserService } from '../../services/user.service';
import { 
  loadDepartments, 
  loadDepartmentsSuccess, 
  loadDepartmentsFailure,
  loadUsersByDepartment,
  loadUsersByDepartmentSuccess,
  loadUsersByDepartmentFailure,
  loadAssignableUsers,
  loadAssignableUsersSuccess,
  loadAssignableUsersFailure
} from './department.actions';
import { selectDepartmentState } from './department.selectors';

@Injectable()
export class DepartmentEffects {
  private actions$ = inject(Actions);
  private departmentService = inject(DepartmentService);
  private userService = inject(UserService);
  private store = inject(Store);

  // Load departments effect with caching
  loadDepartments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadDepartments),
      withLatestFrom(this.store.select(selectDepartmentState)),
      filter(([, state]) => {
        // Only load if data is stale or empty
        const isStale = !state.lastUpdated || (Date.now() - state.lastUpdated) > 5 * 60 * 1000;
        const shouldLoad = state.departments.length === 0 || isStale;

        return shouldLoad;
      }),
      switchMap(() => {
 
        return this.departmentService.getDepartmentNames().pipe(
          map((departments) => {
 
            return loadDepartmentsSuccess({ departments });
          }),
          catchError((error) => {
            console.error('Error loading departments:', error);
            return of(loadDepartmentsFailure({ error: error.message }));
          })
        );
      })
    )
  );

  // Load users by department effect with caching
  loadUsersByDepartment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsersByDepartment),
      withLatestFrom(this.store.select(selectDepartmentState)),
      filter(([{ department }, state]) => {
        // Only load if not already loading and data is stale or doesn't exist
        const departmentData = state.departmentUsers[department];
        const isStale = !departmentData || (Date.now() - departmentData.lastUpdated) > 5 * 60 * 1000;
        return !state.loading.users && (!departmentData || isStale);
      }),
      switchMap(([{ department, roles, sortBy }]) => {
        return this.userService.getUsersByDepartment(department, roles, sortBy).pipe(
          map((users) => loadUsersByDepartmentSuccess({ department, users })),
          catchError((error) => of(loadUsersByDepartmentFailure({ department, error: error.message })))
        );
      })
    )
  );

  // Load assignable users effect with caching
  loadAssignableUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAssignableUsers),
      withLatestFrom(this.store.select(selectDepartmentState)),
      filter(([{ department }, state]) => {
        // Only load if data is stale or doesn't exist
        const isStale = !state.assignableUsers || (Date.now() - state.assignableUsers.lastUpdated) > 5 * 60 * 1000;
        const departmentMatches = !department || state.assignableUsers?.department === department;
        return !state.assignableUsers || isStale || !departmentMatches;
      }),
      switchMap(([{ department, excludeCurrentUser }]) => {
  
        return this.userService.getAssignableUsers(department, excludeCurrentUser).pipe(
          map((users) => {
            return loadAssignableUsersSuccess({ users, department });
          }),
          catchError((error) => {
            console.error('Error loading assignable users:', error);
            return of(loadAssignableUsersFailure({ error: error.message }));
          })
        );
      })
    )
  );

  // Auto-refresh effect - DISABLED to prevent performance issues
  // autoRefresh$ = createEffect(() =>
  //   this.actions$.pipe(
  //     ofType(loadDepartmentsSuccess, loadUsersByDepartmentSuccess, loadAssignableUsersSuccess),
  //     switchMap(() =>
  //       // Create an interval that emits every 5 minutes
  //       new Observable(observer => {
  //         const interval = setInterval(() => {
  //           observer.next({ type: '[Department] Auto Refresh' });
  //         }, 5 * 60 * 1000);
          
  //         return () => clearInterval(interval);
  //       })
  //     ),
  //     withLatestFrom(this.store.select(selectIsDepartmentDataStale)),
  //     filter(([, isStale]) => isStale),
  //     map(() => loadDepartments())
  //   )
  // );
}
