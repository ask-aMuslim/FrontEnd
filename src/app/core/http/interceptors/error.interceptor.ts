/**
 * Error Interceptor
 * 
 * Functional HTTP interceptor for global error handling.
 * Normalizes errors and provides consistent error handling.
 */

import { inject } from '@angular/core';
import {
    HttpInterceptorFn,
    HttpRequest,
    HttpHandlerFn,
    HttpEvent
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorNormalizer } from '../../errors/error-normalizer';
import { SKIP_ERROR_HANDLING } from '../context-tokens';

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

    return next(req).pipe(
        catchError((error: unknown) => {
            // Skip error handling if requested
            if (req.context.get(SKIP_ERROR_HANDLING)) {
                return throwError(() => error);
            }

            // Normalize the error
            const apiError = errorNormalizer.normalize(error);

            // Log for debugging (in development)
            if (ngDevMode) {
                console.group(`[HTTP Error] ${req.method} ${req.url}`);
                console.log('Status:', apiError.statusCode);
                console.log('Message:', apiError.message);
                if (apiError.isValidationError) {
                    console.log('Validation Errors:', apiError.validationErrors);
                }
                if (apiError.traceId) {
                    console.log('Trace ID:', apiError.traceId);
                }
                console.groupEnd();
            }

            // Re-throw the normalized error
            return throwError(() => apiError);
        })
    );
};
