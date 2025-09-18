import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginUserDto } from 'libs/dto/login-user.dto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loginData: LoginUserDto = {
    username: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.authService.login(this.loginData).subscribe({
        next: (res) => {
          console.log('Login successful:', res);
          this.router.navigate(['/dashboard']); 
        },
        error: (err) => {
          console.error('Login failed:', err);
          // here you can show error messages to user
        }
      });
    } else {
      console.log('Form is invalid');
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
    }
  }
}
