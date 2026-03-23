# Implementation Plan: Frontend Stabilization Across Core Journeys

**Branch**: `006-stabilize-frontend-flows` | **Date**: 2026-03-14 | **Spec**: `D:\College Content\Ask A Muslim\PROJECT\AskAMuslim\specs\006-stabilize-frontend-flows\spec.md`
**Input**: Feature specification from `/specs/006-stabilize-frontend-flows/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Stabilize four user-critical frontend areas without breaking existing architecture boundaries:

1. Academy end-to-end flow (lesson -> course quiz -> level/next completion step -> congrats/completed state) must be deterministic and guarded against invalid completion.
2. Profile page must fully persist via existing student profile API integration, including robust load/save/error UX.
3. Home page must suppress the “How can we best serve you?” section and remove `home-serve__icon` from rendered DOM path.
4. Ask Questions tag filtering must operate on full matching data (server-filtered dataset) rather than only current-page subset.

Technical approach: preserve existing standalone + OnPush component model, keep API access in service/facade boundaries, and introduce targeted flow/query-state corrections plus verification evidence (build/test/lint/manual/API contract checks).

## Technical Context

**Language/Version**: TypeScript (Angular 20+ standalone architecture)  
**Primary Dependencies**: Angular framework, RxJS, generated OpenAPI client under `src/app/api/**`, custom facades/services (`StudentFacade`, `QuizAttemptFacade`, `QasService`, `TagsService`)  
**Storage**: Backend APIs (StudentProfiles, QuizAttempts, QAs/Tags); browser localStorage currently used in `quiz.component.ts` for completion snapshot  
**Testing**: Angular CLI/Karma unit tests (`npm run test`), lint (`npm run lint`), production build verification (`npm run build`)  
**Target Platform**: Web (SSR-capable Angular app, browser clients)  
**Project Type**: Frontend web application (feature-first Angular app)  
**Performance Goals**: Preserve current UX responsiveness while avoiding extra round-trips and stale OnPush UI state; no new heavy runtime loops  
**Constraints**: No direct `HttpClient` in components; generated API files untouched; strict TypeScript/no `any`; immutable/signal-safe state updates where applicable  
**Scale/Scope**: Targeted stabilization across `academy`, `account/about`, `home`, and `ask-and-contact/ask-Q&A` flows with no global architecture rewrite

### Impacted Angular Modules / Pages / Services / Facades

- **Routing / flow entrypoints**
  - `src/app/app.routes.ts` (academy and ask routes; current academy route topology)
- **Academy flow**
  - `src/app/pages/academy/lesson-player/lesson-player.component.ts`
  - `src/app/pages/academy/quiz/quiz.component.ts`
  - `src/app/pages/academy/shared/academy-page-shell/**` (banner/breadcrumb continuity if needed)
  - `src/app/core/services/academy-progress.service.ts`
  - `src/app/core/services/quiz-attempts.service.ts`
  - `src/app/api/facades/quiz-attempt.facade.ts`
- **Profile integration**
  - `src/app/pages/account/about/about.component.ts`
  - `src/app/api/facades/student.facade.ts`
  - `src/app/core/services/student-profile.service.ts`
- **Home suppression/removal**
  - `src/app/pages/home/home.html`
  - `src/app/pages/home/home.scss` (cleanup of orphaned section styles after hide/remove)
  - `src/app/pages/home/home.ts` (if template bindings are removed)
- **Ask Questions tag filtering**
  - `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.ts`
  - `src/app/core/services/qas.service.ts`
  - `src/app/core/services/tags.service.ts`

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Standalone + OnPush**: Impacted standalone components (`AskQaComponent`, `QuizComponent`) remain standalone; OnPush behavior respected and explicit CD marks preserved/extended when async state changes.
- [x] **Facade boundary**: Component-level HTTP remains prohibited; changes are constrained to existing service/facade boundaries (`QasService`, `StudentFacade`, `QuizAttemptsService` / `QuizAttemptFacade`).
- [x] **Signal-first state**: Existing signal usage in `QuizComponent` remains immutable; list/filter states in ask-qa continue immutable replacement updates.
- [x] **Contract discipline**: Contract-sensitive behavior references existing endpoints (`/api/QAs`, `/api/Tags`, `/api/StudentProfiles/me`, `/api/QuizAttempts/complete/{attemptId}`) with Swagger/Postman checks.
- [x] **Verification gates declared**: Required commands and manual/API flow evidence are explicitly defined in `quickstart.md` and contracts artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/006-stabilize-frontend-flows/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── app.routes.ts
│   ├── pages/
│   │   ├── academy/
│   │   │   ├── lesson-player/
│   │   │   ├── quiz/
│   │   │   └── shared/academy-page-shell/
│   │   ├── account/about/
│   │   ├── home/
│   │   └── ask-and-contact/ask-Q&A/
│   ├── core/services/
│   │   ├── academy-progress.service.ts
│   │   ├── quiz-attempts.service.ts
│   │   ├── student-profile.service.ts
│   │   ├── qas.service.ts
│   │   └── tags.service.ts
│   └── api/facades/
│       ├── student.facade.ts
│       └── quiz-attempt.facade.ts
└── environments/

specs/006-stabilize-frontend-flows/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/

tests/
└── (Angular spec files co-located under src/**/*.spec.ts)
```

**Structure Decision**: Use the existing single Angular application (feature-first under `src/app/pages/**`, cross-cutting domain services under `src/app/core/services/**`, API edge via `src/app/api/facades/**`). No new top-level app/package split is required.

## Architecture Decisions

1. **Academy transition stabilization in-place**

- Keep route model in `app.routes.ts` and improve transition guards/state handling inside academy page services/components.
- Maintain quiz completion guard (`isFinishingQuiz`) and enforce all-answers-complete contract before completion submit.

2. **Profile persistence through existing profile boundary**

- Continue using `AboutComponent` -> `StudentFacade` -> `StudentProfileService` path.
- Prefer mapping/validation updates in service/facade layer rather than UI ad-hoc conversions.

3. **Home serve section removal at template source**

- Remove/disable section markup in `home.html` and remove icon element rather than only visual hiding where possible.
- Keep authentication conditional behavior intact for other sections.

4. **Ask Questions global tag filtering via API-scoped dataset**

- Shift from client filtering over current `questions` page to server-side filtered retrieval and pagination synchronization.
- Reset page index on filter changes and clear stale results during in-flight request transitions.

## API Contract Considerations

- **Q&A filtering**: `/api/QAs` currently accepts `pageNumber`, `pageSize`, and `tags` query parameters through `QasService.getAll()`; implementation must validate that selected tag produces full dataset paging semantics.
- **Tags taxonomy**: `/api/Tags` is source-of-truth for category options; “All Categories” remains UI-only synthetic option.
- **Profile endpoints**: `/api/StudentProfiles/me` (GET/POST/PUT) and optional `/api/StudentProfiles/picture` must preserve response mapping to `AboutModel` without destructive field loss.
- **Quiz attempts**: `/api/QuizAttempts` and `/api/QuizAttempts/complete/{attemptId}` require answer payload consistency and no duplicate completion attempts.

## Verification Strategy

1. **Automated quality gates**

- `npm run build`
- `npm run test`
- `npm run lint`
- `npm run swagger:check`

2. **Manual Academy flow validation**

- Start at lesson player route and verify transition chain to quiz/completed state.
- Validate blocked submission when unanswered questions remain.

3. **Manual Profile validation**

- Load profile data, edit main/personal/contact sections, save, refresh, verify persistence.
- Validate user-friendly error states for failed saves.

4. **Manual Home validation**

- Confirm “How can we best serve you?” is not visually rendered.
- Confirm `home-serve__icon` does not exist in rendered section path.

5. **Manual/API Ask Questions validation**

- Use a tag known to span multiple pages; verify filtered results across all pages.
- Validate pagination reset when changing/clearing tag and empty-state correctness.

## Post-Design Constitution Re-Check

- [x] **Standalone + OnPush**: Design keeps standalone component boundaries and explicit CD handling for async updates.
- [x] **Facade boundary**: No design step introduces component-level transport logic.
- [x] **Signal-first/immutable state**: Quiz signals remain immutable; list/filter state updates are replacement-based.
- [x] **Contract discipline**: Contracts documented under `contracts/api-contracts.md` and verification path includes Swagger + Postman.
- [x] **Verification gates**: Build, test, lint, and swagger checks plus manual evidence are explicitly captured in `quickstart.md`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |
