# API Client Migration Status

> Last updated: Phase D (Optional Enhancements) — unused declarations cleanup complete. 34 of 36 unused declarations fixed across 20 files. Build verified clean (zero errors, 19 prerendered routes). 2 remaining are intentional TODOs in meet-scholar.

## Architecture

```
Page Components → Domain Services → Facades → Generated API / HttpClient
                        ↘ AcademyMockDataService (fallback)
```

- **Facades** live at `src/app/core/api/facades/` and wrap generated ng-openapi-gen functions.
- **Domain services** in `src/app/core/services/` consume facades and provide business logic.
- **Legacy services** that call endpoints not in Swagger stay on `ApiService` until backend exposes them.

## ✅ Phase C — Console Violation Cleanup

Removed **22 console.log/error/warn** calls across 9 files:

| File | Violations Fixed | Notes |
|------|-----------------|-------|
| `lesson-content.service.ts` | 3 | catchError blocks + unused params |
| `lesson-player.component.ts` | 7 | subscribe/catch/then handlers |
| `academy.component.ts` | 1 | error handler |
| `meet-scholar.component.ts` | 1 | debug payload log |
| `muslim-tube.component.ts` | 1 | search placeholder |
| `chat-list.component.ts` | 1 | chat selection placeholder |
| `inline-svg.directive.ts` | 1 | error catch block |
| `reset-password.component.ts` | 4 | mock flow debug logs |
| `token.service.ts` | 3 | localStorage catch blocks |

**Kept (acceptable patterns):**
- `error.interceptor.ts` — 4 `console.log` inside `ngDevMode` guard (tree-shaken in prod)
- `server.ts` — Node SSR startup message
- `main.ts` — Angular bootstrap error catch

## ✅ Dead-Code Cleanup (3 Services Deleted)

| Deleted Service | Reason |
|----------------|--------|
| `certificates.service.ts` | 0 importers |
| `options.service.ts` | 0 importers |
| `tags.service.ts` | 0 importers |

Services barrel (`src/app/core/services/index.ts`) updated: **23 exports** remaining.

## ✅ Phase D — `any` Type Fixes, Inline Styles, and Unused Declarations

### `any` Type Fixes (8 files)
Replaced unsafe `any` types with proper typed alternatives (`unknown`, `Record<string, unknown>`, specific DTOs, etc.) across 8 non-generated files. ~45 `any` usages in auto-generated code left untouched.

### Inline Style Removal (1 file)
Removed inline `style` attributes from `send-inquiry-success.component.ts` template, replaced with CSS classes.

### Unused Declarations Cleanup (34/36 fixed, 20 files)

**Category 1 — Unused Imports (8 items):** Removed unused import specifiers from 7 files (facades, components, services).

**Category 2 — Unused Interfaces/Enums (4 items):**
| File | Removed |
|------|---------|
| `identity.facade.ts` | `TokenData` interface |
| `error-normalizer.ts` | `ProblemDetails`, `ValidationErrorResponse` interfaces |
| `enums.model.ts` | `EnrollmentStatus` enum |

**Category 3 — Unused Parameters (16 items):** Prefixed with `_` across 10 files (trackBy `index` → `_index`, callback params, seed data params). Also fixed `enrollments.service.ts` `any` → `unknown` on unused params.

**Category 4 — Unused Members/Variables (6 items fixed, 3 intentionally kept):**
| File | Fix |
|------|-----|
| `auth.service.ts` | Removed `platformId`, `isBrowser`, `PLATFORM_ID` import, `isPlatformBrowser` import (cascade) |
| `quiz.component.ts` | Removed dead `resetTimer()` method |
| `home.ts` | Removed `bubbleMarqueeId`, `lastFrameTime`, `host` constructor param, `containerWidth`, `duration` locals |
| `meet-scholar.component.ts` | Prefixed `_meetingRequestsService` (kept for pending API) |

**Intentionally kept (2 errors with `noUnusedLocals`/`noUnusedParameters`):**
- `meet-scholar.component.ts:87` — `_meetingRequestsService` injection (pending API integration)
- `meet-scholar.component.ts:251` — `payload` local variable (pending API integration)

## ✅ Completed Facade Layer (15 Facades)

| Facade | Domain | Key DTOs | Notes |
|--------|--------|----------|-------|
| IdentityFacade | Auth (login, register, logout) | `LoginViewModel` | Social login not in Swagger |
| CourseFacade | Course CRUD | `CourseReadDto`, `CourseReadByIdDto` | |
| EnrollmentFacade | Enroll/unenroll, queries | `EnrollmentCreateDto` | |
| InstructorFacade | Instructor queries | — | `me()`, `update()` not in Swagger |
| LessonFacade | Lesson CRUD | `LessonReadDto` | Notes/progress endpoints not in Swagger |
| ProgressFacade | 13 progress endpoints | `ProgressReadDto`, `ProgressCreateDto`, `ProgressUpdateDto` | Uses `$Json` function variants |
| QuestionFacade | 11 question endpoints | `QuestionCreateDto`, `QuestionUpdateDto`, `QuestionBulkUpdateDto` | Uses HttpClient directly (no `$Json` variants) |
| QuizFacade | Quiz CRUD | `QuizReadDto` | |
| QuizEvaluationFacade | Evaluation triggers | — | POST-only, void return |
| StudentFacade | Student queries | — | `me()`, `dashboard()`, `update()` not in Swagger |
| AnswerFacade | Student answers | — | |
| CertificateFacade | Certificate generation/retrieval | — | HttpClient direct; 4 endpoints |
| OptionFacade | Quiz option CRUD | `OptionCreateDto`, `OptionUpdateDto` | HttpClient direct; path params |
| PrayerTimesFacade | Prayer times retrieval | — | HttpClient direct; parameterless |
| QiblaFacade | Qibla direction | — | HttpClient direct; single endpoint |

## ✅ Completed Service Migrations

| Service | Facade Used | Status |
|---------|-------------|--------|
| AuthService | IdentityFacade | Hybrid — social login stays on ApiService |
| CoursesService | CourseFacade | Fully migrated |
| LessonsService | LessonFacade | Fully migrated |
| EnrollmentsService | EnrollmentFacade | Fully migrated |
| InstructorsService | InstructorFacade | Fully migrated |
| StudentsService | StudentFacade | Fully migrated |
| QuizzesService | QuizFacade | Fully migrated |
| QuestionsService | QuestionFacade | Fully migrated |
| AcademyProgressService | ProgressFacade | Rewritten — API-first with mock fallback |
| LessonContentService | LessonFacade | Fully migrated |

## ⚠️ Legacy Services (NOT in Swagger — 14 services)

These services use endpoints not exposed in `swagger.json`. They must stay on `ApiService` until the backend team publishes them.

| Service | Endpoints | Methods |
|---------|-----------|---------|
| AdminNotesService | `/api/AdminNotes/*` | `getByStudent`, `create` |
| AdminsService | `/api/Admins/*` | `me`, `getById`, `update` |
| EventRegistrationsService | `/api/EventRegistrations/*` | 6 methods |
| EventsService | `/api/Events/*` | CRUD |
| InquiryRequestsService | `/api/InquiryRequests/*` | 6 methods |
| LevelsService | `/api/Levels/*` | CRUD |
| MeetingRequestsService | `/api/MeetingRequests/*` | 6 methods |
| MuslimTubeService | `/api/MuslimTube/*` | Channels + Video CRUD |
| NotificationsService | `/api/Notifications/*` | `getByUser`, `send`, `markRead` |
| PreachersService | `/api/Preachers/*` | `me`, `getById`, `getAll`, `update` |
| QAsService | `/api/QAs/*` | CRUD |
| QuizAttemptsService | `/api/QuizAttempts/*` | `getByQuiz`, `getByStudent`, `create`, `complete` |
| StudentNotesService | `/api/StudentNotes/*` | CRUD by lesson |
| StudentQuestionsService | `/api/StudentQuestions/*` | CRUD + `answer` |

## 📝 Type Mapping

| Old Type | New Generated Type |
|----------|-------------------|
| `CourseDto` | `CourseReadDto` |
| `LessonDto` | `LessonReadDto` |
| `CreateLessonRequest` | FormData with typed params |
| `LoginRequest` | `LoginViewModel` |
| `ProgressDto` | `ProgressReadDto` / `ProgressCreateDto` / `ProgressUpdateDto` |
| `QuestionDto` | `QuestionCreateDto` / `QuestionUpdateDto` / `QuestionBulkUpdateDto` |
| `QuizDto` | `QuizReadDto` |
| `EnrollmentDto` | `EnrollmentCreateDto` |

## 🎯 Next Steps (Blocked on Backend)

1. Backend team adds remaining 14 endpoint groups to Swagger spec
2. Regenerate the OpenAPI client: `npm run generate:api`
3. Create new facades following the pattern in `src/app/core/api/facades/`
4. Migrate each legacy service to its corresponding facade
5. Add social login (Google/Facebook) to Swagger to complete AuthService migration
