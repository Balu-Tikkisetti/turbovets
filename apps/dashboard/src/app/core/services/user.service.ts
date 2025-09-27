import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.local';
import { UserDto } from '@turbovets/data';
import { JwtRefreshService } from './jwt-refresh.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private http = inject(HttpClient);
  private jwtRefreshService = inject(JwtRefreshService);

  getProfileDetails(): Observable<UserDto> {
    const headers = this.jwtRefreshService.getAuthHeaders();

    return this.http.get<UserDto>(`${this.apiUrl}/profile/details`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getAllUsers(): Observable<UserDto[]> {
    const headers = this.jwtRefreshService.getAuthHeaders();

    return this.http.get<UserDto[]>(`${this.apiUrl}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  updateUser(userId: string, updateData: { role?: string; department?: string | null }): Observable<UserDto> {
    const headers = this.jwtRefreshService.getAuthHeaders();

    return this.http.patch<UserDto>(`${this.apiUrl}/${userId}`, updateData, { headers }).pipe(
      catchError(this.handleError)
    );
  }



  getUsersByDepartment(
    department: string, 
    roles?: string[], 
    sortBy: 'role' | 'name' = 'role'
  ): Observable<UserDto[]> {
    const headers = this.jwtRefreshService.getAuthHeaders();
    let url = `${this.apiUrl}/by-department/${encodeURIComponent(department)}`;
    
    const params = new URLSearchParams();
    if (roles && roles.length > 0) {
      params.append('roles', roles.join(','));
    }
    params.append('sortBy', sortBy);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<UserDto[]>(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  getAssignableUsers(
    department?: string, 
    excludeCurrentUser = true
  ): Observable<UserDto[]> {
    const headers = this.jwtRefreshService.getAuthHeaders();
    let url = `${this.apiUrl}/assignable`;
    
    const params = new URLSearchParams();
    if (department) {
      params.append('department', department);
    }
    params.append('excludeCurrentUser', excludeCurrentUser.toString());
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<UserDto[]>(url, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Backend returned code ${error.status}: ${error.error?.message || JSON.stringify(error.error)}`;
    }
    console.error('UserService Error:', errorMessage);
    console.error('Full error object:', error);
    return throwError(() => new Error(errorMessage));
  }
}
