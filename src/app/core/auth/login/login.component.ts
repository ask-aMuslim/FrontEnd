import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IdentityFacade } from '../../../api/facades/identity.facade';
import { toFriendlyAuthErrorMessage } from '../auth-error-message.util';
import { environment } from '../../../../environments/environment';
import { SocialAuthenticationService } from '../../services/social-auth.service';

import { GoogleSigninButtonModule, SocialAuthService } from '@abacritt/angularx-social-login';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, GoogleSigninButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly facade = inject(IdentityFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  protected readonly loading = this.facade.isLoading;
  protected readonly apiError = this.facade.error;
  private readonly socialAuthService = inject(SocialAuthenticationService);
  private readonly abacrittAuthService = inject(SocialAuthService);

  protected loginForm: FormGroup;
  protected showPassword = false;
  protected submitSuccess = false;
  protected fieldFocused: Record<string, boolean> = {};
  protected fieldTouched: Record<string, boolean> = {};

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });

    this.facade.clearError();
  }

  ngOnInit(): void {
    this.submitSuccess = false;
    this.facade.clearError();

    // Listen for Google Sign-In Success
    this.abacrittAuthService.authState.subscribe((user) => {
      if (user && user.provider === 'GOOGLE' && user.idToken) {
        // Send the Google token to our backend via the service
        this.socialAuthService.handleGoogleToken(user.idToken).subscribe({
          next: () => {
            this.submitSuccess = true;
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
            void this.router.navigateByUrl(returnUrl ?? '/home');
          },
          error: (err: any) => {
            this.submitSuccess = false;
            console.error('Google login failed', err);
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.facade.clearError();
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
    if (this.loginForm.valid && !this.loading()) {
      this.facade.clearError();
      const email = String(this.loginForm.value.email).trim();
      const password = String(this.loginForm.value.password);

      this.facade.login(email, password).subscribe({
        next: () => {
          this.submitSuccess = true;
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
          void this.router.navigateByUrl(returnUrl ?? '/home');
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

  protected onSocialSignIn(provider: 'google' | 'facebook'): void {
    if (!this.isBrowser) return;

    const loginMethod = provider === 'google'
      ? this.socialAuthService.signInWithGoogle()
      : this.socialAuthService.signInWithFacebook();

    loginMethod.subscribe({
      next: () => {
        this.submitSuccess = true;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
        void this.router.navigateByUrl(returnUrl ?? '/home');
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
}
