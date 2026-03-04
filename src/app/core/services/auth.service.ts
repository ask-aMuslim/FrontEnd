/**
 * Auth Service
 * 
 * Facade for authentication operations that bridges the gap between
 * the new TokenService-based architecture and existing components.
 * 
 * This service is being phased out in favor of IdentityFacade + TokenService.
 * New code should use IdentityFacade directly.
 * 
 * @deprecated Use IdentityFacade and TokenService directly
 */

import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';

// New architecture imports
import { IdentityFacade } from '../api/facades/identity.facade';
import { TokenService } from '../auth/token.service';

// Legacy imports (for social login - not in Swagger spec yet)
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '../constants/api-endpoints';

// Types
import { LoginViewModel } from '../api/generated/models';
import { AuthResponse, RegisterRequest } from '../models/interfaces/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly facade = inject(IdentityFacade);
  private readonly tokenService = inject(TokenService);
  private readonly legacyApi = inject(ApiService);
  private readonly router = inject(Router);

  // Reactive authentication state using signals
  // These now delegate to TokenService
  private _currentUser = signal<{ name: string; meta: string } | null>(null);

  // Expose isAuthenticated from TokenService
  readonly isAuthenticated = this.tokenService.isAuthenticated;
  readonly currentUser = this._currentUser.asReadonly();

  constructor() {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    // TokenService handles its own initialization from localStorage
    // We just need to set up the user info if authenticated
    if (this.tokenService.isAuthenticated()) {
      const email = this.tokenService.userEmail();
      this._currentUser.set(email ? { name: email, meta: 'Signed in' } : null);
    }
  }

  /**
   * Set authenticated user state (for manual state updates)
   * @deprecated Use TokenService.setTokens() instead
   */
  setAuthenticatedUser(user?: { name: string; meta: string }): void {
    this._currentUser.set(user ?? null);
  }

  /**
   * Clear authentication state (for manual state updates)
   * @deprecated Use TokenService.clear() instead
   */
  clearAuthState(): void {
    this._currentUser.set(null);
  }

  /**
   * Logout user
   * Clears tokens and navigates to login
   */
  logout(): Observable<void> {
    // Clear local state
    this._currentUser.set(null);

    // Call backend logout and clear tokens
    return this.facade.logout().pipe(
      tap(() => {
        // Navigate to login
        this.router.navigate(['/login']);
      }),
      catchError(() => {
        // Even if logout fails, tokens are cleared by facade
        this.router.navigate(['/login']);
        return of(undefined);
      })
    );
  }

  /**
   * Register new user
   */
  register(payload: RegisterRequest): Observable<AuthResponse> {
    let role: 'Student' | 'Instructor' | 'Admin' = 'Student';
    if (payload.role === 1) {
      role = 'Instructor';
    } else if (payload.role === 2) {
      role = 'Admin';
    }

    return this.facade.register({
      Email: payload.email,
      Password: payload.password,
      FirstName: payload.firstName,
      LastName: payload.lastName,
      Role: role,
    }).pipe(
      map(() => {
        // The generated API returns void, but we need to return AuthResponse
        // This is a temporary workaround until Swagger spec includes proper response types
        return {
          accessToken: '',
          refreshToken: '',
          expiresIn: 0
        } as AuthResponse;
      }),
      tap(() => {
        // If the API actually returns tokens, they would be set here
        // For now, user needs to login after registration
      })
    );
  }

  /**
   * Login user with credentials
   */
  login(payload: LoginViewModel): Observable<AuthResponse> {
    return this.facade.login(payload).pipe(
      map(() => {
        // The generated API returns void, but we need to return AuthResponse
        // This is a temporary workaround until Swagger spec includes proper response types
        // The actual tokens are handled by the HTTP response, not the generated client
        return {
          accessToken: this.tokenService.accessToken() || '',
          refreshToken: this.tokenService.refreshToken() || '',
          expiresIn: 3600 // Default 1 hour
        } as AuthResponse;
      }),
      tap(() => {
        // Update user state
        this._currentUser.set({
          name: payload.email,
          meta: 'Signed in',
        });
      })
    );
  }

  /**
   * Login with Google
   * Note: This endpoint is not in Swagger spec, uses legacy API
   */
  loginGoogle(token: string): Observable<AuthResponse> {
    return this.legacyApi.post<AuthResponse>(API_ENDPOINTS.auth.loginGoogle(), { token }).pipe(
      tap((response) => {
        // Store tokens in TokenService
        if (response?.accessToken) {
          this.tokenService.setTokens({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken ?? '',
            expiresIn: response.expiresIn ?? 3600
          });
          this._currentUser.set({ name: 'Google User', meta: 'Signed in with Google' });
        }
      })
    );
  }

  /**
   * Login with Facebook
   * Note: This endpoint is not in Swagger spec, uses legacy API
   */
  loginFacebook(payload: { accessToken: string }): Observable<AuthResponse> {
    return this.legacyApi.post<AuthResponse>(API_ENDPOINTS.auth.loginFacebook(), payload).pipe(
      tap((response) => {
        // Store tokens in TokenService
        if (response?.accessToken) {
          this.tokenService.setTokens({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken ?? '',
            expiresIn: response.expiresIn ?? 3600
          });
          this._currentUser.set({ name: 'Facebook User', meta: 'Signed in with Facebook' });
        }
      })
    );
  }

  /**
   * Check if user has valid session
   */
  hasValidSession(): boolean {
    return this.tokenService.hasValidSession();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.tokenService.accessToken();
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return this.tokenService.refreshToken();
  }
}
