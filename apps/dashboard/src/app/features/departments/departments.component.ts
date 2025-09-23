import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { UserDto, Role } from '@turbovets/data';
import { selectCurrentUser } from '../../core/state/auth.reducer';
import { UserService } from '../../core/services/user.service';
import { DepartmentService, Department, CreateDepartmentDto } from '../../core/services/department.service';
import { JwtRefreshService } from '../../core/services/jwt-refresh.service';



@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss']
})
export class DepartmentsComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private userService = inject(UserService);
  private departmentService = inject(DepartmentService);
  private jwtRefreshService = inject(JwtRefreshService);
  
  currentUser$: Observable<UserDto | null> = this.store.select(selectCurrentUser);
  Role = Role;
  
  departments: Department[] = [];
  loading = false;
  error: string | null = null;
  
  // Modal state
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedDepartment: Department | null = null;
  
  // Form data
  departmentForm: CreateDepartmentDto = {
    name: '',
    description: '',
    color: '#3B82F6'
  };
  
  // Available colors for departments
  departmentColors = [
    { value: '#3B82F6', name: 'Blue', class: 'bg-blue-500' },
    { value: '#10B981', name: 'Green', class: 'bg-green-500' },
    { value: '#F59E0B', name: 'Yellow', class: 'bg-yellow-500' },
    { value: '#EF4444', name: 'Red', class: 'bg-red-500' },
    { value: '#8B5CF6', name: 'Purple', class: 'bg-purple-500' },
    { value: '#06B6D4', name: 'Cyan', class: 'bg-cyan-500' },
    { value: '#F97316', name: 'Orange', class: 'bg-orange-500' },
    { value: '#6B7280', name: 'Gray', class: 'bg-gray-500' }
  ];
  
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    this.loadDepartments();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadDepartments() {
    this.loading = true;
    this.error = null;
    
    // Debug: Check if user has a valid token
    const token = this.jwtRefreshService.getAccessToken();
    const isValid = this.jwtRefreshService.isTokenValid();
    
    
    if (!token) {
      this.error = 'No authentication token found. Please log in to view departments.';
      this.loading = false;
      return;
    }
    
    if (!isValid) {
      this.error = 'Authentication token expired. Please log in again.';
      this.loading = false;
      return;
    }
    
    // Use the DepartmentService which properly handles environment configuration and authentication
    this.subscription.add(
      this.departmentService.getDepartments().subscribe({
        next: (departments) => {
          this.departments = departments;
          this.loading = false;
        },
        error: (error) => {
          
          if (error.status === 401) {
            this.error = 'Authentication failed. Please log in again to view departments.';
          } else {
            this.error = 'Failed to load departments: ' + (error.error?.message || error.message || 'Unknown error');
          }
          this.loading = false;
        }
      })
    );
  }

  // Modal methods
  openCreateModal() {
    this.departmentForm = {
      name: '',
      description: '',
      color: '#3B82F6'
    };
    this.showCreateModal = true;
  }

  openEditModal(department: Department) {
    this.selectedDepartment = department;
    this.departmentForm = {
      name: department.name,
      description: department.description || '',
      color: department.color
    };
    this.showEditModal = true;
  }

  openDeleteModal(department: Department) {
    this.selectedDepartment = department;
    this.showDeleteModal = true;
  }

  closeModals() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedDepartment = null;
    this.resetForm();
  }

  resetForm() {
    this.departmentForm = {
      name: '',
      description: '',
      color: '#3B82F6'
    };
  }

  // CRUD operations
  createDepartment() {
    if (!this.departmentForm.name.trim()) {
      alert('Please enter a department name');
      return;
    }

    this.loading = true;
    
    this.subscription.add(
      this.departmentService.createDepartment(this.departmentForm).subscribe({
        next: (department) => {
          this.departments.push(department);
          this.loading = false;
          this.closeModals();
        },
        error: (error) => {
          alert('Failed to create department: ' + (error.error?.message || error.message));
          this.loading = false;
        }
      })
    );
  }

  updateDepartment() {
    if (!this.selectedDepartment || !this.departmentForm.name.trim()) {
      alert('Please enter a department name');
      return;
    }

    this.loading = true;
    
    this.subscription.add(
      this.departmentService.updateDepartment(this.selectedDepartment.id, this.departmentForm).subscribe({
        next: (updatedDepartment) => {
          const index = this.departments.findIndex(d => d.id === updatedDepartment.id);
          if (index !== -1) {
            this.departments[index] = updatedDepartment;
          }
          this.loading = false;
          this.closeModals();
        },
        error: (error) => {
          alert('Failed to update department: ' + (error.error?.message || error.message));
          this.loading = false;
        }
      })
    );
  }

  deleteDepartment() {
    if (!this.selectedDepartment) return;

    this.loading = true;
    
    this.subscription.add(
      this.departmentService.deleteDepartment(this.selectedDepartment.id).subscribe({
        next: () => {
          this.departments = this.departments.filter(d => d.id !== this.selectedDepartment?.id);
          this.loading = false;
          this.closeModals();
        },
        error: (error) => {
          alert('Failed to delete department: ' + (error.error?.message || error.message));
          this.loading = false;
        }
      })
    );
  }

  // Utility methods
  canManageDepartments(user: UserDto | null): boolean {
    return user?.role === Role.Owner || user?.role === Role.Admin;
  }

  getDepartmentColor(deptName: string): string {
    // Simple hash function to assign consistent colors
    let hash = 0;
    for (let i = 0; i < deptName.length; i++) {
      hash = deptName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % this.departmentColors.length;
    return this.departmentColors[colorIndex].value;
  }

  getDepartmentColorClass(color: string): string {
    const colorMap: { [key: string]: string } = {
      '#3B82F6': 'bg-blue-500',
      '#10B981': 'bg-green-500',
      '#F59E0B': 'bg-yellow-500',
      '#EF4444': 'bg-red-500',
      '#8B5CF6': 'bg-purple-500',
      '#06B6D4': 'bg-cyan-500',
      '#F97316': 'bg-orange-500',
      '#6B7280': 'bg-gray-500'
    };
    return colorMap[color] || 'bg-gray-500';
  }

  getDepartmentColorTextClass(color: string): string {
    const colorMap: { [key: string]: string } = {
      '#3B82F6': 'text-blue-600',
      '#10B981': 'text-green-600',
      '#F59E0B': 'text-yellow-600',
      '#EF4444': 'text-red-600',
      '#8B5CF6': 'text-purple-600',
      '#06B6D4': 'text-cyan-600',
      '#F97316': 'text-orange-600',
      '#6B7280': 'text-gray-600'
    };
    return colorMap[color] || 'text-gray-600';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

}