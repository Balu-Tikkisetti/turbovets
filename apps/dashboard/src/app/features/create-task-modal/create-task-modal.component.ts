import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormArray } from '@angular/forms';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../core/state/auth.reducer';
import { createNewTask } from '../../core/state/task/task.actions';
import { Subscription } from 'rxjs';
import { UserDto } from 'libs/data/src/lib/dto/user.dto';

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

export enum Role {
  Owner = 'Owner',
  Admin = 'Admin',
  Viewer = 'Viewer'
}

@Component({
  selector: 'app-create-task-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIf, NgForOf],
  templateUrl: './create-task-modal.component.html',
  styleUrl: './create-task-modal.component.scss'
})
export class CreateTaskModalComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() formClose = new EventEmitter<void>();

  taskForm: FormGroup;
  activeTab: 'work' | 'personal' = 'work';
  isRecurring = false;
  private recurringSubscription!: Subscription;

  priorities: Priority[] = [
    { value: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-700' },
    { value: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-700' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
    { value: 'low', label: 'Low', color: 'bg-green-500', textColor: 'text-green-700' }
  ];

  statuses: Status[] = [
    { value: 'to-do', label: 'To Do' },
    { value: 'started', label: 'Started' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' }
  ];

  departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  availableUsers: UserDto[] = [
    { id: 'user1', username: 'Alice', role: Role.Viewer },
    { id: 'user2', username: 'Bob', role: Role.Admin },
    { id: 'user3', username: 'Charlie', role: Role.Viewer },
    { id: 'user4', username: 'Diana', role: Role.Owner }
  ];
  availableAssignees: UserDto[] = [];
  mockTasks = [
    { id: 1, title: 'Write API documentation' },
    { id: 2, title: 'Design user dashboard' },
    { id: 3, title: 'Implement login functionality' }
  ];

  currentUser: UserDto | null = null;
  canChangeDepartment = false;
  private userSubscription!: Subscription;
  private fb = inject(FormBuilder);
  private store = inject(Store);

  constructor() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: ['medium'],
      status: ['to-do'],
      department: [''],
      startDate: [''],
      startTime: [''],
      dueDate: ['', Validators.required],
      dueTime: [''],
      assignee: [''],
      recurring: [false],
      relatedTasks: [[]],
      links: this.fb.array([]),
      media: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.userSubscription = this.store.select(selectCurrentUser).subscribe(user => {
      this.currentUser = user;
      this.canChangeDepartment = user?.role === Role.Owner;
      if (user) {
        this.filterAssignees(user);
      }
    });
    
    this.recurringSubscription = this.taskForm.get('recurring')!.valueChanges.subscribe(isRecurring => {
      this.isRecurring = isRecurring;
      if (isRecurring) {
        this.taskForm.get('dueDate')?.clearValidators();
        this.taskForm.patchValue({ dueDate: '' });
      } else {
        this.taskForm.get('dueDate')?.setValidators([Validators.required]);
      }
      this.taskForm.get('dueDate')?.updateValueAndValidity();
    });

    this.setActiveTab('work');
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.recurringSubscription) {
      this.recurringSubscription.unsubscribe();
    }
  }

  filterAssignees(user: UserDto) {
    if (user.role === Role.Owner || user.role === Role.Admin) {
      this.availableAssignees = this.availableUsers.filter(u => u.role === Role.Viewer || u.role === Role.Admin);
    } else {
      this.availableAssignees = [];
    }
  }

  get links(): FormArray {
    return this.taskForm.get('links') as FormArray;
  }

  get media(): FormArray {
    return this.taskForm.get('media') as FormArray;
  }

  setActiveTab(tab: 'work' | 'personal') {
    this.activeTab = tab;
    this.taskForm.get('recurring')?.setValue(false);
    
    if (tab === 'work') {
      this.taskForm.get('dueDate')?.setValidators([Validators.required]);
      this.taskForm.get('dueTime')?.setValidators([Validators.required]);
      this.taskForm.get('dueDate')?.setValue('');
      this.taskForm.get('dueTime')?.setValue('23:59');
      this.taskForm.get('startDate')?.clearValidators();
      this.taskForm.get('startTime')?.clearValidators();
      this.taskForm.get('status')?.setValidators([Validators.required]);
      this.taskForm.get('department')?.setValidators([Validators.required]);

    } else { // personal
      this.taskForm.get('dueDate')?.setValidators([Validators.required]);
      this.taskForm.get('dueTime')?.setValidators([Validators.required]);
      this.taskForm.get('startDate')?.setValidators([Validators.required]);
      this.taskForm.get('startTime')?.setValidators([Validators.required]);
      this.taskForm.get('status')?.clearValidators();
      this.taskForm.get('department')?.clearValidators();
    }

    this.taskForm.get('dueDate')?.updateValueAndValidity();
    this.taskForm.get('dueTime')?.updateValueAndValidity();
    this.taskForm.get('startDate')?.updateValueAndValidity();
    this.taskForm.get('startTime')?.updateValueAndValidity();
    this.taskForm.get('status')?.updateValueAndValidity();
    this.taskForm.get('department')?.updateValueAndValidity();
  }

  addLink() {
    this.links.push(this.fb.group({ url: [''] }));
  }

  removeLink(index: number) {
    this.links.removeAt(index);
  }

  addMedia() {
    this.media.push(this.fb.group({ name: [''], file: [null] }));
  }

  removeMedia(index: number) {
    this.media.removeAt(index);
  }

  onFileSelected(event: Event, index: number) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.media.at(index).patchValue({
        name: file.name,
        file: file
      });
    }
  }

  onSubmit() {
    if (this.taskForm.valid && this.currentUser) {
      const formData = {
        ...this.taskForm.value,
        creatorId: this.currentUser.id,
        creatorRole: this.currentUser.role,
        category: this.activeTab,
        ...(this.activeTab === 'work' && { startDate: new Date().toISOString().slice(0, 10) })
      };
      
      this.store.dispatch(createNewTask({ task: formData }));
      this.onCloseModal();
    } else {
      this.markFormGroupTouched();
    }
  }

  onCloseModal() {
    this.formClose.emit();
    this.taskForm.reset({
      priority: 'medium',
      status: 'to-do',
      recurring: false,
    });
    this.links.clear();
    this.media.clear();
    this.setActiveTab('work');
  }

  private markFormGroupTouched() {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      if (control) {
        control.markAsTouched();
        if (control instanceof FormArray) {
          control.controls.forEach(c => c.markAsTouched());
        }
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `Task ${fieldName} is required`;
      if (field.errors['minlength']) return `Task ${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }
}