import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { UserDto, Role } from '@turbovets/data';
import { selectCurrentUserOrSession } from '../../core/state/auth.reducer';
import { 
  loadAnalytics,
  setAnalyticsFilters
} from '../../core/state/analytics/analytics.actions';
import {
  selectAnalyticsData,
  selectAnalyticsLoading,
  selectAnalyticsError,
  selectAnalyticsLastUpdated,
  selectAuditLogs,
  selectTotalCount
} from '../../core/state/analytics/analytics.selectors';
import { 
  AnalyticsData, 
  ActivityLog 
} from '../../core/state/analytics/analytics.actions';

interface TimeRange {
  label: string;
  value: string;
  days: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private destroy$ = new Subject<void>();
  
  // Observables from NgRx state
  currentUser$: Observable<UserDto | null> = this.store.select(selectCurrentUserOrSession);
  
  // Analytics observables - simplified for audit logs only
  analyticsData$: Observable<AnalyticsData | null> = this.store.select(selectAnalyticsData);
  analyticsLoading$: Observable<boolean> = this.store.select(selectAnalyticsLoading);
  analyticsError$: Observable<string | null> = this.store.select(selectAnalyticsError);
  lastUpdated$: Observable<Date | null> = this.store.select(selectAnalyticsLastUpdated);
  
  // Computed observables for audit logs
  auditLogs$: Observable<ActivityLog[]> = this.store.select(selectAuditLogs);
  totalCount$: Observable<number> = this.store.select(selectTotalCount);
  
  // Filters and controls - simplified
  selectedTimeRange = '30';
  
  // Time range options
  timeRanges: TimeRange[] = [
    { label: 'Last 7 days', value: '7', days: 7 },
    { label: 'Last 30 days', value: '30', days: 30 },
    { label: 'Last 90 days', value: '90', days: 90 },
    { label: 'Last year', value: '365', days: 365 }
  ];

  ngOnInit() {
  
    // Initialize analytics component and load data based on user permissions
    this.initializeAnalytics();
  }

  private initializeAnalytics() {
    // Check user permissions and load audit data
    this.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
   
      if (!user) {
      
        return;
      }
      
      if (this.canAccessAnalytics(user)) {
        this.loadAuditData();
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canAccessAnalytics(user: UserDto | null): boolean {

    if (!user) {
     
      return false;
    }
    
    const canAccess = user.role === Role.Owner || user.role === Role.Admin;
 
    return canAccess;
  }

  loadAuditData() {

    // Load audit data with current time range filter
    this.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
    
      if (user && this.canAccessAnalytics(user)) {
     
        this.store.dispatch(loadAnalytics({ 
          filters: { 
            timeRange: this.selectedTimeRange
          } 
        }));
      }
    });
  }

  onTimeRangeChange() {

    // Update filters and reload data when time range changes
    this.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user && this.canAccessAnalytics(user)) {
     
        this.store.dispatch(setAnalyticsFilters({ 
          filters: { timeRange: this.selectedTimeRange } 
        }));
        this.loadAuditData();
      }
    });
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString();
  }

  getRelativeTime(date: Date | string): string {
    const now = new Date();
    const targetDate = new Date(date);
    const diffMs = now.getTime() - targetDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  getActionColor(action: string): string {
    const colors: { [key: string]: string } = {
      'create': 'bg-green-100 text-green-800',
      'update': 'bg-blue-100 text-blue-800',
      'delete': 'bg-red-100 text-red-800',
      'login': 'bg-purple-100 text-purple-800',
      'logout': 'bg-gray-100 text-gray-800',
      'view': 'bg-indigo-100 text-indigo-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  }

  getRoleColor(role: string): string {
    const colors: { [key: string]: string } = {
      'Owner': 'bg-purple-100 text-purple-800',
      'Admin': 'bg-blue-100 text-blue-800',
      'Viewer': 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  }

  refreshAnalytics() {
   
    // Reload audit data with current filters
    this.loadAuditData();
  }

  goToDashboard() {
 
    window.location.href = '/dashboard';
  }
}
