# Integration Audit — Phase 2 (2026-02-15)

## Scope
- Verified regenerated OpenAPI client under `src/app/api` against runtime wiring in `src/app/app.config.ts`.
- Audited service integration split between generated/facade path and legacy `ApiService` + `API_ENDPOINTS` path.
- Applied critical runtime and security remediations discovered during audit.

## Critical Findings
1. **Legacy API base URL drift risk (fixed)**
   - `ApiService` previously sent many relative `'/api/...'` calls without prefixing `environment.apiBaseUrl`.
   - Impact: in non-proxy/dev-hosted setups, requests could be sent to frontend origin instead of backend host.
   - Fix: `src/app/core/services/api.service.ts` now normalizes relative paths against `environment.apiBaseUrl` while preserving absolute URLs.

2. **Hardcoded refresh endpoint fragility (fixed)**
   - `TokenService` used a single hardcoded refresh path (`/api/Identity/Refresh`).
   - Impact: auth refresh failed when backend exposed alternate route shape.
   - Fix: `src/app/core/auth/token.service.ts` now tries `API_ENDPOINTS.IDENTITY.REFRESH` first, then falls back to `/api/Identity/Refresh`.

3. **Credential leakage in repo files (fixed)**
   - Hardcoded Postman token detected in `src/environments/environment.development.ts` and `.kilocode/mcp.json`.
   - Fix: token values sanitized and replaced with non-secret placeholders.

4. **No-console rule violation (fixed)**
   - `error.interceptor.ts` used development `console.*` logging.
   - Fix: removed console logging and retained normalized error propagation.

## Major Findings (Open)
1. **Mixed API architecture remains**
   - A subset of domains use facades on generated functions (`IdentityFacade`, `CourseFacade`, etc.).
   - 15 services still depend on `ApiService` + constants (`events`, `meeting-requests`, `notifications`, `qas`, etc.).
   - This is currently functional but increases contract drift risk versus generated API.

2. **Constants metadata stale**
   - `src/app/core/constants/api-endpoints.ts` comments still describe many endpoints as “not in current swagger” though regenerated client contains matching domains.

3. **Unit test harness baseline issue**
   - `npm test` fails with `NG0908: Angular requires Zone.js` in existing tests.
   - Failure is pre-existing test setup mismatch with zoneless app configuration, not introduced by this phase.

## Validation Evidence
- `npm run build` completed successfully after remediations.
- `npm test` executed; failures are infrastructure-level (`NG0908`) across unrelated specs.

## Recommended Next Remediation Sprint
1. Migrate legacy services with generated equivalents available (`events`, `event-registrations`, `meeting-requests`, `inquiry-requests`, `notifications`, `muslim-tube`, `quiz-attempts`, `qas`, `student-notes`, `student-questions`).
2. Align and de-duplicate endpoint ownership (facades vs constants).
3. Update test setup for zoneless Angular or selectively enable Zone.js in spec bootstrap.
