import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      (click)="toggleTheme()"
      class="theme-toggle-enterprise"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
      [title]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <!-- Sun icon (light mode) -->
      <svg
        *ngIf="!themeService.isDark()"
        class="theme-icon theme-icon-light"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      
      <!-- Moon icon (dark mode) -->
      <svg
        *ngIf="themeService.isDark()"
        class="theme-icon theme-icon-dark"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  `,
  styles: [`
  
    .theme-toggle-enterprise {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      background: var(--gradient-glass);
      backdrop-filter: var(--glass-backdrop);
      border: 1px solid var(--glass-border);
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--shadow-3d);
      overflow: hidden;
      transform-style: preserve-3d;
    }

    .theme-toggle-enterprise::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.6s ease;
    }

    .theme-toggle-enterprise::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--gradient-enterprise);
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: var(--radius-lg);
    }

    .theme-toggle-enterprise:hover::before {
      left: 100%;
    }

    .theme-toggle-enterprise:hover::after {
      opacity: 0.1;
    }

    .theme-toggle-enterprise:hover {
      transform: translateY(-2px) translateZ(8px);
      box-shadow: var(--shadow-enterprise);
      border-color: rgba(255, 255, 255, 0.4);
    }

    .theme-toggle-enterprise:active {
      transform: translateY(-1px) translateZ(4px);
      box-shadow: var(--shadow-lg);
    }

    .theme-toggle-enterprise:focus {
      outline: none;
      box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.2);
      border-color: var(--accent-500);
    }

    .theme-icon {
      width: 20px;
      height: 20px;
      position: relative;
      z-index: 1;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .theme-icon-light {
      color: var(--warning-500);
      filter: drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3));
    }

    .theme-icon-dark {
      color: var(--accent-400);
      filter: drop-shadow(0 2px 4px rgba(14, 165, 233, 0.3));
    }

    .theme-toggle-enterprise:hover .theme-icon {
      transform: scale(1.1) rotate(15deg);
    }

    .theme-toggle-enterprise:hover .theme-icon-light {
      color: var(--warning-400);
      filter: drop-shadow(0 4px 8px rgba(245, 158, 11, 0.4));
    }

    .theme-toggle-enterprise:hover .theme-icon-dark {
      color: var(--accent-300);
      filter: drop-shadow(0 4px 8px rgba(14, 165, 233, 0.4));
    }

    /* Dark mode specific styles */
    .dark .theme-toggle-enterprise {
      background: var(--gradient-glass);
      border: 1px solid var(--glass-border);
    }

    .dark .theme-toggle-enterprise:hover {
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* ===== RESPONSIVE DESIGN ===== */
    @media (max-width: 640px) {
      .theme-toggle-enterprise {
        width: 40px;
        height: 40px;
      }
      
      .theme-icon {
        width: 18px;
        height: 18px;
      }
    }

    @media (min-width: 1025px) {
      .theme-toggle-enterprise:hover {
        transform: translateY(-3px) translateZ(12px);
      }
    }

    /* ===== ACCESSIBILITY IMPROVEMENTS ===== */
    @media (prefers-reduced-motion: reduce) {
      .theme-toggle-enterprise,
      .theme-icon {
        transition: none;
        transform: none !important;
      }
      
      .theme-toggle-enterprise:hover {
        transform: none !important;
      }
      
      .theme-toggle-enterprise:hover .theme-icon {
        transform: none !important;
      }
    }

    /* ===== HIGH CONTRAST MODE ===== */
    @media (prefers-contrast: high) {
      .theme-toggle-enterprise {
        border: 2px solid rgba(0, 0, 0, 0.3);
      }
      
      .dark .theme-toggle-enterprise {
        border: 2px solid rgba(255, 255, 255, 0.3);
      }
    }

    /* ===== PRINT STYLES ===== */
    @media print {
      .theme-toggle-enterprise {
        background: white !important;
        backdrop-filter: none !important;
        box-shadow: none !important;
        border: 1px solid #ccc !important;
      }
    }
  `]
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    // Shift+N: Create new task
    if (event.shiftKey && event.key === 'D') {
      event.preventDefault();
      this.toggleTheme();
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

}