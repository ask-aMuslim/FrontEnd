<!--
Sync Impact Report
- Version change: 2.0.0 -> 2.1.0
- Modified sections:
  - Automated Spec-Kit Pipeline -> Split-Agent Planning & Review Pipeline
- Added sections:
  - Plan-First Split-Agent Protocol (codifying separate Planning, Execution, and Review agents)
- Templates requiring updates:
  - ✅ .specify/templates/constitution-template.md
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

## Split-Agent Planning & Review Pipeline (NON-NEGOTIABLE)

To maximize quality and prevent regressions, feature development is split into a **Planning Phase** and an **Implementation Phase** executed by separate, specialized agent instances.

### 1. Planning & Design Phase (Current Agent)
The Planning Agent is responsible for specifying, planning, and creating highly granular, high-fidelity developer tasks. In this phase, the agent MUST:
- **No Implementation**: The planning agent MUST NOT write or apply any functional feature code.
- **High-Fidelity Tasks**: Author `tasks.md` such that each task is atomic, complete, and self-contained. Each task description MUST specify:
  - Exact file paths and relative imports.
  - Required component state, Inputs, Outputs, and specific Signal APIs to use (e.g., `signal`, `computed`, `linkedSignal`).
  - Explicit UI structure, CSS/Tailwind classes, and responsive behavior matching our design systems.
  - Required unit test coverage details (which files, what to assert).
- **Handoff Package**: Generate a clear, high-level handoff brief summarizing context, APIs, database updates, and safety-critical boundaries for the implementation agent.

### 2. Implementation Phase (Execution Agent)
The Execution Agent is delegated to implement the defined tasks. This agent MUST:
- **Strict Task Adherence**: Read `.specify/memory/constitution.md` and the `tasks.md` of the feature. Only implement tasks defined in the approved `tasks.md`.
- **Zero Ambiguity/Assumptions**: If a task is underspecified, the Execution Agent must stop and ask the user rather than guessing.
- **Incremental Verification**: Run quality gates (`npm run lint`, `npm run test`, `npm run build`) after each task is implemented to catch bugs early.

### 3. Verification & Review Phase (Review Agent)
Once implementation is complete, the Planning Agent resumes as the Review Agent. They MUST:
- **Verify Quality Gates**: Run the complete verification suite (`build`, `test`, `lint`, and API swagger checks if applicable).
- **Architecture & Diff Audit**: Perform a rigorous review of the implemented code diffs to ensure no architectural boundaries were breached, ChangeDetectionStrategy is correct, and all styling utilizes approved design tokens.
- **Check-off Completed Tasks**: Verify and check off completed tasks in the final walkthrough and task list.

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

**Version**: 2.1.0 | **Ratified**: 2026-05-23 | **Last Amended**: 2026-05-23
