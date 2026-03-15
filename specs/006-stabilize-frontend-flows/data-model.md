# Phase 1 Data Model — 006 Stabilize Frontend Flows

## 1) AcademyJourneyState

Represents runtime progression across lesson, quiz, and completion states.

### Fields

- `courseId: string`
- `lessonId: string`
- `currentStep: 'lesson' | 'quiz' | 'review' | 'completed'`
- `activeAttemptId: string | null`
- `isFinishingQuiz: boolean`
- `timeRemaining: number`
- `allQuestionsAnswered: boolean`

### Relationships

- 1:1 with currently active `QuizAttempt` when user is in quiz step.
- Derives lesson metadata from `AcademyProgressService` (`AcademyCourse`, `AcademyLesson`).

### Validation / Invariants

- Completion submission only allowed when `allQuestionsAnswered === true`.
- `isFinishingQuiz` prevents duplicate finish calls.

### State transitions

- `lesson -> quiz` when lesson flow reaches quiz entrypoint.
- `quiz -> review` after successful finish logic.
- `review -> completed` when passing criteria met (`hasPassed`).

---

## 2) QuizAttempt

Represents backend-facing quiz attempt lifecycle payload.

### Fields

- `attemptId: string`
- `quizId: string`
- `studentId: string`
- `answers: QuizAnswerDto[]`
- `completedAt?: string`

### Relationships

- Many `QuizAnswerDto` entries per attempt.
- API contract owner: `QuizAttemptFacade` / `/api/QuizAttempts`.

### Validation / Invariants

- `answers.length` should equal number of quiz questions for completion request.
- `attemptId` must be non-empty before complete request.

---

## 3) UserProfile

Represents persisted student profile used by account/about UI.

### Fields (API-facing)

- `firstName?: string`
- `lastName?: string`
- `email?: string`
- `bio?: string`
- `gender?: string`
- `dateOfBirth?: string`
- `oldReligion?: string`
- `reasonForConversion?: string`
- `address?: string`
- `country?: string`
- `phoneNumber?: string`
- `imageUrl?: string`

### Relationships

- Source: `StudentProfileService` (`/api/StudentProfiles/me`).
- Mapped to `AboutModel` for UI editing sections.

### Validation / Invariants

- Field mapping must not silently erase previously loaded values on partial responses.
- Save errors must not clear unsaved edits unexpectedly.

---

## 4) HomeServeSectionVisibility

Represents suppression/removal state for Home serve section.

### Fields

- `isRendered: boolean`
- `iconRendered: boolean`

### Validation / Invariants

- Requirement target state: `isRendered = false`, `iconRendered = false`.

---

## 5) QuestionTagFilterContext

Represents Ask Questions global tag filtering and paging state.

### Fields

- `selectedTag: string | null`
- `pageNumber: number`
- `pageSize: number`
- `totalPages: number`
- `totalCount: number`
- `results: QuestionCard[]`
- `isSearching: boolean`

### Relationships

- Data source: `QasService.getAll({ pageNumber, pageSize, tags })` + `TagsService.getAll(...)`.

### Validation / Invariants

- On tag change, `pageNumber` resets to 1.
- Pagination operates over filtered dataset totals, not stale unfiltered counts.
- Empty filter result must display empty state and no stale records.

---

## 6) ValidationEvidenceRecord

Captures verification output required for sign-off.

### Fields

- `buildPassed: boolean`
- `testPassed: boolean`
- `lintPassed: boolean`
- `swaggerCheckPassed: boolean`
- `academyFlowEvidence: string[]`
- `profileEvidence: string[]`
- `homeEvidence: string[]`
- `askQaEvidence: string[]`

### Validation / Invariants

- All required command gates must pass before completion.
- Manual/API evidence must include at least one trace per scoped area.
