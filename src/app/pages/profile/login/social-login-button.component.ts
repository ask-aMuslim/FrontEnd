import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialAuthenticationService } from '../../../core/services/social-auth.service';

export type SocialProvider = 'google' | 'facebook';

@Component({
  selector: 'app-social-login-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="'social-login-btn ' + provider"
      (click)="onSocialLogin()"
      [disabled]="isLoading"
      type="button"
    >
      @if (isLoading) {
        <span class="loading-spinner"></span>
      } @else {
        <img 
          [src]="getProviderIcon()" 
          [alt]="provider + ' logo'"
          class="provider-icon"
        />
      }
      <span class="btn-text">{{ getButtonText() }}</span>
    </button>
  `,
  styles: [`
    .social-login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      border: 1px solid var(--color-border-primary, #e5e7eb);
      border-radius: var(--border-radius-default);
      background: white;
      color: var(--color-text-body, #1f2937);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1rem;

      &:hover:not(:disabled) {
        background: var(--color-card-surface-secondary, #f9fafb);
        border-color: var(--color-border-secondary, #d1d5db);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .provider-icon {
        width: 20px;
        height: 20px;
        object-fit: contain;
      }

      .btn-text {
        font-size: 0.95rem;
      }

      .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(0, 0, 0, 0.1);
        border-top: 2px solid rgba(0, 0, 0, 0.3);
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialLoginButtonComponent {
  @Input() provider: SocialProvider = 'google';
  @Output() loginSuccess = new EventEmitter<{ token: string; user: Record<string, unknown> }>();
  @Output() loginError = new EventEmitter<Error>();

  isLoading = false;
  private readonly socialAuthService = inject(SocialAuthenticationService);

  getProviderIcon(): string {
    return this.provider === 'google'
      ? '/icons/icons-social-apps/google.svg'
      : '/icons/icons-social-apps/facebook.svg';
  }

  getButtonText(): string {
    return this.provider === 'google'
      ? 'Sign in with Google'
      : 'Sign in with Facebook';
  }

  onSocialLogin(): void {
    this.isLoading = true;
    const loginMethod = this.provider === 'google'
      ? this.socialAuthService.signInWithGoogle()
      : this.socialAuthService.signInWithFacebook();

    loginMethod.subscribe({
      next: (response) => {
        this.isLoading = false;
        this.loginSuccess.emit(response);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error instanceof Error ? error : new Error('Authentication failed');
        this.loginError.emit(errorMessage);
      },
    });
  }
}
