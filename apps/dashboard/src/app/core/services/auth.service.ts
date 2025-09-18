import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.local';
import { LoginUserDto } from 'libs/dto/login-user.dto';
import { RegisterUserDto } from 'libs/data/dto/register-user.dto';
import { UserDto } from 'libs/data/src/lib/dto/user.dto';
import { Store } from '@ngrx/store';
import { loginSuccess, logout, AuthState } from '../state/auth.reducer';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private http: HttpClient;
  private store: Store<AuthState>;

  constructor() {
    this.http = inject(HttpClient);
    this.store = inject(Store);
  }

  login(credentials: LoginUserDto): Observable<{ access_token: string, user: UserDto }> {
    return this.http.post<{ access_token: string, user: UserDto }>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        this.setToken(res.access_token);
        this.store.dispatch(loginSuccess(res.user));
      }),
      catchError(this.handleError)
    );
  }

  register(userData: RegisterUserDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData).pipe(
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
    this.store.dispatch(logout());
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
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