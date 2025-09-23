import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../core/state/auth.reducer';
import { createTask } from '../../core/state/task/task.actions';
import { Subscription } from 'rxjs';
import { UserDto, Role } from '@turbovets/data';
import { 
  loadDepartments, 
  loadAssignableUsers, 
  selectDepartment
} from '../../core/state/department/department.actions';
import { 
  selectDepartments as selectDepartmentsState,
  selectAssignableUsers as selectAssignableUsersState,
  selectSelectedDepartment as selectSelectedDepartmentState,
  selectDepartmentLoading as selectDepartmentLoadingState
} from '../../core/state/department/department.selectors';
import { DepartmentService, UserPermissions } from '@turbovets/auth';
import { take } from 'rxjs/operators';

interface Priority {
  value: string;
  label: string;
  color: string;
  textColor: string;
}

interface Status {
  value: string;
  label: string;
}

@Component({
  selector: 'app-create-task-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create-task-modal.component.html',
  styleUrls: ['./create-task-modal.component.scss']
})
export class CreateTaskModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible = false;
  @Output() formClose = new EventEmitter<void>();

  taskForm: FormGroup;
  activeTab: 'work' | 'personal' = 'work';
  isRecurring = false;
  recurringPattern = 'daily';
  recurringEndDate: Date | null = null;
  recurringEndCount: number | null = null;
  recurringEndType: 'date' | 'count' = 'date';

  // Data properties
  currentUser: UserDto | null = null;
  departments: string[] = [];
  availableAssignees: UserDto[] = [];
  selectedDepartment = '';
  userPermissions: UserPermissions | null = null;

  // Loading states
  isLoadingDepartments = false;
  isLoadingUsers = false;
  isSubmitting = false;

  // Permission checks
  get canChangeDepartment(): boolean {
    if (!this.userPermissions) return false;
    
    // Owner can change to any department
    if (this.userPermissions.canViewAllDepartments) return true;
    
    // Admin and Viewer cannot change departments (they're locked to their own department)
    return false;
  }

  // Subscriptions
  private subscription = new Subscription();
  private departmentsSubscription?: Subscription;
  private assignableUsersSubscription?: Subscription;
  private recurringSubscription?: Subscription;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private departmentService = inject(DepartmentService);

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      category: ['work'],
      priority: ['medium', Validators.required],
      status: ['to-do', Validators.required],
      dueDate: [''],
      assigneeId: [''],
      department: [''],
      tags: ['']
    });
  }

  ngOnInit() {
    // Subscribe to current user
    this.subscription.add(
      this.store.select(selectCurrentUser).subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.userPermissions = this.departmentService.getUserPermissions(user.role as Role, user.department);
        }
      })
    );

    // Subscribe to loading states
    this.subscription.add(
      this.store.select(selectDepartmentLoadingState).subscribe(loading => {
        this.isLoadingDepartments = loading.departments;
        this.isLoadingUsers = loading.assignable;
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this.departmentsSubscription) {
      this.departmentsSubscription.unsubscribe();
    }
    if (this.assignableUsersSubscription) {
      this.assignableUsersSubscription.unsubscribe();
    }
    if (this.recurringSubscription) {
      this.recurringSubscription.unsubscribe();
    }
  }

  // Load departments and assignable users when modal is opened
  loadModalData(): void {
    if (!this.currentUser) {
      return;
    }

    // Set up subscriptions to state data
    this.setupDataSubscriptions();

    // Trigger loading if needed
    this.triggerDataLoading();
  }

  private setupDataSubscriptions(): void {
    // Subscribe to departments
    this.departmentsSubscription = this.store.select(selectDepartmentsState).subscribe(departments => {
      this.departments = departments;
    });

    // Subscribe to assignable users
    this.assignableUsersSubscription = this.store.select(selectAssignableUsersState).subscribe(assignableUsers => {
      if (assignableUsers) {
        this.availableAssignees = assignableUsers.users;
        this.filterAssignees();
      }
    });

    // Subscribe to selected department
    this.subscription.add(
      this.store.select(selectSelectedDepartmentState).subscribe(selectedDept => {
        this.selectedDepartment = selectedDept || '';
        if (selectedDept) {
          this.taskForm.patchValue({ department: selectedDept });
        }
      })
    );
  }

  private triggerDataLoading(): void {
    // Always check if we need to load departments (for all users who can see departments)
    this.store.select(selectDepartmentsState).pipe(take(1)).subscribe(departments => {
      // Load departments only if:
      // 1. User is Admin/Owner and no departments loaded
      // Note: Only Admin/Owner can access the departments API endpoint
      const shouldLoadDepartments = (
        (this.currentUser?.role === Role.Admin || this.currentUser?.role === Role.Owner) && 
        departments.length === 0
      );
      
      if (shouldLoadDepartments) {
        this.store.dispatch(loadDepartments());
      } else if (this.currentUser?.role !== Role.Admin && this.currentUser?.role !== Role.Owner && this.currentUser?.department && departments.length === 0) {
        // For non-Admin/Owner users, populate departments with just their department
        this.departments = [this.currentUser.department];
      }
    });

    // Set default department for non-owners and load users
    if (this.currentUser?.role !== Role.Owner && this.currentUser?.department) {
      this.store.select(selectSelectedDepartmentState).pipe(take(1)).subscribe(selectedDept => {
        if (!selectedDept && this.currentUser?.department) {
          this.store.dispatch(selectDepartment({ department: this.currentUser.department }));
          this.taskForm.patchValue({ department: this.currentUser.department });
          // Load assignable users for the default department
          this.store.dispatch(loadAssignableUsers({ department: this.currentUser.department, excludeCurrentUser: true }));
        }
      });
    }
  }

  filterAssignees() {
    if (!this.currentUser || !this.userPermissions) {
      this.availableAssignees = [];
      return;
    }

    if (this.userPermissions.canAssignTasks) {
      // Users are already sorted by role (Admin first, then Viewer) from the backend
      this.availableAssignees = this.availableAssignees || [];
    } else {
      this.availableAssignees = [];
    }
  }

  onDepartmentChange(department: string) {
    if (department && department !== this.selectedDepartment) {
      // Update selected department in state
      this.store.dispatch(selectDepartment({ department }));
      
      // Load assignable users for the selected department
      this.store.dispatch(loadAssignableUsers({ department, excludeCurrentUser: true }));
      
      // Update form
      this.taskForm.patchValue({ department });
    }
  }

  ngOnChanges() {
    if (this.visible && this.currentUser) {
      // Ensure data is loaded when modal becomes visible
      this.loadModalData();
    }
  }

  setActiveTab(tab: 'work' | 'personal') {
    this.activeTab = tab;
    this.taskForm.patchValue({ category: tab });
  }

  onSubmit() {
    if (this.taskForm.valid && this.currentUser) {
      this.isSubmitting = true;
      
      const formValue = this.taskForm.value;
      const taskData = {
        ...formValue,
        creatorId: this.currentUser.id,
        dueDate: formValue.dueDate ? new Date(formValue.dueDate).toISOString() : null,
        tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()) : []
      };

      this.store.dispatch(createTask({ task: taskData }));
      
      this.resetForm();
      this.onCloseModal();
    } else {
      this.markFormGroupTouched();
    }
  }

  onCloseModal() {
    this.resetForm();
    this.formClose.emit();
  }

  private markFormGroupTouched() {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['minlength']) {
        return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  // Form options
  priorities: Priority[] = [
    { value: 'low', label: 'Low', color: '#10B981', textColor: '#FFFFFF' },
    { value: 'medium', label: 'Medium', color: '#F59E0B', textColor: '#FFFFFF' },
    { value: 'high', label: 'High', color: '#EF4444', textColor: '#FFFFFF' },
    { value: 'critical', label: 'Critical', color: '#7C2D12', textColor: '#FFFFFF' }
  ];

  statuses: Status[] = [
    { value: 'to-do', label: 'To Do' },
    { value: 'started', label: 'Started' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' }
  ];

  private resetForm() {
    this.taskForm.reset({
      title: '',
      description: '',
      category: 'work',
      priority: 'medium',
      status: 'to-do',
      dueDate: '',
      assigneeId: '',
      department: '',
      tags: ''
    });
    this.activeTab = 'work';
    this.isRecurring = false;
    this.recurringPattern = 'daily';
    this.recurringEndDate = null;
    this.recurringEndCount = null;
    this.recurringEndType = 'date';
    this.isSubmitting = false;
  }
}
