import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { selectCurrentUser } from '../../core/state/auth.reducer';
import { UserDto } from '@turbovets/data';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-overlay.component.html',
  styleUrls: ['./profile-overlay.component.scss']
})
export class ProfileOverlayComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isVisible = false;
  @Output() closeOverlay = new EventEmitter<void>();

  currentUser$: Observable<UserDto | null>;
  profileDetails$: Observable<UserDto | null> = of(null);
  isLoading = false;
  
  private store = inject(Store);
  private router = inject(Router);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private clickListener?: (event: Event) => void;

  constructor() {
    this.currentUser$ = this.store.select(selectCurrentUser);
  }

  ngOnInit(): void {
    // Close overlay when clicking outside
    this.clickListener = (event: Event) => {
      const target = event.target as HTMLElement;
      const overlay = target.closest('.profile-overlay-container');
      if (!overlay && this.isVisible) {
        this.closeOverlay.emit();
      }
    };
    document.addEventListener('click', this.clickListener);
  }

  ngOnChanges(): void {
    if (this.isVisible) {
      this.fetchProfileDetails();
    }
  }

  private fetchProfileDetails(): void {
    this.isLoading = true;
    this.profileDetails$ = this.userService.getProfileDetails();
    
    this.profileDetails$.subscribe({
      next: (details) => {
        this.isLoading = false;
        console.log('Profile details fetched:', details);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching profile details:', error);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  onCloseOverlay(): void {
    this.closeOverlay.emit();
  }

  onLogout(): void {
    // Use AuthService logout method which handles sessionStorage cleanup
    this.authService.logout().subscribe({
      next: () => {
        // Close overlay
        this.closeOverlay.emit();
        
        // Navigate to login page
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Even if logout fails, clear local state and navigate
        this.closeOverlay.emit();
        this.router.navigate(['/auth/login']);
      }
    });
  }

  getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'Owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'Admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Viewer':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  }
}
