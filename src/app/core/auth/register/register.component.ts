import { Component, OnInit, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/interfaces/auth.model';

type RegisterField = 'fullName' | 'email' | 'password';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  registerForm!: FormGroup;
  showPassword = false;
  isSubmitting = false;
  hasMinLength = false;
  hasNumber = false;
  religionType: 'muslim' | 'non-muslim' | null = null;

  // Field interaction states
  fieldTouched = {
    fullName: false,
    email: false,
    password: false
  };

  // Field focus states for premium animations
  fieldFocused = {
    fullName: false,
    email: false,
    password: false
  };

  submitSuccess = false;

  constructor(private readonly fb: FormBuilder) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      religionType: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/.*\d.*/)]],
    });

    // Subscribe to password changes to update validation indicators
    this.registerForm.get('password')?.valueChanges.subscribe((value) => {
      this.hasMinLength = value?.length >= 8;
      this.hasNumber = /\d/.test(value || '');
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onReligionChange(type: 'muslim' | 'non-muslim'): void {
    this.religionType = type;
  }

  onFieldFocus(field: RegisterField): void {
    this.fieldFocused[field] = true;
  }

  onFieldBlur(field: RegisterField): void {
    this.fieldFocused[field] = false;
    this.fieldTouched[field] = true;
  }

  isFieldInvalid(field: RegisterField): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && this.fieldTouched[field]);
  }

  private getFullNameError(control: import('@angular/forms').AbstractControl): string {
    if (control.hasError('required')) return 'Full name is required';
    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Name must be at least ${minLength} characters`;
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `Name must not exceed ${maxLength} characters`;
    }
    return '';
  }

  private getEmailError(control: import('@angular/forms').AbstractControl): string {
    if (control.hasError('required')) return 'Email address is required';
    if (control.hasError('email')) return 'Please enter a valid email address';
    if (control.hasError('pattern')) return 'Invalid email format';
    return '';
  }

  private getPasswordError(control: import('@angular/forms').AbstractControl): string {
    if (control.hasError('required')) return 'Password is required';
    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Password must be at least ${minLength} characters`;
    }
    if (control.hasError('pattern')) return 'Password must contain at least one number';
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `Password must not exceed ${maxLength} characters`;
    }
    return '';
  }

  getFieldError(field: RegisterField): string {
    const control = this.registerForm.get(field);
    if (!control || !this.fieldTouched[field]) return '';

    switch (field) {
      case 'fullName':
        return this.getFullNameError(control);
      case 'email':
        return this.getEmailError(control);
      case 'password':
        return this.getPasswordError(control);
      default:
        return '';
    }
  }

  onSubmit(): void {
    // Mark all fields as touched for validation display
    Object.keys(this.fieldTouched).forEach(key => {
      this.fieldTouched[key as keyof typeof this.fieldTouched] = true;
    });

    if (this.registerForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const payload = this.buildRegisterPayload();

      this.authService
        .register(payload)
        .pipe(finalize(() => (this.isSubmitting = false)))
        .subscribe({
          next: () => {
            this.submitSuccess = true;
            void this.router.navigate(['/login']);
          },
          error: () => {
            this.submitSuccess = false;
          },
        });
    }
  }

  private buildRegisterPayload(): RegisterRequest {
    const fullName = String(this.registerForm.value.fullName).trim();
    const [firstName, ...rest] = fullName.split(' ').filter(Boolean);
    const lastName = rest.join(' ');
    const roleByReligion: Record<'muslim' | 'non-muslim', number> = {
      muslim: 1,
      'non-muslim': 2,
    };
    const selectedReligion = this.registerForm.value.religionType as 'muslim' | 'non-muslim';

    return {
      email: String(this.registerForm.value.email).trim(),
      password: String(this.registerForm.value.password),
      firstName: firstName || 'User',
      lastName: lastName || 'Account',
      role: roleByReligion[selectedReligion],
    };
  }
}
