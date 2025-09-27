import { Component, AfterViewInit, OnDestroy, inject, ComponentRef, Type, ChangeDetectorRef, ViewChild } from '@angular/core';
import { AsyncPipe, CommonModule, NgComponentOutlet } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { selectCurrentUserOrSession, AuthState } from '../../core/state/auth.reducer';
import { UserDto, Role, Task, TaskCategory } from '@turbovets/data';
import { CreateTaskModalComponent } from '../create-task-modal/create-task-modal.component';
import { ProfileOverlayComponent } from '../profile/profile-overlay.component';
import { TaskOverlayComponent } from '../task-overlay/task-overlay.component';
import { MembersComponent } from '../members/members.component';
import { DepartmentsComponent } from '../departments/departments.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { loadTasks, loadTaskStatistics } from '../../core/state/task/task.actions';
import { selectFilteredTasks, selectTasksLoading, selectTasksError, selectTaskStatistics } from '../../core/state/task/task.selectors';
import { StatisticsChartComponent } from '../statistics/statistics-chart.component';

declare const lucide: {
  createIcons(): void;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [AsyncPipe, CommonModule, NgComponentOutlet, CreateTaskModalComponent, ProfileOverlayComponent, TaskOverlayComponent, MembersComponent, DepartmentsComponent, ThemeToggleComponent, StatisticsChartComponent]
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('createTaskModal') createTaskModal?: CreateTaskModalComponent;
  
  isModalVisible = false;
  isProfileOverlayVisible = false;
  isTaskOverlayVisible = false;
  selectedTaskId: string | null = null;
  activeNavItem = 'dashboard';
  isSidebarOpen = false;
  
  // Lazy loaded components
  TasksComponent: Type<unknown> | null = null;
  CalendarComponent: Type<unknown> | null = null;
  AnalyticsComponent: Type<unknown> | null = null;
  loadingTasks = false;
  currentTaskType: 'work' | 'my' = 'work';
  loadingCalendar = false;
  loadingAnalytics = false;
  tasksComponentRef: ComponentRef<unknown> | null = null;

  currentUser$: Observable<UserDto | null>;
  currentUser: UserDto | null = null; // For permission checks
  Role = Role; // Make Role enum available in template
  
  // Task observables for dashboard display
  tasks$!: Observable<Task[]>;
  tasksLoading$!: Observable<boolean>;
  tasksError$!: Observable<string | null>;
  taskStatistics$!: Observable<unknown>;
  
  
  // Lazy loading states for specific sections
  isTasksDataReady = false;
  
  // Memory leak prevention
  private destroy$ = new Subject<void>();
  
  private store: Store<AuthState> = inject(Store);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor() {
    this.currentUser$ = this.store.select(selectCurrentUserOrSession);
    this.tasks$ = this.store.select(selectFilteredTasks);
    this.tasksLoading$ = this.store.select(selectTasksLoading);
    this.tasksError$ = this.store.select(selectTasksError);
    this.taskStatistics$ = this.store.select(selectTaskStatistics);
  }

  ngAfterViewInit(): void {
    // Subscribe to current user for permission checks
    this.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Load all tasks for organization-wide view
    this.store.dispatch(loadTasks());
    
    // Load task statistics
    this.store.dispatch(loadTaskStatistics());
    
    // Initialize Lucide icons
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 100);
    
    // Handle window resize to close sidebar on desktop
    window.addEventListener('resize', this.handleResize.bind(this));
  }


  onNewTaskClick(): void {
    this.isModalVisible = true;
    // Load modal data when modal is opened
    setTimeout(() => {
      if (this.createTaskModal && this.createTaskModal.loadModalData) {
        this.createTaskModal.loadModalData();
      }
    }, 0);
  }

  onModalClose(): void {
    this.isModalVisible = false;
  }


  onProfileClick(): void {
    this.isProfileOverlayVisible = true;
    this.cdr.detectChanges();
  }

  onProfileOverlayClose(): void {
    this.isProfileOverlayVisible = false;
  }


  onNavItemClick(navItem: string): void {
    this.activeNavItem = navItem;
    
    // Set task type based on navigation item
    if (navItem === 'tasks' || navItem === 'dashboard') {
      this.currentTaskType = 'work';
    } else if (navItem === 'my-tasks') {
      this.currentTaskType = 'my';
    }
    
    // Lazy load components when needed
    if ((navItem === 'dashboard' || navItem === 'tasks' || navItem === 'my-tasks') && !this.TasksComponent) {
      this.loadTasksComponent();
    }
    
    if (navItem === 'calendar' && !this.CalendarComponent) {
      this.loadCalendarComponent();
    }
    
    if (navItem === 'analytics' && !this.AnalyticsComponent) {
    
      this.loadAnalyticsComponent();
    }
  }

  async loadTasksComponent() {
    if (this.loadingTasks) return;
    
    this.loadingTasks = true;
    try {
      const module = await import('../tasks/tasks.component');
      this.TasksComponent = module.TasksComponent;
    } catch {
      // Handle component loading error silently
    } finally {
      this.loadingTasks = false;
    }
  }

  async loadCalendarComponent() {
    if (this.loadingCalendar) return;
    
    this.loadingCalendar = true;
    try {
      const module = await import('../calendar/calendar.component');
      this.CalendarComponent = module.CalendarComponent;
    } catch {
      // Handle component loading error silently
    } finally {
      this.loadingCalendar = false;
    }
  }

  async loadAnalyticsComponent() {
    if (this.loadingAnalytics) return;
    this.loadingAnalytics = true;
    try {
      const module = await import('../analytics/analytics.component');
      this.AnalyticsComponent = module.AnalyticsComponent;
     
    } catch (error) {
      console.error('Dashboard: Error loading analytics component:', error);
    } finally {
      this.loadingAnalytics = false;
    }
  }

  isNavItemActive(navItem: string): boolean {
    return this.activeNavItem === navItem;
  }

  canAccessAnalytics(user: UserDto | null): boolean {
    const canAccess = user?.role === Role.Owner || user?.role === Role.Admin;
    return canAccess;
  }

  // Permission checking methods for task editing
  canEditTask(task?: Task): boolean {
    if (!this.currentUser) return false;
    
    const userRole = this.currentUser.role as Role;
    
    // Owners and Admins can access all tasks
    if (userRole === Role.Owner || userRole === Role.Admin) {
      return true;
    }
    
    // Viewers can access personal tasks they created
    if (userRole === Role.Viewer && task) {
      const taskCategory = task.category as TaskCategory;
      const isTaskCreator = task.creatorId === this.currentUser.id;
      return taskCategory === TaskCategory.Personal && isTaskCreator;
    }
    
    return false;
  }

  // Check if user can view task details (for display purposes)
  canViewTaskDetails(task: Task): boolean {
    if (!this.currentUser) return false;
    
    const userRole = this.currentUser.role as Role;
    const taskCategory = task.category as TaskCategory;
    const isTaskCreator = task.creatorId === this.currentUser.id;
    const isTaskAssignee = task.assigneeId === this.currentUser.id;
    
    // All users can view tasks they created or are assigned to
    if (isTaskCreator || isTaskAssignee) return true;
    
    // Admins and owners can view all work tasks
    if ((userRole === Role.Owner || userRole === Role.Admin) && taskCategory === TaskCategory.Work) {
      return true;
    }
    
    return false;
  }

  // Check if user can access full tasks management (Owners and Admins only)
  canAccessFullTasksManagement(): boolean {
    if (!this.currentUser) return false;
    
    const userRole = this.currentUser.role as Role;
    
    // Only Owners and Admins can access full tasks management
    return userRole === Role.Owner || userRole === Role.Admin;
  }

  // Check if user can access full tasks management in dashboard (Admins only, not Owners)
  canAccessFullTasksManagementForAdmins(): boolean {
    if (!this.currentUser) return false;
    
    const userRole = this.currentUser.role as Role;
    
    // Only Admins can access full tasks management in dashboard (Owners see charts and overview only)
    return userRole === Role.Admin;
  }

  // Task editing methods
  onTaskClick(task: Task): void {
    if (this.canEditTask(task)) {
      // Open task overlay for editing
      this.selectedTaskId = task.id;
      this.isTaskOverlayVisible = true;
    }
  }

  onTaskOverlayClose(): void {
    this.isTaskOverlayVisible = false;
    this.selectedTaskId = null;
  }

  // Helper methods for task display
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

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    // Prevent body scroll when sidebar is open on mobile
    if (this.isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
    // Restore body scroll
    document.body.style.overflow = '';
  }

  handleResize(): void {
    // Close sidebar when resizing to desktop size
    if (window.innerWidth >= 1024) {
      this.closeSidebar();
    }
  }


  ngOnDestroy(): void {
    // Clean up all subscriptions to prevent memory leaks
    this.destroy$.next();
    this.destroy$.complete();
    
    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Clear any component references
    this.tasksComponentRef = null;
    this.TasksComponent = null;
    this.CalendarComponent = null;
    this.AnalyticsComponent = null;
  }
}