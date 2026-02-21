# PROJECT ARCHITECTURE

## Tech Stack

| Layer                    | Technology                                      | Version |
| ------------------------ | ----------------------------------------------- | ------- |
| **Frontend**             | Angular with Signals, Zoneless change detection | 19+     |
| **Backend**              | .NET WebAPI                                     | 8       |
| **Database**             | SQL Server                                      | -       |
| **API Documentation**    | Swagger/OpenAPI                                 | v1      |
| **Authentication**       | JWT Bearer tokens                               | -       |
| **Architecture Pattern** | Facade pattern for API calls                    | -       |

## Context Layers

### Rules

- **Primary Instructions:** [`.github/instructions/AAM Instructions.instructions.md`](../.github/instructions/AAM%20Instructions.instructions.md)
- **Execution Rules:** Strict TypeScript, no `any` types, feature-first domain-driven design
- **Quality Standards:** Zero tolerance for mistakes, standalone components only

### API Layer

- **Generated API Client:** [`src/app/api/`](../src/app/api/) - Auto-generated from Swagger
- **API Configuration:** [`src/app/api/api-configuration.ts`](../src/app/api/api-configuration.ts)
- **Models/DTOs:** [`src/app/api/models/`](../src/app/api/models/) - Generated DTOs from backend
- **Function Modules:** [`src/app/api/fn/`](../src/app/api/fn/) - Endpoint-specific service functions

### Facades (Wrapper Services)

- **Location:** [`src/app/api/facades/`](../src/app/api/facades/)
- **Purpose:** Wrap generated API services with domain-specific methods
- **Available Facades:**
  - [`course.facade.ts`](../src/app/api/facades/course.facade.ts) - Course operations
  - [`enrollment.facade.ts`](../src/app/api/facades/enrollment.facade.ts) - Enrollment management
  - [`identity.facade.ts`](../src/app/api/facades/identity.facade.ts) - Authentication operations
  - [`instructor.facade.ts`](../src/app/api/facades/instructor.facade.ts) - Instructor profiles
  - [`lesson.facade.ts`](../src/app/api/facades/lesson.facade.ts) - Lesson operations
  - [`progress.facade.ts`](../src/app/api/facades/progress.facade.ts) - Progress tracking
  - [`question.facade.ts`](../src/app/api/facades/question.facade.ts) - Question management
  - [`quiz.facade.ts`](../src/app/api/facades/quiz.facade.ts) - Quiz operations
  - [`student.facade.ts`](../src/app/api/facades/student.facade.ts) - Student profiles

### Core Services

- **Location:** [`src/app/core/services/`](../src/app/core/services/)
- **Purpose:** Application-wide services (auth interceptors, state management)

## API Endpoints

### Base URLs

| Environment     | URL                                 |
| --------------- | ----------------------------------- |
| **Production**  | `https://aam-api.ask-a-muslim.com`  |
| **Development** | `https://aam-api.ask-a-muslim.com`  |
| **Local Proxy** | `/api` (configured in angular.json) |

### Endpoint Categories

| Category       | Base Path                                   | Facade            |
| -------------- | ------------------------------------------- | ----------------- |
| Authentication | `/api/Authentication/*`                     | IdentityFacade    |
| Courses        | `/api/Courses/*`                            | CourseFacade      |
| Lessons        | `/api/Lessons/*`                            | LessonFacade      |
| Enrollments    | `/api/Enrollments/*`                        | EnrollmentFacade  |
| Students       | `/api/Students/*`, `/api/StudentProfiles/*` | StudentFacade     |
| Events         | `/api/Events/*`                             | EventService      |
| Muslim Tube    | `/api/MuslimTube/*`                         | (Not implemented) |
| Progress       | `/api/Progress/*`                           | ProgressFacade    |

## Source of Truth

- **API Contracts:** [`ai/api-contracts.md`](api-contracts.md)
- **Current Task:** [`ai/current-task.md`](current-task.md)
- **Audit Report:** [`docs/API_INTEGRATION_AUDIT_REPORT_2026-02-21.md`](../docs/API_INTEGRATION_AUDIT_REPORT_2026-02-21.md)
- **Swagger Spec:** [`swagger.json`](../swagger.json) or [`backend_swagger.json`](../backend_swagger.json)

## Integration Status

| Module           | Status       | Notes                             |
| ---------------- | ------------ | --------------------------------- |
| Authentication   | ✅ Working   | Login, forgot-password functional |
| Courses          | ✅ Working   | List, detail, CRUD operations     |
| Lessons          | ⚠️ Partial   | Progress endpoint mismatch        |
| Enrollments      | ❌ Issues    | GET returns 405                   |
| Student Profiles | ✅ Working   | Profile CRUD functional           |
| Events           | ✅ Working   | List and detail functional        |
| Muslim Tube      | ❌ Mock Data | No backend integration            |
| Progress         | ❌ Issues    | Path mismatch with backend        |

## Critical Issues

1. **Lesson Progress:** Frontend expects `/api/Lessons/{id}/progress`, backend uses `/api/Progress/`
2. **Enrollments GET:** Returns 405 Method Not Allowed
3. **Muslim Tube:** All components use hardcoded mock data
4. **Meeting Requests:** POST returns 400 with no actionable error message

See [`docs/API_INTEGRATION_AUDIT_REPORT_2026-02-21.md`](../docs/API_INTEGRATION_AUDIT_REPORT_2026-02-21.md) for complete details.
