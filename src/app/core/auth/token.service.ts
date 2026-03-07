/**
 * Token Service
 * 
 * Centralized JWT lifecycle management with Angular signals.
 * Memory-first storage with localStorage fallback for persistence.
 */

import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { IS_REFRESH_REQUEST, SKIP_AUTH } from '../http/context-tokens';

const AUTH_REFRESH_PATH = '/api/Authentication/refresh';

/** Storage key for auth data */
const AUTH_STORAGE_KEY = 'aam_auth';

/** Token data structure */
interface TokenData {
    accessToken: string;
    refreshToken: string;
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
    private readonly _refreshToken = signal<string | null>(null);
    private readonly _expiresAt = signal<number | null>(null);
    private readonly _userId = signal<string | null>(null);
    private readonly _userEmail = signal<string | null>(null);

    // Time before expiry to trigger proactive refresh (1 minute)
    private readonly refreshBufferMs = 60 * 1000;

    // Public readonly signals
    readonly accessToken = this._accessToken.asReadonly();
    readonly refreshToken = this._refreshToken.asReadonly();
    readonly userId = this._userId.asReadonly();
    readonly userEmail = this._userEmail.asReadonly();

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

    constructor() {
        this.initializeFromStorage();
    }

    /**
     * Set tokens after successful login/refresh
     */
    setTokens(data: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        userId?: string;
        userEmail?: string;
    }): void {
        const expiresAt = Date.now() + data.expiresIn * 1000;

        this._accessToken.set(data.accessToken);
        this._refreshToken.set(data.refreshToken);
        this._expiresAt.set(expiresAt);

        if (data.userId) this._userId.set(data.userId);
        if (data.userEmail) this._userEmail.set(data.userEmail);

        this.persistToStorage({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
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
     * Refresh the access token using refresh token
     */
    refreshAccessToken(): Observable<string> {
        const refreshToken = this._refreshToken();

        if (!refreshToken) {
            this.clearTokens();
            return throwError(() => new Error('No refresh token available'));
        }

        // Call refresh endpoint
        return this.callRefreshEndpoint(refreshToken).pipe(
            tap(response => {
                this.setTokens({
                    accessToken: response.accessToken,
                    refreshToken: response.refreshToken,
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

    // ==================== Private Methods ====================

    /**
     * Initialize tokens from storage on service creation
     */
    private initializeFromStorage(): void {
        if (!this.isBrowser) return;

        try {
            const stored = localStorage.getItem(AUTH_STORAGE_KEY);
            if (!stored) return;

            const data: AuthStorage = JSON.parse(stored);

            // Check if stored token is still valid
            if (data.expiresAt && data.expiresAt > Date.now()) {
                this._accessToken.set(data.accessToken);
                this._refreshToken.set(data.refreshToken);
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
     * Persist tokens to localStorage
     */
    private persistToStorage(data: AuthStorage): void {
        if (!this.isBrowser) return;

        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
        } catch {
            // Storage write failed silently
        }
    }

    /**
     * Clear localStorage
     */
    private clearStorage(): void {
        if (!this.isBrowser) return;

        try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
            // Storage clear failed silently
        }
    }

    /**
     * Call the refresh token endpoint
     * Note: This endpoint may not exist in current Swagger spec
     * Adjust the endpoint path as needed
     */
    private callRefreshEndpoint(refreshToken: string): Observable<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        const normalizedBaseUrl = environment.apiBaseUrl.replaceAll(/\/+$/g, '');
        const refreshUrls = [
            `${normalizedBaseUrl}${AUTH_REFRESH_PATH}`,
            `${normalizedBaseUrl}/api/Identity/Refresh`
        ];

        return this.tryRefreshUrls(refreshUrls, refreshToken);
    }

    private tryRefreshUrls(
        refreshUrls: readonly string[],
        refreshToken: string
    ): Observable<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    }> {
        if (refreshUrls.length === 0) {
            return throwError(() => new Error('No refresh endpoint configured'));
        }

        const [currentUrl, ...remainingUrls] = refreshUrls;

        return this.http.post<{
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
        }>(
            currentUrl,
            { refreshToken },
            {
                context: new HttpContext()
                    .set(IS_REFRESH_REQUEST, true)
                    .set(SKIP_AUTH, true)
            }
        ).pipe(
            catchError((error: unknown) => {
                if (remainingUrls.length === 0) {
                    return throwError(() => error);
                }

                return this.tryRefreshUrls(remainingUrls, refreshToken);
            })
        );
    }
}
