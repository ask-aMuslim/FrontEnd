# API Integration Complete Implementation Guide

## Executive Summary

This document provides a comprehensive guide to the production-grade, contract-enforced API integration system implemented for the AskAMuslim Angular 20 frontend. The system ensures Swagger is the single source of truth, with automated client generation, contract drift detection, and enterprise-level authentication handling.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Principles](#core-principles)
3. [Folder Structure](#folder-structure)
4. [Implementation Details](#implementation-details)
5. [Authentication System](#authentication-system)
6. [Error Handling](#error-handling)
7. [HTTP Interceptors](#http-interceptors)
8. [CI/CD Integration](#cicd-integration)
9. [Migration Guide](#migration-guide)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)
12. [Future Roadmap](#future-roadmap)

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              COMPONENT LAYER                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │  LoginComponent │  │ CourseComponent │  │ Other Components│             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FACADE LAYER                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ IdentityFacade  │  │  CourseFacade   │  │  Other Facades  │             │
│  │  - login()      │  │  - getAll()     │  │                 │             │
│  │  - logout()     │  │  - getById()    │  │                 │             │
│  │  - register()   │  │  - create()     │  │                 │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
└───────────┼─────────────────────┼─────────────────────┼─────────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GENERATED CLIENT LAYER                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ng-openapi-gen generated code                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │ apiIdentity* │  │  apiCourse*  │  │  apiOther*   │               │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                      models.ts (DTOs)                         │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTERCEPTOR LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        AuthInterceptor                               │   │
│  │  - Attach JWT token to requests                                     │   │
│  │  - Handle 401 responses with token refresh                          │   │
│  │  - Queue parallel refresh requests                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       ErrorInterceptor                               │   │
│  │  - Normalize all HTTP errors to ApiError                            │   │
│  │  - Log errors in development                                        │   │
│  │  - Respect SKIP_ERROR_HANDLING context                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HTTP CLIENT LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Angular HttpClient                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              ASP.NET Core - Swagger/OpenAPI                          │   │
│  │              https://ask-a-muslim.runasp.net/swagger                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Supporting Services

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTH SERVICES                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        TokenService                                  │   │
│  │  - Memory-first token storage with signals                          │   │
│  │  - Automatic token refresh (1 minute before expiry)                 │   │
│  │  - localStorage fallback for persistence                            │   │
│  │  - SSR-safe implementation                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    RefreshQueueService                               │   │
│  │  - Prevent parallel refresh requests                                │   │
│  │  - Queue pending requests during refresh                            │   │
│  │  - Resolve all pending on success                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           ERROR SERVICES                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ErrorNormalizer                                 │   │
│  │  - Convert HttpErrorResponse to ApiError                            │   │
│  │  - Handle ProblemDetails (RFC 7807)                                 │   │
│  │  - Extract validation errors                                        │   │
│  │  - Provide user-friendly messages                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Principles

### 1. Swagger is the Single Source of Truth

All API client code is generated from the OpenAPI specification. No manual API wiring is allowed.

```bash
# Regenerate API client from Swagger
npm run generate:api
```

### 2. No Direct HttpClient Calls

Components never call HttpClient directly. They use Facade services.

```typescript
// ❌ WRONG - Never do this
this.http.get<Course[]>('https://api.example.com/courses')

// ✅ CORRECT - Use facade
this.courseFacade.getAll().subscribe(courses => ...)
```

### 3. No Generated File Modification

Files in `src/app/core/api/generated/` are auto-generated and must not be modified.

### 4. Contract Drift Detection

CI pipeline fails if backend changes without frontend regeneration.

### 5. HttpContextToken Pattern

Use type-safe context tokens instead of URL matching for interceptor behavior.

```typescript
// ❌ WRONG - Fragile URL matching
if (req.url.includes('/login')) { skipAuth(); }

// ✅ CORRECT - Type-safe context token
if (req.context.get(SKIP_AUTH)) { skipAuth(); }
```

---

## Folder Structure

```
src/app/core/
├── api/
│   ├── generated/                    # AUTO-GENERATED - DO NOT EDIT
│   │   ├── api-configuration.ts      # Base URL configuration
│   │   ├── api.ts                    # Main API exports
│   │   ├── functions.ts              # Function exports
│   │   ├── models.ts                 # Generated DTOs
│   │   ├── request-builder.ts        # Internal request builder
│   │   ├── strict-http-response.ts   # Typed response wrapper
│   │   └── fn/                       # Endpoint-specific functions
│   │       ├── identity/             # Identity endpoints
│   │       │   ├── api-identity-login-login-post.ts
│   │       │   ├── api-identity-register-register-post.ts
│   │       │   └── ...
│   │       ├── course/               # Course endpoints
│   │       └── ...
│   └── facades/                      # Domain-specific wrappers
│       ├── index.ts                  # Barrel export
│       ├── identity.facade.ts        # Auth operations
│       ├── course.facade.ts          # Course operations
│       ├── enrollment.facade.ts      # Enrollment operations
│       └── ...
├── auth/
│   ├── index.ts                      # Barrel export
│   ├── token.service.ts              # JWT lifecycle management
│   └── refresh-queue.service.ts      # Prevent parallel refreshes
├── errors/
│   ├── index.ts                      # Barrel export
│   ├── api-error.model.ts            # Normalized error structure
│   └── error-normalizer.ts           # Error conversion logic
└── http/
    ├── index.ts                      # Barrel export
    ├── context-tokens.ts             # HttpContextToken definitions
    └── interceptors/
        ├── auth.interceptor.ts       # JWT injection & refresh
        └── error.interceptor.ts      # Global error handling
```

---

## Implementation Details

### HttpContextTokens

Location: [`src/app/core/http/context-tokens.ts`](src/app/core/http/context-tokens.ts)

```typescript
import { HttpContextToken } from '@angular/common/http';

/** Skip authentication for this request */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

/** Skip global error handling for this request */
export const SKIP_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);

/** Custom retry count for this request */
export const RETRY_COUNT = new HttpContextToken<number>(() => 0);

/** Custom timeout in milliseconds */
export const CUSTOM_TIMEOUT = new HttpContextToken<number | null>(() => null);

/** Skip token refresh on 401 */
export const SKIP_TOKEN_REFRESH = new HttpContextToken<boolean>(() => false);

/** Mark request as a refresh token request (internal) */
export const IS_REFRESH_REQUEST = new HttpContextToken<boolean>(() => false);
```

**Usage:**

```typescript
import { HttpContext } from '@angular/common/http';
import { SKIP_AUTH, SKIP_ERROR_HANDLING } from '@core/http';

// Skip authentication for public endpoint
this.http.get(url, { 
  context: new HttpContext().set(SKIP_AUTH, true) 
});

// Handle errors locally
this.http.get(url, { 
  context: new HttpContext().set(SKIP_ERROR_HANDLING, true) 
});

// Combine multiple tokens
this.http.get(url, { 
  context: new HttpContext()
    .set(SKIP_AUTH, true)
    .set(SKIP_ERROR_HANDLING, true)
});
```

---

## Authentication System

### TokenService

Location: [`src/app/core/auth/token.service.ts`](src/app/core/auth/token.service.ts)

**Features:**
- Memory-first storage using Angular signals
- localStorage fallback for persistence across page refreshes
- Automatic token refresh 1 minute before expiry
- SSR-safe (checks platform before localStorage access)
- Computed signals for reactive state

**API:**

```typescript
@Injectable({ providedIn: 'root' })
export class TokenService {
  // Signals
  readonly accessToken: Signal<string | null>;
  readonly refreshToken: Signal<string | null>;
  readonly userId: Signal<string | null>;
  readonly userEmail: Signal<string | null>;
  readonly isAuthenticated: Signal<boolean>;
  readonly isTokenExpiringSoon: Signal<boolean>;
  readonly isTokenExpired: Signal<boolean>;

  // Methods
  setTokens(data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    userId?: string;
    userEmail?: string;
  }): void;

  clearTokens(): void;

  getValidToken(): Observable<string>;

  refreshAccessToken(): Observable<string>;

  hasValidSession(): boolean;

  getAuthState(): {
    isAuthenticated: boolean;
    hasToken: boolean;
    isExpiringSoon: boolean;
    isExpired: boolean;
    userId: string | null;
    userEmail: string | null;
  };
}
```

**Usage:**

```typescript
import { TokenService } from '@core/auth';

@Component({...})
export class MyComponent {
  tokenService = inject(TokenService);

  // Check authentication
  if (this.tokenService.isAuthenticated()) {
    console.log('User is logged in');
  }

  // Set tokens after login
  this.tokenService.setTokens({
    accessToken: 'eyJ...',
    refreshToken: 'eyJ...',
    expiresIn: 3600,
    userId: '123',
    userEmail: 'user@example.com'
  });

  // Get valid token (may trigger refresh)
  this.tokenService.getValidToken().subscribe(token => {
    // Use token for manual operations
  });
}
```

### RefreshQueueService

Location: [`src/app/core/auth/refresh-queue.service.ts`](src/app/core/auth/refresh-queue.service.ts)

**Purpose:** Prevents parallel token refresh requests when multiple API calls fail with 401 simultaneously.

**How it works:**
1. First 401 triggers actual refresh request
2. Subsequent 401s queue up and wait
3. When refresh completes, all queued requests are resolved with new token
4. If refresh fails, all queued requests are rejected

**API:**

```typescript
@Injectable({ providedIn: 'root' })
export class RefreshQueueService {
  queueRefresh(): Observable<string>;
  isRefreshInProgress(): boolean;
  cancelAllPending(): void;
}
```

---

## Error Handling

### ApiError Model

Location: [`src/app/core/errors/api-error.model.ts`](src/app/core/errors/api-error.model.ts)

```typescript
interface ApiError {
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
```

### ErrorNormalizer

Location: [`src/app/core/errors/error-normalizer.ts`](src/app/core/errors/error-normalizer.ts)

**Handles:**
- `HttpErrorResponse` from Angular
- `ProblemDetails` (RFC 7807) from ASP.NET Core
- Standard JavaScript `Error` objects
- Unknown error types

**Usage:**

```typescript
import { ErrorNormalizer, ApiError } from '@core/errors';

@Component({...})
export class MyComponent {
  errorNormalizer = inject(ErrorNormalizer);

  handleError(error: unknown) {
    const apiError = this.errorNormalizer.normalize(error);

    if (apiError.isValidationError) {
      // Show validation errors
      Object.entries(apiError.validationErrors).forEach(([field, messages]) => {
        console.log(`${field}: ${messages.join(', ')}`);
      });
    } else if (apiError.isNetworkError) {
      alert('No internet connection');
    } else if (apiError.isAuthError) {
      this.router.navigate(['/login']);
    } else {
      alert(apiError.message);
    }
  }
}
```

---

## HTTP Interceptors

### AuthInterceptor

Location: [`src/app/core/http/interceptors/auth.interceptor.ts`](src/app/core/http/interceptors/auth.interceptor.ts)

**Features:**
1. Attaches JWT Authorization header to all requests
2. Handles 401 responses with automatic token refresh
3. Retries original request after successful refresh
4. Queues parallel refresh requests
5. Redirects to login if refresh fails
6. Respects HttpContextToken configuration

**Flow:**

```
Request → Check SKIP_AUTH → Get Valid Token → Attach Header → Send Request
                                    ↓
                            401 Response?
                                    ↓ Yes
                            Check SKIP_TOKEN_REFRESH
                                    ↓ No
                            Queue Refresh
                                    ↓
                            Refresh Success?
                            ↓ Yes          ↓ No
                    Retry Request    Redirect to Login
```

### ErrorInterceptor

Location: [`src/app/core/http/interceptors/error.interceptor.ts`](src/app/core/http/interceptors/error.interceptor.ts)

**Features:**
1. Normalizes all HTTP errors to ApiError format
2. Logs errors in development mode
3. Respects SKIP_ERROR_HANDLING context token
4. Re-throws normalized error for component handling

---

## CI/CD Integration

### Contract Drift Detection

Location: [`.github/workflows/api-contract.yml`](.github/workflows/api-contract.yml)

**Workflow Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Fetch latest Swagger JSON
5. Regenerate API client
6. Check for changes in generated folder
7. Fail build if drift detected

**Manual Trigger:**

```bash
# Via GitHub CLI
gh workflow run api-contract.yml

# Or via GitHub Actions UI
# Actions → API Contract Check → Run workflow
```

**Local Regeneration:**

```bash
npm run generate:api
```

---

## Migration Guide

### Phase A: Core Hardening ✅ (Complete)

- [x] Create HttpContextToken definitions
- [x] Implement TokenService with signals
- [x] Implement RefreshQueueService
- [x] Create AuthInterceptor (functional)
- [x] Create ErrorNormalizer
- [x] Create Error model
- [x] Register interceptors in app.config.ts
- [x] Add CI contract drift check
- [x] Create index exports
- [x] Update IdentityFacade with TokenService integration

### Phase B: Auth Migration (In Progress)

- [ ] Find all login/register components
- [ ] Update components to use IdentityFacade
- [ ] Remove legacy auth service usage
- [ ] Test complete auth flow

### Phase C: Feature Migration

- [ ] Migrate Courses feature
- [ ] Migrate Enrollments feature
- [ ] Migrate remaining features
- [ ] Remove legacy ApiService entirely

### Migration Pattern

**Before (Legacy):**

```typescript
// Legacy service
@Injectable()
export class ApiService {
  private baseUrl = 'https://api.example.com';
  
  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${endpoint}`);
  }
}

// Component using legacy
this.apiService.get<Course[]>('courses').subscribe(...)
```

**After (Generated):**

```typescript
// Facade using generated client
@Injectable({ providedIn: 'root' })
export class CourseFacade {
  private http = inject(HttpClient);
  private config = inject(ApiConfiguration);

  getAll(): Observable<Course[]> {
    return apiCourseGetCoursesGet(this.http, this.config.rootUrl).pipe(
      map(response => response.body ?? [])
    );
  }
}

// Component using facade
this.courseFacade.getAll().subscribe(...)
```

---

## API Reference

### IdentityFacade

Location: [`src/app/core/api/facades/identity.facade.ts`](src/app/core/api/facades/identity.facade.ts)

```typescript
@Injectable({ providedIn: 'root' })
export class IdentityFacade {
  // Signals
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;
  readonly isAuthenticated: Signal<boolean>;

  // Methods
  login(credentials: LoginViewModel): Observable<void>;
  register(userData: any): Observable<void>;
  logout(): Observable<void>;
  updateEmail(data: UpdateEmailDto): Observable<void>;
  updatePassword(data: UpdatePasswordDto): Observable<void>;
  updateName(data: UpdateNameDto): Observable<void>;
  clearError(): void;
  hasValidSession(): boolean;
  getAuthState(): AuthState;
  setTokens(tokens: TokenData): void;
}
```

---

## Troubleshooting

### "No authentication token available"

**Cause:** User is not logged in or token has expired.

**Solution:** Redirect to login page.

```typescript
if (!this.tokenService.isAuthenticated()) {
  this.router.navigate(['/login']);
}
```

### "Contract drift detected" in CI

**Cause:** Backend API has changed without frontend regeneration.

**Solution:**
1. Run `npm run generate:api` locally
2. Review changes in `src/app/core/api/generated/`
3. Commit and push changes

### "Refresh token failed"

**Cause:** Refresh token has expired or is invalid.

**Solution:** Clear tokens and redirect to login.

```typescript
// This is handled automatically by the interceptor
// But you can also handle it manually:
this.tokenService.clearTokens();
this.router.navigate(['/login']);
```

### Type errors after regeneration

**Cause:** Generated types have changed.

**Solution:** Update facade methods and components to match new types.

### Interceptor not working

**Cause:** Interceptor not registered in app.config.ts.

**Solution:** Verify `withInterceptors()` is configured:

```typescript
// app.config.ts
provideHttpClient(
  withFetch(),
  withInterceptors([
    authInterceptor,
    errorInterceptor
  ])
)
```

---

## Future Roadmap

### Short Term

1. **Complete Phase B** - Connect login/register components
2. **Complete Phase C** - Migrate all features to generated clients
3. **Add Swagger Hash Locking** - Store hash to detect changes before regeneration

### Medium Term

1. **Automated Form Generation** - Generate form validators from OpenAPI schema
2. **Mock Server Integration** - Use generated types for mock server
3. **Postman Collection Sync** - Auto-sync Postman collection with Swagger changes

### Long Term

1. **API Versioning Support** - Handle multiple API versions gracefully
2. **GraphQL Migration Path** - Prepare for potential GraphQL adoption
3. **Offline Support** - Queue requests when offline, sync when online

---

## Appendix: File Locations

| Component | Location |
|-----------|----------|
| HttpContextTokens | `src/app/core/http/context-tokens.ts` |
| TokenService | `src/app/core/auth/token.service.ts` |
| RefreshQueueService | `src/app/core/auth/refresh-queue.service.ts` |
| AuthInterceptor | `src/app/core/http/interceptors/auth.interceptor.ts` |
| ErrorInterceptor | `src/app/core/http/interceptors/error.interceptor.ts` |
| ApiError Model | `src/app/core/errors/api-error.model.ts` |
| ErrorNormalizer | `src/app/core/errors/error-normalizer.ts` |
| IdentityFacade | `src/app/core/api/facades/identity.facade.ts` |
| Generated API | `src/app/core/api/generated/` |
| CI Workflow | `.github/workflows/api-contract.yml` |
| Environment Config | `src/environments/environment.ts` |
| App Configuration | `src/app/app.config.ts` |

---

## Changelog

### 2026-02-12 - Phase A Complete
- Implemented core authentication infrastructure
- Created TokenService with signal-based state management
- Implemented refresh queue to prevent parallel refreshes
- Created functional HTTP interceptors
- Added error normalization
- Integrated with IdentityFacade
- Added CI contract drift detection
