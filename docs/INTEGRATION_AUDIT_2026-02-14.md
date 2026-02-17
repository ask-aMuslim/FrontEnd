# Integration Audit — 2026-02-14

## Scope
- Runtime contract probe against `swagger.json` operations.
- Live UI verification with Chrome DevTools MCP on `http://localhost:4200`.
- Postman MCP environment inspection.

## Contract Validation Summary
- Source: `swagger.json`
- Runtime target: `https://askamusslimapi.runasp.net`
- Operations tested: `79`
- 2xx responses: `22`
- 401/403 responses: `4`
- 4xx responses: `49`
- 5xx responses: `8`
- Network failures: `0`

Detailed matrix: `docs/integration-contract-runtime-report.json`

## Frontend Integration Defects Fixed

### 1) Wrong dev environment API base URL (critical)
- Symptom: requests were emitted as `/api/api/...` and parsed as HTML (`Unexpected token '<'`).
- Root cause: no development file replacement in `angular.json`.
- Fix: enabled `fileReplacements` for `development`:
  - `src/environments/environment.ts` -> `src/environments/environment.development.ts`
- Verified via MCP: login now calls `https://askamusslimapi.runasp.net/api/Identity/Login/login`.

### 2) Ask-Q&A bound to legacy non-existent endpoint
- Symptom: Ask-Q&A fetched from `/QAs` (404 on backend).
- Root cause: `API_ENDPOINTS.qas.*` mapped to legacy routes.
- Fix: rebound to Swagger routes under `/api/Question`.
- Verified via MCP: route `/ask-and-contact/ask-qa` now triggers `GET https://askamusslimapi.runasp.net/api/Question` with `200`.

### 3) Post-login profile fetch used invalid endpoint
- Symptom: after successful login, app called `/api/Students/me` (`404`).
- Root cause: legacy `StudentFacade.me()` endpoint.
- Fix:
  - Resolve current user id/email from token in `StudentFacade`.
  - Query `/api/Student/{id}` first.
  - On 404 fallback to `/api/Student` collection lookup.
- Verified via MCP:
  - Login `POST /api/Identity/Login/login` -> `200`
  - Profile request fallback chain executes (`/api/Student/{id}` -> `404`, then `/api/Student` -> `200`)
  - Progress call proceeds: `/api/Progress/GetProgressByStudentId/...` -> `200`

### 4) Runtime console issue cleanup
- Symptom: form-field issue warning (`id`/`name` missing) on Ask-Q&A route.
- Fix: added `id` and `name` to search input in Ask-Q&A template.
- Verified via MCP: no warnings/errors on the route.

## Authentication/Authorization Checks
- Bearer injection verified in runtime request headers for authenticated calls.
- Unauthorized flow verified: invalid login yields clean `401` and user-facing `Unauthorized` message.

## Backend/API Defects Observed (Not fixable from frontend)
5xx responses detected for:
- `PUT /api/Option/{optionId}`
- `DELETE /api/Option/{optionId}`
- `GET /api/Option/option/{optionId}`
- `DELETE /api/Option/question/{questionId}`
- `PUT /api/Question/{id}`
- `PUT /api/Quiz/{id}`
- `POST /api/QuizEvaluation/evaluate/{quizId}`
- `POST /api/QuizEvaluation/evaluate/{quizId}/student/{studentId}`

These require backend fixes or contract updates.

## Build/Validation Status
- `npx ng build` passes after changes.
- Remaining CSS selector warnings are pre-existing build warnings unrelated to API wiring.

## Files Changed in This Audit
- `angular.json`
- `src/app/core/constants/api-endpoints.ts`
- `src/app/core/api/facades/student.facade.ts`
- `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.html`
- `docs/integration-contract-runtime-report.json` (generated)
- `docs/integration-binding-map.json` (generated)
