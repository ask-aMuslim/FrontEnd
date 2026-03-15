# Quickstart — 006 Stabilize Frontend Flows

## Prerequisites

- Node dependencies installed (`npm install`)
- Backend/API available for `/api` endpoints used by Academy/Profile/Ask Q&A

## 1) Run required verification gates

1. Run build gate.
2. Run unit tests.
3. Run lint.
4. Run API contract check.

Expected outcome: all gates pass before feature sign-off.

## 2) Manual validation checklist

### A. Academy full user flow

1. Navigate to a protected lesson page: `/academy/course/{courseId}/lesson/{lessonId}`.
2. Complete lesson actions and transition into quiz flow.
3. Answer all quiz questions; submit.
4. Confirm review/completed (congrats) state renders with consistent course context.
5. Negative case: leave required answers empty and confirm submission is blocked.

### B. Profile API integration

1. Open account profile page (`/account` -> about section).
2. Confirm profile values load from API.
3. Edit main, personal, and contact fields and save each section.
4. Refresh page and verify persisted values.
5. Trigger failure case (e.g., invalid value/network interruption) and verify user-facing error handling.

### C. Home section suppression

1. Open `/home` as unauthenticated user.
2. Confirm “How can we best serve you?” section is not visible.
3. Inspect DOM and confirm `home-serve__icon` is absent from rendered output.

### D. Ask Questions global tag filtering

1. Open `/ask-and-contact/ask-qa`.
2. Select a tag known to have records across multiple pages.
3. Confirm results include full matching dataset and pagination reflects filtered totals.
4. Change/clear tag and verify page reset to first page with no stale data.
5. Validate empty-state behavior for non-matching tag.

## 3) API/contract validation traces

- Validate Swagger contract checks pass for touched endpoints.
- Validate Postman collection requests for:
  - Student profile read/write (`/api/StudentProfiles/me`)
  - Quiz attempt completion (`/api/QuizAttempts/complete/{attemptId}`)
  - Q&A filtering (`/api/QAs?pageNumber=&pageSize=&tags=`)
  - Tags retrieval (`/api/Tags`)

## 4) Evidence package

Record command outputs and screenshots/traces for:

- Academy flow transitions
- Profile load/save/refresh
- Home section absence
- Ask Q&A tag filtering across pages
