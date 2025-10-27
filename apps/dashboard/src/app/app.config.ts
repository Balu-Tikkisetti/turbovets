import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { authReducer } from './core/state/auth.reducer';
import { taskReducer } from './core/state/mytask/mytask.reducer';
import { TaskEffects } from './core/state/mytask/mytask.effects';
import { membersReducer } from './core/state/members/members.reducer';
import { MembersEffects } from './core/state/members/members.effects';
import { analyticsReducer } from './core/state/analytics/analytics.reducer';
import { AnalyticsEffects } from './core/state/analytics/analytics.effects';
import { departmentReducer } from './core/state/department/department.reducer';
import { DepartmentEffects } from './core/state/department/department.effects';
import { statisticsReducer } from './core/state/statistics/statistics.reducer';
import { StatisticsEffects } from './core/state/statistics/statistics.effects';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ThemeService } from './core/services/theme.service';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideStore({ 
      auth: authReducer,
      tasks: taskReducer,
      members: membersReducer,
      analytics: analyticsReducer,
      department: departmentReducer,
      statistics: statisticsReducer
    }),
    provideEffects([TaskEffects, MembersEffects, AnalyticsEffects, DepartmentEffects, StatisticsEffects]),
    provideCharts(withDefaultRegisterables()),
    ThemeService
  ],
};
