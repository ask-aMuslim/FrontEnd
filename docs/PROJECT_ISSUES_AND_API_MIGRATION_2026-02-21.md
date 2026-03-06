# Project Issues & API Migration Report

**Project:** AskAMuslim  
**Date:** 2026-02-21  
**Scope:** Full frontend audit against `https://aam-api.ask-a-muslim.com` and migration away from legacy API assumptions.

---

## Decision Framework (Applied)

For each issue, this report classifies root cause as:

1. **Frontend integration issue** → fixed in code immediately.
2. **Invalid request / malformed body / incorrect headers / backend route/validation issue** → flagged as **Backend Coordination Required** and isolated for your review.

---

## What Was Fixed (Frontend-Side)

### 1) Muslim Tube hardcoded data removed and replaced with live API calls

- **Root cause:** Static arrays and seed data were used in multiple pages instead of backend endpoints.
- **Fix implemented:**
  - Added `MuslimTubeFacade` with dynamic calls:
    - `GET /api/MuslimTube/channels`
    - `GET /api/MuslimTube/videos`
    - `GET /api/MuslimTube/videos/{id}`
    - `GET /api/MuslimTube/channels/{channelId}/videos`
  - Wired live data into:
    - `src/app/pages/muslim-tube/channels/channels.component.ts`
    - `src/app/pages/muslim-tube/videos/videos.component.ts`
    - `src/app/pages/muslim-tube/channel-detail/channel-detail.component.ts`
    - `src/app/pages/muslim-tube/video-detail/video-detail.component.ts`
  - Updated `video-card` event typing to support backend GUID IDs.

### 2) Questions listing API mismatch fixed

- **Root cause:** `GET /api/Questions` was being called without required `QuizId` query parameter.
- **Fix implemented:**
  - `QuestionFacade.getAllQuestions(quizId)` now sends `QuizId`.
  - `QuestionsService` updated to `getAllByQuizId(quizId)`.

### 3) Quiz page moved to API-backed question/option loading

- **Root cause:** Quiz questions/options were hardcoded with mock content.
- **Fix implemented:**
  - `quiz.component.ts` now:
    - loads quiz target from `QuizzesService` (lesson/course aware)
    - loads questions from `QuestionsService` by quiz ID
    - loads options per question through new `OptionsService`
  - Added `OptionFacade` and `OptionsService` using `GET /api/Options/by-question/{questionId}`.
  - Removed hardcoded quiz lesson sidebar seed list.
  - Replaced hardcoded sidebar labels in `quiz.component.html` with dynamic bindings.

### 4) Students courses flow corrected (avoid invalid endpoint dependency)

- **Root cause:** `GET /api/Students/courses` returned invalid user context errors.
- **Fix implemented:**
  - `StudentFacade.getStudentCourses()` now composes data via:
    1. `GET /api/StudentProfiles/me`
    2. `GET /api/Enrollments/by-student/{studentId}`
    3. `GET /api/Courses/{id}` (fan-out)

### 5) Legacy domain references removed from project docs

- **Root cause:** Documentation still referenced a deprecated runasp backend domain.
- **Fix implemented:** Updated references to `https://aam-api.ask-a-muslim.com` in:
  - `ai/architecture.md`
  - `ai/api-contracts.md`
  - `docs/API_INTEGRATION_AUDIT_REPORT_2026-02-21.md`

### 6) Invalid progress endpoint call eliminated from active request flow

- **Root cause:** Frontend attempted non-existing lesson progress route.
- **Fix implemented:**
  - `LessonFacade.saveProgress` converted to no-op payload echo (prevents repeated 404 spam).
  - `ProgressFacade.getProgressByStudentId` now returns empty until backend progress endpoint is finalized.

### 7) Academy progress and lesson content are now API-first (mock dependencies removed)

- **Root cause:** Academy services still referenced mock-data services and static fallbacks in critical learning flows.
- **Fix implemented:**
  - `src/app/core/services/academy-progress.service.ts`
    - removed mock-data service dependency.
    - computes stage/course/recent progress from `StudentFacade`, `EnrollmentFacade`, `CourseFacade`, and `LessonFacade`.
  - `src/app/core/services/lesson-content.service.ts`
    - removed mock lesson generation paths.
    - returns API-derived lesson/content with neutral empty defaults on API failure.

### 8) Events and Ask Q&A pages removed hardcoded seed content

- **Root cause:** Static fallback narratives and seeded question datasets were still present in UI-facing components.
- **Fix implemented:**
  - `src/app/pages/events/events.component.ts` and `event.service.ts`
    - removed branded/static text fallbacks for title/speaker/tags/details.
    - preserved API media fallback assets only.
  - `src/app/pages/events/events.component.html`
    - replaced large hardcoded hero fallback literals with neutral placeholders.
  - `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.ts`
    - removed large seeded `questions` array.
    - now API-driven with neutral defaults.

### 9) Security hygiene fix

- **Root cause:** Local helper script contained sensitive token content.
- **Fix implemented:** deleted `check_mcp.js` from the workspace.

---

## Backend Coordination Required (Paused for Your Review)

> These are explicitly backend-facing according to the decision tree. I did **not** invent fake frontend workarounds that would hide contract defects.

### B1) Progress APIs missing / inconsistent

- **Observed:** No stable progress endpoint in current OAS for lesson/student progress retrieval equivalent to previous assumptions.
- **Impact:** True persisted academy progress tracking cannot be completed end-to-end.
- **Frontend status:** Safe fallbacks applied to prevent invalid requests; full live progress depends on backend contract.
- **Needs backend:**
  - Either provide stable progress endpoints (read/update) in OAS, or
  - expose lesson progress under lessons routes and align DTO shape.

### B2) Meeting request 400 behavior

- **Observed:** `POST /api/MeetingRequests` previously returned 400 without actionable validation details.
- **Frontend action taken:** enforced consistent ISO `scheduledAt` payload and safer request shaping.
- **Needs backend:** return structured validation errors (`succeeded/errors`) that identify failing field(s).

### B3) Enrollment listing contract

- **Observed:** `GET /api/Enrollments` is not available, while UI/services historically assumed list access.
- **Frontend action taken:** shifted logic toward student-scoped listing where possible.
- **Needs backend:** confirm whether a global list endpoint should exist or remain role-restricted.

### B4) Collection confirmation gap (Postman)

- **Status:** ✅ **Resolved**.
- **Resolved details:** Confirmed collection `AskAMuslimBackend API Copy` in workspace with UID `36594832-dc526989-433f-49eb-bfd7-1ba2b17d6cfc`; endpoint map was retrieved and used for migration checks.

---

## Files Added

- `src/app/api/facades/muslim-tube.facade.ts`
- `src/app/api/facades/option.facade.ts`
- `src/app/core/services/options.service.ts`
- `docs/PROJECT_ISSUES_AND_API_MIGRATION_2026-02-21.md`

## Files Updated (Key)

- `src/app/api/facades/index.ts`
- `src/app/api/facades/enrollment.facade.ts`
- `src/app/api/facades/lesson.facade.ts`
- `src/app/api/facades/progress.facade.ts`
- `src/app/api/facades/question.facade.ts`
- `src/app/api/facades/quiz.facade.ts`
- `src/app/api/facades/student.facade.ts`
- `src/app/core/services/enrollments.service.ts`
- `src/app/core/services/index.ts`
- `src/app/core/services/questions.service.ts`
- `src/app/core/services/quizzes.service.ts`
- `src/app/pages/academy/quiz/quiz.component.ts`
- `src/app/pages/academy/quiz/quiz.component.html`
- `src/app/pages/ask-and-contact/meet-scholar/meet-scholar.component.ts`
- `src/app/pages/muslim-tube/channels/channels.component.ts`
- `src/app/pages/muslim-tube/channel-detail/channel-detail.component.ts`
- `src/app/pages/muslim-tube/videos/videos.component.ts`
- `src/app/pages/muslim-tube/video-detail/video-detail.component.ts`
- `src/app/pages/muslim-tube/video-card/video-card.component.ts`
- `src/app/pages/muslim-tube/muslim-tube.component.ts`
- `ai/architecture.md`
- `ai/api-contracts.md`
- `docs/API_INTEGRATION_AUDIT_REPORT_2026-02-21.md`

---

## Verification Snapshot

- Type/lint diagnostics: **no errors reported** for all edited migration files.
- Test task was executed in watch mode; one stale transient watch diagnostic was observed then corrected in `academy-progress.service.ts` by removing impossible status comparison.
- Existing project build context: last known `npm run build` was successful in this workspace.

---

## Review Gate (Required)

Please review and confirm how you want to proceed on backend-coordination items **B1–B4**.  
Once you confirm backend decisions (especially progress contract + Postman collection UID), I will continue with the next integration pass and remove remaining fallback behavior where backend support exists.
