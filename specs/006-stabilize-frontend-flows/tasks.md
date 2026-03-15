# Tasks: Frontend Stabilization Across Core Journeys

**Input**: Design documents from `/specs/006-stabilize-frontend-flows/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api-contracts.md`, `quickstart.md`

**Tests**: Explicitly included (user requested implementation + verification coverage).  
**Organization**: Tasks are grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete task)
- **[Story]**: User story label (`US1`, `US2`, `US3`, `US4`)
- All tasks include concrete file targets.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature tasking, evidence scaffolding, and baseline verification entry points.

- [ ] T001 Create feature validation log scaffold in `specs/006-stabilize-frontend-flows/validation-evidence.md`
- [ ] T002 Create manual QA checklist artifact in `specs/006-stabilize-frontend-flows/manual-test-report.md`
- [ ] T003 [P] Add API contract verification checklist section in `specs/006-stabilize-frontend-flows/contracts/api-contracts.md`
- [ ] T004 Record constitution compliance checklist for this implementation in `specs/006-stabilize-frontend-flows/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared flow/query/error conventions that all stories depend on.

**⚠️ CRITICAL**: Complete before story implementation.

- [ ] T005 Audit and normalize OnPush async update points in `src/app/pages/academy/quiz/quiz.component.ts`, `src/app/pages/account/about/about.component.ts`, and `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.ts`
- [ ] T006 [P] Add shared frontend error normalization usage for profile and ask flows in `src/app/core/errors/error-normalizer.ts`, `src/app/core/services/student-profile.service.ts`, and `src/app/core/services/qas.service.ts`
- [ ] T007 [P] Align pagination/filter request-state primitives in `src/app/core/services/qas.service.ts` and `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.ts`
- [ ] T008 Add academy flow transition guard helpers in `src/app/core/services/academy-progress.service.ts`
- [ ] T009 [P] Add façade boundary assertions/comments (no component HTTP rule) in `src/app/api/facades/student.facade.ts` and `src/app/api/facades/quiz-attempt.facade.ts`
- [ ] T010 Define gate execution section (build/test/lint/swagger/manual) in `specs/006-stabilize-frontend-flows/quickstart.md`

**Checkpoint**: Foundation ready; user stories can proceed.

---

## Phase 3: User Story 1 - Complete Academy Learning Journey (Priority: P1) 🎯 MVP

**Goal**: Ensure deterministic lesson -> quiz -> completion/congrats flow with proper validation and duplicate-submit protection.

**Independent Test**: Learner can complete the full journey without dead ends; invalid quiz submission is blocked.

### Tests for User Story 1

- [ ] T011 [P] [US1] Add lesson-to-quiz navigation unit tests in `src/app/pages/academy/lesson-player/lesson-player.component.spec.ts`
- [ ] T012 [P] [US1] Add quiz completion guard tests (all answers required + in-flight lock) in `src/app/pages/academy/quiz/quiz.component.spec.ts`
- [ ] T013 [P] [US1] Add quiz-attempt service contract tests for completion payload validity in `src/app/core/services/quiz-attempts.service.spec.ts`

### Implementation for User Story 1

- [ ] T014 [US1] Stabilize lesson progression transitions in `src/app/pages/academy/lesson-player/lesson-player.component.ts`
- [ ] T015 [US1] Implement deterministic next-step resolution (quiz/review/completed) in `src/app/core/services/academy-progress.service.ts`
- [ ] T016 [US1] Enforce complete-answer validation before finish in `src/app/pages/academy/quiz/quiz.component.ts`
- [ ] T017 [US1] Prevent duplicate completion submissions in `src/app/pages/academy/quiz/quiz.component.ts` and `src/app/core/services/quiz-attempts.service.ts`
- [ ] T018 [US1] Ensure completion payload mapping matches contract in `src/app/api/facades/quiz-attempt.facade.ts` and `src/app/core/services/quiz-attempts.service.ts`
- [ ] T019 [US1] Align academy completion UI states and congrats rendering in `src/app/pages/academy/quiz/quiz.component.html` and `src/app/pages/academy/quiz/quiz.component.scss`
- [ ] T020 [US1] Add academy flow manual verification evidence in `specs/006-stabilize-frontend-flows/manual-test-report.md`

**Checkpoint**: Academy journey is independently functional and verifiable.

---

## Phase 4: User Story 2 - Reliable Profile Management with API Persistence (Priority: P1)

**Goal**: Profile loads accurately, saves via API, persists across reloads, and surfaces clear failures.

**Independent Test**: Edit + save + refresh keeps values; API validation errors show user-facing feedback.

### Tests for User Story 2

- [ ] T021 [P] [US2] Add profile load/save success and error tests in `src/app/pages/account/about/about.component.spec.ts`
- [ ] T022 [P] [US2] Add student profile service mapping tests for partial/null responses in `src/app/core/services/student-profile.service.spec.ts`
- [ ] T023 [P] [US2] Add student facade request-shape tests in `src/app/api/facades/student.facade.spec.ts`

### Implementation for User Story 2

- [ ] T024 [US2] Complete API-to-viewmodel mapping for editable profile fields in `src/app/core/services/student-profile.service.ts`
- [ ] T025 [US2] Ensure section save handlers preserve unsaved edits on failure in `src/app/pages/account/about/about.component.ts`
- [ ] T026 [US2] Align profile create/update routing through façade methods in `src/app/api/facades/student.facade.ts`
- [ ] T027 [US2] Update profile form components to bind validated error states in `src/app/pages/account/about/edit-main-information/edit-main-information.component.ts`, `src/app/pages/account/about/edit-personal-information/edit-personal-information.component.ts`, and `src/app/pages/account/about/edit-contact-information/edit-contact-information.component.ts`
- [ ] T028 [US2] Update profile UI feedback content and save-state rendering in `src/app/pages/account/about/about.component.html` and `src/app/pages/account/about/about.component.scss`
- [ ] T029 [US2] Add profile API persistence validation evidence in `specs/006-stabilize-frontend-flows/manual-test-report.md`

**Checkpoint**: Profile persistence works independently with robust error handling.

---

## Phase 5: User Story 4 - Global Tag Filtering on Ask Questions (Priority: P1)

**Goal**: Tag filtering returns all matching records across dataset and keeps pagination consistent with filtered totals.

**Independent Test**: A cross-page tag returns all matches; pagination and empty states are consistent after filter changes.

### Tests for User Story 4

- [ ] T030 [P] [US4] Add server-filtered query parameter tests in `src/app/core/services/qas.service.spec.ts`
- [ ] T031 [P] [US4] Add Ask QA component tests for page reset on tag change in `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.spec.ts`
- [ ] T032 [P] [US4] Add Ask QA component tests for empty-state/no-stale-results behavior in `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.spec.ts`

### Implementation for User Story 4

- [ ] T033 [US4] Implement global tag filtering via API request params (not page-local array filtering) in `src/app/core/services/qas.service.ts`
- [ ] T034 [US4] Refactor Ask QA filter lifecycle and pagination reset logic in `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.ts`
- [ ] T035 [US4] Ensure filtered pagination metadata drives UI controls in `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.ts` and `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.html`
- [ ] T036 [US4] Improve loading/empty/error presentation for filtered results in `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.html` and `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.scss`
- [ ] T037 [US4] Validate tags source and all-categories handling consistency in `src/app/core/services/tags.service.ts` and `src/app/pages/ask-and-contact/ask-Q&A/ask-qa.component.ts`
- [ ] T038 [US4] Add Ask Questions filtering validation evidence in `specs/006-stabilize-frontend-flows/manual-test-report.md`

**Checkpoint**: Global tag filtering and filtered pagination are independently functional.

---

## Phase 6: User Story 3 - Home Page Section Suppression for Targeted UI (Priority: P2)

**Goal**: Hide “How can we best serve you?” section and remove `home-serve__icon` from rendered output.

**Independent Test**: Section is not visible and icon element is absent in DOM across viewport checks.

### Tests for User Story 3

- [ ] T039 [P] [US3] Add Home template suppression test for target section in `src/app/pages/home/home.spec.ts`
- [ ] T040 [P] [US3] Add Home template test ensuring `home-serve__icon` is absent in `src/app/pages/home/home.spec.ts`

### Implementation for User Story 3

- [ ] T041 [US3] Remove/suppress serve section and icon markup in `src/app/pages/home/home.html`
- [ ] T042 [US3] Clean up related styles and ensure no layout regressions in `src/app/pages/home/home.scss`
- [ ] T043 [US3] Remove obsolete bindings (if any) tied to suppressed section in `src/app/pages/home/home.ts`
- [ ] T044 [US3] Add Home suppression/icon-removal validation evidence in `specs/006-stabilize-frontend-flows/manual-test-report.md`

**Checkpoint**: Home suppression requirement is independently functional.

---

## Phase 7: Polish & Cross-Cutting Verification

**Purpose**: Final validation, contracts, and traceable sign-off evidence.

- [ ] T045 [P] Run and capture `npm run build` output in `specs/006-stabilize-frontend-flows/validation-evidence.md`
- [ ] T046 [P] Run and capture `npm run test` output in `specs/006-stabilize-frontend-flows/validation-evidence.md`
- [ ] T047 [P] Run and capture `npm run lint` output in `specs/006-stabilize-frontend-flows/validation-evidence.md`
- [ ] T048 [P] Run and capture `npm run swagger:check` output in `specs/006-stabilize-frontend-flows/validation-evidence.md`
- [ ] T049 Execute full quickstart validation pass and summarize outcomes in `specs/006-stabilize-frontend-flows/manual-test-report.md`
- [ ] T050 Finalize implementation summary + gate checklist in `specs/006-stabilize-frontend-flows/validation-evidence.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: no dependencies.
- **Phase 2 (Foundational)**: depends on Phase 1; blocks all user stories.
- **Phases 3, 4, 5, 6 (User Stories)**: all depend on Phase 2.
- **Phase 7 (Polish)**: depends on completion of all targeted user stories.

### User Story Dependencies

- **US1 (Academy, P1)**: starts after Foundation; no story dependency.
- **US2 (Profile, P1)**: starts after Foundation; no story dependency.
- **US4 (Ask Questions, P1)**: starts after Foundation; no story dependency.
- **US3 (Home, P2)**: starts after Foundation; independent of US1/US2/US4.

### Recommended Completion Order

1. US1 (MVP journey confidence)
2. US2 (profile persistence)
3. US4 (global filtering correctness)
4. US3 (targeted UI suppression)

### Intra-Story Ordering Rule

- Story tests first (TDD-style where practical)
- Core logic/services
- Component/template wiring
- Manual evidence task for that story

---

## Parallel Execution Examples

### US1 Parallel Block

- Run in parallel: T011, T012, T013 (test authoring)
- Then parallelizable implementation subset: T015 and T019 after T014

### US2 Parallel Block

- Run in parallel: T021, T022, T023
- Then parallelizable implementation subset: T026 and T028 after T024/T025

### US4 Parallel Block

- Run in parallel: T030, T031, T032
- Then parallelizable implementation subset: T035 and T036 after T033/T034

### Global Verification Parallel Block

- Run in parallel: T045, T046, T047, T048
- Then run T049 and T050 sequentially.

---

## Implementation Strategy

### MVP First

1. Finish Phase 1 + Phase 2.
2. Deliver US1 completely (Phase 3).
3. Validate US1 independently before adding more scope.

### Incremental Delivery

1. Add US2, validate and capture evidence.
2. Add US4, validate filtered dataset correctness across pages.
3. Add US3, validate targeted Home suppression.
4. Execute full Phase 7 gates and finalize artifacts.

### Team Parallel Strategy

After Foundation:

- Engineer A: US1
- Engineer B: US2
- Engineer C: US4
- Engineer D: US3 (shorter track), then assists Phase 7.

---

## Notes

- All tasks strictly follow checklist format: `- [ ] T### [P?] [US#?] Description with file path`.
- No component-level HTTP calls are permitted.
- Keep generated OpenAPI files untouched.
- Use immutable state updates for filters/pagination/quiz/profile state.
