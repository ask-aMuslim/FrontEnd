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

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
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

  onSubmit(): void {
    if (this.registerForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formData = this.registerForm.value;
      console.log('Register form data:', formData);

      // TODO: Implement actual registration API call
      setTimeout(() => {
        this.isSubmitting = false;
        // Handle success or error
      }, 2000);
    }
  }
}
