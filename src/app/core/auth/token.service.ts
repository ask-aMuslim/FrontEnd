/**
 * Token Service
 *
 * Centralized JWT lifecycle management with Angular signals.
 * Access token is memory-only. Refresh token is handled via HttpOnly cookie.
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { refreshToken } from '../../api/functions';
import { ResultOfAuthenticationResponse } from '../../api/models/result-of-authentication-response';
import {
  IS_REFRESH_REQUEST,
  REQUIRE_CREDENTIALS,
  SKIP_AUTH,
} from '../http/context-tokens';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

const AUTH_SESSION_STORAGE_KEY = 'aam_auth_session';

interface SessionAuthStorage {
  accessToken: string;
  expiresAt: number;
  userId?: string;
  userEmail?: string;
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Access token is kept in memory only.
  private readonly _accessToken = signal<string | null>(null);
  private readonly _expiresAt = signal<number | null>(null);
  private readonly _userId = signal<string | null>(null);
  private readonly _userEmail = signal<string | null>(null);
  private readonly _isInitialized = signal<boolean>(false);
  private initializationPromise: Promise<void> | null = null;

  // Time before expiry to trigger proactive refresh (1 minute)
  private readonly refreshBufferMs = 60 * 1000;

  // Public readonly signals
  readonly accessToken = this._accessToken.asReadonly();
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
      this.restoreSessionState();
      this._isInitialized.set(true);
    });

    return this.initializationPromise;
  }

  /**
   * Set tokens after successful login/refresh
   */
  setTokens(data: {
    accessToken: string;
    expiresIn: number;
    userId?: string;
    userEmail?: string;
  }): void {
    const expiresAt = Date.now() + data.expiresIn * 1000;

    this._accessToken.set(data.accessToken);
    this._expiresAt.set(expiresAt);

    if (data.userId) this._userId.set(data.userId);
    if (data.userEmail) this._userEmail.set(data.userEmail);

    this.persistSessionState({
      accessToken: data.accessToken,
      expiresAt,
      userId: data.userId,
      userEmail: data.userEmail,
    });
  }

  /**
   * Clear all tokens (logout)
   */
  clearTokens(): void {
    this._accessToken.set(null);
    this._expiresAt.set(null);
    this._userId.set(null);
    this._userEmail.set(null);
    this.clearSessionState();
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
   * Refresh the access token using HttpOnly refresh cookie
   */
  refreshAccessToken(): Observable<string> {
    return this.callRefreshEndpoint().pipe(
      tap(response => {
        this.setTokens({
          accessToken: response.accessToken,
          expiresIn: response.expiresIn,
          userId: response.userId,
          userEmail: response.userEmail,
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

  private callRefreshEndpoint(): Observable<{
    accessToken: string;
    expiresIn: number;
    userId?: string;
    userEmail?: string;
  }> {
    const context = new HttpContext()
      .set(IS_REFRESH_REQUEST, true)
      .set(SKIP_AUTH, true)
      .set(REQUIRE_CREDENTIALS, true);

    return refreshToken(
      this.http,
      environment.apiBaseUrl,
      { body: {} },
      context,
    ).pipe(
      map((response) => this.mapRefreshResponse(response.body ?? null)),
    );
  }

  private mapRefreshResponse(response: ResultOfAuthenticationResponse | null): {
    accessToken: string;
    expiresIn: number;
    userId?: string;
    userEmail?: string;
  } {
    const data = response?.data;
    const accessToken = data?.token;

    if (!accessToken || accessToken.trim().length === 0) {
      throw new Error('Refresh endpoint did not return an access token');
    }

    const expiresAt = data?.expiresAt
      ? new Date(data.expiresAt).getTime()
      : Date.now() + 24 * 60 * 60 * 1000;

    const expiresIn = Math.max(60, Math.floor((expiresAt - Date.now()) / 1000));

    return {
      accessToken,
      expiresIn,
      userId: data?.userId ?? undefined,
      userEmail: data?.email ?? undefined,
    };
  }

  private restoreSessionState(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const state = JSON.parse(raw) as SessionAuthStorage;
      if (!state.accessToken || typeof state.accessToken !== 'string') {
        this.clearSessionState();
        return;
      }

      if (!state.expiresAt || state.expiresAt <= Date.now()) {
        this.clearSessionState();
        return;
      }

      this._accessToken.set(state.accessToken);
      this._expiresAt.set(state.expiresAt);
      this._userId.set(state.userId ?? null);
      this._userEmail.set(state.userEmail ?? null);
    } catch {
      this.clearSessionState();
    }
  }

  private persistSessionState(state: SessionAuthStorage): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      window.sessionStorage.setItem(
        AUTH_SESSION_STORAGE_KEY,
        JSON.stringify(state),
      );
    } catch {
      // Ignore storage write failures.
    }
  }

  private clearSessionState(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage clear failures.
    }
  }
}
