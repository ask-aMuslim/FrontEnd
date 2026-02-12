/**
 * Auth Interceptor
 * 
 * Functional HTTP interceptor for Angular 20.
 * Handles JWT injection and token refresh on 401 responses.
 */

import { inject } from '@angular/core';
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
import { TokenService } from '../../auth/token.service';
import { RefreshQueueService } from '../../auth/refresh-queue.service';
import {
    SKIP_AUTH,
    SKIP_TOKEN_REFRESH,
    IS_REFRESH_REQUEST
} from '../context-tokens';

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

    // Skip auth for requests marked with SKIP_AUTH
    if (req.context.get(SKIP_AUTH)) {
        return next(req);
    }

    // Skip auth for refresh requests (handled by TokenService)
    if (req.context.get(IS_REFRESH_REQUEST)) {
        return next(req);
    }

    // Get valid token and attach to request
    return getTokenAndAttach(req, tokenService).pipe(
        switchMap(authReq => next(authReq)),
        catchError((error: unknown) => {
            // Handle 401 Unauthorized
            if (error instanceof HttpErrorResponse && error.status === 401) {
                // Check if we should skip refresh for this request
                if (req.context.get(SKIP_TOKEN_REFRESH)) {
                    return throwError(() => error);
                }

                // Attempt token refresh and retry
                return handle401WithRefresh(req, next, tokenService, refreshQueue, router);
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
    router: Router
): Observable<HttpEvent<unknown>> {
    // Check if we have a refresh token
    if (!tokenService.refreshToken()) {
        // No refresh token - redirect to login
        tokenService.clearTokens();
        router.navigate(['/auth/login']);
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
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
        })
    );
}

/**
 * Attach Authorization header to request
 */
function attachAuthHeader(
    req: HttpRequest<unknown>,
    token: string
): HttpRequest<unknown> {
    return req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });
}
