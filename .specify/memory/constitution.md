<!--
Sync Impact Report
- Version change: 1.0 -> 2.0.0
- Modified principles:
  - Core Tech Stack (Immutable) -> I. Angular Standalone + OnPush by Default
  - Data Flow Pattern (Mandatory) -> II. Facade-First Data Access
  - State Management Pattern -> III. Signal-First Immutable State (NON-NEGOTIABLE)
  - API Contract Integrity -> IV. Contract-First API Discipline
  - Project Health / Review Checklist -> V. Verification Gates Before Merge
- Added sections:
  - Architecture & Boundaries
  - Development Workflow & Quality Gates
- Removed sections:
  - Project Identity (folded into principles and governance)
  - Special Patterns & Known Gotchas (moved to runtime guidance docs)
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
  - ⚠ pending (directory missing): .specify/templates/commands/*.md
  - ✅ .specify/README.md
- Follow-up TODOs:
  - TODO(COMMAND_TEMPLATES): Create .specify/templates/commands/ if command-level templates are introduced.
-->

# AskAMuslim Constitution

## Core Principles

### I. Angular Standalone + OnPush by Default

All new UI code MUST use standalone components and `ChangeDetectionStrategy.OnPush`.
Any async subscription that mutates component-visible state MUST call
`ChangeDetectorRef.markForCheck()` to avoid stale rendering.
Rationale: this repository uses Angular 20 zoneless + SSR/hydration; explicit
change detection keeps runtime behavior deterministic.

### II. Facade-First Data Access

Components MUST NOT call `HttpClient` directly. API calls MUST flow through
generated OpenAPI functions (`src/app/api/fn/**`) wrapped by facades
(`src/app/api/facades/**`), then consumed by core/domain services and pages.
Generated API files are read-only and MUST NOT be manually edited.
Rationale: this preserves contract safety and keeps transport concerns out of UI.

### III. Signal-First Immutable State (NON-NEGOTIABLE)

Application state MUST be modeled with Angular Signals (`signal`, `computed`,
`linkedSignal`) and immutable updates. `any`, unsafe casts, direct mutation, and
business logic in templates are forbidden.
Rationale: strict typing plus immutable signal updates reduce regressions and
support predictable SSR/client hydration.

### IV. Contract-First API Discipline

API work MUST be validated against the OpenAPI/Postman contract before merge.
Run `npm run swagger:check` and, when contracts changed, `npm run api:sync`.
In local development, endpoints MUST respect the `/api` base-path convention and
avoid duplicate prefixing.
Rationale: contract drift has previously caused runtime failures and broken auth.

### V. Verification Gates Before Merge

Every change MUST pass `npm run build`, `npm run test`, and `npm run lint`.
For API-touching changes, `npm run swagger:check` is required.
Commits SHOULD reference a Speckit spec identifier.
Rationale: production stability depends on enforced quality gates, not intent.

## Architecture & Boundaries

The canonical frontend structure is feature-first:

- `src/app/pages/**`: lazy-loaded feature pages.
- `src/app/shared/**`: cross-feature UI/layout/pipes.
- `src/app/core/**`: domain services, auth, guards, interceptors, errors.
- `src/app/api/**`: generated OpenAPI client + custom facades.

Styling MUST use project tokens and shared style layers
(`src/styles/tokens/variables.css`, `src/styles/containers.css`,
`src/styles/styles.css`). Inline styles are prohibited.

Errors MUST normalize through `src/app/core/errors/error-normalizer.ts`.

## Development Workflow & Quality Gates

All contributors (human or agent) MUST execute work in this order:

1. **Analyze**: locate impacted module(s) and architectural boundary.
2. **Plan**: produce a minimal-change plan with explicit risk notes.
3. **Implement**: apply scoped edits only after plan agreement.
4. **Verify**: run required validation commands and report results.

Specification workflow is mandatory for non-trivial work:

- `/speckit.specify` -> spec authoring
- `/speckit.plan` -> implementation design
- `/speckit.tasks` -> executable task breakdown
- `/speckit.implement` -> tracked implementation

## Automated Spec-Kit Pipeline

You are the Automated Spec-Driven Development orchestrator for every AskAMuslim feature. Treat each request as an immediate pipeline execution, and never pause for manual prompts or phase approvals. The following mandates are non-negotiable:

1. **Single-Stream Execution** – Upon receiving a new feature, immediately simulate the full Spec-Kit pipeline in your single-response reply. Do **not** wait for `/speckit.specify`, `.plan`, `.tasks`, or `.implement` commands to be run explicitly; the pipeline is implicit and executed only once per request.
2. **Phase 1 (Specify & Plan)** – Generate a brief but dense `spec.md` and `plan.md` that describe the user journey, the impacted Supabase schema (tables/fields/constraints), and the Angular component tree (pages/components/signals). Present them in separate code blocks labeled `spec.md` and `plan.md`.
3. **Phase 2 (Tasks)** – Immediately follow with a `tasks.md` breakdown that decomposes the plan into atomic, parallelizable engineering steps. Use an ordered list with clear owners (the automated agent) and estimated effort. Wrap in a `tasks.md` block.
4. **Phase 3 (Implement)** – In the same response, emit the Angular and TailwindCSS implementation for the tasks above. Provide fully-formed component/service snippets inside code blocks labeled `typescript`, `html`, or `css` as needed. No placeholder text. This is the delivery phase.
5. **Zero Interruption** – Never request permission or clarification between phases. Label each phase explicitly in markdown headings/blocks, maintain sequential order (Specify → Plan → Tasks → Implement), and complete the entire pipeline in one uninterrupted message.

If execution fails, diagnose and re-run the pipeline within the same message rather than waiting for user approval. Every automated run must end with the code delivery phase ready for review.

## Governance

This Constitution supersedes ad-hoc practices in this repository.

- **Amendment Process**: Propose changes in
  `.specify/memory/amendments/YYYY-MM-DD-<topic>.md`, include motivation,
  affected files, migration impact, then update dependent templates and
  runtime docs in the same change set.
- **Versioning Policy**:
  - **MAJOR**: Principle removal/redefinition or governance incompatibility.
  - **MINOR**: New principle/section or materially stronger guidance.
  - **PATCH**: Clarifications, wording improvements, typo-only edits.
- **Compliance Review**:
  - Every spec and plan MUST include a Constitution check.
  - Every PR MUST document gate results (build/test/lint and API checks when
    relevant).
  - Violations MUST be resolved before merge; no deferred TODO bypass.

**Version**: 2.0.0 | **Ratified**: 2026-03-11 | **Last Amended**: 2026-03-14
