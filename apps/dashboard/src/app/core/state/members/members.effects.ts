import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, map, switchMap, withLatestFrom, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { UserService } from '../../services/user.service';
import { 
  loadMembers, 
  loadMembersSuccess, 
  loadMembersFailure,
  updateMember,
  updateMemberSuccess,
  updateMemberFailure,
  MemberWithStatus
} from './members.actions';
import { selectMembersState } from './members.selectors';

@Injectable()
export class MembersEffects {
  private actions$ = inject(Actions);
  private userService = inject(UserService);
  private store = inject(Store);

  // Load members effect with caching
  loadMembers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMembers),
      withLatestFrom(this.store.select(selectMembersState)),
      filter(([, state]) => {
        // Only load if not already loading and data is stale (older than 5 minutes)
        const isStale = !state.lastUpdated || (Date.now() - state.lastUpdated) > 5 * 60 * 1000;
        return !state.loading && (state.members.length === 0 || isStale);
      }),
      switchMap(() => {
        return this.userService.getAllUsers().pipe(
          map((users) => {
            // Filter out current user and add online status
            return users.map(user => ({
              ...user,
              isOnline: this.determineOnlineStatus(user),
              lastSeen: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined
            }));
          }),
          map((members: MemberWithStatus[]) => loadMembersSuccess({ members })),
          catchError((error) => of(loadMembersFailure({ error: error.message })))
        );
      })
    )
  );

  // Update member effect
  updateMember$ = createEffect(() =>
    this.actions$.pipe(
      ofType(updateMember),
      switchMap(({ memberId, updateData }) =>
        this.userService.updateUser(memberId, updateData).pipe(
          map((updatedUser) => {
            const member: MemberWithStatus = {
              ...updatedUser,
              isOnline: this.determineOnlineStatus(updatedUser),
              lastSeen: updatedUser.lastLoginAt ? new Date(updatedUser.lastLoginAt) : undefined
            };
            return updateMemberSuccess({ member });
          }),
          catchError((error) => of(updateMemberFailure({ error: error.message })))
        )
      )
    )
  );

  // Auto-refresh online status every 30 seconds
  autoRefreshOnlineStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadMembersSuccess),
      switchMap(() =>
        // Create an interval that emits every 30 seconds
        new Observable(observer => {
          const interval = setInterval(() => {
            observer.next({ type: '[Members] Auto Refresh Online Status' });
          }, 30000);
          
          return () => clearInterval(interval);
        })
      ),
      map(() => ({ type: '[Members] Update Online Status' }))
    )
  );

  private determineOnlineStatus(user: { lastLoginAt?: string }): boolean {
    if (!user.lastLoginAt) return false;
    const lastLogin = new Date(user.lastLoginAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);
    return diffMinutes <= 5;
  }
}

// Helper Observable for interval
import { Observable } from 'rxjs';
