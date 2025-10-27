import { Component, OnInit, OnDestroy, inject, HostListener, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { Task, TaskCategory, TaskPriority, TaskStatus, UserDto, Role } from '@turbovets/data';
import { CdkDropList, CdkDrag } from '@angular/cdk/drag-drop';
import { selectCurrentUser } from '../../core/state/auth.reducer';
import { UserService } from '../../core/services/user.service';
import { 
  loadTasks, 
  loadMyTasks,
  createTask, 
  updateTask, 
  deleteTask,
  assignTask,
  setTaskFilters, 
  clearTaskFilters,
  setTaskSort,
  bulkUpdateTaskStatus,
  TaskFilters,
  TaskSortOptions
} from '../../core/state/mytask/mytask.actions';
import { 
  selectFilteredTasks, 
  selectMyTasks,
  selectFilteredMyTasks,
  selectTasksLoading, 
  selectMyTasksLoading,
  selectTasksError,
  selectTaskStats,
  selectFilteredTaskStats,
  selectOverdueTasks,
  selectUpcomingTasks,
  selectTasksTotal,
  selectTasksPage,
  selectTasksTotalPages,
  selectTasksHasNext
} from '../../core/state/mytask/mytask.selectors';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDropList, CdkDrag],
  templateUrl: './mytasks.component.html',
  styleUrls: ['./mytasks.component.scss']
})
export class TasksComponent implements OnInit, OnDestroy {
  @Input() taskType: 'work' | 'my' = 'work'; // Default to work tasks
  private store = inject(Store);
  private userService = inject(UserService);
  
  // Expose enums for template use
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;
  TaskCategory = TaskCategory;
  Role = Role;
  
  // Observables from NgRx state
  currentUser$: Observable<UserDto | null> = this.store.select(selectCurrentUser);
  
  // Dynamic selectors based on task type
  get filteredTasks$(): Observable<Task[]> {
    return this.taskType === 'my' 
      ? this.store.select(selectFilteredMyTasks)
      : this.store.select(selectFilteredTasks);
  }
  
  get loading$(): Observable<boolean> {
    return this.taskType === 'my'
      ? this.store.select(selectMyTasksLoading)
      : this.store.select(selectTasksLoading);
  }
  
  error$: Observable<string | null> = this.store.select(selectTasksError);
  get taskStats$(): Observable<any> {
    return this.taskType === 'my'
      ? this.store.select(selectMyTasks).pipe(
          map(tasks => this.calculateMyTaskStats(tasks))
        )
      : this.store.select(selectTaskStats);
  }
  
  get filteredStats$(): Observable<any> {
    return this.taskType === 'my'
      ? this.store.select(selectFilteredMyTasks).pipe(
          map(tasks => this.calculateMyTaskStats(tasks))
        )
      : this.store.select(selectFilteredTaskStats);
  }
  overdueTasks$: Observable<Task[]> = this.store.select(selectOverdueTasks);
  upcomingTasks$: Observable<Task[]> = this.store.select(selectUpcomingTasks);
  
  // Pagination observables
  totalTasks$: Observable<number> = this.store.select(selectTasksTotal);
  currentPage$: Observable<number> = this.store.select(selectTasksPage);
  totalPages$: Observable<number> = this.store.select(selectTasksTotalPages);
  hasNext$: Observable<boolean> = this.store.select(selectTasksHasNext);
  
  // Pagination properties
  currentPage = 1;
  totalTasks = 0;
  totalPages = 0;
  pageSize = 10;
  hasNext = false;
  
  // Local filter state
  filters: TaskFilters = {
    searchTerm: '',
    category: '',
    status: '',
    priority: '',
    assigneeId: '',
    creatorId: '',
    department: '',
    dateRange: {
      start: null,
      end: null
    }
  };
  
  // Sort options
  sortOptions: TaskSortOptions = {
    field: 'createdAt',
    direction: 'desc'
  };
  
  // View options
  viewMode: 'list' | 'grid' | 'kanban' = 'list';
  showFilters = false;
  showCompleted = true;
  
  // Modal state
  showEditModal = false;
  selectedTask: Task | null = null;
  isSaving = false;
  
  // Advanced filtering and sorting
  searchTerm = '';
  activeFilter = 'all';
 
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Quick filters
  quickFilters = ['All', 'Work', 'Personal'];
  
  // Task statuses for Kanban
  taskStatuses = ['to-do', 'started', 'ongoing', 'completed'];
  
  // Form data
  taskForm = {
    title: '',
    description: '',
    category: TaskCategory.Work,
    priority: TaskPriority.Medium,
    status: TaskStatus.ToDo,
    department: '',
    startDate: '',     // ← Add this
    startTime: '',
    dueDate: '',
    dueTime: '',
    recurring: false,
    assigneeId: ''
  };
  
  // Available options
  categories = [
    { value: TaskCategory.Work, label: 'Work', icon: 'briefcase' },
    { value: TaskCategory.Personal, label: 'Personal', icon: 'user' }
  ];
  
  priorities = [
    { value: TaskPriority.Critical, label: 'Critical', color: 'red' },
    { value: TaskPriority.High, label: 'High', color: 'orange' },
    { value: TaskPriority.Medium, label: 'Medium', color: 'yellow' },
    { value: TaskPriority.Low, label: 'Low', color: 'green' }
  ];
  
  statuses = [
    { value: TaskStatus.ToDo, label: 'To Do', color: 'gray' },
    { value: TaskStatus.Started, label: 'Started', color: 'blue' },
    { value: TaskStatus.Ongoing, label: 'Ongoing', color: 'purple' },
    { value: TaskStatus.Completed, label: 'Completed', color: 'green' }
  ];
  
  sortFields = [
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title' },
    { value: 'status', label: 'Status' }
  ];
  
  departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  
  private subscription: Subscription = new Subscription();

  // Current user for permission checks
  currentUser: UserDto | null = null;

  // Assignable users for dropdown
  assignableUsers: UserDto[] = [];
  loadingAssignableUsers = false;

  // Keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    // Prevent shortcuts when typing in inputs
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    // Ctrl/Cmd + N: Create new task
    if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
      event.preventDefault();
      this.openCreateModal();
    }

    // Ctrl/Cmd + A: Select all tasks
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      this.selectAllTasks();
    }

    // Escape: Clear selection or close modals
    if (event.key === 'Escape') {
      if (this.showEditModal) {
        this.closeModals();
      } else {
        this.clearSelection();
      }
    }

    // Delete: Delete selected tasks
    if (event.key === 'Delete' && this.selectedTasks.size > 0) {
      event.preventDefault();
     
    }

    // Space: Toggle completed filter
    if (event.key === ' ' && !event.target) {
      event.preventDefault();
      this.toggleCompleted();
    }

    // 1-4: Quick filter by priority
    if (event.key >= '1' && event.key <= '4') {
      event.preventDefault();
      const priorities = [TaskPriority.Critical, TaskPriority.High, TaskPriority.Medium, TaskPriority.Low];
      const priorityIndex = parseInt(event.key) - 1;
      if (priorityIndex < priorities.length) {
        this.updateFilters({ priority: priorities[priorityIndex] });
      }
    }
  }





  ngOnInit() {

    
    // Subscribe to current user for permission checks
    this.subscription.add(
      this.currentUser$.subscribe(user => {
        this.currentUser = user; // This stores the user locally
        
        // Load assignable users if user is Owner or Admin
        if (user && (user.role === Role.Owner || user.role === Role.Admin)) {
          this.loadAssignableUsers();
        }
      })
    );
    
    // Load my tasks data
      this.store.dispatch(loadMyTasks({ page: this.currentPage, limit: this.pageSize }));
    
    
    // Debug: Subscribe to loading state
    this.subscription.add(
      this.loading$.subscribe(loading => {
        console.log('TasksComponent: Loading state changed:', loading);
      })
    );
    
    // Debug: Subscribe to error state
    this.subscription.add(
      this.error$.subscribe(error => {
        if (error) {
          console.error('TasksComponent: Error loading tasks:', error);
        }
      })
    );
    
    // Debug: Subscribe to filtered tasks
    this.subscription.add(
      this.filteredTasks$.subscribe(tasks => {
        console.log('TasksComponent: Filtered tasks updated:', tasks?.length || 0, 'tasks');
      })
    );
    
    // Subscribe to pagination state
    this.subscription.add(
      this.totalTasks$.subscribe(total => {
        this.totalTasks = total;
      })
    );
    
    this.subscription.add(
      this.currentPage$.subscribe(page => {
        this.currentPage = page;
      })
    );
    
    this.subscription.add(
      this.totalPages$.subscribe(totalPages => {
        this.totalPages = totalPages;
      })
    );
    
    this.subscription.add(
      this.hasNext$.subscribe(hasNext => {
        this.hasNext = hasNext;
      })
    );
    
    // Set up real-time updates
    const interval = setInterval(() => {

      if (this.taskType === 'my') {
        this.store.dispatch(loadMyTasks({ page: this.currentPage, limit: this.pageSize }));
      } else {
        this.store.dispatch(loadTasks({ page: this.currentPage, limit: this.pageSize }));
      }
    }, 60000); // Update every minute
    
    this.subscription.add({ unsubscribe: () => clearInterval(interval) });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Filter methods
  onSearchChange() {
    this.updateFilters({ searchTerm: this.filters.searchTerm });
  }

  onCategoryChange() {
    this.updateFilters({ category: this.filters.category });
  }

  onStatusChange() {
    this.updateFilters({ status: this.filters.status });
  }

  onPriorityChange() {
    this.updateFilters({ priority: this.filters.priority });
  }

  onDepartmentChange() {
    this.updateFilters({ department: this.filters.department });
  }

  onDateRangeChange() {
    this.updateFilters({ dateRange: this.filters.dateRange });
  }

  updateFilters(filters: Partial<TaskFilters>) {
    this.filters = { ...this.filters, ...filters };
    this.store.dispatch(setTaskFilters({ filters }));
  }

  // Helper methods for template
  setWorkFilter() {
    this.updateFilters({ category: 'work' as any });
  }

  setPersonalFilter() {
    this.updateFilters({ category: 'personal' as any });
  }

  retryLoadTasks() {
    if (this.taskType === 'my') {
      this.store.dispatch(loadMyTasks({ page: this.currentPage, limit: this.pageSize }));
    } else {
      this.store.dispatch(loadTasks({ page: this.currentPage, limit: this.pageSize }));
    }
  }


  clearFilters() {
    this.filters = {
      searchTerm: '',
      category: '',
      status: '',
      priority: '',
      assigneeId: '',
      creatorId: '',
      department: '',
      dateRange: {
        start: null,
        end: null
      }
    };
    this.store.dispatch(clearTaskFilters());
  }

  // Sort methods
  onSortChange() {
    this.store.dispatch(setTaskSort({ sort: this.sortOptions }));
  }

  toggleSortDirection() {
    this.sortOptions.direction = this.sortOptions.direction === 'asc' ? 'desc' : 'asc';
    this.onSortChange();
  }

  // View methods
  setViewMode(mode: 'list' | 'grid' | 'kanban') {
    this.viewMode = mode;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  toggleCompleted() {
    this.showCompleted = !this.showCompleted;
    if (!this.showCompleted) {
      this.updateFilters({ status: TaskStatus.Completed });
    } else {
      this.updateFilters({ status: '' });
    }
  }

  // Task CRUD methods
  openCreateModal() {
    // This method is kept for compatibility but the actual create modal is handled by the dashboard
    console.log('Create task modal should be opened from dashboard');
  }

  openEditModal(task: Task) {
    this.selectedTask = task;
    this.taskForm = {
      title: task.title,
      description: task.description || '',
      category: task.category as any,
      priority: task.priority as any,
      status: task.status as any,
      department: task.department || '',
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',  
      startTime: task.startTime || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      dueTime: task.dueTime || '',
      recurring: task.recurring,
      assigneeId: task.assigneeId || ''
    };
    this.showEditModal = true;
  }

  // Enhanced delete with confirmation
  deleteTask(task: Task) {
    const confirmed = confirm(`Are you sure you want to delete "${task.title}"?\n\nThis action cannot be undone.`);
    if (confirmed && this.currentUser) {
      this.store.dispatch(deleteTask({ taskId: task.id }) );
    }
  }

  // Bulk operations
  selectedTasks: Set<string> = new Set();
  
  toggleTaskSelection(taskId: string) {
    if (this.selectedTasks.has(taskId)) {
      this.selectedTasks.delete(taskId);
    } else {
      this.selectedTasks.add(taskId);
    }
  }

  selectAllTasks() {
    this.filteredTasks$.pipe(take(1)).subscribe(tasks => {
      if (tasks) {
        this.selectedTasks.clear();
        tasks.forEach(task => this.selectedTasks.add(task.id));
      }
    });
  }

  clearSelection() {
    this.selectedTasks.clear();
  }



  bulkUpdateStatus(status: TaskStatus) {
    if (this.selectedTasks.size === 0) return;
    
    const taskIds = Array.from(this.selectedTasks);
    this.store.dispatch(bulkUpdateTaskStatus({ taskIds, status }));
    
    // Clear selection after dispatching update
    this.clearSelection();
  }

  closeModals() {
    this.showEditModal = false;
    this.selectedTask = null;
    this.resetForm();
  }

  resetForm() {
    this.taskForm = {
      title: '',
      description: '',
      category: TaskCategory.Work,
      priority: TaskPriority.Medium,
      status: TaskStatus.ToDo,
      department: '',
      startDate: '',
      startTime: '',
      dueDate: '',
      dueTime: '',
      recurring: false,
      assigneeId: ''
    };
  }

  saveTask() {
    if (!this.taskForm.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    
    this.isSaving = true;
    
    if (this.selectedTask) {
      // Prepare update payload with only allowed fields
      const updates: Partial<Task> = {
        title: this.taskForm.title,
        description: this.taskForm.description || undefined,
        priority: this.taskForm.priority,
        status: this.taskForm.status,
        dueDate: this.taskForm.dueDate ? new Date(this.taskForm.dueDate) : undefined,
        dueTime: this.taskForm.dueTime || undefined,
      };
      
      // Add conditional fields based on category
      if (this.selectedTask.category === TaskCategory.Personal) {
        updates.startDate = this.taskForm.startDate ? new Date(this.taskForm.startDate) : undefined;
        updates.startTime = this.taskForm.startTime || undefined;
        updates.recurring = this.taskForm.recurring || false;
      }
      
      // Add department for work tasks
      if (this.selectedTask.category === TaskCategory.Work && this.taskForm.department) {
        updates.department = this.taskForm.department;
      }
      
      // Add assigneeId if user has permission and field is set
      if (this.canReassignTask() && this.taskForm.assigneeId) {
        updates.assigneeId = this.taskForm.assigneeId;
      }
      
      // Update existing task
      this.store.dispatch(updateTask({ 
        taskId: this.selectedTask.id, 
        updates: updates
      }));
      
      // Close modal after a short delay to allow state to update
      setTimeout(() => {
        this.isSaving = false;
        this.closeModals();
      }, 500);
    } else {
      // Create new task - needs all fields
      const taskData = {
        ...this.taskForm,
        dueDate: this.taskForm.dueDate ? new Date(this.taskForm.dueDate) : undefined,
        startDate: this.taskForm.startDate ? new Date(this.taskForm.startDate) : undefined,
        dueTime: this.taskForm.dueTime || undefined,
        startTime: this.taskForm.startTime || undefined,
      } as Task;
      
      this.store.dispatch(createTask({ task: taskData }));
      
      setTimeout(() => {
        this.isSaving = false;
        this.closeModals();
      }, 500);
    }
  }


  toggleTaskStatus(task: Task) {
    const newStatus = task.status === TaskStatus.Completed ? TaskStatus.ToDo : TaskStatus.Completed;
    this.store.dispatch(updateTask({ 
      taskId: task.id, 
      updates: { status: newStatus, updatedAt: new Date() }
    }));
  }

  // Utility methods
  getPriorityColor(priority: TaskPriority): string {
    const priorityMap = {
      [TaskPriority.Critical]: 'red',
      [TaskPriority.High]: 'orange',
      [TaskPriority.Medium]: 'yellow',
      [TaskPriority.Low]: 'green'
    };
    return priorityMap[priority] || 'gray';
  }

  getStatusColor(status: TaskStatus): string {
    const statusMap = {
      [TaskStatus.ToDo]: 'gray',
      [TaskStatus.Started]: 'blue',
      [TaskStatus.Ongoing]: 'purple',
      [TaskStatus.Completed]: 'green'
    };
    return statusMap[status] || 'gray';
  }

  getCategoryIcon(category: TaskCategory): string {
    return category === TaskCategory.Work ? 'briefcase' : 'user';
  }

  isOverdue(dueDate: Date | string): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  isDueToday(task: Task): boolean {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString();
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString();
  }

  formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleString();
  }

  getRelativeTime(date: Date | string): string {
    const now = new Date();
    const taskDate = new Date(date);
    const diffMs = now.getTime() - taskDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }

  getTasksByStatus(tasks: Task[] | null, status: string): Task[] {
    if (!tasks) return [];
    return tasks.filter(task => task.status === status);
  }

  getTaskCountByStatus(tasks: Task[] | null, status: string): number {
    return this.getTasksByStatus(tasks, status).length;
  }

  // Template helper methods to avoid type casting issues
  getCategoryIconSafe(category: any): string {
    return this.getCategoryIcon(category);
  }

  getPriorityColorSafe(priority: any): string {
    return this.getPriorityColor(priority);
  }

  getStatusColorSafe(status: any): string {
    return this.getStatusColor(status);
  }

  // Quick filter button styling
  getQuickFilterClasses(filter: string): string {
    const isActive = this.activeFilter === filter.toLowerCase().replace(' ', '-');
    const baseClasses = 'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 shadow-sm';
    
    if (isActive) {
      switch (filter) {
        case 'All':
          return `${baseClasses} bg-blue-500 text-white shadow-blue-200 dark:shadow-blue-800 ring-2 ring-blue-300 dark:ring-blue-600`;
        case 'Work':
          return `${baseClasses} bg-purple-500 text-white shadow-purple-200 dark:shadow-purple-800 ring-2 ring-purple-300 dark:ring-purple-600`;
        case 'Personal':
          return `${baseClasses} bg-green-500 text-white shadow-green-200 dark:shadow-green-800 ring-2 ring-green-300 dark:ring-green-600`;
        default:
          return `${baseClasses} bg-blue-500 text-white shadow-blue-200 dark:shadow-blue-800 ring-2 ring-blue-300 dark:ring-blue-600`;
      }
    } else {
      return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-md`;
    }
  }

  // Advanced filtering and sorting methods
  applyQuickFilter(filter: string) {
    this.activeFilter = filter.toLowerCase().replace(' ', '-');
    
    switch (filter) {
      case 'All':
        this.store.dispatch(clearTaskFilters());
        break;
      case 'Work':
        this.store.dispatch(setTaskFilters({ 
          filters: { category: TaskCategory.Work } 
        }));
        break;
      case 'Personal':
        this.store.dispatch(setTaskFilters({ 
          filters: { category: TaskCategory.Personal } 
        }));
        break;
      case 'My Tasks':
        // Filter for user's own tasks (created by or assigned to user)
        // This will be handled by a custom filter function
        this.store.dispatch(clearTaskFilters());
        break;
      case 'Overdue':
        // Filter for overdue tasks
        this.store.dispatch(setTaskFilters({ 
          filters: { 
            dateRange: {
              start: null,
              end: new Date()
            }
          } 
        }));
        break;
      case 'High Priority':
        this.store.dispatch(setTaskFilters({ 
          filters: { priority: TaskPriority.High } 
        }));
        break;
      case 'Completed':
        this.store.dispatch(setTaskFilters({ 
          filters: { status: TaskStatus.Completed } 
        }));
        break;
    }
  }

  // Utility methods for template
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'critical': return 'alert-triangle';
      case 'high': return 'arrow-up';
      case 'medium': return 'minus';
      case 'low': return 'arrow-down';
      default: return 'circle';
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

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'check-circle';
      case 'ongoing': return 'play-circle';
      case 'started': return 'play';
      case 'to-do': return 'circle';
      default: return 'circle';
    }
  }
  canEditTaskWithUser(task: Task, user: UserDto | null): boolean {
    if (!user) return false;
    const userRole = user.role as Role;
    const isCreator = task.creatorId === user.id;
  
    // Owners/Admins can edit all
    if (userRole === Role.Owner || userRole === Role.Admin) return true;
  
    // Viewers: only personal tasks they created
    return task.category === TaskCategory.Personal && isCreator;
  }
  
  canDeleteTaskWithUser(task: Task, user: UserDto | null): boolean {
    if (!user) return false;
    const userRole = user.role as Role;
    const isCreator = task.creatorId === user.id;
  
    if (userRole === Role.Owner) return true;
    return task.category === TaskCategory.Personal && isCreator;
  }
  
  canReassignTask(): boolean {
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

  // Check if task should be visible in "My Tasks" section
  canViewTaskInMyTasks(task: Task): boolean {
    if (!this.currentUser) return false;
    
    const userRole = this.currentUser.role as Role;
    const taskCategory = task.category as TaskCategory;
    const isTaskCreator = task.creatorId === this.currentUser.id;
    const isTaskAssignee = task.assigneeId === this.currentUser.id;
    
    // Must be either creator or assignee to see in "My Tasks"
    if (!isTaskCreator && !isTaskAssignee) {
      return false;
    }

    switch (userRole) {
      case Role.Owner:
        // Owner can see all work tasks + their own personal tasks
        if (taskCategory === TaskCategory.Work) {
          return true; // Can see all work tasks they created/assigned
        } else {
          return isTaskCreator; // Can only see personal tasks they created
        }
        
      case Role.Admin:
        // Admin can see work tasks they created/assigned + their own personal tasks
        if (taskCategory === TaskCategory.Work) {
          return true; // Can see all work tasks they created/assigned
        } else {
          return isTaskCreator; // Can only see personal tasks they created
        }
        
      case Role.Viewer:
        // Viewer can see personal tasks they created/assigned + work tasks they created/assigned
        return true; // Can see both personal and work tasks they created or are assigned to
        
      default:
        return false;
    }
  }

  // Get tasks for "My Tasks" section
  getMyTasks(tasks: Task[]): Task[] {
    return tasks.filter(task => this.canViewTaskInMyTasks(task));
  }

  // Get filtered tasks based on active filter
  getFilteredTasksForDisplay(tasks: Task[] | null): Task[] {
    if (!tasks) return [];
    if (this.activeFilter === 'my-tasks') {
      return this.getMyTasks(tasks);
    }
    return tasks;
  }

  // Helper method to get filtered tasks length safely
  getFilteredTasksLength(): number {
    let length = 0;
    this.filteredTasks$.pipe(take(1)).subscribe(tasks => {
      length = tasks?.length || 0;
    });
    return length;
  }

  // Calculate completion rate
  getCompletionRate(): number {
    let completionRate = 0;
    this.taskStats$.pipe(take(1)).subscribe(stats => {
      if (stats && stats.total > 0) {
        completionRate = Math.round((stats.completed / stats.total) * 100);
      }
    });
    return completionRate;
  }

  calculateMyTaskStats(tasks: Task[]): any {
    if (!tasks || tasks.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
        high: 0,
        medium: 0,
        low: 0
      };
    }

    const now = new Date();
    const overdue = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < now && task.status !== TaskStatus.Completed
    ).length;

    return {
      total: tasks.length,
      completed: tasks.filter(task => task.status === TaskStatus.Completed).length,
      inProgress: tasks.filter(task => task.status === TaskStatus.Started || task.status === TaskStatus.Ongoing).length,
      pending: tasks.filter(task => task.status === TaskStatus.ToDo).length,
      overdue,
      high: tasks.filter(task => task.priority === TaskPriority.High).length,
      medium: tasks.filter(task => task.priority === TaskPriority.Medium).length,
      low: tasks.filter(task => task.priority === TaskPriority.Low).length
    };
  }

  // Edit task method
  editTask(task: Task) {
    this.currentUser$.pipe(take(1)).subscribe(user => {
      if (!this.canEditTaskWithUser(task, user)) {
        console.warn('User does not have permission to edit this task');
        return;
      }
  
      this.selectedTask = task;
      this.taskForm = {
        title: task.title,
        description: task.description || '',
        category: task.category as any,
        priority: task.priority as any,
        status: task.status as any,
        department: task.department || '',
        startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',  
        startTime: task.startTime || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        dueTime: task.dueTime || '',
        recurring: task.recurring || false,
        assigneeId: task.assigneeId || ''
      };
  
      this.showEditModal = true;
    });
  }
  

  // Assign task method
  assignTask(task: Task, assigneeId: string) {
    if (!this.canReassignTask()) {
      console.warn('User does not have permission to assign tasks');
      return;
    }
    
    this.store.dispatch(assignTask({ taskId: task.id, assigneeId }));
  }

  // Load assignable users for dropdown
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

  // Pagination methods
  goToPage(page: number | string) {
    const pageNumber = typeof page === 'string' ? parseInt(page, 10) : page;
    if (pageNumber >= 1 && pageNumber <= this.totalPages && pageNumber !== this.currentPage) {
      this.currentPage = pageNumber;
      this.loadTasksForCurrentPage();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  onPageSizeChange() {
    this.currentPage = 1; // Reset to first page when changing page size
    this.loadTasksForCurrentPage();
  }

  loadTasksForCurrentPage() {
    if (this.taskType === 'my') {
      this.store.dispatch(loadMyTasks({ page: this.currentPage, limit: this.pageSize }));
    } else {
      this.store.dispatch(loadTasks({ page: this.currentPage, limit: this.pageSize }));
    }
  }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (this.currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== this.totalPages) {
          pages.push(i);
        }
      }
      
      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }
      
      // Show last page
      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  getEndItemNumber(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalTasks);
  }

  // Drag and drop handler
  onTaskDrop(event: any) {
    // Handle drag and drop if needed
    console.log('Task dropped:', event);
  }
}
