# API Integration Migration Status

## Overview

This document tracks the migration status of all API services from legacy `ApiService` + `API_ENDPOINTS` pattern to the new generated client + facade pattern.

## Migration Strategy

### Target Architecture
```
Component
    ↓
Domain Service (Facade)
    ↓
Generated Client (ng-openapi-gen)
    ↓
HTTP Interceptor (auth, error handling)
    ↓
Angular HttpClient
```

### Key Principles
1. **Swagger is the single source of truth** - All generated code comes from the Swagger spec
2. **No manual API wiring** - Components never call HttpClient directly
3. **No generated file modification** - All adaptations happen in facades
4. **Contract drift detection** - CI fails if backend changes without frontend update

---

## Swagger-Exposed Endpoints (Migrated to Facades)

| Endpoint Group | Facade | Status | Notes |
|----------------|--------|--------|-------|
| Authentication | `IdentityFacade` | ✅ Complete | Login, register, refresh, password management |
| Courses | `CourseFacade` | ✅ Complete | CRUD operations, category/level filtering |
| Enrollments | `EnrollmentFacade` | ✅ Complete | Student enrollments (some endpoints use manual HTTP due to Swagger spec issues) |
| Instructors | `InstructorFacade` | ✅ Complete | Instructor profiles |
| Lessons | `LessonFacade` | ✅ Complete | Lesson CRUD |
| Quizzes | `QuizFacade` | ✅ Complete | Quiz management |
| Students | `StudentFacade` | ✅ Complete | Student profiles, dashboard |
| Answers | `AnswerFacade` | ✅ Complete | Student answers to questions |
| Certificates | Partial | ⚠️ Partial | Only some endpoints in Swagger |
| Progress | Partial | ⚠️ Partial | Progress tracking endpoints |
| Questions | Partial | ⚠️ Partial | Question management |
| Options | Partial | ⚠️ Partial | Question options |

---

## Legacy Services (NOT in Swagger Spec)

These services continue using `ApiService` + `API_ENDPOINTS` because the backend endpoints are not exposed in the Swagger specification. **Backend team needs to add these to Swagger.**

| Service | File | Status | Priority |
|---------|------|--------|----------|
| AdminNotes | `admin-notes.service.ts` | 🔴 Legacy | Low |
| Admins | `admins.service.ts` | 🔴 Legacy | Low |
| Certificates | `certificates.service.ts` | 🔴 Legacy | Medium |
| EventRegistrations | `event-registrations.service.ts` | 🔴 Legacy | Medium |
| Events | `events.service.ts` | 🔴 Legacy | High |
| InquiryRequests | `inquiry-requests.service.ts` | 🔴 Legacy | Medium |
| Levels | `levels.service.ts` | 🔴 Legacy | Low |
| MeetingRequests | `meeting-requests.service.ts` | 🔴 Legacy | Medium |
| MuslimTube | `muslim-tube.service.ts` | 🔴 Legacy | High |
| Notifications | `notifications.service.ts` | 🔴 Legacy | Medium |
| Options | `options.service.ts` | 🔴 Legacy | Medium |
| Preachers | `preachers.service.ts` | 🔴 Legacy | Medium |
| QAs | `qas.service.ts` | 🔴 Legacy | Medium |
| Questions | `questions.service.ts` | 🔴 Legacy | Medium |
| QuizAttempts | `quiz-attempts.service.ts` | 🔴 Legacy | Medium |
| StudentNotes | `student-notes.service.ts` | 🔴 Legacy | Low |
| StudentQuestions | `student-questions.service.ts` | 🔴 Legacy | Medium |
| Tags | `tags.service.ts` | 🔴 Legacy | Low |

---

## Infrastructure Components

| Component | File | Status |
|-----------|------|--------|
| HttpContextTokens | `context-tokens.ts` | ✅ Complete |
| TokenService | `token.service.ts` | ✅ Complete |
| RefreshQueueService | `refresh-queue.service.ts` | ✅ Complete |
| AuthInterceptor | `auth.interceptor.ts` | ✅ Complete |
| ErrorInterceptor | `error.interceptor.ts` | ✅ Complete |
| ErrorNormalizer | `error-normalizer.ts` | ✅ Complete |
| ApiError Model | `api-error.model.ts` | ✅ Complete |
| Swagger Hash | `swagger.hash` | ✅ Complete |
| CI Workflow | `api-contract.yml` | ✅ Complete |

---

## CI/CD Pipeline

### GitHub Actions Workflow
- **File**: `.github/workflows/api-contract.yml`
- **Triggers**: Push to main/develop, PRs, daily schedule
- **Jobs**:
  1. Contract Validation - Fetches Swagger, generates hash, checks for changes
  2. Client Regeneration - Regenerates API client if contract changed
  3. Build & Test - Ensures code compiles and tests pass
  4. Drift Check - Fails PR if contract changed without update
  5. Hash Update - Commits new hash on main branch

### NPM Scripts
```bash
npm run generate:api     # Generate API client from Swagger
npm run swagger:hash     # Show current Swagger hash
npm run swagger:check    # Check if contract changed
npm run swagger:update   # Update stored hash
npm run api:sync         # Full sync (check, generate, update)
```

---

## Migration Checklist

### For Each Legacy Service

1. **Verify endpoint exists in Swagger**
   ```bash
   # Check if endpoint is in generated functions
   ls src/app/core/api/generated/fn/{endpoint-name}/
   ```

2. **If endpoint exists in Swagger:**
   - Create facade in `src/app/core/api/facades/`
   - Import generated functions
   - Add error handling with `ErrorNormalizer`
   - Export from `index.ts`
   - Update components to use facade

3. **If endpoint does NOT exist in Swagger:**
   - Keep using `ApiService` + `API_ENDPOINTS`
   - Document in this file
   - Request backend team to add to Swagger

4. **Remove legacy code:**
   - Delete `API_ENDPOINTS` entries for migrated endpoints
   - Remove `ApiService` dependency from migrated services

---

## Next Steps

### Immediate
1. ✅ Implement CI workflow
2. ✅ Implement Swagger hash lock
3. ✅ Create remaining facades for Swagger-exposed endpoints

### Short-term
1. Request backend team to expose missing endpoints in Swagger
2. Migrate high-priority legacy services (Events, MuslimTube)
3. Add integration tests for facades

### Long-term
1. Zero manual endpoint strings in frontend
2. Full contract-driven development
3. Automated API documentation generation

---

## Contract Lock Strategy

The `swagger.hash` file contains a SHA256 hash of the normalized Swagger JSON. This hash is:
- Generated during CI builds
- Compared against the stored hash
- Updated when the contract changes intentionally

If the hash changes unexpectedly:
1. CI fails with clear message
2. Developer must review diff
3. Run `npm run api:sync` to regenerate and update
4. Commit changes to generated files and hash

---

## Error Handling Pattern

All facades follow this error handling pattern:

```typescript
// In facade
private readonly errorNormalizer = inject(ErrorNormalizer);
private readonly _error = signal<ApiError | null>(null);

catchError(error => {
    this._loading.set(false);
    const apiError = this.errorNormalizer.normalize(error);
    this._error.set(apiError);
    return throwError(() => apiError);
})
```

The `ErrorNormalizer` converts:
- HTTP errors to `ApiError`
- ProblemDetails (RFC 7807) to structured format
- Network errors to user-friendly messages
- Validation errors to field-level errors

---

## Authentication Flow

1. **Login**: `IdentityFacade.login()` → stores tokens in `TokenService`
2. **Token Storage**: Memory-first with signals, optional secure persistence
3. **Auto-Refresh**: `AuthInterceptor` handles 401 → silent refresh → retry
4. **Refresh Queue**: `RefreshQueueService` prevents parallel refresh requests
5. **Logout**: Clear tokens, redirect to login

### HttpContextTokens
- `SKIP_AUTH`: Skip token injection for public endpoints
- `SKIP_ERROR_HANDLING`: Handle errors manually in component
- `SKIP_TOKEN_REFRESH`: Don't attempt refresh on 401
- `IS_REFRESH_REQUEST`: Mark refresh requests to avoid infinite loops
- `RETRY_COUNT`: Track retry attempts for exponential backoff
- `CUSTOM_TIMEOUT`: Override default timeout

---

*Last updated: 2026-02-12*
