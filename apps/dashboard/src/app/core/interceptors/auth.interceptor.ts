import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { JwtRefreshService } from '../services/jwt-refresh.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private jwtRefreshService = inject(JwtRefreshService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip interceptor for auth endpoints (login, register, refresh)
    if (this.isAuthEndpoint(req.url)) {
      console.log('🔓 Auth endpoint - skipping interceptor:', req.url);
      return next.handle(req);
    }

    // Skip interceptor for public endpoints
    if (this.isPublicEndpoint(req.url)) {
      console.log('🔓 Public endpoint - skipping interceptor:', req.url);
      return next.handle(req);
    }

    // Get current token
    const token = this.jwtRefreshService.getAccessToken();
    const isValid = this.jwtRefreshService.isTokenValid();
    
    console.log('🔍 Interceptor - URL:', req.url);
    console.log('🔍 Interceptor - Token exists:', !!token);
    console.log('🔍 Interceptor - Token valid:', isValid);
    
    // If no token, let the request proceed (will likely fail with 401)
    if (!token) {
      console.log('❌ No token - request will likely fail with 401');
      return next.handle(req);
    }

    // Check if token is valid
    if (isValid) {
      // Token is valid, add it to the request
      console.log('✅ Adding token to request');
      const authReq = this.addTokenToRequest(req, token);
      return next.handle(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
          console.log('❌ Request failed with error:', error.status);
          if (error.status === 401) {
            return this.handle401Error(req, next);
          }
          return throwError(() => error);
        })
      );
    } else {
      // Token is expired, try to refresh
      console.log('🔄 Token expired - attempting refresh');
      return this.handle401Error(req, next);
    }
  }

  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }

  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = ['/health', '/status'];
    return publicEndpoints.some(endpoint => url.includes(endpoint));
  }

  private addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
      setHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  }

  private handle401Error(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check if user is active before attempting refresh
    if (!this.jwtRefreshService.isUserActive()) {
      // User is inactive, handle session timeout
      this.jwtRefreshService.handleSessionTimeout();
      return EMPTY;
    }

    // Try to refresh the token
    return this.jwtRefreshService.refreshToken().pipe(
      switchMap((tokenResponse) => {
        // Token refreshed successfully, retry the original request
        const authReq = this.addTokenToRequest(req, tokenResponse.access_token);
        return next.handle(authReq);
      }),
      catchError(() => {
        // Refresh failed, handle session timeout
        this.jwtRefreshService.handleSessionTimeout();
        return EMPTY;
      })
    );
  }
}
