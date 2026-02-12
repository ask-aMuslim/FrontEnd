import { Component, inject } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoginViewModel } from '../../api/generated/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected loginForm: FormGroup;
  protected showPassword = false;
  protected isSubmitting = false;
  protected submitSuccess = false;
  protected fieldFocused: { [key: string]: boolean } = {};
  protected fieldTouched: { [key: string]: boolean } = {};

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  protected onFieldFocus(fieldName: string): void {
    this.fieldFocused[fieldName] = true;
  }

  protected onFieldBlur(fieldName: string): void {
    this.fieldFocused[fieldName] = false;
    this.fieldTouched[fieldName] = true;
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.fieldTouched[fieldName]));
  }

  protected getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (!field) return '';

    // Email errors
    if (fieldName === 'email') {
      if (field.hasError('required')) return 'Email address is required';
      if (field.hasError('email')) return 'Please enter a valid email address';
      if (field.hasError('pattern')) return 'Invalid email format';
    }

    // Password errors
    if (fieldName === 'password') {
      if (field.hasError('required')) return 'Password is required';
      if (field.hasError('minlength')) {
        const minLength = field.errors?.['minlength'].requiredLength;
        return `Password must be at least ${minLength} characters`;
      }
      if (field.hasError('maxlength')) {
        const maxLength = field.errors?.['maxlength'].requiredLength;
        return `Password must not exceed ${maxLength} characters`;
      }
    }

    return '';
  }

  protected onSubmit(): void {
    if (this.loginForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const payload: LoginViewModel = {
        email: String(this.loginForm.value.email).trim(),
        password: String(this.loginForm.value.password),
      };

      this.authService
        .login(payload)
        .pipe(finalize(() => (this.isSubmitting = false)))
        .subscribe({
          next: () => {
            this.submitSuccess = true;
            void this.router.navigate(['/home']);
          },
          error: () => {
            this.submitSuccess = false;
          },
        });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
        this.fieldTouched[key] = true;
      });
    }
  }
}
