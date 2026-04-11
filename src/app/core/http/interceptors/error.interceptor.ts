/**
 * Error Interceptor
 * 
 * Functional HTTP interceptor for global error handling.
 * Normalizes errors and provides consistent error handling.
 */

import { inject, PLATFORM_ID } from '@angular/core';
import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ErrorNormalizer } from '../../errors/error-normalizer';
import { SKIP_ERROR_HANDLING } from '../context-tokens';
import { TokenService } from '../../auth/token.service';

/**
 * Error Interceptor
 * 
 * Features:
 * - Normalizes all HTTP errors to ApiError format
 * - Logs errors for debugging
 * - Respects SKIP_ERROR_HANDLING context token
 */
export const errorInterceptor: HttpInterceptorFn = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const errorNormalizer = inject(ErrorNormalizer);
    const tokenService = inject(TokenService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    return next(req).pipe(
        catchError((error: unknown) => {
            // Skip error handling if requested
            if (req.context.get(SKIP_ERROR_HANDLING)) {
                return throwError(() => error);
            }

            // Normalize the error
            const apiError = errorNormalizer.normalize(error);

            // Global auth handling for protected requests
            if ((apiError.statusCode === 401 || apiError.statusCode === 403) && isBrowser) {
                const currentUrl = router.url;
                const isAuthPage = currentUrl.startsWith('/login') || currentUrl.startsWith('/register');
                const hasSession = tokenService.hasValidSession() || tokenService.canUseCookieRefresh();
                const shouldRedirectToLogin =
                    apiError.statusCode === 401
                    || (apiError.statusCode === 403 && !hasSession);

                if (!isAuthPage && shouldRedirectToLogin) {
                    tokenService.clearTokens();
                    void router.navigate(['/login'], {
                        queryParams: {
                            returnUrl: currentUrl,
                        },
                    });
                }
            }

            globalThis.console?.error('[HTTP Error]', {
                method: req.method,
                url: req.urlWithParams,
                statusCode: apiError.statusCode,
                message: apiError.message,
                traceId: apiError.traceId,
            });

            // Re-throw the normalized error
            return throwError(() => apiError);
        })
    );
};
