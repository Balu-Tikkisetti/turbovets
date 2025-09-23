import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginUserDto } from '@turbovets/data';
import { CommonModule } from '@angular/common';

interface HttpError {
  status: number;
  message?: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loginData: LoginUserDto = {
    username: '',
    password: ''
  };

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.authService.login(this.loginData).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']); 
        },
        error: (err: HttpError) => {
          // Handle different types of login errors
          if (err?.status === 401) {
            alert('Invalid username or password. Please check your credentials and try again.');
          } else if (err?.status === 403) {
            alert('Your account has been deactivated. Please contact your administrator.');
          } else if (err?.status === 0) {
            alert('Unable to connect to the server. Please check your internet connection and try again.');
          } else if (err?.status >= 500) {
            alert('Server error occurred. Please try again later or contact support if the problem persists.');
          } else {
            alert('Login failed. Please try again.');
          }
        }
      });
    } else {
      alert('Please fill in all required fields correctly.');
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
    }
  }
}
