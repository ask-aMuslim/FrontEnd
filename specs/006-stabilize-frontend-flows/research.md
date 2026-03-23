# Phase 0 Research — 006 Stabilize Frontend Flows

## Decision 1: Academy completion orchestration remains route-stable and quiz-guarded

- **Decision**: Keep current academy route topology (`/academy/course/:courseId/lesson/:lessonId`, `/academy/course/:courseId/quiz`) and stabilize transition logic in `LessonPlayerComponent` + `QuizComponent` + `AcademyProgressService`.
- **Rationale**: Existing routing already contains the required journey entry points; instability is likely in transition/guard state, not missing route infrastructure.
- **Alternatives considered**:
  - Add a new dedicated congrats route: rejected because current completed/congrats state already exists in `quiz.component.html` and would add unnecessary route complexity.
  - Move completion logic into component template conditionals only: rejected because completion protection belongs in service/component action flow.

## Decision 2: Profile integration remains facade-first through StudentFacade

- **Decision**: Keep `AboutComponent` wired through `StudentFacade` and `StudentProfileService` for all profile CRUD/save behavior.
- **Rationale**: This path is already implemented and caches profile state; improvements should focus on mapping consistency, field completeness, and error UX.
- **Alternatives considered**:
  - Direct API calls from About component: rejected by constitution (Facade-first boundary).
  - New duplicated profile service for about page only: rejected due to logic duplication and cache divergence risk.

## Decision 3: Home “serve” section suppression should be source-level template removal/suppression

- **Decision**: Remove/suppress `home-serve` block from `home.html` and remove `home-serve__icon` markup from rendered DOM path.
- **Rationale**: Requirement explicitly asks hidden section + icon removal. Source-level template control is deterministic and avoids accidental visibility regressions.
- **Alternatives considered**:
  - CSS-only `display:none`: partially valid but weaker against accidental structural reuse; icon markup still exists in DOM unless removed.

## Decision 4: Ask Questions global tag filtering must be server-driven with synchronized pagination

- **Decision**: Implement tag filtering by requesting filtered datasets from `/api/QAs` with `tags` + paging params and align pagination state to filtered totals.
- **Rationale**: Current `AskQaComponent.onSearch()` filters only in-memory `questions` loaded for current page; this cannot produce full-dataset tag results.
- **Alternatives considered**:
  - Fetch all questions once and filter client-side: rejected due to scalability, stale cache risk, and mismatch with API pagination contract.
  - Keep current page-local filtering and append pages lazily: rejected because it still fails true global semantics and complicates UX.

## Decision 5: Contract verification remains Swagger + Postman evidence

- **Decision**: Validate API-sensitive behavior with `npm run swagger:check` plus Postman collection assertions for profile/QA/quiz attempts contracts.
- **Rationale**: Constitution requires contract-first discipline and this repository already ships swagger/postman assets.
- **Alternatives considered**:
  - Rely only on browser/manual testing: rejected because contract drift may be invisible from UI smoke tests.

## Resolved Clarifications

- Technical stack: Angular TypeScript app with standalone components and OnPush usage in impacted views.
- External interfaces: Existing REST endpoints for QAs/Tags, StudentProfiles, QuizAttempts.
- Test/tooling gates: build/test/lint/swagger checks are available and required.

No remaining NEEDS CLARIFICATION items.
