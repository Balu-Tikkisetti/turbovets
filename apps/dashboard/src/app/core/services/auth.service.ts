import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.local';
import { LoginUserDto } from 'libs/data/src/lib/dto/login-user.dto';
import { RegisterUserDto } from 'libs/data/src/lib/dto/register-user.dto';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private http: HttpClient;

  constructor() {
    this.http = inject(HttpClient);
  }

  login(credentials: LoginUserDto): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        this.setToken(res.access_token);
      }),
      catchError(this.handleError)
    );
  }

  register(userData: RegisterUserDto): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/register`, userData).pipe(
      tap(res => {
        if (res.access_token) {
          this.setToken(res.access_token); 
        }
      }),
      catchError(this.handleError)
    );
  }
  
  confirm(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm`, { code }).pipe(
      catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isAuthenticatedSubject.next(true);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
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