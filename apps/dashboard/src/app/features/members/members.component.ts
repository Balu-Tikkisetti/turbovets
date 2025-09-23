import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { UserDto, Role } from '@turbovets/data';
import { UserService } from '../../core/services/user.service';
import { selectCurrentUser, updateCurrentUser } from '../../core/state/auth.reducer';

interface MemberWithStatus extends UserDto {
  isOnline?: boolean;
  lastSeen?: Date;
}

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class MembersComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private userService = inject(UserService);
  
  currentUser$: Observable<UserDto | null> = this.store.select(selectCurrentUser);
  members: MemberWithStatus[] = [];
  filteredMembers: MemberWithStatus[] = [];
  
  // Filters
  searchTerm = '';
  selectedRole = '';
  selectedDepartment = '';
  statusFilter = '';
  
  // Modal state
  showEditModal = false;
  selectedMember: MemberWithStatus | null = null;
  isSaving = false;
  
  // Form data
  editForm = {
    role: '',
    department: ''
  };
  
  // Available departments
  departments = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
  
  // Computed properties
  get onlineCount(): number {
    return this.members.filter(member => member.isOnline).length;
  }
  
  canManageUsers = false;
  
  private subscription: Subscription = new Subscription();

  ngOnInit() {
    this.loadMembers();
    
    // Check if current user can manage users
    this.currentUser$.subscribe(user => {
      this.canManageUsers = user?.role === Role.Owner;
    });
    
    // Set up real-time updates (simulate with periodic refresh)
    const interval = setInterval(() => {
      this.updateOnlineStatus();
    }, 30000); // Update every 30 seconds
    
    this.subscription.add({ unsubscribe: () => clearInterval(interval) });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadMembers() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // Get current user to filter them out
        this.currentUser$.pipe(take(1)).subscribe(currentUser => {
          // Filter out the current user from the members list
          const otherUsers = currentUser ? users.filter(user => user.id !== currentUser.id) : users;
          
          this.members = otherUsers.map(user => ({
            ...user,
            isOnline: this.determineOnlineStatus(user),
            lastSeen: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined
          }));
          
          this.applyFilters();
        });
      },
      error: (error) => {
        // Handle error silently
      }
    });
  }

  private determineOnlineStatus(user: UserDto): boolean {
    // Simple logic: consider user online if they logged in within the last 5 minutes
    if (!user.lastLoginAt) return false;
    const lastLogin = new Date(user.lastLoginAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);
    return diffMinutes <= 5;
  }

  private updateOnlineStatus() {
    this.members.forEach(member => {
      member.isOnline = this.determineOnlineStatus(member);
    });
    this.applyFilters();
  }

  applyFilters() {
    // Apply search and filter criteria to member list
    
    this.filteredMembers = this.members.filter(member => {
      const matchesSearch = !this.searchTerm || 
        member.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (member.email && member.email.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesRole = !this.selectedRole || member.role === this.selectedRole;
      
      // Fixed department filtering logic
      const matchesDepartment = !this.selectedDepartment || 
        member.department === this.selectedDepartment;
      
      const matchesStatus = !this.statusFilter || 
        (this.statusFilter === 'online' && member.isOnline) ||
        (this.statusFilter === 'offline' && !member.isOnline);
      
      const passes = matchesSearch && matchesRole && matchesDepartment && matchesStatus;
      
      return passes;
    });
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedDepartment = '';
    this.statusFilter = '';
    this.applyFilters();
  }


  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Owner':
        return 'owner';
      case 'Admin':
        return 'admin';
      case 'Viewer':
        return 'viewer';
      default:
        return '';
    }
  }

  getLastSeenText(lastSeen: Date): string {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  openEditModal(member: MemberWithStatus) {
    this.selectedMember = member;
    this.editForm = {
      role: member.role,
      department: member.department || ''
    };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedMember = null;
    this.editForm = { role: '', department: '' };
  }

  saveMemberChanges() {
    if (!this.selectedMember) return;
    
    // Validate that Admin role requires a department
    if (this.editForm.role === 'Admin' && !this.editForm.department) {
      alert('Admin role requires a department to be selected. Please select a department first.');
      return;
    }
    
    this.isSaving = true;
    
    const updateData = {
      role: this.editForm.role,
      department: this.editForm.department || undefined
    };
    
    this.userService.updateUser(this.selectedMember.id, updateData).subscribe({
      next: () => {
        // Update local member data
        if (this.selectedMember) {
          const selectedMemberId = this.selectedMember.id;
          const memberIndex = this.members.findIndex(m => m.id === selectedMemberId);
          if (memberIndex !== -1) {
            this.members[memberIndex] = {
              ...this.members[memberIndex],
              role: this.editForm.role,
              department: this.editForm.department || undefined
            };
            this.applyFilters();
          }
          
          // If the current user edited their own profile, update the store
          this.currentUser$.pipe(take(1)).subscribe(currentUser => {
            if (currentUser && currentUser.id === selectedMemberId) {
              // Update the current user in the store
              this.store.dispatch(updateCurrentUser({
                ...currentUser,
                role: this.editForm.role,
                department: this.editForm.department || undefined
              }));
            }
          });
        }
        
        this.closeEditModal();
        this.isSaving = false;
      },
      error: (error) => {
        this.isSaving = false;
      }
    });
  }
}
