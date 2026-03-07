import { Component, inject, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { IdentityFacade } from '../../../api/facades/identity.facade';
import { toFriendlyAuthErrorMessage } from '../auth-error-message.util';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly identityFacade = inject(IdentityFacade);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly apiError = this.identityFacade.error;
  protected readonly loading = this.identityFacade.isLoading;

  protected currentStep: 1 | 2 | 3 = 1;
  protected emailForm: FormGroup;
  protected otpForm: FormGroup;
  protected passwordForm: FormGroup;
  protected fieldFocused: { [key: string]: boolean } = {};
  protected fieldTouched: { [key: string]: boolean } = {};
  protected showPassword = false;
  protected showConfirmPassword = false;

  // OTP related
  protected otpDigits: string[] = ['', '', '', '', '', ''];
  protected otpTimer = 60;
  protected canResendOtp = false;
  private timerInterval?: ReturnType<typeof setInterval>;
  protected userEmail = '';

  constructor() {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });

    this.passwordForm = this.fb.group(
      {
        password: [
          '',
          [Validators.required, Validators.minLength(8), Validators.pattern(/.*\d.*/)],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  protected get hasMinLength(): boolean {
    const password = this.passwordForm.get('password')?.value || '';
    return password.length >= 8;
  }

  protected get hasNumber(): boolean {
    const password = this.passwordForm.get('password')?.value || '';
    return /\d/.test(password);
  }

  protected get passwordsMatch(): boolean {
    const password = this.passwordForm.get('password')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;
    return password === confirmPassword && password !== '';
  }

  protected get isPasswordValid(): boolean {
    return this.hasMinLength && this.hasNumber;
  }

  protected onFieldFocus(fieldName: string): void {
    this.fieldFocused[fieldName] = true;
  }

  protected onFieldBlur(fieldName: string): void {
    this.fieldFocused[fieldName] = false;
    this.fieldTouched[fieldName] = true;
  }

  protected isFieldInvalid(fieldName: string, form: FormGroup = this.emailForm): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.fieldTouched[fieldName]));
  }

  protected getFieldError(fieldName: string, form: FormGroup = this.emailForm): string {
    const field = form.get(fieldName);
    if (!field) return '';

    if (fieldName === 'email') {
      if (field.hasError('required')) return 'Email address is required';
      if (field.hasError('email')) return 'Please enter a valid email address';
    }

    if (fieldName === 'password') {
      if (field.hasError('required')) return 'Password is required';
      if (field.hasError('minlength')) return 'Password must be at least 8 characters';
    }

    if (fieldName === 'confirmPassword') {
      if (field.hasError('required')) return 'Please confirm your password';
      if (form.hasError('passwordMismatch')) return 'Passwords do not match';
    }

    return '';
  }

  protected togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  protected toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  protected onEmailSubmit(): void {
    if (this.emailForm.invalid || this.loading()) {
      this.emailForm.get('email')?.markAsTouched();
      this.fieldTouched['email'] = true;
      return;
    }

    const email = String(this.emailForm.get('email')?.value ?? '').trim();
    this.identityFacade.clearError();

    this.identityFacade.requestPasswordResetOtp(email).subscribe({
      next: () => {
        this.userEmail = email;
        this.currentStep = 2;
        this.otpDigits = ['', '', '', '', '', ''];
        this.otpForm.reset({ otp: '' });
        this.startOtpTimer();
      },
      error: () => {
        this.fieldTouched['email'] = true;
      },
    });
  }

  protected onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!/^\d*$/.test(value)) {
      input.value = this.otpDigits[index];
      return;
    }

    this.otpDigits[index] = value.slice(-1);
    input.value = this.otpDigits[index];

    if (this.otpDigits[index] && index < 5) {
      const nextInput = input.parentElement?.nextElementSibling?.querySelector('input');
      nextInput?.focus();
    }

    this.otpForm.patchValue({ otp: this.otpDigits.join('') });
    this.otpForm.get('otp')?.markAsDirty();
  }

  protected onOtpKeydown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = input.parentElement?.previousElementSibling?.querySelector('input');
      prevInput?.focus();
    }
  }

  protected onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').trim() || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    digits.forEach((digit, index) => {
      if (index < 6) {
        this.otpDigits[index] = digit;
      }
    });

    this.otpForm.patchValue({ otp: this.otpDigits.join('') });
  }

  protected startOtpTimer(): void {
    if (!this.isBrowser) return;

    this.otpTimer = 60;
    this.canResendOtp = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = globalThis.setInterval(() => {
      this.otpTimer--;
      if (this.otpTimer <= 0) {
        this.canResendOtp = true;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
      }
    }, 1000);
  }

  protected get formattedTimer(): string {
    const minutes = Math.floor(this.otpTimer / 60);
    const seconds = this.otpTimer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  protected resendOtp(): void {
    if (this.canResendOtp) {
      this.identityFacade.clearError();
      this.otpDigits = ['', '', '', '', '', ''];
      this.otpForm.reset({ otp: '' });

      this.identityFacade.requestPasswordResetOtp(this.userEmail).subscribe({
        next: () => {
          this.startOtpTimer();
        },
        error: () => {
          this.canResendOtp = true;
        },
      });
    }
  }

  protected onOtpSubmit(): void {
    if (this.otpForm.invalid || this.loading()) {
      this.otpForm.get('otp')?.markAsTouched();
      this.fieldTouched['otp'] = true;
      return;
    }

    const otp = this.otpDigits.join('');
    this.identityFacade.clearError();

    this.identityFacade.verifyPasswordResetOtp(this.userEmail, otp).subscribe({
      next: () => {
        this.currentStep = 3;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
      },
      error: () => {
        this.fieldTouched['otp'] = true;
      },
    });
  }

  protected onPasswordSubmit(): void {
    if (this.passwordForm.invalid || !this.isPasswordValid || !this.passwordsMatch || this.loading()) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
        this.fieldTouched[key] = true;
      });
      return;
    }

    const otp = this.otpDigits.join('');
    const password = String(this.passwordForm.get('password')?.value ?? '');

    this.identityFacade.clearError();
    this.identityFacade
      .resetPassword(this.userEmail, otp, password)
      .subscribe({
        next: () => {
          void this.router.navigate(['/login'], {
            queryParams: { reset: 'success' },
          });
        },
        error: () => {
          this.fieldTouched['password'] = true;
          this.fieldTouched['confirmPassword'] = true;
        },
      });
  }

  protected trackByIndex(index: number): number {
    return index;
  }

  protected goToPreviousStep(): void {
    this.identityFacade.clearError();
    if (this.currentStep > 1) {
      this.currentStep = (this.currentStep - 1) as 1 | 2 | 3;
    }
  }

  protected get friendlyApiError(): string | null {
    return toFriendlyAuthErrorMessage(this.apiError());
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = String(group.get('password')?.value ?? '');
    const confirmPassword = String(group.get('confirmPassword')?.value ?? '');

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
