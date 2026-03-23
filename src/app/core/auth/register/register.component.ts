import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IdentityFacade, RegistrationData, UserRole } from '../../../api/facades/identity.facade';
import { toFriendlyAuthErrorMessage } from '../auth-error-message.util';
import { SocialAuthenticationService } from '../../services/social-auth.service';
import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';

type RegisterField = 'religionType' | 'fullName' | 'email' | 'phoneNumber' | 'password';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, GoogleSigninButtonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly facade = inject(IdentityFacade);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly loading = this.facade.isLoading;
  protected readonly apiError = this.facade.error;
  private readonly socialAuthService = inject(SocialAuthenticationService);
  private readonly abacrittAuthService = inject(SocialAuthService);

  registerForm!: FormGroup;
  showPassword = false;
  hasMinLength = false;
  hasNumber = false;
  religionType: 'muslim' | 'non-muslim' | null = null;

  // Field interaction states
  fieldTouched = {
    religionType: false,
    fullName: false,
    email: false,
    phoneNumber: false,
    password: false
  };

  // Field focus states for premium animations
  fieldFocused = {
    religionType: false,
    fullName: false,
    email: false,
    phoneNumber: false,
    password: false
  };

  submitSuccess = false;

  constructor(private readonly fb: FormBuilder) { }

  ngOnInit(): void {
    this.submitSuccess = false;
    this.facade.clearError();

    // Listen for Google Sign-In Success
    this.abacrittAuthService.authState.subscribe((user) => {
      if (user && user.provider === 'GOOGLE' && user.idToken) {
        this.socialAuthService.handleGoogleToken(user.idToken).subscribe({
          next: () => {
            this.submitSuccess = true;
            void this.router.navigate(['/home']);
          },
          error: (err: any) => {
            this.submitSuccess = false;
            console.error('Google registration failed', err);
          }
        });
      }
    });

    this.registerForm = this.fb.group({
      religionType: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/.*\d.*/)]],
    });

    // Subscribe to password changes to update validation indicators
    this.registerForm.get('password')?.valueChanges.subscribe((value) => {
      this.hasMinLength = value?.length >= 8;
      this.hasNumber = /\d/.test(value || '');
    });
  }

  ngOnDestroy(): void {
    this.facade.clearError();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onReligionChange(type: 'muslim' | 'non-muslim'): void {
    this.religionType = type;
    this.fieldTouched.religionType = true;
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

  private getPhoneNumberError(control: import('@angular/forms').AbstractControl): string {
    if (control.hasError('required')) return 'Phone number is required';
    if (control.hasError('pattern')) return 'Please enter a valid phone number (10-15 digits)';
    return '';
  }

  private getReligionTypeError(control: import('@angular/forms').AbstractControl): string {
    if (control.hasError('required')) return 'Please choose Muslim or Non-Muslim';
    return '';
  }

  getFieldError(field: RegisterField): string {
    const control = this.registerForm.get(field);
    if (!control || !this.fieldTouched[field]) return '';

    switch (field) {
      case 'religionType':
        return this.getReligionTypeError(control);
      case 'fullName':
        return this.getFullNameError(control);
      case 'email':
        return this.getEmailError(control);
      case 'password':
        return this.getPasswordError(control);
      case 'phoneNumber':
        return this.getPhoneNumberError(control);
      default:
        return '';
    }
  }

  protected onSocialSignIn(provider: 'google' | 'facebook'): void {
    if (!this.isBrowser) return;

    const loginMethod = provider === 'google'
      ? this.socialAuthService.signInWithGoogle()
      : this.socialAuthService.signInWithFacebook();

    loginMethod.subscribe({
      next: () => {
        this.submitSuccess = true;
        void this.router.navigate(['/home']);
      },
      error: (error) => {
        this.submitSuccess = false;
        console.error(`${provider} login failed`, error);
      },
    });
  }

  protected get friendlyApiError(): string | null {
    return toFriendlyAuthErrorMessage(this.apiError());
  }

  onSubmit(): void {
    this.registerForm.markAllAsTouched();

    // Mark all fields as touched for validation display
    Object.keys(this.fieldTouched).forEach(key => {
      this.fieldTouched[key as keyof typeof this.fieldTouched] = true;
    });

    if (this.registerForm.valid && !this.loading()) {
      this.facade.clearError();
      const payload = this.buildRegisterPayload();

      this.facade.register(payload).subscribe({
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

  private buildRegisterPayload(): RegistrationData {
    const fullName = String(this.registerForm.value.fullName).trim();
    const [firstName, ...rest] = fullName.split(' ').filter(Boolean);
    const lastName = rest.join(' ');

    // Map religionType to appropriate userRole
    const userRole: UserRole = this.religionType === 'muslim' ? 'Student' : 'NonMuslim';

    return {
      email: String(this.registerForm.value.email).trim(),
      password: String(this.registerForm.value.password),
      firstName: firstName || 'User',
      lastName: lastName || 'Account',
      phoneNumber: String(this.registerForm.value.phoneNumber).trim(),
      role: userRole,
    };
  }
}
