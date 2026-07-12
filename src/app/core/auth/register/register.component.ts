import {
  Component,
  computed,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
  inject,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IdentityFacade,
  RegistrationData,
} from '../../../api/facades/identity.facade';
import type { ReligiousStatus } from '../../../api/models';
import { toFriendlyAuthErrorMessage } from '../auth-error-message.util';
import { SocialAuthenticationService } from '../../services/social-auth.service';
import { take } from 'rxjs';
import {
  SocialAuthService,
} from '@abacritt/angularx-social-login';

type RegisterField = 'religionType' | 'fullName' | 'email' | 'password';
type ReligionSelection = 'non-muslim' | 'born-muslim' | 'new-muslim';

const religionStatusBySelection: Readonly<
  Record<ReligionSelection, ReligiousStatus>
> = {
  'non-muslim': 1,
  'born-muslim': 2,
  'new-muslim': 3,
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly facade = inject(IdentityFacade);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly fb = inject(FormBuilder);

  protected readonly loading = this.facade.isLoading;
  protected readonly apiError = this.facade.error;
  private readonly socialAuthService = inject(SocialAuthenticationService);
  private readonly abacrittAuthService = inject(SocialAuthService);
  protected readonly religionOptions: ReadonlyArray<{
    value: ReligionSelection;
    label: string;
  }> = [
      { value: 'non-muslim', label: 'Non-Muslim' },
      { value: 'born-muslim', label: 'Born Muslim' },
      { value: 'new-muslim', label: 'New Muslim' },
    ];

  registerForm!: FormGroup;
  otpForm!: FormGroup;
  currentStep: 1 | 2 = 1;
  showPassword = false;
  hasMinLength = false;
  hasNumber = false;
  religionType: ReligionSelection | null = null;
  otpDigits: string[] = ['', '', '', '', '', ''];
  protected readonly otpTimer = signal(60);
  protected readonly canResendOtp = signal(false);
  protected readonly formattedTimer = computed(() => {
    const minutes = Math.floor(this.otpTimer() / 60);
    const seconds = this.otpTimer() % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });
  private registeredEmail = '';
  private registrationPayload: RegistrationData | null = null;
  private otpTimerInterval?: ReturnType<typeof globalThis.setInterval>;
  otpTouched = false;

  // Field interaction states
  fieldTouched = {
    religionType: false,
    fullName: false,
    email: false,
    password: false,
  };

  // Field focus states for premium animations
  fieldFocused = {
    religionType: false,
    fullName: false,
    email: false,
    password: false,
  };

  private _googleBtnContainer?: ElementRef<HTMLDivElement>;

  @ViewChild('googleBtnContainer', { static: false }) set googleBtnContainer(content: ElementRef<HTMLDivElement> | undefined) {
    if (content) {
      this._googleBtnContainer = content;
      this.renderGoogleButton();
    }
  }

  submitSuccess = false;

  ngOnInit(): void {
    this.submitSuccess = false;
    this.currentStep = 1;
    this.facade.clearError();

    // Listen for Google Sign-In Success
    this.abacrittAuthService.authState.subscribe((user) => {
      if (user && user.provider === 'GOOGLE' && user.idToken) {
        this.socialAuthService.handleGoogleToken(user.idToken).subscribe({
          next: () => {
            this.submitSuccess = true;
            void this.router.navigate(['/home']);
          },
          error: (err: unknown) => {
            this.submitSuccess = false;
            globalThis.console.error('Google registration failed', err);
          },
        });
      }
    });

    this.registerForm = this.fb.group({
      religionType: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/.*\d.*/),
        ],
      ],
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    });

    // Subscribe to password changes to update validation indicators
    this.registerForm.get('password')?.valueChanges.subscribe((value) => {
      this.hasMinLength = value?.length >= 8;
      this.hasNumber = /\d/.test(value || '');
    });
  }

  ngOnDestroy(): void {
    if (this.otpTimerInterval) {
      globalThis.clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = undefined;
    }
    this.facade.clearError();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onReligionChange(type: ReligionSelection): void {
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
    if (field === 'religionType') {
      return !!(control && control.invalid && this.fieldTouched.religionType);
    }
    return !!(control && control.invalid && this.fieldFocused[field]);
  }

  private getFullNameError(
    control: import('@angular/forms').AbstractControl,
  ): string {
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

  private getEmailError(
    control: import('@angular/forms').AbstractControl,
  ): string {
    if (control.hasError('required')) return 'Email address is required';
    if (control.hasError('email')) return 'Please enter a valid email address';
    if (control.hasError('pattern')) return 'Invalid email format';
    return '';
  }

  private getPasswordError(
    control: import('@angular/forms').AbstractControl,
  ): string {
    if (control.hasError('required')) return 'Password is required';
    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength']?.requiredLength;
      return `Password must be at least ${minLength} characters`;
    }
    if (control.hasError('pattern'))
      return 'Password must contain at least one number';
    if (control.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength']?.requiredLength;
      return `Password must not exceed ${maxLength} characters`;
    }
    return '';
  }

  private getReligionTypeError(
    control: import('@angular/forms').AbstractControl,
  ): string {
    if (control.hasError('required')) return 'Please choose a religious status';
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
      default:
        return '';
    }
  }

  get isOtpInvalid(): boolean {
    const otpControl = this.otpForm.get('otp');
    return !!(
      otpControl &&
      otpControl.invalid &&
      (otpControl.dirty || otpControl.touched || this.otpTouched)
    );
  }

  protected onSocialSignIn(provider: 'google' | 'facebook'): void {
    if (!this.isBrowser) return;

    const loginMethod =
      provider === 'google'
        ? this.socialAuthService.signInWithGoogle()
        : this.socialAuthService.signInWithFacebook();

    loginMethod.subscribe({
      next: () => {
        this.submitSuccess = true;
        void this.router.navigate(['/home']);
      },
      error: (error) => {
        this.submitSuccess = false;
        globalThis.console.error(`${provider} login failed`, error);
      },
    });
  }

  protected get friendlyApiError(): string | null {
    return toFriendlyAuthErrorMessage(this.apiError());
  }

  onSubmit(): void {
    if (this.currentStep !== 1) {
      return;
    }

    this.registerForm.markAllAsTouched();

    // Mark all fields as touched for validation display
    Object.keys(this.fieldTouched).forEach((key) => {
      this.fieldTouched[key as keyof typeof this.fieldTouched] = true;
    });

    if (this.registerForm.valid && !this.loading()) {
      this.facade.clearError();
      const payload = this.buildRegisterPayload();
      this.registrationPayload = payload;
      const email = String(this.registerForm.value.email).trim();

      this.facade.register(payload).subscribe({
        next: () => {
          this.submitSuccess = false;
          this.registeredEmail = email;
          this.currentStep = 2;
          this.otpDigits = ['', '', '', '', '', ''];
          this.otpTouched = false;
          this.otpForm.reset({ otp: '' });
          this.startOtpTimer();
        },
        error: () => {
          this.submitSuccess = false;
        },
      });
    }
  }

  onOtpInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (!/^\d*$/.test(value)) {
      input.value = this.otpDigits[index];
      return;
    }

    this.otpDigits[index] = value.slice(-1);
    input.value = this.otpDigits[index];

    if (this.otpDigits[index] && index < 5) {
      const nextInput =
        input.parentElement?.nextElementSibling?.querySelector('input');
      nextInput?.focus();
    }

    this.otpForm.patchValue({ otp: this.otpDigits.join('') });
    this.otpForm.get('otp')?.markAsDirty();
  }

  onOtpKeydown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput =
        input.parentElement?.previousElementSibling?.querySelector('input');
      prevInput?.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text').trim() || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');

    digits.forEach((digit, index) => {
      if (index < 6) {
        this.otpDigits[index] = digit;
      }
    });

    this.otpForm.patchValue({ otp: this.otpDigits.join('') });
    this.otpForm.get('otp')?.markAsDirty();
  }

  onOtpSubmit(): void {
    if (this.loading()) {
      return;
    }

    const otp = this.otpDigits.join('');
    this.otpForm.patchValue({ otp });

    if (this.otpForm.invalid || !this.registeredEmail) {
      this.otpTouched = true;
      this.otpForm.get('otp')?.markAsTouched();
      return;
    }

    this.facade.clearError();

    this.facade.verifyRegistrationOtp(this.registeredEmail, otp).subscribe({
      next: () => {
        this.submitSuccess = true;
        if (this.otpTimerInterval) {
          globalThis.clearInterval(this.otpTimerInterval);
          this.otpTimerInterval = undefined;
        }
        void this.router.navigate(['/login'], {
          queryParams: { registered: 'success' },
        });
      },
      error: () => {
        this.submitSuccess = false;
        this.otpTouched = true;
      },
    });
  }

  goToRegisterStep(): void {
    if (this.otpTimerInterval) {
      globalThis.clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = undefined;
    }

    this.currentStep = 1;
    this.otpTouched = false;
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpTimer.set(60);
    this.canResendOtp.set(false);
    this.otpForm.reset({ otp: '' });
    this.facade.clearError();
  }

  protected startOtpTimer(): void {
    if (!this.isBrowser) {
      return;
    }

    this.otpTimer.set(60);
    this.canResendOtp.set(false);

    if (this.otpTimerInterval) {
      globalThis.clearInterval(this.otpTimerInterval);
      this.otpTimerInterval = undefined;
    }

    this.otpTimerInterval = globalThis.setInterval(() => {
      const nextTimer = this.otpTimer() - 1;
      this.otpTimer.set(Math.max(0, nextTimer));

      if (nextTimer <= 0) {
        this.canResendOtp.set(true);
        if (this.otpTimerInterval) {
          globalThis.clearInterval(this.otpTimerInterval);
          this.otpTimerInterval = undefined;
        }
      }
    }, 1000);
  }

  protected resendOtp(): void {
    if (!this.canResendOtp() || !this.registrationPayload || this.loading()) {
      return;
    }

    this.facade.clearError();
    this.otpDigits = ['', '', '', '', '', ''];
    this.otpTouched = false;
    this.otpForm.reset({ otp: '' });

    this.facade.register(this.registrationPayload).subscribe({
      next: () => {
        this.startOtpTimer();
      },
      error: () => {
        this.canResendOtp.set(true);
      },
    });
  }

  private buildRegisterPayload(): RegistrationData {
    const fullName = String(this.registerForm.value.fullName).trim();
    const [firstName, ...rest] = fullName.split(' ').filter(Boolean);
    const lastName = rest.join(' ');

    const religiousStatus =
      religionStatusBySelection[this.religionType ?? 'non-muslim'];

    return {
      email: String(this.registerForm.value.email).trim(),
      password: String(this.registerForm.value.password),
      firstName: firstName || 'User',
      lastName: lastName || 'Account',
      religiousStatus,
    };
  }

  private renderGoogleButton(): void {
    if (!this.isBrowser) return;

    this.abacrittAuthService.initState.pipe(take(1)).subscribe(() => {
      setTimeout(() => {
        const google = (window as any).google;
        if (google?.accounts?.id && this._googleBtnContainer?.nativeElement) {
          google.accounts.id.renderButton(this._googleBtnContainer.nativeElement, {
            type: 'standard',
            size: 'large',
            theme: 'outline',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 380
          });
        }
      }, 50);
    });
  }
}
