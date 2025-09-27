import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map, take } from 'rxjs';
import { selectCurrentUser } from '../state/auth.reducer';
import { Role } from '@turbovets/data';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsGuard implements CanActivate {
  private store = inject(Store);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.store.select(selectCurrentUser).pipe(
      take(1),
      map(user => {
        if (!user) {
          console.warn('AnalyticsGuard: User not authenticated, redirecting to login');
          this.router.navigate(['/auth/login']);
          return false;
        }

        // Only Owners and Admins can access analytics
        if (user.role !== Role.Owner && user.role !== Role.Admin) {
          console.warn(`AnalyticsGuard: Access denied for role ${user.role}. Only Owners and Admins can access analytics.`);
          this.router.navigate(['/dashboard']);
          return false;
        }

        // Additional check for Admin users - they must have a department
        if (user.role === Role.Admin && !user.department) {
          console.warn('AnalyticsGuard: Admin users must have a department assigned to access analytics');
          this.router.navigate(['/dashboard']);
          return false;
        }

   
        return true;
      })
    );
  }
}
