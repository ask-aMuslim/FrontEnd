/**
 * HTTP Context Tokens
 * 
 * Type-safe request configuration using Angular's HttpContextToken.
 * Avoids fragile URL matching for interceptor behavior control.
 */

import { HttpContextToken } from '@angular/common/http';

/**
 * Skip authentication for this request.
 * Use when calling public endpoints that don't require JWT.
 * 
 * @example
 * this.http.get(url, { context: new HttpContext().set(SKIP_AUTH, true) })
 */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

/**
 * Skip global error handling for this request.
 * Use when you want to handle errors locally in the component.
 * 
 * @example
 * this.http.get(url, { context: new HttpContext().set(SKIP_ERROR_HANDLING, true) })
 */
export const SKIP_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);

/**
 * Custom retry count for this request.
 * Default is 0 (no retries). Set higher for resilient requests.
 * 
 * @example
 * this.http.get(url, { context: new HttpContext().set(RETRY_COUNT, 3) })
 */
export const RETRY_COUNT = new HttpContextToken<number>(() => 0);

/**
 * Custom timeout in milliseconds for this request.
 * Default is null (use global timeout).
 * 
 * @example
 * this.http.get(url, { context: new HttpContext().set(CUSTOM_TIMEOUT, 30000) })
 */
export const CUSTOM_TIMEOUT = new HttpContextToken<number | null>(() => null);

/**
 * Skip token refresh on 401 for this request.
 * Use for requests that should fail immediately on auth errors.
 * 
 * @example
 * this.http.get(url, { context: new HttpContext().set(SKIP_TOKEN_REFRESH, true) })
 */
export const SKIP_TOKEN_REFRESH = new HttpContextToken<boolean>(() => false);

/**
 * Mark request as a refresh token request.
 * Prevents infinite loop when refresh endpoint returns 401.
 * 
 * @internal Used by RefreshQueueService
 */
export const IS_REFRESH_REQUEST = new HttpContextToken<boolean>(() => false);
