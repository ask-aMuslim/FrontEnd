/**
 * Error Normalizer
 * 
 * Converts various error formats (HTTP, ProblemDetails, etc.) 
 * into a normalized ApiError structure.
 */

import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, ApiErrorFactory } from './api-error.model';

@Injectable({ providedIn: 'root' })
export class ErrorNormalizer {

    /**
     * Normalize any error to ApiError
     */
    normalize(error: unknown): ApiError {
        // Already an ApiError
        if (this.isApiError(error)) {
            return error;
        }

        // HTTP error response
        if (error instanceof HttpErrorResponse) {
            return this.normalizeHttpError(error);
        }

        // Error object with message
        if (error instanceof Error) {
            return this.normalizeError(error);
        }

        // Unknown error type
        return ApiErrorFactory.unknownError(error);
    }

    /**
     * Normalize HTTP error response
     */
    normalizeHttpError(error: HttpErrorResponse): ApiError {
        // Network error (no response)
        if (error.status === 0) {
            return ApiErrorFactory.networkError(error);
        }

        // Auth errors
        if (error.status === 401) {
            const message = this.extractMessage(error.error) ?? 'Authentication required';
            return ApiErrorFactory.authError(message, error);
        }

        // Forbidden
        if (error.status === 403) {
            const message = this.extractMessage(error.error) ?? 'Access denied';
            return ApiErrorFactory.forbiddenError(message, error);
        }

        // Not found
        if (error.status === 404) {
            const message = this.extractMessage(error.error) ?? 'Resource not found';
            return ApiErrorFactory.notFoundError(message, error);
        }

        // Server errors
        if (error.status >= 500) {
            const message = this.extractMessage(error.error) ?? 'Server error';
            return ApiErrorFactory.serverError(message, error);
        }

        // Validation errors (400)
        if (error.status === 400) {
            return this.normalizeValidationError(error);
        }

        // Other client errors
        const message = this.extractMessage(error.error) ?? error.message ?? 'Request failed';
        const validationErrors = this.extractValidationErrors(error.error);

        return ApiErrorFactory.create({
            statusCode: error.status,
            message,
            validationErrors,
            traceId: this.extractTraceId(error.error),
            originalError: error
        });
    }

    /**
     * Normalize standard Error object
     */
    normalizeError(error: Error): ApiError {
        return ApiErrorFactory.create({
            statusCode: 0,
            message: error.message || 'An unexpected error occurred',
            originalError: error
        });
    }

    /**
     * Normalize validation error (400 Bad Request)
     */
    private normalizeValidationError(error: HttpErrorResponse): ApiError {
        const body = error.error;
        const validationErrors = this.extractValidationErrors(body);
        const firstValidationError = Object.values(validationErrors)
            .find((entries) => entries.length > 0)?.[0];
        const message = firstValidationError ?? this.extractMessage(body) ?? 'Validation failed';

        return ApiErrorFactory.create({
            statusCode: 400,
            message,
            validationErrors,
            traceId: this.extractTraceId(body),
            originalError: error
        });
    }

    /**
     * Extract message from error body
     */
    private extractMessage(body: unknown): string | null {
        if (typeof body === 'string' && body.trim().length > 0) {
            return body;
        }

        if (!body || typeof body !== 'object') {
            return null;
        }

        const obj = body as Record<string, unknown>;

        // Standard error message
        if (typeof obj['message'] === 'string') {
            return obj['message'];
        }

        // Detail field
        if (typeof obj['detail'] === 'string') {
            return obj['detail'];
        }

        // ProblemDetails format
        if (typeof obj['title'] === 'string') {
            return obj['title'];
        }

        // Error field
        if (typeof obj['error'] === 'string') {
            return obj['error'];
        }

        return null;
    }

    /**
     * Extract validation errors from error body
     */
    private extractValidationErrors(body: unknown): Record<string, string[]> {
        if (!body || typeof body !== 'object') {
            return {};
        }

        const obj = body as Record<string, unknown>;
        const errors: Record<string, string[]> = {};

        // ASP.NET Core validation errors format
        if (obj['errors'] && typeof obj['errors'] === 'object') {
            const validationObj = obj['errors'] as Record<string, unknown>;

            for (const [field, value] of Object.entries(validationObj)) {
                if (Array.isArray(value)) {
                    errors[field] = value.map(String);
                } else if (typeof value === 'string') {
                    errors[field] = [value];
                } else if (Array.isArray((value as any)?.errors)) {
                    // Nested validation errors
                    errors[field] = (value as any).errors.map(String);
                }
            }
        }

        return errors;
    }

    /**
     * Extract trace ID from error body
     */
    private extractTraceId(body: unknown): string | null {
        if (!body || typeof body !== 'object') {
            return null;
        }

        const obj = body as Record<string, unknown>;

        if (typeof obj['traceId'] === 'string') {
            return obj['traceId'];
        }

        if (typeof obj['TraceId'] === 'string') {
            return obj['TraceId'];
        }

        if (typeof obj['trace_id'] === 'string') {
            return obj['trace_id'];
        }

        return null;
    }

    /**
     * Type guard for ApiError
     */
    private isApiError(value: unknown): value is ApiError {
        return (
            typeof value === 'object' &&
            value !== null &&
            'statusCode' in value &&
            'message' in value &&
            'validationErrors' in value
        );
    }

    /**
     * Get user-friendly message for an error
     */
    getUserFriendlyMessage(error: unknown): string {
        const apiError = this.normalize(error);

        // If we have validation errors, format them
        if (apiError.isValidationError) {
            const messages = Object.entries(apiError.validationErrors)
                .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
                .join('\n');
            return messages || apiError.message;
        }

        return apiError.message;
    }

    /**
     * Check if error is a network error
     */
    isNetworkError(error: unknown): boolean {
        if (error instanceof HttpErrorResponse) {
            return error.status === 0;
        }
        return this.normalize(error).isNetworkError;
    }

    /**
     * Check if error is an authentication error
     */
    isAuthError(error: unknown): boolean {
        if (error instanceof HttpErrorResponse) {
            return error.status === 401 || error.status === 403;
        }
        return this.normalize(error).isAuthError;
    }

    /**
     * Check if error is a validation error
     */
    isValidationError(error: unknown): boolean {
        if (error instanceof HttpErrorResponse) {
            return error.status === 400;
        }
        return this.normalize(error).isValidationError;
    }
}
