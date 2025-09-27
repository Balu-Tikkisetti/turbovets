import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Task, TaskCategory, TaskPriority, TaskStatus } from '@turbovets/data';
import { 
  loadTasks, 
  createTask, 
  updateTask, 
  deleteTask
} from '../../core/state/task/task.actions';
import { 
  selectFilteredTasks, 
  selectTasksLoading, 
  selectTasksError
} from '../../core/state/task/task.selectors';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  tasks: Task[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  task?: Task;
  color: string;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  
  // Observables from NgRx state
  filteredTasks$: Observable<Task[]> = this.store.select(selectFilteredTasks);
  loading$: Observable<boolean> = this.store.select(selectTasksLoading);
  error$: Observable<string | null> = this.store.select(selectTasksError);
  
  // Calendar state
  currentDate = new Date();
  selectedDate: Date | null = null;
  viewMode: 'month' | 'week' | 'day' = 'month';
  
  // Calendar data
  calendarDays: CalendarDay[] = [];
  calendarEvents: CalendarEvent[] = [];
  
  // View controls
  showTaskModal = false;
  showTaskDetailsModal = false;
  selectedTask: Task | null = null;
  isSaving = false;
  
  // Form data for task creation/editing
  taskForm = {
    title: '',
    description: '',
    category: TaskCategory.Work,
    priority: TaskPriority.Medium,
    status: TaskStatus.ToDo,
    department: '',
    dueDate: '',
    dueTime: '',
    recurring: false,
    assigneeId: ''
  };
  
  // Available options
  categories = [
    { value: TaskCategory.Work, label: 'Work', icon: 'briefcase', color: 'blue' },
    { value: TaskCategory.Personal, label: 'Personal', icon: 'user', color: 'green' }
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
  
  departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  
  private subscription: Subscription = new Subscription();

  ngOnInit() {

    
    // Load tasks data
    this.store.dispatch(loadTasks());
    
    // Subscribe to tasks and update calendar
    this.subscription.add(
      this.filteredTasks$.subscribe(tasks => {
    
        this.updateCalendarEvents(tasks || []);
        this.generateCalendarDays();
      })
    );
    
    // Generate initial calendar
    this.generateCalendarDays();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  // Calendar navigation
  previousMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendarDays();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendarDays();
  }

  goToToday() {
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.generateCalendarDays();
  }

  setViewMode(mode: 'month' | 'week' | 'day') {
    this.viewMode = mode;
    this.generateCalendarDays();
  }

  // Calendar generation
  generateCalendarDays() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first day of month and calculate starting date
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    this.calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayTasks = this.getTasksForDate(date);
      
      this.calendarDays.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: this.isSameDay(date, new Date()),
        isSelected: this.selectedDate ? this.isSameDay(date, this.selectedDate) : false,
        tasks: dayTasks
      });
    }
  }

  updateCalendarEvents(tasks: Task[]) {
    this.calendarEvents = tasks
      .filter(task => task.dueDate)
      .map(task => ({
        id: task.id,
        title: task.title,
        start: new Date(task.dueDate!),
        end: new Date(task.dueDate!),
        allDay: true,
        task: task,
        color: this.getTaskColor(task)
      }));
  }

  getTasksForDate(date: Date): Task[] {
    return this.calendarEvents
      .filter(event => this.isSameDay(event.start, date))
      .map(event => event.task!)
      .filter(Boolean);
  }

  // Date utilities
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  formatFullDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  formatDay(date: Date): string {
    return date.getDate().toString();
  }

  formatWeekday(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // Task utilities
  getTaskColor(task: Task): string {
    const priority = task.priority as string;
    const priorityColors: { [key: string]: string } = {
      'critical': 'bg-red-500',
      'high': 'bg-orange-500',
      'medium': 'bg-yellow-500',
      'low': 'bg-green-500'
    };
    return priorityColors[priority] || 'bg-gray-500';
  }

  getTaskPriorityColor(priority: TaskPriority | string): string {
    const priorityStr = priority as string;
    const priorityColors: { [key: string]: string } = {
      'critical': 'text-red-600 bg-red-50',
      'high': 'text-orange-600 bg-orange-50',
      'medium': 'text-yellow-600 bg-yellow-50',
      'low': 'text-green-600 bg-green-50'
    };
    return priorityColors[priorityStr] || 'text-gray-600 bg-gray-50';
  }

  getTaskStatusColor(status: TaskStatus | string): string {
    const statusStr = status as string;
    const statusColors: { [key: string]: string } = {
      'to-do': 'text-gray-600 bg-gray-50',
      'started': 'text-blue-600 bg-blue-50',
      'ongoing': 'text-purple-600 bg-purple-50',
      'completed': 'text-green-600 bg-green-50'
    };
    return statusColors[statusStr] || 'text-gray-600 bg-gray-50';
  }

  // Task interactions
  selectDate(date: Date) {
    this.selectedDate = new Date(date);
    this.generateCalendarDays();
  }

  openTaskModal(task?: Task, date?: Date) {
    if (task) {
      // Show task details modal for existing tasks
      this.selectedTask = task;
      this.showTaskDetailsModal = true;
    } else {
      // Show create/edit modal for new tasks
      this.selectedTask = null;
      this.resetForm();
      if (date) {
        this.taskForm.dueDate = date.toISOString().split('T')[0];
      }
      this.showTaskModal = true;
    }
  }

  openTaskDetailsModal(task: Task) {
    this.selectedTask = task;
    this.showTaskDetailsModal = true;
  }

  closeTaskDetailsModal() {
    this.showTaskDetailsModal = false;
    this.selectedTask = null;
  }

  closeTaskModal() {
    this.showTaskModal = false;
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
      dueDate: '',
      dueTime: '',
      recurring: false,
      assigneeId: ''
    };
  }

  saveTask() {
    if (!this.taskForm.title.trim()) return;
    
    this.isSaving = true;
    
    const taskData = {
      ...this.taskForm,
      dueDate: this.taskForm.dueDate ? new Date(this.taskForm.dueDate) : undefined,
      creatorId: '', // Will be set by the effect
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    if (this.selectedTask) {
      // Update existing task
      this.store.dispatch(updateTask({ 
        taskId: this.selectedTask.id, 
        updates: taskData 
      }));
    } else {
      // Create new task
      this.store.dispatch(createTask({ task: taskData }));
    }
    
    // Handle success/error
    this.subscription.add(
      this.store.select(selectTasksError).subscribe(error => {
        if (!error) {
          this.closeTaskModal();
          this.isSaving = false;
        } else {
          console.error('Error saving task:', error);
          this.isSaving = false;
        }
      })
    );
  }

  deleteTask(task: Task) {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.store.dispatch(deleteTask({ taskId: task.id }));
    }
  }

  toggleTaskStatus(task: Task) {
    const statusStr = task.status as string;
    const isCompleted = statusStr === 'completed';
    const newStatus = isCompleted ? TaskStatus.ToDo : TaskStatus.Completed;
    this.store.dispatch(updateTask({ 
      taskId: task.id, 
      updates: { status: newStatus, updatedAt: new Date() }
    }));
  }

  // Template helper methods
  getCategoryIcon(category: TaskCategory | string): string {
    const cat = category as string;
    return cat === 'work' || cat === TaskCategory.Work ? 'briefcase' : 'user';
  }

  getPriorityIcon(priority: TaskPriority | string): string {
    const priorityStr = priority as string;
    const priorityIcons: { [key: string]: string } = {
      'critical': 'alert-triangle',
      'high': 'arrow-up',
      'medium': 'minus',
      'low': 'arrow-down'
    };
    return priorityIcons[priorityStr] || 'minus';
  }

  getStatusIcon(status: TaskStatus | string): string {
    const statusStr = status as string;
    const statusIcons: { [key: string]: string } = {
      'to-do': 'circle',
      'started': 'play-circle',
      'ongoing': 'clock',
      'completed': 'check-circle'
    };
    return statusIcons[statusStr] || 'circle';
  }

  isOverdue(task: Task): boolean {
    const statusStr = task.status as string;
    if (!task.dueDate || statusStr === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  }

  isDueToday(task: Task): boolean {
    if (!task.dueDate) return false;
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    return dueDate.toDateString() === today.toDateString();
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
}
