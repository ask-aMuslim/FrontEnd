# Enterprise API Integration Architecture (Corrected, Implementation-Free)

---

## Executive Summary

This document presents a corrected, implementation-free architecture plan tailored to the AskAMuslim Angular application. It focuses on realistic, pragmatic, and high-quality approaches that align with the codebase's current state (feature-first, ng-openapi-gen present, strict TypeScript) and avoids unnecessary complexity. The goal: a production-grade, contract-enforced, maintainable API integration that is easy to audit and operate.

---

## Table of Contents

1. Core Architectural Principles
2. System Architecture Overview
3. Folder Structure (Feature-first)
4. Layer Design (Practical)
5. Authentication System (Design)
6. HTTP Interceptor Design (Behavioral Spec)
7. Adapter Responsibilities (Where to map)
8. Contract Drift Strategy (Recommended)
9. CI/CD Contract Checks (Practical)
10. Postman / MCP (Optional Role)
11. Migration Strategy (Feature-by-feature)
12. Form Scaffolding (Conservative)
13. Error Normalization (Domain Model)
14. Risk Mitigation
15. Implementation Roadmap (Accelerated)

---

## 1. Core Architectural Principles ✅

- **Swagger / OpenAPI is the source of truth** for types and endpoints.
- **Never modify generated code** — generation is single source and reproducible.
- **Feature-first placement** for business logic: keep services/adapters inside feature folders.
- **No fragile URL checks**: prefer request-scoped tokens (HttpContextToken) for skipping auth.
- **Automated contract checks** in CI: regenerate then compare; fail fast on drift.
- **JWT lifecycle management** must be centralized and reactive (signals/observables).
- **Postman MCP is optional** — use where team workflow benefits outweigh tooling overhead.
- **Forms remain primarily manual, type-safe**; automation is a conservative future enhancement.

---

## 2. System Architecture Overview (High Level)

- Presentation: Components & Reactive Forms.
- Domain: Feature services (facades) that expose domain models.
- Generated: Read-only API client and DTOs produced by ng-openapi-gen.
- Integration: Interceptor + Token service + Refresh queue.
- Testing/Validation: CI regeneration checks and optional Postman/Newman runners.

Mermaid diagrams are useful for communicating flow (keep diagrams in repo, no code snippets required here).

---

## 3. Folder Structure (Feature-first) 🧭

Recommended high-level shapes (examples only):

- src/app/pages/<feature>/services/           # Feature-specific facades & mapping
- src/app/pages/<feature>/models/             # Feature view models
- src/app/core/api/generated/                 # Auto-generated client (do not edit)
- src/app/core/auth/                          # Token service, refresh queue, guards
- src/app/core/http/                          # HttpContextToken definitions, helpers
- src/app/core/errors/                        # Error normalization utilities

Notes:
- **Avoid** a global `adapters/` folder unless there is cross-feature reuse justification.
- Collocate mapper functions/classes with the feature to keep cognitive load low.

---

## 4. Layer Design (Practical & Minimal) 🧩

- **Generated Layer**: Full isolation — build-time generated DTOs & functions; committed or CI-generated.
- **Domain Facades**: Feature-level services that call generated clients and map to domain models. They encapsulate validation, caching, and state.
- **Error/Normalization Layer**: Shared domain error model, used by facades and interceptors.

Guideline: keep the stack to three clear layers (generated → facade/mapper → component) to avoid over-engineering.

---

## 5. Authentication System (Design) 🔒

Design goals:
- Centralized token lifecycle management (access + refresh tokens).
- Reactive signals or observables that represent auth state (isAuthenticated, tokenExpiry, etc.).
- Safe persistence for long sessions in browser-only storage (localStorage or secure alternative), guarded by platform checks.
- Transparent refresh strategy that refreshes proactively and recovers from 401s via a refresh queue.

Responsibilities of Token Service (spec):
- Provide current token via a single entry method that guarantees a valid token or triggers refresh.
- Expose computed flags for "expiring soon" and "authenticated".
- Provide clear methods to set/clear tokens and to persist state.

Refresh Queue (spec):
- Ensure a single refresh operation at a time.
- Allow pending requests to wait for a refreshed token.
- Fail-safe behavior: on refresh failure, clear tokens and trigger logout path.

---

## 6. HTTP Interceptor Design (Behavioral Spec) 🪝

- **Use HttpContextToken** to annotate requests (e.g., SKIP_AUTH) — avoid URL matching.
- On outgoing request: consult token service, attach Authorization header when applicable.
- On 401 responses: initiate refresh queue and retry the original request once; on persistent failure, clear auth and redirect to login.
- Interceptor also delegates to global error normalization and optional retry logic configured via context tokens.

---

## 7. Adapter Responsibilities & Placement (Practical)**

- **Do not** introduce a heavy cross-cutting `adapters/` layer by default.
- Keep mapping/normalization logic in feature facades or small helper classes placed alongside feature services.
- Shared normalization logic (e.g., enum coercion, null coalescing) can live in `core/errors` or `core/utils`.

Rationale: reduces indirection, keeps code discoverable, aligns with feature-first rules.

---

## 8. Contract Drift Strategy (Realistic & Optional) ⚠️

- **Recommended (practical):** In CI, run `npm run generate:api` and fail the job if generated files differ — simple and effective.
- **Optional (advanced):** Maintain a `swagger.hash` lock and fail on hash mismatch. This increases strictness but also operational overhead; mark as an "Advanced" opt-in feature.

---

## 9. CI/CD Contract Checks (Minimal & Effective) ⚙️

- CI job steps:
  - Install dependencies
  - Run API generation tooling
  - If `git diff --exit-code src/app/core/api/generated` fails → mark the job as failed and surface the diff
  - Run unit tests & linting
  - Optionally run Newman/Postman suites (if team uses Postman)

Outcome: contract changes are visible at PR time and must be explicitly addressed.

---

## 10. Postman / MCP (Optional) 🧪

- Use Postman primarily for exploratory testing and maintaining manual collections.
- If the team maintains Postman collections, consider running Newman in CI for smoke tests (login, major flows).
- If not actively used, do not mandate Postman; keep it as an optional integration.

Best practices if used:
- Store `baseUrl`, `jwt`, and `refreshToken` in environment variables
- Add a login test that extracts tokens into environment for downstream requests

---

## 11. Migration Strategy (Feature-by-feature) 🔁

- **Start with Auth/Identity** — this unblocks secure testing and token flow.
- Migrate **high-value features** next (courses, events) in small PRs.
- For each feature:
  - Ensure endpoints exist in Swagger
  - Replace legacy direct calls with generated client usage inside feature facade
  - Map DTO → domain models within the feature service
  - Remove legacy constants/services when the feature passes tests

Advantages: minimal blast radius, easily testable, and continuous progress.

---

## 12. Form Scaffolding (Conservative Approach) 🧾

- Prefer **type-safe manual forms** using generated DTO types for validation and typing.
- Consider a lightweight schema metadata extractor for repetitive validation rules (required, min/max) **as an optional enhancement** — do not auto-generate full UI.
- Reason: OpenAPI lacks UI intent (labels, placeholders, conditional rules), and full UI generation introduces brittleness.

---

## 13. Error Normalization (Domain Model) ⚠️

- Normalize backend ProblemDetails and HTTP errors into a single `ApiError` shape that includes status, message, validation details, trace id and timestamps.
- Centralize logic in an error-normalizer service used by error interceptor and facades
- Provide clear user-friendly messages and structured validation errors for form layers

---

## 14. Risk Mitigation (Top-level) 🚨

- Backend breaking changes → CI detection + adapters provide safe defaults
- Token refresh failures → refresh queue and clear-fallback behavior
- Partial swagger exposure → Feature-first migration and backend coordination
- Over-automation → prefer incremental, well-tested changes and avoid generating UI automatically

---

## 15. Implementation Roadmap (Accelerated & Phased) 🗺️

**Assumptions:** The repository already contains `ng-openapi-gen` and many domain facades; changes are primarily incremental.

Phase A — Core Hardening (1–2 days)
- Add HTTP context-based interceptor spec and register it
- Harden `AuthService` design (reactive signals + safe persistence)
- Add refresh queue behavior and safe 401 handling
- Add CI check for regeneration (generate & diff)

Phase B — Focused Migration (1–2 days)
- Migrate Auth/Identity first
- Migrate 1–2 high-impact features (courses, events)
- Remove the most critical legacy endpoint constants

Phase C — Optional Enhancements (2–7 days)
- Enable Postman/Newman smoke tests (optional)
- Consider swagger hash lock as advanced option
- Add a small schema metadata helper for common validation mapping (optional)

Total baseline: **2–5 days** for core and essential migrations; optional items add time as needed.

---

## Appendices & Quick Guidance

- Keep generated code read-only and reproducible via `npm run generate:api`.
- Place feature services and mapping logic within feature folders (e.g., `src/app/pages/academy/services/`).
- Use HttpContextToken for opt-outs, not URL matching.
- Make Postman and swagger-hash features optional and document their operational costs.

---

*Document Version: 1.1 (Corrected)*
*Last Updated: 2026-02-12*
*Author: Architecture Team (revised — design only, no implementation)*
