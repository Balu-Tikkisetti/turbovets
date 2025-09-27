import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.local';
import { LoginUserDto, RegisterUserDto, UserSession, UserProfile } from '@turbovets/data';
import { Store } from '@ngrx/store';
import { loginSuccess, logout, AuthState } from '../state/auth.reducer';
import { JwtRefreshService, LoginResponse } from './jwt-refresh.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private http = inject(HttpClient);
  private router = inject(Router);
  private store = inject(Store<AuthState>);
  private jwtRefreshService = inject(JwtRefreshService);

  login(credentials: LoginUserDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        // Use JwtRefreshService to handle token storage and management
        this.jwtRefreshService.setTokens(res);
        
        // Create minimal session data for sessionStorage
        const session: UserSession = {
          id: res.user.id,
          username: res.user.username,
          role: res.user.role,
          department: res.user.department
        };
        
        // Create full user profile for application state
        const userProfile: UserProfile = {
          ...session
          // Note: email and lastLoginAt are not returned from backend login response
          // They can be fetched separately if needed
        };
        
        this.store.dispatch(loginSuccess(userProfile, session));
        
        // Login successful - statistics will be updated via polling
      }),
      catchError(this.handleError)
    );
  }

  register(userData: RegisterUserDto): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/register`, userData).pipe(
      catchError(this.handleError)
    );
  }

  confirm(code: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/confirm`, { code }).pipe(
      catchError(this.handleError)
    );
  }

  logout(): Observable<unknown> {
    const token = this.jwtRefreshService.getAccessToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/logout`, {}, { headers }).pipe(
      tap(() => {
        // Use JwtRefreshService to clear all tokens
        this.jwtRefreshService.clearTokens();
        
        // Logout successful
        
        // Dispatch logout action to clear state
        this.store.dispatch(logout());
      }),
      catchError((error) => {
        // Even if API call fails, clear local data
        this.jwtRefreshService.clearTokens();
        // Logout completed
        this.store.dispatch(logout());
        return this.handleError(error);
      })
    );
  }

  getToken(): string | null {
    return this.jwtRefreshService.getAccessToken();
  }

  checkSessionStatus(): Observable<unknown> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token found'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get(`${environment.apiUrl}/users/session/status`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private hasToken(): boolean {
    return !!this.jwtRefreshService.getAccessToken();
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Backend returned code ${error.status}: ${error.error?.message || JSON.stringify(error.error)}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}