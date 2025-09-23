import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment.local';
import { CreateTaskDto, UpdateTaskDto, TaskInterface } from '@turbovets/data';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  createTask(taskData: CreateTaskDto): Observable<TaskInterface> {
    return this.http.post<TaskInterface>(this.apiUrl, taskData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getTasks(): Observable<TaskInterface[]> {
    console.log('TaskService: Getting tasks from:', this.apiUrl);
    const headers = this.getHeaders();
    console.log('TaskService: Headers prepared');
    
    return this.http.get<TaskInterface[]>(this.apiUrl, {
      headers: headers
    }).pipe(
      tap(tasks => {
        console.log('TaskService: Received tasks from backend:', tasks);
        console.log('TaskService: Number of tasks:', tasks?.length || 0);
      }),
      catchError(error => {
        console.error('TaskService: Error fetching tasks:', error);
        return this.handleError(error);
      })
    );
  }

  getTaskById(id: string): Observable<TaskInterface> {
    return this.http.get<TaskInterface>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateTask(id: string, taskData: UpdateTaskDto): Observable<TaskInterface> {
    return this.http.patch<TaskInterface>(`${this.apiUrl}/${id}`, taskData, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Bulk operations
  bulkDeleteTasks(taskIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk/delete`, { taskIds }, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  bulkUpdateTaskStatus(taskIds: string[], status: string): Observable<TaskInterface[]> {
    return this.http.post<TaskInterface[]>(`${this.apiUrl}/bulk-update-status`, { 
      taskIds, 
      status 
    }, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Additional methods for effects
  moveTaskToDepartment(taskId: string, department: string): Observable<TaskInterface> {
    return this.http.patch<TaskInterface>(`${this.apiUrl}/${taskId}/department`, { department }, {
      headers: this.getHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  bulkUpdateTasks(taskIds: string[], updates: Partial<TaskInterface>): Observable<TaskInterface[]> {
    return this.http.patch<TaskInterface[]>(`${this.apiUrl}/bulk-update`, { taskIds, updates }, {
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
    
    console.error('Task Service Error:', {
      status: error.status,
      message: errorMessage,
      error: error.error,
      url: error.url
    });
    
    return throwError(() => new Error(errorMessage));
  }
}
