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

import { Injectable, Injector, effect, signal, inject } from '@angular/core';
import { Observable, map, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { toApiMediaUrl } from '../helpers/media-url.helper';

// New architecture imports
import { IdentityFacade } from '../../api/facades/identity.facade';
import { TokenService } from '../auth/token.service';
import { StudentFacade } from '../../api/facades/student.facade';
import { SocialAuthenticationService } from './social-auth.service';

// Types
import { AuthResponse, RegisterRequest } from '../models/interfaces/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly facade = inject(IdentityFacade);
  private readonly tokenService = inject(TokenService);
  private readonly studentFacade = inject(StudentFacade);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  // Reactive authentication state using signals
  // These now delegate to TokenService
  private _currentUser = signal<{
    name: string;
    meta: string;
    imageUrl?: string | null;
  } | null>(null);

  // Expose isAuthenticated from TokenService
  readonly isAuthenticated = this.tokenService.isAuthenticated;
  readonly currentUser = this._currentUser.asReadonly();
  readonly error = this.facade.error;

  constructor() {
    this.initializeAuthState();
    this.setupAuthHydrationEffect();
  }

  private initializeAuthState(): void {
    // TokenService handles its own initialization from sessionStorage
    // We just need to set up the user info if authenticated
    if (this.tokenService.isAuthenticated()) {
      this.hydrateCurrentUserFromProfile();
    }
  }

  /**
   * Set authenticated user state (for manual state updates)
   * @deprecated Use TokenService.setTokens() instead
   */
  setAuthenticatedUser(user?: { name: string; meta: string; imageUrl?: string | null }): void {
    if (!user) {
      this._currentUser.set(null);
      return;
    }

    this._currentUser.set({
      ...user,
      imageUrl: this.normalizeImageUrl(user.imageUrl),
    });
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

    // Also clear social auth state (Google/Facebook) to prevent auto-login bounce
    this.injector.get(SocialAuthenticationService, null)?.signOut().subscribe({
      error: () => {
        /* ignore */
      },
    });

    return this.facade.logout().pipe(
      catchError(() => of(undefined)),
      finalize(() => {
        this.tokenService.clearTokens();
        this.studentFacade.clearCache();
        void this.router.navigate(['/']);
      }),
      map(() => void 0),
    );
  }

  /**
   * Register new user
   */
  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.facade
      .register({
        email: payload.email,
        password: payload.password,
        firstName: payload.firstName,
        lastName: payload.lastName,
        religiousStatus: payload.religiousStatus,
      })
      .pipe(
        map(() => {
          // The generated API returns void, but we need to return AuthResponse
          // This is a temporary workaround until Swagger spec includes proper response types
          return {
            accessToken: '',
            refreshToken: '',
            expiresIn: 0,
          } as AuthResponse;
        }),
        tap(() => {
          // If the API actually returns tokens, they would be set here
          // For now, user needs to login after registration
        }),
      );
  }

  /**
   * Login user with credentials
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.facade.login(email, password).pipe(
      map((response) => {
        // The facade returns LoginResponse with token and user info
        return {
          accessToken: response.token || '',
          refreshToken: '',
          expiresIn: response.expiresIn ?? 3600,
        } as AuthResponse;
      }),
      tap(() => {
        this.studentFacade.clearCache();
        this._currentUser.set({ name: email, meta: 'Signed in' });
        this.hydrateCurrentUserFromProfile();
      }),
    );
  }

  /**
   * Login with Google
   */
  loginGoogle(token: string): Observable<AuthResponse> {
    return this.facade.loginGoogle(token).pipe(
      map((response) => ({
        accessToken: response.token ?? '',
        refreshToken: '',
        expiresIn: response.expiresIn ?? 3600,
      })),
      tap(() => {
        this.studentFacade.clearCache();
        this._currentUser.set({
          name: 'Google User',
          meta: 'Signed in with Google',
        });
        this.hydrateCurrentUserFromProfile();
      }),
    );
  }

  /**
   * Login with Facebook
   */
  loginFacebook(payload: { accessToken: string }): Observable<AuthResponse> {
    return this.facade.loginFacebook(payload.accessToken).pipe(
      map((response) => ({
        accessToken: response.token ?? '',
        refreshToken: '',
        expiresIn: response.expiresIn ?? 3600,
      })),
      tap(() => {
        this.studentFacade.clearCache();
        this._currentUser.set({
          name: 'Facebook User',
          meta: 'Signed in with Facebook',
        });
        this.hydrateCurrentUserFromProfile();
      }),
    );
  }

  /**
   * Check if user has valid session
   */
  hasValidSession(): boolean {
    return this.tokenService.hasValidSession();
  }

  clearError(): void {
    this.facade.clearError();
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
    return null;
  }

  getCurrentUserName(): string {
    const rawName = this._currentUser()?.name || this.tokenService.userEmail() || 'User';
    return this.isEmail(rawName) ? this.formatEmailAsName(rawName) : rawName;
  }

  getCurrentUserMeta(): string {
    return (
      this._currentUser()?.meta ||
      (this.tokenService.isAuthenticated() ? 'Signed in' : 'Guest')
    );
  }

  getCurrentUserImageUrl(): string {
    return this.normalizeImageUrl(this._currentUser()?.imageUrl) ?? '/images/profile-placeholder.svg';
  }

  updateCurrentUserImageUrl(imageUrl?: string | null): void {
    const currentUser = this._currentUser();

    if (!currentUser) {
      return;
    }

    this._currentUser.set({
      ...currentUser,
      imageUrl: this.normalizeImageUrl(imageUrl),
    });
  }

  private setupAuthHydrationEffect(): void {
    effect(() => {
      const authenticated = this.tokenService.isAuthenticated();
      const fallbackEmail = this.tokenService.userEmail();

      if (!authenticated) {
        this._currentUser.set(null);
        return;
      }

      this._currentUser.set({
        name: fallbackEmail || 'User',
        meta: 'Signed in',
      });
      this.hydrateCurrentUserFromProfile();
    });
  }

  private hydrateCurrentUserFromProfile(): void {
    const fallbackEmail = this.tokenService.userEmail();
    if (!fallbackEmail) {
      this._currentUser.set(null);
      return;
    }

    this._currentUser.set({ name: fallbackEmail, meta: 'Signed in' });

    this.studentFacade
      .getMyProfile()
      .pipe(
        map((profile: unknown) => {
          const profileRecord = this.asRecord(profile);

          const firstName = this.getString(profileRecord, [
            'firstName',
            'firstname',
            'givenName',
          ]);
          const lastName = this.getString(profileRecord, [
            'lastName',
            'lastname',
            'familyName',
          ]);
          const fullNameFromParts = `${firstName} ${lastName}`.trim();
          const fullName =
            fullNameFromParts ||
            this.getString(profileRecord, [
              'fullName',
              'name',
              'displayName',
            ]) ||
            fallbackEmail;

          const level = this.getString(profileRecord, [
            'level',
            'studentLevel',
            'stage',
          ]);
          const meta = level ? `Level ${level}` : 'Student';
          const imageUrl = this.getString(profileRecord, [
            'imageUrl',
            'profileImageUrl',
            'picture',
            'avatarUrl',
          ]);

          return {
            name: fullName,
            meta,
            imageUrl: this.normalizeImageUrl(imageUrl),
          };
        }),
        catchError(() => of({ name: fallbackEmail, meta: 'Signed in' })),
      )
      .subscribe(
        (user: { name: string; meta: string; imageUrl?: string | null }) => {
          this._currentUser.set(user);
        },
      );
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : null;
  }

  private getString(
    record: Record<string, unknown> | null,
    keys: string[],
  ): string {
    if (!record) {
      return '';
    }

    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }

    return '';
  }

  private normalizeImageUrl(imageUrl?: string | null): string | null {
    return toApiMediaUrl(typeof imageUrl === 'string' ? imageUrl : null);
  }

  private isEmail(value: string): boolean {
    return typeof value === 'string' && value.includes('@');
  }

  private formatEmailAsName(email: string): string {
    if (!email) return 'User';
    const localPart = email.split('@')[0];
    if (!localPart) return 'User';
    return localPart
      .replace(/[._-]/g, ' ')
      .split(' ')
      .filter((word) => word.length > 0)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
