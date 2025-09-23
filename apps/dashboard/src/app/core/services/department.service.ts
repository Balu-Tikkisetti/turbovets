import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.local';
import { JwtRefreshService } from './jwt-refresh.service';

export interface Department {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  taskCount: number;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDepartmentDto {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/departments`;
  private http = inject(HttpClient);
  private jwtRefreshService = inject(JwtRefreshService);

  private getHeaders(): HttpHeaders {
    return this.jwtRefreshService.getAuthHeaders();
  }

  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getDepartmentById(id: string): Observable<Department> {
    return this.http.get<Department>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  createDepartment(departmentData: CreateDepartmentDto): Observable<Department> {
    return this.http.post<Department>(this.apiUrl, departmentData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateDepartment(id: string, departmentData: UpdateDepartmentDto): Observable<Department> {
    return this.http.patch<Department>(`${this.apiUrl}/${id}`, departmentData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Network Error: ${error.error.message}`;
    } else {
      // Server-side error
      const status = error.status;
      const serverError = error.error;
      
      switch (status) {
        case 400:
          errorMessage = serverError?.message || 'Bad Request: Invalid data provided';
          break;
        case 401:
          errorMessage = 'Unauthorized: Please log in again';
          break;
        case 403:
          errorMessage = 'Forbidden: You do not have permission to perform this action';
          break;
        case 404:
          errorMessage = serverError?.message || 'Not Found: The requested resource was not found';
          break;
        case 409:
          errorMessage = serverError?.message || 'Conflict: The operation conflicts with existing data';
          break;
        case 422:
          errorMessage = serverError?.message || 'Validation Error: Please check your input';
          break;
        case 500:
          errorMessage = 'Server Error: Please try again later';
          break;
        default:
          errorMessage = serverError?.message || `Server returned code ${status}`;
      }
    }
    
    console.error('Department Service Error:', {
      status: error.status,
      message: errorMessage,
      error: error.error,
      url: error.url
    });
    
    return throwError(() => new Error(errorMessage));
  }
}
