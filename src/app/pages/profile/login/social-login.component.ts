import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SocialLoginButtonComponent } from './social-login-button.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-social-login',
    standalone: true,
    imports: [CommonModule, SocialLoginButtonComponent],
    template: `
    <div class="social-login-container">
      <div class="divider-section">
        <span class="divider-text">Or continue with</span>
      </div>

      <div class="social-buttons-group">
        <app-social-login-button
          provider="google"
          (loginSuccess)="onLoginSuccess()"
          (loginError)="onLoginError($event)"
        />
        <app-social-login-button
          provider="facebook"
          (loginSuccess)="onLoginSuccess()"
          (loginError)="onLoginError($event)"
        />
      </div>

      @if (errorMessage) {
        <div class="error-message">
          {{ errorMessage }}
        </div>
      }
    </div>
  `,
    styles: [`
    .social-login-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-top: 1.5rem;
    }

    .divider-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin: 0.5rem 0;

      &::before,
      &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--color-border-primary, #e5e7eb);
      }

      .divider-text {
        font-size: 0.875rem;
        color: var(--color-text-secondary, #6b7280);
        white-space: nowrap;
      }
    }

    .social-buttons-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;

      @media (max-width: 640px) {
        grid-template-columns: 1fr;
      }
    }

    .error-message {
      padding: 0.75rem 1rem;
      background: var(--color-status-error-light, #fee2e2);
      color: var(--color-status-error-base, #dc2626);
      border-radius: var(--border-radius-default);
      font-size: 0.875rem;
      text-align: center;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialLoginComponent {
    errorMessage = '';
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);

    onLoginSuccess(): void {
        // Token is already stored by the social auth service
        // Navigate to dashboard or home page
        this.router.navigate(['/home']).catch(() => {
            // Fallback navigation
            this.router.navigate(['/']).catch(() => {
                // If navigation fails, refresh the page
                if (typeof globalThis !== 'undefined' && globalThis.location) {
                    globalThis.location.href = '/';
                }
            });
        });
    }

    onLoginError(error: Error): void {
        this.errorMessage = error.message || 'Login failed. Please try again.';
    }
}
