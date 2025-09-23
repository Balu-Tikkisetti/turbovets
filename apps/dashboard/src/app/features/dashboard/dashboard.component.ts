import { Component, AfterViewInit, OnDestroy, inject, ComponentRef, Type, ChangeDetectorRef, ViewChild } from '@angular/core';
import { AsyncPipe, CommonModule, NgComponentOutlet } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { selectCurrentUser, AuthState } from '../../core/state/auth.reducer';
import { UserDto, Role, Task } from '@turbovets/data';
import { CreateTaskModalComponent } from '../create-task-modal/create-task-modal.component';
import { ProfileOverlayComponent } from '../profile/profile-overlay.component';
import { MembersComponent } from '../members/members.component';
import { DepartmentsComponent } from '../departments/departments.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { loadTasks } from '../../core/state/task/task.actions';
import { selectFilteredTasks, selectTasksLoading, selectTasksError } from '../../core/state/task/task.selectors';

declare const lucide: {
  createIcons(): void;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [AsyncPipe, CommonModule, NgComponentOutlet, CreateTaskModalComponent, ProfileOverlayComponent, MembersComponent, DepartmentsComponent, ThemeToggleComponent]
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('createTaskModal') createTaskModal?: CreateTaskModalComponent;
  
  isModalVisible = false;
  isProfileOverlayVisible = false;
  activeNavItem = 'dashboard';
  isSidebarOpen = false;
  
  // Lazy loaded components
  TasksComponent: Type<unknown> | null = null;
  CalendarComponent: Type<unknown> | null = null;
  AnalyticsComponent: Type<unknown> | null = null;
  loadingTasks = false;
  loadingCalendar = false;
  loadingAnalytics = false;
  tasksComponentRef: ComponentRef<unknown> | null = null;

  currentUser$: Observable<UserDto | null>;
  Role = Role; // Make Role enum available in template
  
  // Task observables for dashboard display
  tasks$!: Observable<Task[]>;
  tasksLoading$!: Observable<boolean>;
  tasksError$!: Observable<string | null>;
  
  // Lazy loading states for specific sections
  isTasksDataReady = false;
  
  // Memory leak prevention
  private destroy$ = new Subject<void>();
  
  private store: Store<AuthState> = inject(Store);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  constructor() {
    this.currentUser$ = this.store.select(selectCurrentUser);
    this.tasks$ = this.store.select(selectFilteredTasks);
    this.tasksLoading$ = this.store.select(selectTasksLoading);
    this.tasksError$ = this.store.select(selectTasksError);
  }

  ngAfterViewInit(): void {
    // Load all tasks for organization-wide view
    this.store.dispatch(loadTasks());
    
    // Initialize Lucide icons
    setTimeout(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, 100);
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
  }

  onProfileOverlayClose(): void {
    this.isProfileOverlayVisible = false;
  }

  onNavItemClick(navItem: string): void {
    this.activeNavItem = navItem;
    
    // Lazy load components when needed
    if (navItem === 'my-tasks' && !this.TasksComponent) {
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
    } catch (error) {
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
    } catch (error) {
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
      // Handle component loading error silently
    } finally {
      this.loadingAnalytics = false;
    }
  }

  isNavItemActive(navItem: string): boolean {
    return this.activeNavItem === navItem;
  }

  canAccessAnalytics(user: UserDto | null): boolean {
    return user?.role === Role.Owner || user?.role === Role.Admin;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }


  ngOnDestroy(): void {
    // Clean up all subscriptions to prevent memory leaks
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clear any component references
    this.tasksComponentRef = null;
    this.TasksComponent = null;
    this.CalendarComponent = null;
    this.AnalyticsComponent = null;
  }
}