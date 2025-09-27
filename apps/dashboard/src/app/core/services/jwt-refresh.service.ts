import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, fromEvent, merge, EMPTY } from 'rxjs';
import { catchError, switchMap, tap, filter, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { logout } from '../state/auth.reducer';
import { environment } from '../../../environments/environment.local';

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginResponse extends TokenResponse {
  user: {
    id: string;
    username: string;
    role: string;
    department?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class JwtRefreshService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private store = inject(Store);
  
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly ACCESS_TOKEN_KEY = 'auth_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  
  // Token refresh settings
  private readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
  private readonly ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
  
  // Observables for token management
  private tokenRefreshSubject = new BehaviorSubject<boolean>(false);
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  
  // Activity tracking
  private lastActivityTime = Date.now();
  private activityTimer: number | null = null;
  private refreshTimer: number | null = null;

  constructor() {
    this.initializeActivityTracking();
    this.initializeTokenRefresh();
  }

  /**
   * Initialize activity tracking to detect user interactions
   */
  private initializeActivityTracking(): void {
    // Track various user activities
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    merge(...activityEvents.map(event => fromEvent(document, event)))
      .pipe(
        tap(() => this.updateLastActivity()),
        filter(() => this.isTokenValid())
      )
      .subscribe();
  }

  /**
   * Initialize automatic token refresh
   */
  private initializeTokenRefresh(): void {
    if (this.isTokenValid()) {
      this.scheduleTokenRefresh();
    }
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    this.lastActivityTime = Date.now();
    
    // Send activity update to backend (throttled)
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    
    this.activityTimer = setTimeout(() => {
      this.sendActivityUpdate().subscribe();
    }, 5000); // Send every 5 seconds max
  }

  /**
   * Send activity update to backend
   */
  private sendActivityUpdate(): Observable<unknown> {
    const token = this.getAccessToken();
    if (!token) return EMPTY;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/activity`, {}, { headers }).pipe(
      catchError(() => EMPTY) // Ignore errors for activity updates
    );
  }

  /**
   * Check if current token is valid and not expired
   */
  isTokenValid(): boolean {
    const token = this.getAccessToken();
    const expiry = this.getTokenExpiry();
    
    if (!token || !expiry) return false;
    
    return Date.now() < expiry;
  }

  /**
   * Check if user has been active recently
   */
  isUserActive(): boolean {
    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    return timeSinceLastActivity < this.ACTIVITY_TIMEOUT;
  }

  /**
   * Schedule token refresh before expiry
   */
  private scheduleTokenRefresh(): void {
    const expiry = this.getTokenExpiry();
    if (!expiry) return;

    const timeUntilExpiry = expiry - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - this.TOKEN_REFRESH_THRESHOLD, 0);

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      if (this.isUserActive()) {
        this.refreshToken().subscribe();
      } else {
        this.handleSessionTimeout();
      }
    }, refreshTime);
  }

  /**
   * Refresh the access token using refresh token
   */
  refreshToken(): Observable<TokenResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.handleSessionTimeout();
      return EMPTY;
    }

    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        map(token => ({ access_token: token as string, refresh_token: refreshToken, expires_in: 15 * 60 }))
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const body = { refresh_token: refreshToken };
    
    return this.http.post<TokenResponse>(`${this.apiUrl}/refresh`, body).pipe(
      tap((response: TokenResponse) => {
        this.setTokens(response);
        this.refreshTokenSubject.next(response.access_token);
        this.isRefreshing = false;
        this.scheduleTokenRefresh();
      }),
      catchError((error: HttpErrorResponse) => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(null);
        this.handleTokenRefreshError(error);
        return EMPTY;
      })
    );
  }

  /**
   * Handle token refresh errors
   */
  private handleTokenRefreshError(error: HttpErrorResponse): void {
    console.error('Token refresh failed:', error);
    
    if (error.status === 401) {
      this.handleSessionTimeout();
    }
  }

  /**
   * Handle session timeout - logout user and redirect to login
   */
  handleSessionTimeout(): void {

    this.clearTokens();
    this.store.dispatch(logout());
    this.router.navigate(['/auth/login']);
  }

  /**
   * Set tokens in storage
   */
  setTokens(tokenResponse: TokenResponse): void {
    const expiry = Date.now() + (tokenResponse.expires_in * 1000);
    
    sessionStorage.setItem(this.ACCESS_TOKEN_KEY, tokenResponse.access_token);
    sessionStorage.setItem(this.REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
    sessionStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.toString());
  }

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get token expiry timestamp
   */
  getTokenExpiry(): number | null {
    const expiry = sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
    return expiry ? parseInt(expiry, 10) : null;
  }


  /**
   * Clear all tokens from storage
   */
  clearTokens(): void {
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(): boolean {
    const expiry = this.getTokenExpiry();
    if (!expiry) return false;
    
    const timeUntilExpiry = expiry - Date.now();
    return timeUntilExpiry < this.TOKEN_REFRESH_THRESHOLD;
  }

  /**
   * Get authorization headers with current token
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest' // CSRF protection
    });
  }

  /**
   * Intercept HTTP requests to handle token refresh
   */
  interceptRequest(request: { method: string; url: string; [key: string]: unknown }): Observable<unknown> {
    // If token is expired and user is active, try to refresh
    if (!this.isTokenValid() && this.isUserActive()) {
      return this.refreshToken().pipe(
        switchMap(() => {
          // Retry the original request with new token
          const headers = this.getAuthHeaders();
          return this.http.request(request.method, request.url, {
            ...request,
            headers: headers
          });
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.handleSessionTimeout();
          }
          throw error;
        })
      );
    }

    // If token is valid, proceed with request
    if (this.isTokenValid()) {
      return this.http.request(request.method, request.url, {
        ...request,
        headers: this.getAuthHeaders()
      });
    }

    // If token is invalid and user is inactive, handle timeout
    this.handleSessionTimeout();
    return EMPTY;
  }
}
