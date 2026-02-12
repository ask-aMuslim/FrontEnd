/**
 * API Error Model
 * 
 * Normalized error structure for the application.
 * All backend errors are converted to this format.
 */

/**
 * Normalized API Error
 */
export interface ApiError {
    /** HTTP status code (0 for network errors) */
    statusCode: number;

    /** User-friendly error message */
    message: string;

    /** Field-level validation errors */
    validationErrors: Record<string, string[]>;

    /** Backend trace ID for debugging */
    traceId: string | null;

    /** When the error occurred */
    timestamp: Date;

    /** Computed: Is this a network error? */
    isNetworkError: boolean;

    /** Computed: Is this an authentication error? */
    isAuthError: boolean;

    /** Computed: Does this have validation errors? */
    isValidationError: boolean;

    /** Original error for debugging */
    readonly originalError?: unknown;
}

/**
 * Factory for creating ApiError instances
 */
export class ApiErrorFactory {
    /**
     * Create an ApiError from partial data
     */
    static create(partial: Partial<ApiError> & { statusCode: number; message: string }): ApiError {
        const statusCode = partial.statusCode;
        const validationErrors = partial.validationErrors ?? {};

        return {
            statusCode,
            message: partial.message,
            validationErrors,
            traceId: partial.traceId ?? null,
            timestamp: partial.timestamp ?? new Date(),
            isNetworkError: statusCode === 0,
            isAuthError: statusCode === 401 || statusCode === 403,
            isValidationError: Object.keys(validationErrors).length > 0,
            originalError: partial.originalError
        };
    }

    /**
     * Create a network error (no connection)
     */
    static networkError(originalError?: unknown): ApiError {
        return this.create({
            statusCode: 0,
            message: 'Unable to connect to the server. Please check your internet connection.',
            originalError
        });
    }

    /**
     * Create an authentication error
     */
    static authError(message?: string, originalError?: unknown): ApiError {
        return this.create({
            statusCode: 401,
            message: message ?? 'Your session has expired. Please log in again.',
            originalError
        });
    }

    /**
     * Create a forbidden error
     */
    static forbiddenError(message?: string, originalError?: unknown): ApiError {
        return this.create({
            statusCode: 403,
            message: message ?? 'You do not have permission to perform this action.',
            originalError
        });
    }

    /**
     * Create a not found error
     */
    static notFoundError(message?: string, originalError?: unknown): ApiError {
        return this.create({
            statusCode: 404,
            message: message ?? 'The requested resource was not found.',
            originalError
        });
    }

    /**
     * Create a server error
     */
    static serverError(message?: string, originalError?: unknown): ApiError {
        return this.create({
            statusCode: 500,
            message: message ?? 'An unexpected server error occurred. Please try again later.',
            originalError
        });
    }

    /**
     * Create an unknown error
     */
    static unknownError(originalError?: unknown): ApiError {
        const message = originalError instanceof Error
            ? originalError.message
            : 'An unexpected error occurred.';

        return this.create({
            statusCode: 0,
            message,
            originalError
        });
    }
}
