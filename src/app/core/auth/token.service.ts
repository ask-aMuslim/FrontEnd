/**
 * Token Service
 * 
 * Centralized JWT lifecycle management with Angular signals.
 * Access token is sessionStorage-backed. Refresh token is cookie-based.
 */

import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IS_REFRESH_REQUEST, REQUIRE_CREDENTIALS, SKIP_AUTH } from '../http/context-tokens';

const AUTH_REFRESH_PATH = '/api/Authentication/refresh-token';
const LEGACY_REFRESH_PATHS = ['/api/Authentication/refresh', '/api/Identity/Refresh'];

/** Storage key for auth data */
const AUTH_SESSION_STORAGE_KEY = 'aam_auth_session';

/** Token data structure */
interface TokenData {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

/** Internal storage structure */
interface AuthStorage extends TokenData {
  userId?: string;
  userEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly http = inject(HttpClient);

  // Memory-first storage using signals
  private readonly _accessToken = signal<string | null>(null);
  // Refresh token is stored in secure HttpOnly cookies only (not in JS storage).
  private readonly _refreshToken = signal<string | null>(null);
  private readonly _expiresAt = signal<number | null>(null);
  private readonly _userId = signal<string | null>(null);
  private readonly _userEmail = signal<string | null>(null);
  private readonly _isInitialized = signal<boolean>(false);
  private initializationPromise: Promise<void> | null = null;

  // Time before expiry to trigger proactive refresh (1 minute)
  private readonly refreshBufferMs = 60 * 1000;

  // Public readonly signals
  readonly accessToken = this._accessToken.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly userId = this._userId.asReadonly();
  readonly userEmail = this._userEmail.asReadonly();
  readonly isInitialized = this._isInitialized.asReadonly();

  // Computed signals
  readonly isAuthenticated = computed(() => !!this._accessToken());

  readonly isTokenExpiringSoon = computed(() => {
    const expiresAt = this._expiresAt();
    if (!expiresAt) return false;
    return Date.now() > expiresAt - this.refreshBufferMs;
  });

  readonly isTokenExpired = computed(() => {
    const expiresAt = this._expiresAt();
    if (!expiresAt) return true;
    return Date.now() >= expiresAt;
  });

  constructor() { }

  /**
   * Initialize auth state from persisted storage.
   * Safe to call multiple times (idempotent).
   */
  initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = Promise.resolve().then(() => {
      if (!this.isBrowser) {
        this._isInitialized.set(true);
        return;
      }

      this.restoreFromStorage();
      this._isInitialized.set(true);
    });

    return this.initializationPromise;
  }

  /**
   * Set tokens after successful login/refresh
   */
  setTokens(data: {
    accessToken: string;
    refreshToken?: string | null;
    expiresIn: number;
    userId?: string;
    userEmail?: string;
  }): void {
    const normalizedRefreshToken = this.normalizeOptionalString(data.refreshToken);
    const expiresAt = Date.now() + data.expiresIn * 1000;

    this._accessToken.set(data.accessToken);
    this._refreshToken.set(normalizedRefreshToken);
    this._expiresAt.set(expiresAt);

    if (data.userId) this._userId.set(data.userId);
    if (data.userEmail) this._userEmail.set(data.userEmail);

    this.persistToStorage({
      accessToken: data.accessToken,
      refreshToken: normalizedRefreshToken,
      expiresAt,
      userId: data.userId,
      userEmail: data.userEmail
    });
  }

  /**
   * Clear all tokens (logout)
   */
  clearTokens(): void {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._expiresAt.set(null);
    this._userId.set(null);
    this._userEmail.set(null);
    this.clearStorage();
  }

  /**
   * Get a valid token, refreshing if necessary
   * Returns Observable to handle async refresh
   */
  getValidToken(): Observable<string> {
    const currentToken = this._accessToken();

    // No token - user not authenticated
    if (!currentToken) {
      return throwError(() => new Error('No authentication token available'));
    }

    // Token still valid and not expiring soon
    if (!this.isTokenExpiringSoon() && !this.isTokenExpired()) {
      return of(currentToken);
    }

    // Token expired or expiring soon - need refresh
    return this.refreshAccessToken();
  }

  /**
   * Refresh the access token using refresh cookie
   */
  refreshAccessToken(): Observable<string> {
    // Call refresh endpoint
    return this.callRefreshEndpoint().pipe(
      tap(response => {
        this.setTokens({
          accessToken: response.accessToken,
          expiresIn: response.expiresIn
        });
      }),
      map(response => response.accessToken),
      catchError(error => {
        // Refresh failed - clear tokens
        this.clearTokens();
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if user has valid session
   */
  hasValidSession(): boolean {
    return this.isAuthenticated() && !this.isTokenExpired();
  }

  /**
   * Get current auth state for debugging
   */
  getAuthState(): {
    isAuthenticated: boolean;
    hasToken: boolean;
    isExpiringSoon: boolean;
    isExpired: boolean;
    userId: string | null;
    userEmail: string | null;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      hasToken: !!this._accessToken(),
      isExpiringSoon: this.isTokenExpiringSoon(),
      isExpired: this.isTokenExpired(),
      userId: this._userId(),
      userEmail: this._userEmail()
    };
  }

  canUseCookieRefresh(): boolean {
    return this.isBrowser;
  }

  // ==================== Private Methods ====================

  /**
   * Initialize tokens from storage on service creation
   */
  private restoreFromStorage(): void {
    if (!this.isBrowser) return;

    try {
      const stored = globalThis.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      if (!stored) return;

      const data: AuthStorage = JSON.parse(stored);

      // Check if stored token is still valid
      if (data.expiresAt && data.expiresAt > Date.now()) {
        this._accessToken.set(data.accessToken);
        this._refreshToken.set(this.normalizeOptionalString(data.refreshToken));
        this._expiresAt.set(data.expiresAt);
        this._userId.set(data.userId ?? null);
        this._userEmail.set(data.userEmail ?? null);
      } else {
        // Token expired - clear storage
        this.clearStorage();
      }
    } catch {
      this.clearStorage();
    }
  }

  /**
   * Persist access token to sessionStorage
   */
  private persistToStorage(data: AuthStorage): void {
    if (!this.isBrowser) return;

    try {
      globalThis.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage write failed silently
    }
  }

  /**
   * Clear sessionStorage
   */
  private clearStorage(): void {
    if (!this.isBrowser) return;

    try {
      globalThis.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      // Storage clear failed silently
    }
  }

  /**
   * Call the refresh token endpoint
   * Note: This endpoint may not exist in current Swagger spec
   * Adjust the endpoint path as needed
   */
  private callRefreshEndpoint(): Observable<{
    accessToken: string;
    expiresIn: number;
  }> {
    const normalizedBaseUrl = environment.apiBaseUrl.replaceAll(/\/+$/g, '');
    const refreshUrls = [AUTH_REFRESH_PATH, ...LEGACY_REFRESH_PATHS]
      .map((path) => `${normalizedBaseUrl}${path}`);

    return this.tryRefreshUrls(refreshUrls);
  }

  private tryRefreshUrls(
    refreshUrls: readonly string[],
  ): Observable<{
    accessToken: string;
    expiresIn: number;
  }> {
    if (refreshUrls.length === 0) {
      return throwError(() => new Error('No refresh endpoint configured'));
    }

    const [currentUrl, ...remainingUrls] = refreshUrls;

    return this.http.post<unknown>(
      currentUrl,
      {},
      {
        withCredentials: true,
        context: new HttpContext()
          .set(IS_REFRESH_REQUEST, true)
          .set(REQUIRE_CREDENTIALS, true)
          .set(SKIP_AUTH, true)
      }
    ).pipe(
      map((response) => this.normalizeRefreshResponse(response)),
      catchError((error: unknown) => {
        if (remainingUrls.length === 0) {
          return throwError(() => error);
        }

        return this.tryRefreshUrls(remainingUrls);
      })
    );
  }

  private normalizeRefreshResponse(
    response: unknown,
  ): {
    accessToken: string;
    expiresIn: number;
  } {
    const topLevel = this.asRecord(response);
    const nestedData = this.asRecord(topLevel?.['data']);
    const payload = nestedData ?? topLevel;

    const accessToken = this.normalizeOptionalString(payload?.['accessToken'])
      ?? this.normalizeOptionalString(payload?.['token']);
    const expiresIn = this.resolveExpiresInSeconds(payload?.['expiresIn'], payload?.['expiresAt']);

    if (!accessToken) {
      throw new Error('Refresh endpoint did not return an access token');
    }

    return {
      accessToken,
      expiresIn,
    };
  }

  private resolveExpiresInSeconds(
    expiresInValue: unknown,
    expiresAtValue: unknown,
  ): number {
    if (typeof expiresInValue === 'number' && Number.isFinite(expiresInValue)) {
      return Math.max(60, Math.floor(expiresInValue));
    }

    if (typeof expiresAtValue === 'string') {
      const expiresAtMs = Date.parse(expiresAtValue);
      if (Number.isFinite(expiresAtMs)) {
        return Math.max(60, Math.floor((expiresAtMs - Date.now()) / 1000));
      }
    }

    return 24 * 60 * 60;
  }

  private normalizeOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : null;
  }
}
