import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegisterUserDto } from "@turbovets/data";
import { AuthService } from '../../../core/services/auth.service';

interface HttpError {
  status: number;
  message?: string;
}


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  registerData: RegisterUserDto & { confirmPassword: string } = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  onSubmit(form: NgForm) {
    // The form's validity is checked directly in the template's [disabled] binding.
    // Here, we just need to ensure all conditions are met before proceeding.
    if (form.valid && this.passwordsMatch() && this.isPasswordStrong()) {
      this.authService.register(this.registerData).subscribe({
        next: () => {
          alert('Registration successful! You can now sign in with your credentials.');
          this.router.navigate(['auth/login']);
        },
        error: (error: HttpError) => {
          // Handle different types of registration errors
          if (error?.status === 409) {
            alert('Username or email already exists. Please choose different credentials.');
          } else if (error?.status === 400) {
            alert('Invalid registration data. Please check your information and try again.');
          } else if (error?.status === 0) {
            alert('Unable to connect to the server. Please check your internet connection and try again.');
          } else if (error?.status >= 500) {
            alert('Server error occurred. Please try again later or contact support if the problem persists.');
          } else {
            alert('Registration failed. Please try again.');
          }
        }
      });
    } else {
      alert('Please fill in all fields correctly and ensure your password meets the requirements.');
      // Mark all controls as touched to trigger validation messages on the template
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
    }
  }

  // Check if passwords match
  passwordsMatch(): boolean {
    return this.registerData.password === this.registerData.confirmPassword;
  }

  // Password strength validation
  isPasswordStrong(): boolean {
    const password = this.registerData.password;
    if (!password) return false;

    const hasNumber = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasSpecial = /[#?!@$%^&*-]/.test(password);
    const hasMinLength = password.length >= 8;

    return hasNumber && hasUpper && hasLower && hasSpecial && hasMinLength;
  }

  // Get password strength error message
  getPasswordStrengthError(): string {
    const password = this.registerData.password;
    if (!password) return '';

    const missing = [];
    if (password.length < 8) missing.push('at least 8 characters');
    if (!/[0-9]/.test(password)) missing.push('a number');
    if (!/[A-Z]/.test(password)) missing.push('an uppercase letter');
    if (!/[a-z]/.test(password)) missing.push('a lowercase letter');
    if (!/[#?!@$%^&*-]/.test(password)) missing.push('a special character');

    return missing.length > 0 ? `Password must contain ${missing.join(', ')}` : '';
  }
}