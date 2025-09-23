import { Injectable, signal, computed } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'turbovets-theme';
  
  // Signal for reactive theme state
  private themeSignal = signal<Theme>(this.getInitialTheme());
  
  // Computed signal for isDark
  public isDark = computed(() => this.themeSignal() === 'dark');
  
  // Public getter for current theme
  public get currentTheme(): Theme {
    return this.themeSignal();
  }

  constructor() {
    this.initializeTheme();
  }

  private getInitialTheme(): Theme {
    // Check localStorage first
    const savedTheme = localStorage.getItem(this.THEME_KEY) as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light
    return 'light';
  }

  private initializeTheme(): void {
    const theme = this.themeSignal();
    this.applyTheme(theme);
    
    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only update if user hasn't manually set a preference
        if (!localStorage.getItem(this.THEME_KEY)) {
          const newTheme = e.matches ? 'dark' : 'light';
          this.themeSignal.set(newTheme);
          this.applyTheme(newTheme);
        }
      });
    }
  }

  public toggleTheme(): void {
    const newTheme = this.themeSignal() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  public setTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    this.applyTheme(theme);
    localStorage.setItem(this.THEME_KEY, theme);
  }

  private applyTheme(theme: Theme): void {
    const htmlElement = document.documentElement;
    
    if (theme === 'dark') {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }
}
