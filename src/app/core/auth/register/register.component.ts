import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
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

  constructor(private fb: FormBuilder) { }

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

  onFieldFocus(field: 'fullName' | 'email' | 'password'): void {
    this.fieldFocused[field] = true;
  }

  onFieldBlur(field: 'fullName' | 'email' | 'password'): void {
    this.fieldFocused[field] = false;
    this.fieldTouched[field] = true;
  }

  isFieldInvalid(field: 'fullName' | 'email' | 'password'): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && this.fieldTouched[field]);
  }

  getFieldError(field: 'fullName' | 'email' | 'password'): string {
    const control = this.registerForm.get(field);
    if (!control || !this.fieldTouched[field]) return '';

    // Full Name errors
    if (field === 'fullName') {
      if (control.hasError('required')) return 'Full name is required';
      if (control.hasError('minlength')) {
        const minLength = control.errors?.['minlength'].requiredLength;
        return `Name must be at least ${minLength} characters`;
      }
      if (control.hasError('maxlength')) {
        const maxLength = control.errors?.['maxlength'].requiredLength;
        return `Name must not exceed ${maxLength} characters`;
      }
    }

    // Email errors
    if (field === 'email') {
      if (control.hasError('required')) return 'Email address is required';
      if (control.hasError('email')) return 'Please enter a valid email address';
      if (control.hasError('pattern')) return 'Invalid email format';
    }

    // Password errors
    if (field === 'password') {
      if (control.hasError('required')) return 'Password is required';
      if (control.hasError('minlength')) {
        const minLength = control.errors?.['minlength'].requiredLength;
        return `Password must be at least ${minLength} characters`;
      }
      if (control.hasError('pattern')) return 'Password must contain at least one number';
      if (control.hasError('maxlength')) {
        const maxLength = control.errors?.['maxlength'].requiredLength;
        return `Password must not exceed ${maxLength} characters`;
      }
    }

    return '';
  }

  onSubmit(): void {
    // Mark all fields as touched for validation display
    Object.keys(this.fieldTouched).forEach(key => {
      this.fieldTouched[key as keyof typeof this.fieldTouched] = true;
    });

    if (this.registerForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = this.registerForm.value;
      console.log('Register form data:', formData);

      // TODO: Implement actual registration API call
      setTimeout(() => {
        this.isSubmitting = false;
        this.submitSuccess = true;
        // Handle success or error
      }, 2000);
    }
  }
}
