# API Contracts — 006 Stabilize Frontend Flows

## Scope

This feature consumes existing backend APIs and does not introduce new endpoints.

## 1) Quiz Attempts

### Endpoint

- `POST /api/QuizAttempts`
- `PUT /api/QuizAttempts/complete/{attemptId}`

### Request contract (complete)

- Body: `CompleteQuizAttemptCommand`
  - `answers: QuizAnswerDto[]`
    - `questionId: string`
    - `selectedOptionId: string`

### Contract expectations

- Completion should only be attempted when answers include all required questions.
- Duplicate completion calls should be guarded client-side.

## 2) Student Profile

### Endpoint

- `GET /api/StudentProfiles/me`
- `POST /api/StudentProfiles/me`
- `PUT /api/StudentProfiles/me`
- `POST /api/StudentProfiles/picture` (optional in this scope)

### Request contract (update/create)

- Body shape: `CreateStudentProfileRequest` / `UpdateStudentProfileRequest`
- Fields include: `firstName`, `lastName`, `bio`, `gender`, `dateOfBirth`, `oldReligion`, `reasonForConversion`, `address`, `country`, `phoneNumber`, etc.

### Contract expectations

- Partial API responses must be mapped safely without destructive UI resets.
- Validation/server/network errors must propagate as user-readable messages.

## 3) Ask Questions and Tags

### Endpoint

- `GET /api/QAs?pageNumber={n}&pageSize={m}&tags={tagName}`
- `GET /api/Tags?pageNumber={n}&pageSize={m}`

### Contract expectations

- `tags` query parameter drives server-side filtering scope.
- Response metadata (`totalPages`, `totalCount` either root or nested under `data`) must drive pagination UI state.
- Empty filter responses must return empty datasets without stale page cache bleed.

## Verification hooks

- `npm run swagger:check`
- Postman collection: AskAMuslimBackend API requests for the above endpoints
