/**
 * Auth Interceptor
 *
 * Functional HTTP interceptor for Angular 20.
 * Handles JWT injection and token refresh on 401 responses.
 */

import { inject, PLATFORM_ID } from '@angular/core';
import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent,
    HttpErrorResponse,

} from '@angular/common/http';
import {
    Observable,
    throwError,
    from,
    of
} from 'rxjs';
import {
    switchMap,
    catchError,
    take
} from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { TokenService } from '../../auth/token.service';
import { RefreshQueueService } from '../../auth/refresh-queue.service';
import {
    SKIP_AUTH,
    SKIP_TOKEN_REFRESH,
    IS_REFRESH_REQUEST,
    REQUIRE_CREDENTIALS,
} from '../context-tokens';
import { environment } from '../../../../environments/environment';

/**
 * Auth Interceptor
 *
 * Features:
 * - Attaches JWT Authorization header to requests
 * - Handles 401 responses with token refresh
 * - Uses HttpContextToken for configuration (no URL matching)
 * - Prevents infinite loops on refresh endpoint
 */
export const authInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const tokenService = inject(TokenService);
    const refreshQueue = inject(RefreshQueueService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    // Skip auth for requests marked with SKIP_AUTH
    if (req.context.get(SKIP_AUTH)) {
        return next(req);
    }

    // Skip auth for refresh requests (handled by TokenService)
    if (req.context.get(IS_REFRESH_REQUEST)) {
        return next(req);
    }

    const compatibleReq = applyRequestCompatibility(req);

    // Get valid token and attach to request
    return from(tokenService.initialize()).pipe(
        switchMap(() => getTokenAndAttach(compatibleReq, tokenService)),
        switchMap(authReq => next(authReq)),
        catchError((error: unknown) => {
            const statusCode = extractStatusCode(error);

            // Handle auth failures (backend may return 401 or 403 on expired/missing token)
            if (statusCode === 401 || statusCode === 403) {
                // Check if we should skip refresh for this request
                if (req.context.get(SKIP_TOKEN_REFRESH)) {
                    return throwError(() => error);
                }

                // If there is no access token in memory, fail fast.
                // Cookie-based refresh is attempted when token exists but is invalid/expired.
                if (!tokenService.accessToken()) {
                    return throwError(() => error);
                }

                // Attempt token refresh and retry
                return handleAuthFailureWithRefresh(compatibleReq, next, tokenService, refreshQueue, router, isBrowser);
            }

            return throwError(() => error);
        })
    );
};

/**
 * Get valid token and attach to request
 */
function getTokenAndAttach(
    req: HttpRequest<unknown>,
    tokenService: TokenService
): Observable<HttpRequest<unknown>> {
    // Check if user is authenticated
    if (!tokenService.isAuthenticated()) {
        // No token available - proceed without auth header
        return of(req);
    }

    // Get valid token (may trigger refresh if expiring soon)
    return from(tokenService.getValidToken()).pipe(
        take(1),
        switchMap(token => {
            if (!token) {
                return of(req);
            }
            return of(attachAuthHeader(req, token));
        }),
        catchError(() => {
            // Token refresh failed - proceed without auth
            // The 401 handler will deal with this
            return of(req);
        })
    );
}

/**
 * Handle 401 response with token refresh
 */
function handle401WithRefresh(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
    tokenService: TokenService,
    refreshQueue: RefreshQueueService,
    router: Router,
    isBrowser: boolean
): Observable<HttpEvent<unknown>> {
    if (!tokenService.accessToken()) {
        // No refresh token - redirect to login
        tokenService.clearTokens();
        if (isBrowser) {
            void router.navigate(['/login'], {
                queryParams: {
                    returnUrl: router.url
                }
            });
        }
        return throwError(() => new Error('Session expired - please login again'));
    }

    // Queue refresh (prevents parallel refreshes)
    return refreshQueue.queueRefresh().pipe(
        switchMap(newToken => {
            // Retry original request with new token
            const retryReq = attachAuthHeader(req, newToken);
            return next(retryReq);
        }),
        catchError(refreshError => {
            // Refresh failed - clear tokens and redirect to login
            tokenService.clearTokens();
            refreshQueue.cancelAllPending();
            if (isBrowser) {
                void router.navigate(['/login'], {
                    queryParams: {
                        returnUrl: router.url
                    }
                });
            }
            return throwError(() => refreshError);
        })
    );
}

function handleAuthFailureWithRefresh(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
    tokenService: TokenService,
    refreshQueue: RefreshQueueService,
    router: Router,
    isBrowser: boolean
): Observable<HttpEvent<unknown>> {
    return handle401WithRefresh(req, next, tokenService, refreshQueue, router, isBrowser);
}

/**
 * Attach Authorization header to request
 */
function attachAuthHeader(
    req: HttpRequest<unknown>,
    token: string
): HttpRequest<unknown> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}

function extractStatusCode(error: unknown): number | null {
    if (error instanceof HttpErrorResponse) {
        return error.status;
    }

    if (typeof error === 'object' && error !== null) {
        const maybeStatus = (error as { statusCode?: unknown; status?: unknown }).statusCode
            ?? (error as { statusCode?: unknown; status?: unknown }).status;

        if (typeof maybeStatus === 'number' && Number.isFinite(maybeStatus)) {
            return maybeStatus;
        }
    }

    return null;
}

function applyRequestCompatibility(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const setHeaders: Record<string, string> = {};

    if (!req.headers.has('Accept')) {
        setHeaders['Accept'] = 'application/json';
    }

    if (shouldSetJsonContentType(req)) {
        setHeaders['Content-Type'] = 'application/json';
    }

    return req.clone({
        withCredentials: req.withCredentials || req.context.get(REQUIRE_CREDENTIALS) || environment.authWithCredentials,
        setHeaders,
    });
}

function shouldSetJsonContentType(req: HttpRequest<unknown>): boolean {
    if (req.headers.has('Content-Type')) {
        return false;
    }

    if (req.body === null || req.body === undefined) {
        return false;
    }

    const isFormData = typeof FormData !== 'undefined' && req.body instanceof FormData;
    const isBlob = typeof Blob !== 'undefined' && req.body instanceof Blob;
    const isArrayBuffer = typeof ArrayBuffer !== 'undefined' && req.body instanceof ArrayBuffer;

    if (isFormData || isBlob || isArrayBuffer) {
        return false;
    }

    return typeof req.body === 'object';
}
