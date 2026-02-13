/**
 * Identity Facade Service
 * 
 * Wraps generated API functions for authentication and identity operations.
 * Integrates with TokenService for JWT lifecycle management.
 */

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ApiConfiguration } from '../generated/api-configuration';
import { TokenService } from '../../auth/token.service';
import { ErrorNormalizer } from '../../errors/error-normalizer';
import { SKIP_AUTH } from '../../http/context-tokens';

// Generated function imports
import { apiIdentityLoginLoginPost } from '../generated/fn/identity/api-identity-login-login-post';
import { apiIdentityRegisterRegisterPost } from '../generated/fn/identity/api-identity-register-register-post';
import { apiIdentityLogoutLogoutPost } from '../generated/fn/identity/api-identity-logout-logout-post';
import { apiIdentityUpdateEmailUpdateEmailPut } from '../generated/fn/identity/api-identity-update-email-update-email-put';
import { apiIdentityUpdatePasswordUpdatePasswordPut } from '../generated/fn/identity/api-identity-update-password-update-password-put';
import { apiIdentityUpdateNameUpdateNamePut } from '../generated/fn/identity/api-identity-update-name-update-name-put';
import type { ApiIdentityRegisterRegisterPost$Params } from '../generated/fn/identity/api-identity-register-register-post';

// Generated model imports
import type { LoginViewModel } from '../generated/models/login-view-model';
import type { UpdateEmailDto } from '../generated/models/update-email-dto';
import type { UpdatePasswordDto } from '../generated/models/update-password-dto';
import type { UpdateNameDto } from '../generated/models/update-name-dto';

/** Response from login endpoint - adjusted based on actual API response */
interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    userId?: string;
    userEmail?: string;
}

type RegisterBody = NonNullable<ApiIdentityRegisterRegisterPost$Params['body']>;

@Injectable({ providedIn: 'root' })
export class IdentityFacade {
    private readonly http = inject(HttpClient);
    private readonly config = inject(ApiConfiguration);
    private readonly tokenService = inject(TokenService);
    private readonly errorNormalizer = inject(ErrorNormalizer);

    // Reactive state
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);

    // Public readonly signals
    readonly loading = this._loading.asReadonly();
    readonly error = this._error.asReadonly();

    // Expose authentication state from TokenService
    readonly isAuthenticated = this.tokenService.isAuthenticated;

    /**
     * Login user with credentials
     * Stores tokens in TokenService on success
     * 
     * Note: The generated API returns void, but the actual API returns tokens.
     * This will be adjusted when the Swagger spec is updated to include proper response types.
     */
    login(credentials: LoginViewModel): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        // Create context to skip auth for login request
        const context = new HttpContext().set(SKIP_AUTH, true);

        return this.http.post<LoginResponse>(
            `${this.config.rootUrl}${apiIdentityLoginLoginPost.PATH}`,
            credentials,
            { context }
        ).pipe(
            tap((response) => {
                if (!response?.accessToken) {
                    throw new Error('Login response did not include access token');
                }

                this.tokenService.setTokens({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken ?? '',
                    expiresIn: response.expiresIn ?? 3600,
                    userId: response.userId,
                    userEmail: response.userEmail,
                });
            }),
            map(() => undefined),
            tap(() => {
                this._loading.set(false);
            }),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError.message);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Register new user
     */
    register(userData: RegisterBody): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        // Create context to skip auth for register request
        const context = new HttpContext().set(SKIP_AUTH, true);

        return apiIdentityRegisterRegisterPost(
            this.http,
            this.config.rootUrl,
            { body: userData },
            context
        ).pipe(
            map(() => undefined),
            tap(() => this._loading.set(false)),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError.message);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Update user email
     */
    updateEmail(data: UpdateEmailDto): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return apiIdentityUpdateEmailUpdateEmailPut(this.http, this.config.rootUrl, { body: data }).pipe(
            map(() => undefined),
            tap(() => this._loading.set(false)),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError.message);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Update user password
     */
    updatePassword(data: UpdatePasswordDto): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return apiIdentityUpdatePasswordUpdatePasswordPut(this.http, this.config.rootUrl, { body: data }).pipe(
            map(() => undefined),
            tap(() => this._loading.set(false)),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError.message);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Update user name
     */
    updateName(data: UpdateNameDto): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return apiIdentityUpdateNameUpdateNamePut(this.http, this.config.rootUrl, { body: data }).pipe(
            map(() => undefined),
            tap(() => this._loading.set(false)),
            catchError(error => {
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError.message);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Logout user - clears tokens and calls backend logout endpoint
     */
    logout(): Observable<void> {
        this._loading.set(true);
        this._error.set(null);

        return apiIdentityLogoutLogoutPost(this.http, this.config.rootUrl).pipe(
            map(() => undefined),
            tap(() => {
                // Clear tokens from TokenService
                this.tokenService.clearTokens();
                this._loading.set(false);
            }),
            catchError(error => {
                // Still clear tokens on error
                this.tokenService.clearTokens();
                this._loading.set(false);
                const apiError = this.errorNormalizer.normalize(error);
                this._error.set(apiError.message);
                return throwError(() => apiError);
            })
        );
    }

    /**
     * Clear any error message
     */
    clearError(): void {
        this._error.set(null);
    }

    /**
     * Check if user has valid session
     */
    hasValidSession(): boolean {
        return this.tokenService.hasValidSession();
    }

    /**
     * Get current auth state for debugging
     */
    getAuthState() {
        return this.tokenService.getAuthState();
    }

    /**
     * Set tokens manually (for cases where tokens are obtained outside normal flow)
     * This is a temporary method until the Swagger spec properly defines token responses
     */
    setTokens(tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        userId?: string;
        userEmail?: string;
    }): void {
        this.tokenService.setTokens(tokens);
    }
}
