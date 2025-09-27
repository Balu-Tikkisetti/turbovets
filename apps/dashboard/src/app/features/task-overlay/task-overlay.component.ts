import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Task, TaskCategory, TaskPriority, TaskStatus, Role, UserDto } from '@turbovets/data';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';
import { selectCurrentUser } from '../../core/state/auth.reducer';
import { updateTask, deleteTask } from '../../core/state/task/task.actions';

@Component({
  selector: 'app-task-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-overlay.component.html',
  styleUrls: ['./task-overlay.component.scss']
})
export class TaskOverlayComponent implements OnInit, OnDestroy, OnChanges {
  @Input() taskId: string | null = null;
  @Input() isVisible = false;
  @Output() closeOverlay = new EventEmitter<void>();

  // Component state
  task: Task | null = null;
  isEditing = false;
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  error: string | null = null;

  // Current user and permissions
  currentUser$: Observable<UserDto | null>;
  currentUser: UserDto | null = null;
  Role = Role;

  // Form data
  taskForm = {
    title: '',
    description: '',
    priority: '',
    status: '',
    category: '',
    dueDate: '',
    assigneeId: ''
  };

  // Available options
  priorities = ['low', 'medium', 'high', 'critical'];
  statuses = ['to-do', 'started', 'ongoing', 'completed'];
  categories = ['work', 'personal', 'shopping', 'health', 'education', 'other'];

  // Assignable users
  assignableUsers: UserDto[] = [];
  loadingAssignableUsers = false;

  // Subscriptions
  private subscriptions = new Subscription();

  private store = inject(Store);
  private taskService = inject(TaskService);
  private userService = inject(UserService);

  constructor() {
    this.currentUser$ = this.store.select(selectCurrentUser);
  }

  ngOnInit() {
    // Subscribe to current user
    this.subscriptions.add(
      this.currentUser$.subscribe(user => {
        this.currentUser = user;
        
        // Check if user has permission to access task overlay
        if (user && !this.hasAccessPermission(user)) {
          this.closeOverlay.emit();
          return;
        }
        
        if (user && this.isVisible) {
          this.loadAssignableUsers();
        }
      })
    );

    // Load task when visible
    if (this.isVisible && this.taskId) {
      this.loadTask();
    }
  }

  hasAccessPermission(user: UserDto): boolean {
    const userRole = user.role as Role;
    // Owners, Admins, and Viewers can access the task overlay
    // (Viewers can only delete personal tasks they created)
    return userRole === Role.Owner || userRole === Role.Admin || userRole === Role.Viewer;
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  ngOnChanges() {
    if (this.isVisible && this.taskId) {
      this.loadTask();
    }
  }

  loadTask() {
    if (!this.taskId) return;

    this.isLoading = true;
    this.error = null;

    this.taskService.getTaskById(this.taskId).subscribe({
      next: (task) => {
        this.task = task;
        this.populateForm();
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load task details';
        this.isLoading = false;
        console.error('Error loading task:', error);
      }
    });
  }

  loadAssignableUsers() {
    if (!this.currentUser) return;

    this.loadingAssignableUsers = true;
    
    // For Admin users, only get users from their department
    // For Owner users, get all users
    const department = this.currentUser.role === Role.Admin ? this.currentUser.department : undefined;
    
    this.userService.getAssignableUsers(department, true).subscribe({
      next: (users) => {
        this.assignableUsers = users;
        this.loadingAssignableUsers = false;
      },
      error: (error) => {
        console.error('Error loading assignable users:', error);
        this.loadingAssignableUsers = false;
      }
    });
  }

  populateForm() {
    if (!this.task) return;

    this.taskForm = {
      title: this.task.title,
      description: this.task.description || '',
      priority: this.task.priority,
      status: this.task.status,
      category: this.task.category,
      dueDate: this.task.dueDate ? new Date(this.task.dueDate).toISOString().split('T')[0] : '',
      assigneeId: this.task.assigneeId || ''
    };
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateForm(); // Reset form to original values
    }
  }

  saveTask() {
    if (!this.task || !this.taskForm.title.trim()) return;

    this.isSaving = true;
    this.error = null;

    // Create API payload with string date format
    const apiUpdateData = {
      title: this.taskForm.title,
      description: this.taskForm.description,
      priority: this.taskForm.priority as TaskPriority,
      status: this.taskForm.status as TaskStatus,
      category: this.taskForm.category as TaskCategory,
      dueDate: this.taskForm.dueDate || undefined, // String format for API
      assigneeId: this.taskForm.assigneeId || undefined
    };

    this.taskService.updateTask(this.task.id, apiUpdateData).subscribe({
      next: (updatedTask) => {
        this.task = updatedTask;
        this.isEditing = false;
        this.isSaving = false;
        
        // Dispatch action to update store with the updated task data
        const storeUpdateData: Partial<Task> = {
          title: updatedTask.title,
          description: updatedTask.description,
          priority: updatedTask.priority,
          status: updatedTask.status,
          category: updatedTask.category,
          dueDate: updatedTask.dueDate,
          assigneeId: updatedTask.assigneeId,
          updatedAt: updatedTask.updatedAt
        };
        this.store.dispatch(updateTask({ taskId: this.task.id, updates: storeUpdateData }));
      },
      error: (error) => {
        this.error = 'Failed to update task';
        this.isSaving = false;
        console.error('Error updating task:', error);
      }
    });
  }

  deleteTask() {
    if (!this.task || !this.canDeleteTask()) return;

    const confirmed = confirm(`Are you sure you want to delete the task "${this.task.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    this.isDeleting = true;
    this.error = null;

    this.taskService.deleteTask(this.task.id).subscribe({
      next: () => {
        this.isDeleting = false;
        
        // Dispatch action to remove from store
        if (this.task) {
          this.store.dispatch(deleteTask({ taskId: this.task.id }));
        }
        
        // Close overlay
        this.closeOverlay.emit();
      },
      error: (error) => {
        this.error = 'Failed to delete task';
        this.isDeleting = false;
        console.error('Error deleting task:', error);
      }
    });
  }

  close() {
    this.closeOverlay.emit();
  }

  // Permission checking methods
  canEditTask(): boolean {
    if (!this.task || !this.currentUser) return false;
    
    const userRole = this.currentUser.role as Role;
    const taskCategory = this.task.category as TaskCategory;
    const isTaskCreator = this.task.creatorId === this.currentUser.id;
    
    switch (userRole) {
      case Role.Owner:
        return true; // Owner can edit all tasks
      case Role.Admin:
        return true; // Admin can edit all tasks
      case Role.Viewer:
        // Viewer can only edit personal tasks they created
        return taskCategory === TaskCategory.Personal && isTaskCreator;
      default:
        return false;
    }
  }

  canDeleteTask(): boolean {
    if (!this.task || !this.currentUser) return false;
    
    const userRole = this.currentUser.role as Role;
    const taskCategory = this.task.category as TaskCategory;
    const isTaskCreator = this.task.creatorId === this.currentUser.id;
    
    switch (userRole) {
      case Role.Owner:
        return true; // Owner can delete any task
      case Role.Admin:
        return true; // Admin cannot delete tasks (as per backend)
      case Role.Viewer:
        // Viewer can delete personal tasks they created (as per backend)
        return taskCategory === TaskCategory.Personal && isTaskCreator;
      default:
        return false;
    }
  }

  canAssignTask(): boolean {
    if (!this.currentUser) return false;
    
    const userRole = this.currentUser.role as Role;
    
    switch (userRole) {
      case Role.Owner:
      case Role.Admin:
        return true;
      case Role.Viewer:
        return false;
      default:
        return false;
    }
  }

  // Helper methods for display
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'started': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'to-do': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  isOverdue(dueDate: Date | string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  getAssigneeName(assigneeId: string): string {
    const assignee = this.assignableUsers.find(user => user.id === assigneeId);
    return assignee ? assignee.username : 'Unknown User';
  }
}
