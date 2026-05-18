# Academy Page Documentation

This document describes the architecture, API integration, data models, and verification steps for the **Academy** section of the AskAMuslim Angular application. It reflects the current implementation state as of March 9, 2026.

---

## Table of Contents

1. [Overview](#overview)
2. [Directory Structure](#directory-structure)
3. [Core Components](#core-components)
4. [Service & Facade Layer](#service--facade-layer)
5. [Data Models (DTOs & Interfaces)](#data-models-dtos--interfaces)
6. [API Endpoints](#api-endpoints)
7. [Data Seeding](#data-seeding)
8. [Integration & Verification](#integration--verification)
9. [End-to-End User Journey](#end-to-end-user-journey)
10. [Known Gaps & Future Work](#known-gaps--future-work)

---

## Overview

The Academy section delivers a structured learning experience organized into stages (levels), courses, lessons, and quizzes. It consumes a RESTful backend and relies on generated OpenAPI facades for type safety. The frontend implements a service-oriented architecture with the `AcademyProgressService` as the orchestration hub.

The documentation covers:

- how components are arranged
- how data is fetched and cached
- how to seed realistic test data
- how to verify API contracts using Postman and Chrome DevTools

## Directory Structure

```
src/app/pages/academy/
├── academy.component.ts
├── academy.component.html
├── academy.component.scss
├── course-tree/
│   └── course-tree.component.ts
├── lesson-player/
│   ├── lesson-player.component.ts
│   ├── lesson-player.component.html
│   └── lesson-player.component.scss
├── quiz/
│   ├── quiz.component.ts
│   ├── quiz.component.html
│   └── quiz.component.scss
└── shared/
    └── academy-page-shell/
        ├── academy-page-shell.component.ts
        └── academy-page-shell.component.html
```

The page uses standalone components and OnPush change detection across the board.

## Core Components

- **AcademyComponent**: landing page that lists stages and courses. Uses `AcademyProgressService` to load data.
- **LessonPlayerComponent**: renders lessons of type intro, video, audio, or article. Handles navigation and notes.
- **QuizComponent**: executes quizzes; includes intro, question flow, review, and results states.
- **AcademyPageShellComponent**: shared wrapper providing breadcrumbs, header, banner, and navigation.
- **CourseTreeComponent**: sidebar showing all lessons within a course.

All visual elements are responsive and designed to work with the token-based container system.

## Service & Facade Layer

All API access occurs through **facades generated from OpenAPI** (`src/app/api/facades`). Domain services wrap these facades and add additional business logic.

### Key Services

- `AcademyProgressService`: orchestrator; caches stages, courses, lessons; computes progress.
- `LessonsService`, `QuizzesService`, `QuestionsService`, `OptionsService`, `EnrollmentsService`: thin wrappers around corresponding facades.
- `QuizAttemptsService`: legacy manual API service for tracking quiz attempts.

### Facades (selected)

- `LessonFacade` - lesson CRUD + notes
- `QuizFacade` - quiz CRUD & filtering
- `QuestionFacade`, `OptionFacade` - question/option management
- `CourseFacade`, `LevelFacade` - courses & stages
- `EnrollmentFacade` - student enrollments

Facades return strongly typed DTOs imported from `src/app/api/models`.

## Data Models (DTOs & Interfaces)

Key TypeScript definitions used by the page:

```ts
// LessonReadDto (from generated API model)
interface LessonReadDto {
  id?: string;
  courseId?: string;
  title?: string;
  description?: string;
  content?: string;
  type?: number; // 0=Intro,1=Video,2=Audio,3=Article
  videoUrl?: string;
  externalVideoUrl?: string;
  thumbnailUrl?: string;
  order?: number;
}
```

Additional client-side interfaces:

```ts
// lesson-content.model.ts
type LessonContent = IntroLessonContent | VideoLessonContent | AudioLessonContent | ArticleLessonContent;

// student-progress.model.ts (AcademyProgressService uses these)
interface StudentProgress { ... }
interface CourseProgress { ... }
interface LessonProgress { ... }
```

### Quiz-related

```ts
interface QuizReadDto { ... }
interface QuestionReadDto { ... }
interface OptionReadDto { ... }
```

Quiz attempt commands are handled manually and are not yet part of the generated schema.

## API Endpoints

The OpenAPI-backed endpoints used by the academy page:

| Resource         | Common Methods                                                        | Notes                                          |
| ---------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| **Levels**       | GET /api/Levels                                                       | returned as Stage                              |
| **Courses**      | GET /api/Courses?LevelId=<>&IsPublished=true                          | roadmaps, filtering                            |
| **Lessons**      | GET /api/Lessons?CourseId=<>, POST/PUT/DELETE                         | includes notes endpoints                       |
| **Quizzes**      | GET /api/Quizzes (with filters), POST/PUT/DELETE                      | `targetType` distinguishes lesson/course/level |
| **Questions**    | GET /api/Questions?QuizId=<>, CRUD                                    |
| **Options**      | GET /api/Options/by-question/{id}                                     |
| **Enrollments**  | GET/POST/DELETE under /api/Enrollments                                |
| **QuizAttempts** | legacy endpoints (not generated): /api/QuizAttempts/by-quiz/{id} etc. |

Refer to the Postman collection `AskAMuslimBackend_API_collection.json` for request/response examples.

## Data Seeding

There is no admin UI; data must be created via API (Postman or backend migrations).

### Minimal realistic dataset

1. **Levels**: create 3 stages using `POST /api/Levels`
2. **Courses**: create 10 courses distributed across stages
3. **Lessons**: create 50+ lessons (5‑8 per course) with varied types
4. **Quizzes**: create at least 5 quizzes,
   - 2 lesson quizzes, 2 course quizzes, 1 level quiz
5. **Questions & Options**: for each quiz add 5‑10 multiple‑choice questions

Payload templates appear in the improved prompt attached earlier; adapt as necessary.

Static fallback data is defined in `src/app/core/services/academy-data.ts`.

## Integration & Verification

Verification is performed with **Postman MCP** and **Chrome DevTools MCP**.

### Contract Validation

- Use Postman to call each endpoint and ensure the response matches the expected DTO.
- Inspect responses in DevTools Network tab when running the app.
- Document any schema mismatches as blockers.

### Component Checks

- Academy page loads all levels and courses correctly.
- Lesson player displays each lesson type with correct media/sections.
- Quiz component cycles through intro→questions→results; network traffic logs attempts and completion.
- Breadcrumbs and banners in `AcademyPageShell` update appropriately.

Screen capture or manual visual inspection for each view confirms appearance.

## End-to-End User Journey

Typical scenario to exercise the page:

1. Visit `/academy`, select Stage 1
2. Enter a course, open first lesson, watch/read/complete
3. Add a note and verify database entry
4. Navigate lessons sequentially
5. Start and complete the course quiz
6. Review results and verify quiz attempt persisted

Network tab should show all API calls succeeded with 200/201 responses.

## Known Gaps & Future Work

- **QuizAttempts API** isn’t in OpenAPI spec; include and regenerate facades
- **Progress endpoints** are empty; backend implementation required for real progress tracking
- **Automatic enrollment** UI is not yet available
- **Admin panel** for content management is missing
- **Certificate generation** and **quiz evaluation** facades exist but are unused

Adding these will complete the backend/frontend contract and allow richer student experiences.

---

This documentation should serve as the canonical reference for developers working on the Academy feature. It can be extended as new capabilities are added. For quick recollection, a checklist of integration steps is included in the earlier prompt for hands-on work (see specialized prompt above).

Feel free to link this file from other docs or the README.
