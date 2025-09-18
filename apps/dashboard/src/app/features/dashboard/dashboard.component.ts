import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectCurrentUser, AuthState } from '../../core/state/auth.reducer';
import { CreateTaskModalComponent } from '../create-task-modal/create-task-modal.component';

declare const lucide: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [AsyncPipe, CommonModule, CreateTaskModalComponent]
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  isSidebarOpen = true; 
  isDarkMode = false;
  isModalVisible = false;

  currentUser$: Observable<{ username: string; id: string; } | null>;
  
  private darkModeListener?: () => void;
  private store: Store<AuthState> = inject(Store);

  constructor() {
    this.isDarkMode = document.documentElement.classList.contains('dark');
    this.currentUser$ = this.store.select(selectCurrentUser);
  }

  ngAfterViewInit(): void {
    lucide.createIcons();
    this.attachEventListeners();
  }

  ngOnDestroy(): void {
    if (this.darkModeListener) {
      document.getElementById('darkModeToggle')?.removeEventListener('click', this.darkModeListener);
    }
  }

  onNewTaskClick(): void {
    this.isModalVisible = true;
  }

  onModalClose(): void {
    this.isModalVisible = false;
  }

  private attachEventListeners(): void {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const html = document.documentElement;

    sidebarToggle?.addEventListener('click', () => {
      sidebar?.classList.toggle('-translate-x-full');
      mobileOverlay?.classList.toggle('hidden');
    });

    mobileOverlay?.addEventListener('click', () => {
      sidebar?.classList.add('hidden');
      mobileOverlay?.classList.add('hidden');
    });

    this.darkModeListener = () => {
      this.isDarkMode = !this.isDarkMode;
      if (this.isDarkMode) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      this.updateDarkModeIcon();
    };

    darkModeToggle?.addEventListener('click', this.darkModeListener);
  }

  private updateDarkModeIcon(): void {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
      const icon = darkModeToggle.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', this.isDarkMode ? 'sun' : 'moon');
        lucide.createIcons();
      }
    }
  }
}