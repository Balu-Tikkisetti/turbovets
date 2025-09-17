import { Route, Routes } from '@angular/router';
import { AuthenticationComponent } from './features/auth/authentication/authentication.component';
import { ConfirmComponent } from './features/auth/confirm/confirm.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { AuthGuard } from './core/guards/auth.guard'; 

export const appRoutes: Routes = [
  {
    path: 'auth',
    component: AuthenticationComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'confirm', component: ConfirmComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  
 
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard] 
  },


  { path: '', redirectTo: '/auth/login', pathMatch: 'full' }
];