import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegisterUserDto } from "libs/data/src/lib/dto/register-user.dto";
import { AuthService } from '../../../core/services/auth.service';
import { HttpClientModule } from '@angular/common/http';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {

  registerData: RegisterUserDto & { confirmPassword: string } = {
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit(form: NgForm) {
    // The form's validity is checked directly in the template's [disabled] binding.
    // Here, we just need to ensure all conditions are met before proceeding.
    if (form.valid && this.passwordsMatch() && this.isPasswordStrong()) {
      this.authService.register(this.registerData).subscribe({
        next: (response: any) => {
          console.log('Registration successful:', response);
          this.router.navigate(['/dashboard']);
        },
        error: (error: any) => {
          console.error('Registration failed:', error);
          // Handle registration error, e.g., show an alert or a specific message to the user
        }
      });
    } else {
      console.log('Form is invalid');
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