# Endpoint Mapping Matrix (Runtime Integration)

## Routing → Service → API Layer

| Feature Route | Primary UI Entry | Service Layer | API Access Path |
|---|---|---|---|
| `/login`, `/register`, `/reset-password` | Auth components in `src/app/core/auth/*` | `AuthService`, `TokenService` | `IdentityFacade` (generated functions) + legacy social/refresh fallback paths |
| `/academy` | `AcademyComponent` and sub-pages | `AcademyProgressService`, `CoursesService`, `LessonsService`, `QuizzesService`, `QuestionsService`, `EnrollmentsService`, `StudentsService` | Mostly facade-based (`CourseFacade`, `LessonFacade`, `QuizFacade`, `QuestionFacade`, `EnrollmentFacade`, `StudentFacade`, `ProgressFacade`) |
| `/events` | `EventsComponent`, `EventDetailComponent` | `EventsService`, `EventRegistrationsService` | Legacy `ApiService` + `API_ENDPOINTS` constants |
| `/ask-and-contact/*` | Ask Q&A, Meet Scholar, Send Inquiry | `QasService`, `InquiryRequestsService`, `MeetingRequestsService` | Legacy `ApiService` + `API_ENDPOINTS` constants |
| `/muslim-tube/*` | Channels/Videos pages | `MuslimTubeService` | Legacy `ApiService` + `API_ENDPOINTS` constants |
| `/account` | `AccountComponent` | `AuthService` + profile services | Mixed: facades + legacy constants |

## API Ownership by Service Pattern

### A) Generated/Façade-backed services
- `auth.service.ts` (partially via `IdentityFacade`)
- `students.service.ts`
- `courses.service.ts`
- `enrollments.service.ts`
- `instructors.service.ts`
- `lessons.service.ts`
- `quizzes.service.ts`
- `questions.service.ts`
- `academy-progress.service.ts`

### B) Legacy constant-backed services (`ApiService`)
- `events.service.ts`
- `event-registrations.service.ts`
- `inquiry-requests.service.ts`
- `meeting-requests.service.ts`
- `muslim-tube.service.ts`
- `notifications.service.ts`
- `preachers.service.ts`
- `levels.service.ts`
- `qas.service.ts`
- `quiz-attempts.service.ts`
- `student-notes.service.ts`
- `student-questions.service.ts`
- `admins.service.ts`
- `admin-notes.service.ts`
- (plus social auth calls inside `auth.service.ts`)

## Integration Risk Tags
- **Low risk:** facade-backed domains where generated contracts are already the source of truth.
- **Medium risk:** legacy domains now made host-safe via `ApiService` URL normalization, but still contract-drift prone.
- **High risk:** auth refresh contract until backend publishes/standardizes refresh endpoint in OpenAPI.
