import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { JwtRefreshService } from '../services/jwt-refresh.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private jwtRefreshService = inject(JwtRefreshService);

  canActivate(): boolean {
    // Check if token exists
    const token = this.authService.getToken();

    if (token) {
      // Check if token is still valid
      const isValid = this.jwtRefreshService.isTokenValid();
      
      if (isValid) {
        return true;
      } else {
        this.jwtRefreshService.clearTokens();
      }
    }

    this.router.navigate(['/auth/login']);
    return false;
  }
}
