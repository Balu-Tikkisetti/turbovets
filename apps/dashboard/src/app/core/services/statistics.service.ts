import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment.local';
import { JwtRefreshService } from './jwt-refresh.service';
import { TaskStatistics } from '@turbovets/data';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;
  private http = inject(HttpClient);
  private jwtRefreshService = inject(JwtRefreshService);

  private getHeaders(): HttpHeaders {
    return this.jwtRefreshService.getAuthHeaders();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('StatisticsService: Error occurred:', error);
    return throwError(() => error);
  }

  // Get task statistics
  getTaskStatistics(): Observable<TaskStatistics> {
    const headers = this.getHeaders();
    
    return this.http.get<TaskStatistics>(`${this.apiUrl}/tasks`, {
      headers: headers
    }).pipe(
      tap(stats => {
        console.log('StatisticsService: Received task statistics from backend:', stats);
      }),
      catchError(this.handleError)
    );
  }

}