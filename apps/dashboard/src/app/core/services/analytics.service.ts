import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  AnalyticsData, 
  UserActivityData, 
  ActivityLog, 
  DepartmentStats, 
  AnalyticsFilters,
  SystemMetrics,
  TaskTrendData
} from '../state/analytics/analytics.actions';
import { JwtRefreshService } from './jwt-refresh.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private jwtRefreshService = inject(JwtRefreshService);
  private baseUrl = `${environment.apiUrl}/analytics`;

  private getHeaders(): HttpHeaders {
    return this.jwtRefreshService.getAuthHeaders();
  }

  getAnalytics(filters?: Partial<AnalyticsFilters>): Observable<{ success: boolean; data: AnalyticsData; timestamp: string }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.timeRange) params = params.set('timeRange', filters.timeRange);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
    }

    console.log('Analytics Service: Making request to:', this.baseUrl);
    console.log('Analytics Service: With params:', params.toString());
    console.log('Analytics Service: With headers:', this.getHeaders());

    return this.http.get<{ success: boolean; data: AnalyticsData; timestamp: string }>(this.baseUrl, { 
      params,
      headers: this.getHeaders()
    });
  }

  getUserActivity(filters?: Partial<AnalyticsFilters>): Observable<{ success: boolean; data: UserActivityData[]; timestamp: string }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.timeRange) params = params.set('timeRange', filters.timeRange);
      if (filters.department) params = params.set('department', filters.department);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
    }

    return this.http.get<{ success: boolean; data: UserActivityData[]; timestamp: string }>(`${this.baseUrl}/user-activity`, { 
      params,
      headers: this.getHeaders()
    });
  }

  getActivityLogs(filters?: Partial<AnalyticsFilters>): Observable<{ success: boolean; data: ActivityLog[]; pagination: { page: number; limit: number; total: number }; timestamp: string }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.timeRange) params = params.set('timeRange', filters.timeRange);
      if (filters.department) params = params.set('department', filters.department);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
    }

    return this.http.get<{ success: boolean; data: ActivityLog[]; pagination: { page: number; limit: number; total: number }; timestamp: string }>(`${this.baseUrl}/activity-logs`, { 
      params,
      headers: this.getHeaders()
    });
  }

  getDepartmentStats(filters?: Partial<AnalyticsFilters>): Observable<{ success: boolean; data: DepartmentStats[]; timestamp: string }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.timeRange) params = params.set('timeRange', filters.timeRange);
      if (filters.department) params = params.set('department', filters.department);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
    }

    return this.http.get<{ success: boolean; data: DepartmentStats[]; timestamp: string }>(`${this.baseUrl}/department-stats`, { 
      params,
      headers: this.getHeaders()
    });
  }

  getTaskTrends(filters?: Partial<AnalyticsFilters>): Observable<{ success: boolean; data: TaskTrendData[]; timestamp: string }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.timeRange) params = params.set('timeRange', filters.timeRange);
      if (filters.department) params = params.set('department', filters.department);
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.startDate) params = params.set('startDate', filters.startDate.toISOString());
      if (filters.endDate) params = params.set('endDate', filters.endDate.toISOString());
    }

    return this.http.get<{ success: boolean; data: TaskTrendData[]; timestamp: string }>(`${this.baseUrl}/task-trends`, { 
      params,
      headers: this.getHeaders()
    });
  }

  getSystemMetrics(): Observable<{ success: boolean; data: SystemMetrics; timestamp: string }> {
    return this.http.get<{ success: boolean; data: SystemMetrics; timestamp: string }>(`${this.baseUrl}/system-metrics`, {
      headers: this.getHeaders()
    });
  }

  exportAnalytics(format: 'csv' | 'pdf' | 'excel', filters?: Partial<AnalyticsFilters>): Observable<{ success: boolean; downloadUrl: string; format: string; timestamp: string }> {
    const body = {
      format,
      ...filters
    };

    return this.http.post<{ success: boolean; downloadUrl: string; format: string; timestamp: string }>(`${this.baseUrl}/export`, body, {
      headers: this.getHeaders()
    });
  }

  getRealtimeUpdates(lastUpdate?: string): Observable<{ 
    success: boolean; 
    data: { 
      systemMetrics: SystemMetrics; 
      recentActivity: ActivityLog[]; 
      lastUpdate: string; 
    }; 
    timestamp: string; 
  }> {
    let params = new HttpParams();
    if (lastUpdate) {
      params = params.set('lastUpdate', lastUpdate);
    }

    return this.http.get<{ 
      success: boolean; 
      data: { 
        systemMetrics: SystemMetrics; 
        recentActivity: ActivityLog[]; 
        lastUpdate: string; 
      }; 
      timestamp: string; 
    }>(`${this.baseUrl}/realtime-updates`, { 
      params,
      headers: this.getHeaders()
    });
  }
}
