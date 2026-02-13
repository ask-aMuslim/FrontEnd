# Backend API Requirements Document

**Project:** AskAMuslim  
**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** Production Requirements  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current API Usage Overview](#2-current-api-usage-overview)
3. [Required Endpoints](#3-required-endpoints)
4. [Required Data Model Definitions](#4-required-data-model-definitions)
5. [Required Validation Rules](#5-required-validation-rules)
6. [Required Error Response Standardization](#6-required-error-response-standardization)
7. [Required Authentication & Authorization Rules](#7-required-authentication--authorization-rules)
8. [Required Pagination / Filtering / Sorting Contracts](#8-required-pagination--filtering--sorting-contracts)
9. [File Handling Requirements](#9-file-handling-requirements)
10. [Identified Inconsistencies or Risks](#10-identified-inconsistencies-or-risks)
11. [Recommended Backend Improvements](#11-recommended-backend-improvements)

---

## 1. Executive Summary

### 1.1 Project Overview

AskAMuslim is an Islamic educational platform providing:
- **Academy Module**: Courses, lessons, quizzes, progress tracking, certificates
- **MuslimTube Module**: Video channels and content
- **Q&A Module**: Question and answer system with translations
- **Islamic Tools**: Prayer times, Qibla direction

### 1.2 API Statistics

| Metric | Count |
|--------|-------|
| Total Endpoints | 73 |
| Controllers | 15 |
| Generated DTOs | 22 |
| File Upload Endpoints | 4 |
| Auth-Required Endpoints | 73 (100%) |

### 1.3 Critical Issues Requiring Immediate Attention

| Severity | Issue | Impact | Priority |
|----------|-------|--------|----------|
| **CRITICAL** | Login endpoint returns `void` instead of token response | Frontend cannot authenticate users | P0 |
| **HIGH** | 25+ endpoints missing response schemas | Type safety broken, integration failures | P1 |
| **HIGH** | Missing DTOs: StudentReadDto, InstructorReadDto, EnrollmentReadDto | Frontend cannot type API responses | P1 |
| **MEDIUM** | Inconsistent naming conventions (PascalCase vs camelCase) | Integration confusion | P2 |
| **MEDIUM** | No pagination on list endpoints | Performance degradation with large datasets | P2 |
| **LOW** | Missing rate limiting headers | Potential abuse | P3 |

---

## 2. Current API Usage Overview

### 2.1 Endpoint Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                    AskAMuslim API Architecture                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Identity   │  │    Course    │  │   Enrollment │          │
│  │  Controller  │  │  Controller  │  │  Controller  │          │
│  │  9 endpoints │  │  8 endpoints │  │  6 endpoints │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Lesson    │  │    Quiz      │  │   Question   │          │
│  │  Controller  │  │  Controller  │  │  Controller  │          │
│  │  6 endpoints │  │  5 endpoints │  │  10 endpoints│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Student    │  │  Instructor  │  │   Progress   │          │
│  │  Controller  │  │  Controller  │  │  Controller  │          │
│  │  3 endpoints │  │  3 endpoints │  │  8 endpoints │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Answer     │  │   Option     │  │  Certificate │          │
│  │  Controller  │  │  Controller  │  │  Controller  │          │
│  │  6 endpoints │  │  5 endpoints │  │  4 endpoints │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │ PrayerTimes  │  │    Qibla     │                             │
│  │  Controller  │  │  Controller  │                             │
│  │  2 endpoints │  │  1 endpoint  │                             │
│  └──────────────┘  └──────────────┘                             │
│                                                                  │
│  ┌──────────────┐                                                │
│  │QuizEvaluation│                                                │
│  │  Controller  │                                                │
│  │  2 endpoints │                                                │
│  └──────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Identity   │────▶│    JWT      │
│  Frontend   │     │   API       │     │   Token     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │     │  Register   │     │   Bearer    │
│   Request   │     │   Request   │     │   Auth      │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Current JWT Token Structure:**
```json
{
  "sub": "028083f6-4241-47f4-ac52-5173cf8e1a66",
  "unique_name": "vMj8zZuWBkbkG",
  "email": "vMj8zZuWBkbkG@gCWH.bb",
  "jti": "e580584e-acfd-4a7f-9804-2942d9bbe632",
  "nbf": 1770840828,
  "exp": 1776024828,
  "iat": 1770840828,
  "iss": "TemplateAPI",
  "aud": "TemplateUsers"
}
```

### 2.3 Base URL

```
Production: https://ask-a-muslim.runasp.net
```

---

## 3. Required Endpoints

### 3.1 Identity Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| POST | `/api/Identity/Register/register` | Register new user | `RegisterRequest` (multipart/form-data) | `AuthResponse` | 200, 400 | No |
| POST | `/api/Identity/Login/login` | Authenticate user | `LoginViewModel` | `AuthResponse` | 200, 400, 401 | No |
| POST | `/api/Identity/Logout/logout` | Logout user | None | `void` | 200, 204, 401 | Yes |
| GET | `/api/Identity/GetAllUsers/Users` | Get all users | None | `UserReadDTO[]` | 200, 401, 403 | Admin |
| GET | `/api/Identity/GetUserById/Users/{id}` | Get user by ID | Path: `id` | `UserReadDTO` | 200, 404 | Yes |
| PUT | `/api/Identity/UpdateEmail/update-email` | Update email | `UpdateEmailDTO` | `void` | 200, 400, 403, 404 | Yes |
| PUT | `/api/Identity/UpdatePassword/update-password` | Update password | `UpdatePasswordDTO` | `void` | 200, 400, 403, 404 | Yes |
| PUT | `/api/Identity/UpdateName/update-name` | Update name | `UpdateNameDTO` | `void` | 200, 400, 403, 404 | Yes |
| DELETE | `/api/Identity/DeleteUser/delete-user/{id}` | Delete user | Path: `id` | `void` | 200, 400, 404 | Admin |

### 3.2 Course Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Course/GetCourses` | Get all courses | None | `CourseReadDTO[]` | 200 | Yes |
| GET | `/api/Course/GetCourseById/{id}` | Get course by ID | Path: `id` | `CourseReadByIdDTO` | 200, 404 | Yes |
| GET | `/api/Course/GetCourseByCategoryName/ByName/{categoryName}` | Get courses by category | Path: `categoryName` | `CourseReadDTO[]` | 200 | Yes |
| GET | `/api/Course/GetCourseByLevelName/ByLevelName/{levelName}` | Get courses by level | Path: `levelName` | `CourseReadDTO[]` | 200 | Yes |
| GET | `/api/Course/GetInstructorCourses/{instructorId}` | Get instructor courses | Path: `instructorId` | `CourseReadDTO[]` | 200 | Yes |
| POST | `/api/Course/CreateCourse` | Create course | `CourseCreateDTO` (multipart/form-data) | `CourseReadByIdDTO` | 200, 400 | Instructor |
| PUT | `/api/Course/UpdateCourse/{id}` | Update course | Path: `id`, `CourseUpdateDTO` (multipart/form-data) | `void` | 200, 400, 404 | Instructor |
| DELETE | `/api/Course/DeleteCourse/{id}` | Delete course | Path: `id` | `void` | 200, 404 | Admin |

### 3.3 Lesson Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Lesson/GetAllLessons` | Get all lessons | None | `LessonReadDTO[]` | 200 | Yes |
| GET | `/api/Lesson/GetLessonByID/{id}` | Get lesson by ID | Path: `id` | `LessonReadDTO` | 200, 404 | Yes |
| GET | `/api/Lesson/GetCourseLessons/{courseId}` | Get course lessons | Path: `courseId` | `LessonReadDTO[]` | 200 | Yes |
| POST | `/api/Lesson/CreateLesson` | Create lesson | Query + multipart/form-data | `LessonReadDTO` | 200, 400 | Instructor |
| PUT | `/api/Lesson/UpdateLesson/{id}` | Update lesson | Path: `id`, Query + multipart/form-data | `void` | 200, 400, 404 | Instructor |
| DELETE | `/api/Lesson/DeleteLesson/{id}` | Delete lesson | Path: `id` | `void` | 200, 404 | Instructor |

### 3.4 Enrollment Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Enrollment/GetAllEnrollments` | Get all enrollments | None | `EnrollmentReadDTO[]` | 200 | Admin |
| GET | `/api/Enrollment/GetEnrollment` | Get enrollment | Query: `studentId`, `courseId` | `EnrollmentReadDTO` | 200, 404 | Yes |
| GET | `/api/Enrollment/GetEnrolledCoursesByStudent` | Get student courses | Query: `studentId` | `CourseReadDTO[]` | 200 | Yes |
| GET | `/api/Enrollment/GetStudentsEnrolledInCourse` | Get course students | Query: `courseId` | `StudentReadDTO[]` | 200 | Instructor |
| POST | `/api/Enrollment/Enroll` | Enroll student | `EnrollmentCreateDTO` | `EnrollmentReadDTO` | 200, 400 | Yes |
| DELETE | `/api/Enrollment/UnEnroll` | Unenroll student | Query: `studentId`, `courseId` | `void` | 200, 404 | Yes |

### 3.5 Quiz Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Quiz` | Get all quizzes | None | `QuizReadDTO[]` | 200 | Yes |
| GET | `/api/Quiz/{id}` | Get quiz by ID | Path: `id` | `QuizReadDTO` | 200, 404 | Yes |
| POST | `/api/Quiz` | Create quiz | `QuizCreateDTO` | `QuizReadDTO` | 200, 400 | Instructor |
| PUT | `/api/Quiz/{id}` | Update quiz | Path: `id`, multipart/form-data | `void` | 200, 400, 404 | Instructor |
| DELETE | `/api/Quiz/{id}` | Delete quiz | Path: `id` | `void` | 200, 404 | Instructor |

### 3.6 Question Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Question` | Get all questions | None | `QuestionReadDTO[]` | 200 | Yes |
| GET | `/api/Question/{id}` | Get question by ID | Path: `id` | `QuestionReadDTO` | 200, 404 | Yes |
| GET | `/api/Question/quiz/{quizId}` | Get quiz questions | Path: `quizId` | `QuestionReadDTO[]` | 200 | Yes |
| GET | `/api/Question/search` | Search questions | Query: `quizId`, `text`, `isCaseSensitive` | `QuestionReadDTO[]` | 200 | Yes |
| GET | `/api/Question/filter` | Filter questions | Query: `quizId`, `text`, `isCaseSensitive`, `minPoints`, `maxPoints` | `QuestionReadDTO[]` | 200 | Yes |
| POST | `/api/Question` | Create question | `QuestionCreateDTO` | `QuestionReadDTO` | 200, 400 | Instructor |
| PUT | `/api/Question/{id}` | Update question | Path: `id`, `QuestionUpdateDTO` | `void` | 200, 400, 404 | Instructor |
| DELETE | `/api/Question/{id}` | Delete question | Path: `id` | `void` | 200, 404 | Instructor |
| POST | `/api/Question/bulk-create` | Bulk create | `QuestionCreateDTO[]` | `QuestionReadDTO[]` | 200, 400 | Instructor |
| PUT | `/api/Question/bulk-update` | Bulk update | `QuestionBulkUpdateDTO[]` | `void` | 200, 400 | Instructor |
| DELETE | `/api/Question/bulk-delete` | Bulk delete | `string[]` | `void` | 200, 400 | Instructor |

### 3.7 Answer Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Answer` | Get all answers | None | `AnswerReadDTO[]` | 200 | Yes |
| GET | `/api/Answer/{studentId}/{questionId}` | Get answer | Path: `studentId`, `questionId` | `AnswerReadDTO` | 200, 404 | Yes |
| POST | `/api/Answer` | Submit answer | `AnswerCreateDTO` | `AnswerReadDTO` | 200, 400 | Student |
| PUT | `/api/Answer/{studentId}/{questionId}` | Update answer | Path: `studentId`, `questionId`, `AnswerUpdateDTO` | `AnswerReadDTO` | 200, 400, 404 | Student |
| DELETE | `/api/Answer/{studentId}/{questionId}` | Delete answer | Path: `studentId`, `questionId` | `void` | 200, 404 | Student |

### 3.8 Option Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Option/{questionId}` | Get question options | Path: `questionId` | `OptionReadDTO[]` | 200 | Yes |
| GET | `/api/Option/option/{optionId}` | Get option by ID | Path: `optionId` | `OptionReadDTO` | 200, 404 | Yes |
| POST | `/api/Option/{questionId}` | Create option | Path: `questionId`, `OptionCreateDTO` | `OptionReadDTO` | 200, 400 | Instructor |
| PUT | `/api/Option/{optionId}` | Update option | Path: `optionId`, `OptionUpdateDTO` | `void` | 200, 400, 404 | Instructor |
| DELETE | `/api/Option/{optionId}` | Delete option | Path: `optionId` | `void` | 200, 404 | Instructor |
| DELETE | `/api/Option/question/{questionId}` | Delete all options | Path: `questionId` | `void` | 200, 404 | Instructor |

### 3.9 Progress Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Progress/GetAllProgresses` | Get all progress | None | `ProgressReadDTO[]` | 200 | Admin |
| GET | `/api/Progress/GetProgressById/{id}` | Get progress by ID | Path: `id` | `ProgressReadDTO` | 200, 404 | Yes |
| GET | `/api/Progress/GetProgressByStudentId/ByStudent/{studentId}` | Get student progress | Path: `studentId` | `ProgressReadDTO[]` | 200 | Yes |
| GET | `/api/Progress/GetProgressByCourseId/ByCourse/{courseId}` | Get course progress | Path: `courseId` | `ProgressReadDTO[]` | 200 | Instructor |
| POST | `/api/Progress/CreateProgress` | Create progress | `ProgressCreateDTO` | `ProgressReadDTO` | 200, 400 | Yes |
| PUT | `/api/Progress/UpdateProgress/{id}` | Update progress | Path: `id`, `ProgressUpdateDTO` | `void` | 200, 400, 404 | Yes |
| PUT | `/api/Progress/MarkProgressAsCompleted/MarkAsCompleted/{id}` | Mark completed | Path: `id` | `void` | 200, 404 | Yes |
| DELETE | `/api/Progress/DeleteProgress/{id}` | Delete progress | Path: `id` | `void` | 200, 404 | Admin |

### 3.10 Student Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Student` | Get all students | None | `StudentReadDTO[]` | 200, 404 | Admin |
| GET | `/api/Student/{id}` | Get student by ID | Path: `id` | `StudentReadDTO` | 200, 404 | Yes |
| GET | `/api/Student/GetAllCourses` | Get student courses | Query: `StudentId` | `CourseReadDTO[]` | 200, 400, 404 | Yes |

### 3.11 Instructor Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Instructor/GetAllInstructors` | Get all instructors | None | `InstructorReadDTO[]` | 200 | Yes |
| GET | `/api/Instructor/GetInstructorById/{id}` | Get instructor by ID | Path: `id` | `InstructorReadDTO` | 200, 404 | Yes |
| GET | `/api/Instructor/GetInstructorByCourseId/{id}/Instructor` | Get course instructor | Path: `id` | `InstructorReadDTO` | 200, 404 | Yes |

### 3.12 Certificate Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Certificate/GetCertificates` | Get all certificates | None | `CertificateReadDTO[]` | 200 | Admin |
| GET | `/api/Certificate/GetCertificateById` | Get certificate by ID | Query: `id` | `CertificateReadDTO` | 200, 404 | Yes |
| POST | `/api/Certificate/AutoGenerateCertificate` | Generate certificate | Query: `progressId` | `CertificateReadDTO` | 200, 400 | System |
| PUT | `/api/Certificate/UpdateCertificateRemarks` | Update remarks | Query: `id`, `remarks` | `void` | 200, 400, 404 | Admin |

### 3.13 QuizEvaluation Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| POST | `/api/QuizEvaluation/evaluate/{quizId}` | Evaluate quiz | Path: `quizId` | `QuizEvaluationResultDTO` | 200, 400 | Student |
| POST | `/api/QuizEvaluation/evaluate/{quizId}/student/{studentId}` | Evaluate for student | Path: `quizId`, `studentId` | `QuizEvaluationResultDTO` | 200, 400 | Instructor |

### 3.14 PrayerTimes Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/PrayerTimes` | Get prayer times | None | `PrayerTimesDTO` | 200 | No |
| GET | `/api/PrayerTimes/location` | Get by location | Query: `lat`, `lng` | `PrayerTimesDTO` | 200 | No |

### 3.15 Qibla Controller

| Method | Path | Purpose | Request Schema | Response Schema | Status Codes | Auth |
|--------|------|---------|----------------|-----------------|--------------|------|
| GET | `/api/Qibla/direction` | Get Qibla direction | Query: `lat`, `lng` | `QiblaDirectionDTO` | 200 | No |

---

## 4. Required Data Model Definitions

### 4.1 Authentication DTOs

#### LoginViewModel
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["email", "password"],
  "properties": {
    "email": {
      "type": "string",
      "format": "email",
      "minLength": 1,
      "description": "User email address"
    },
    "password": {
      "type": "string",
      "minLength": 1,
      "description": "User password"
    }
  },
  "additionalProperties": false
}
```

#### AuthResponse ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["accessToken", "tokenType"],
  "properties": {
    "accessToken": {
      "type": "string",
      "description": "JWT access token"
    },
    "refreshToken": {
      "type": "string",
      "description": "Refresh token for token renewal"
    },
    "tokenType": {
      "type": "string",
      "default": "Bearer",
      "description": "Token type"
    },
    "expiresIn": {
      "type": "integer",
      "description": "Token expiration time in seconds"
    },
    "userId": {
      "type": "string",
      "format": "uuid",
      "description": "Authenticated user ID"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "User email"
    },
    "roles": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "User roles"
    }
  },
  "additionalProperties": false
}
```

#### RegisterRequest (multipart/form-data)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["Email", "Password", "Role"],
  "properties": {
    "FirstName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "LastName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "Email": {
      "type": "string",
      "format": "email"
    },
    "Password": {
      "type": "string",
      "minLength": 6
    },
    "PhoneNumber": {
      "type": "string",
      "format": "tel"
    },
    "Role": {
      "type": "string",
      "enum": ["Student", "Instructor", "Admin"]
    },
    "ProfilePicture": {
      "type": "string",
      "format": "binary",
      "description": "Profile picture file upload"
    }
  }
}
```

### 4.2 Course DTOs

#### CourseReadDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "thumbnailUrl": {
      "type": "string",
      "format": "uri",
      "nullable": true
    },
    "category": {
      "$ref": "#/definitions/Category"
    },
    "level": {
      "$ref": "#/definitions/Level"
    },
    "instructorID": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "instructorName": {
      "type": "string",
      "nullable": true
    },
    "numberOfLessons": {
      "type": "integer",
      "format": "int32"
    },
    "numberOfStudentsEnrolled": {
      "type": "integer",
      "format": "int32"
    }
  },
  "definitions": {
    "Category": {
      "type": "string",
      "enum": [
        "Tafseer",
        "Hadith",
        "Fiqh",
        "Aqeeda",
        "Seerah",
        "QuranMemorization",
        "ArabicLanguage",
        "MannersAndEtiquette",
        "IslamicJurisprudence",
        "NewMuslimEssentials",
        "DuasAndSupplications",
        "IslamicEthics",
        "FamilyAndMarriage",
        "ContemporaryIssues",
        "BiographyOfProphets",
        "Quran",
        "Faith",
        "Other"
      ]
    },
    "Level": {
      "type": "string",
      "enum": ["Beginner", "Intermediate", "Advanced", "AllLevels"]
    }
  }
}
```

#### CourseReadByIdDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "thumbnailUrl": {
      "type": "string",
      "format": "uri",
      "nullable": true
    },
    "category": {
      "$ref": "#/definitions/Category"
    },
    "level": {
      "$ref": "#/definitions/Level"
    },
    "instructorID": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "instructorName": {
      "type": "string",
      "nullable": true
    },
    "lessons": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/LessonReadDTO"
      },
      "nullable": true
    },
    "numberOfLessons": {
      "type": "integer",
      "format": "int32"
    },
    "numberOfStudentsEnrolled": {
      "type": "integer",
      "format": "int32"
    }
  }
}
```

### 4.3 Lesson DTOs

#### LessonReadDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "title": {
      "type": "string"
    },
    "content": {
      "type": "string",
      "nullable": true
    },
    "thumbnailUrl": {
      "type": "string",
      "format": "uri",
      "nullable": true
    },
    "videoUrl": {
      "type": "string",
      "format": "uri",
      "nullable": true
    },
    "externalVideoUrl": {
      "type": "string",
      "format": "uri",
      "nullable": true
    },
    "courseId": {
      "type": "string",
      "format": "uuid"
    }
  }
}
```

### 4.4 Quiz DTOs

#### QuizCreateDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["title", "lessonId"],
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "lessonId": {
      "type": "string",
      "format": "uuid",
      "minLength": 1
    }
  }
}
```

#### QuizReadDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "title": {
      "type": "string"
    },
    "description": {
      "type": "string",
      "nullable": true
    },
    "totalQuestions": {
      "type": "integer",
      "format": "int32"
    },
    "totalMarks": {
      "type": "integer",
      "format": "int32"
    },
    "lessonId": {
      "type": "string",
      "format": "uuid"
    }
  }
}
```

### 4.5 Question DTOs

#### QuestionCreateDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["questionText", "marks", "quizId", "options"],
  "properties": {
    "questionText": {
      "type": "string",
      "minLength": 1
    },
    "marks": {
      "type": "integer",
      "format": "int32",
      "minimum": 1
    },
    "quizId": {
      "type": "string",
      "format": "uuid",
      "minLength": 1
    },
    "options": {
      "type": "array",
      "minItems": 2,
      "items": {
        "$ref": "#/definitions/OptionCreateDTO"
      }
    }
  }
}
```

#### QuestionReadDTO ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "questionText": {
      "type": "string"
    },
    "marks": {
      "type": "integer",
      "format": "int32"
    },
    "quizId": {
      "type": "string",
      "format": "uuid"
    },
    "options": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/OptionReadDTO"
      }
    }
  }
}
```

### 4.6 Option DTOs

#### OptionCreateDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["optionText", "isCorrect"],
  "properties": {
    "optionText": {
      "type": "string",
      "minLength": 1
    },
    "isCorrect": {
      "type": "boolean"
    }
  }
}
```

#### OptionReadDTO ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "optionText": {
      "type": "string"
    },
    "isCorrect": {
      "type": "boolean"
    },
    "questionId": {
      "type": "string",
      "format": "uuid"
    }
  }
}
```

### 4.7 Answer DTOs

#### AnswerCreateDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["studentId", "questionId", "selectedOptionId"],
  "properties": {
    "studentId": {
      "type": "string",
      "format": "uuid",
      "minLength": 1
    },
    "questionId": {
      "type": "string",
      "format": "uuid",
      "minLength": 1
    },
    "selectedOptionId": {
      "type": "string",
      "format": "uuid",
      "minLength": 1
    }
  }
}
```

#### AnswerReadDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "studentId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "questionId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "selectedOptionId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    }
  }
}
```

### 4.8 Progress DTOs

#### ProgressCreateDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "courseId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "studentId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "totalLessonsCompleted": {
      "type": "integer",
      "format": "int32",
      "minimum": 0
    },
    "completedProgress": {
      "type": "boolean"
    }
  }
}
```

#### ProgressReadDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "totalLessonsCompleted": {
      "type": "integer",
      "format": "int32"
    },
    "lessonCompletionRate": {
      "type": "number",
      "format": "double",
      "minimum": 0,
      "maximum": 100
    },
    "completedProgress": {
      "type": "boolean"
    },
    "lastUpdated": {
      "type": "string",
      "format": "date-time"
    },
    "isCompleted": {
      "type": "boolean"
    },
    "isCertified": {
      "type": "boolean"
    },
    "certificateNumber": {
      "type": "string",
      "nullable": true
    },
    "courseId": {
      "type": "string",
      "format": "uuid"
    }
  }
}
```

### 4.9 Enrollment DTOs

#### EnrollmentCreateDTO
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "studentId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    },
    "courseId": {
      "type": "string",
      "format": "uuid",
      "nullable": true
    }
  }
}
```

#### EnrollmentReadDTO ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "studentId": {
      "type": "string",
      "format": "uuid"
    },
    "courseId": {
      "type": "string",
      "format": "uuid"
    },
    "enrolledAt": {
      "type": "string",
      "format": "date-time"
    },
    "status": {
      "type": "integer",
      "enum": [1, 2, 3, 4],
      "description": "1=Active, 2=Completed, 3=Cancelled, 4=Paused"
    },
    "progress": {
      "type": "number",
      "format": "double",
      "minimum": 0,
      "maximum": 100
    }
  }
}
```

### 4.10 Student DTOs

#### StudentReadDTO ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    },
    "profilePictureUrl": {
      "type": "string",
      "format": "uri",
      "nullable": true
    },
    "enrolledCoursesCount": {
      "type": "integer",
      "format": "int32"
    },
    "completedCoursesCount": {
      "type": "integer",
      "format": "int32"
    },
    "certificatesCount": {
      "type": "integer",
      "format": "int32"
    }
  }
}
```

### 4.11 Instructor DTOs

#### InstructorReadDTO ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "userId": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    },
    "bio": {
      "type": "string",
      "nullable": true
    },
    "specialization": {
      "type": "string",
      "nullable": true
    },
    "profilePictureUrl": {
      "type": "string",
      "format": "uri",
      "nullable": true
    },
    "isVerified": {
      "type": "boolean"
    },
    "isActive": {
      "type": "boolean"
    },
    "joinedDate": {
      "type": "string",
      "format": "date-time"
    },
    "rating": {
      "type": "number",
      "format": "double",
      "minimum": 0,
      "maximum": 5
    },
    "totalReviews": {
      "type": "integer",
      "format": "int32"
    },
    "totalCourses": {
      "type": "integer",
      "format": "int32"
    },
    "totalStudents": {
      "type": "integer",
      "format": "int32"
    }
  }
}
```

### 4.12 Certificate DTOs

#### CertificateReadDTO ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "certificateNumber": {
      "type": "string"
    },
    "studentId": {
      "type": "string",
      "format": "uuid"
    },
    "studentName": {
      "type": "string"
    },
    "courseId": {
      "type": "string",
      "format": "uuid"
    },
    "courseTitle": {
      "type": "string"
    },
    "issuedAt": {
      "type": "string",
      "format": "date-time"
    },
    "remarks": {
      "type": "string",
      "nullable": true
    },
    "certificateUrl": {
      "type": "string",
      "format": "uri"
    }
  }
}
```

### 4.13 User DTOs

#### UserReadDTO ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "email": {
      "type": "string",
      "format": "email"
    },
    "firstName": {
      "type": "string"
    },
    "lastName": {
      "type": "string"
    },
    "phoneNumber": {
      "type": "string",
      "nullable": true
    },
    "profilePictureUrl": {
      "type": "string",
      "format": "uri",
      "nullable": true
    },
    "role": {
      "type": "string",
      "enum": ["Student", "Instructor", "Admin"]
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "lastLoginAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true
    },
    "isActive": {
      "type": "boolean"
    }
  }
}
```

### 4.14 Quiz Evaluation DTOs

#### QuizEvaluationResultDTO ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "quizId": {
      "type": "string",
      "format": "uuid"
    },
    "studentId": {
      "type": "string",
      "format": "uuid"
    },
    "totalQuestions": {
      "type": "integer",
      "format": "int32"
    },
    "correctAnswers": {
      "type": "integer",
      "format": "int32"
    },
    "wrongAnswers": {
      "type": "integer",
      "format": "int32"
    },
    "score": {
      "type": "number",
      "format": "double"
    },
    "percentage": {
      "type": "number",
      "format": "double",
      "minimum": 0,
      "maximum": 100
    },
    "passed": {
      "type": "boolean"
    },
    "passingScore": {
      "type": "number",
      "format": "double"
    },
    "evaluatedAt": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

### 4.15 Islamic Tools DTOs

#### PrayerTimesDTO ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "date": {
      "type": "string",
      "format": "date"
    },
    "location": {
      "type": "string"
    },
    "fajr": {
      "type": "string",
      "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
    },
    "sunrise": {
      "type": "string",
      "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
    },
    "dhuhr": {
      "type": "string",
      "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
    },
    "asr": {
      "type": "string",
      "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
    },
    "maghrib": {
      "type": "string",
      "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
    },
    "isha": {
      "type": "string",
      "pattern": "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
    }
  }
}
```

#### QiblaDirectionDTO ⚠️ REQUIRED - Currently Missing
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "latitude": {
      "type": "number",
      "format": "double"
    },
    "longitude": {
      "type": "number",
      "format": "double"
    },
    "qiblaDirection": {
      "type": "number",
      "format": "double",
      "description": "Direction in degrees from North"
    },
    "distanceToKaaba": {
      "type": "number",
      "format": "double",
      "description": "Distance in kilometers"
    }
  }
}
```

### 4.16 Enum Definitions

#### Category Enum
```json
{
  "enum": [
    "Tafseer",
    "Hadith",
    "Fiqh",
    "Aqeeda",
    "Seerah",
    "QuranMemorization",
    "ArabicLanguage",
    "MannersAndEtiquette",
    "IslamicJurisprudence",
    "NewMuslimEssentials",
    "DuasAndSupplications",
    "IslamicEthics",
    "FamilyAndMarriage",
    "ContemporaryIssues",
    "BiographyOfProphets",
    "Quran",
    "Faith",
    "Other"
  ]
}
```

#### Level Enum
```json
{
  "enum": ["Beginner", "Intermediate", "Advanced", "AllLevels"]
}
```

#### UserRole Enum
```json
{
  "enum": ["Student", "Instructor", "Admin"]
}
```

#### EnrollmentStatus Enum
```json
{
  "enum": [
    {"value": 1, "description": "Active"},
    {"value": 2, "description": "Completed"},
    {"value": 3, "description": "Cancelled"},
    {"value": 4, "description": "Paused"}
  ]
}
```

---

## 5. Required Validation Rules

### 5.1 Field-Level Validation

| Field | Type | Rules | Error Message |
|-------|------|-------|---------------|
| `email` | string | Required, valid email format, max 256 chars | "Invalid email format" |
| `password` | string | Required, min 6 chars, max 100 chars, must contain: uppercase, lowercase, number, special char | "Password must be at least 6 characters with uppercase, lowercase, number, and special character" |
| `firstName` | string | Required, min 1 char, max 100 chars | "First name is required" |
| `lastName` | string | Required, min 1 char, max 100 chars | "Last name is required" |
| `title` | string | Required, min 1 char, max 200 chars | "Title is required" |
| `description` | string | Optional, max 5000 chars | "Description exceeds maximum length" |
| `questionText` | string | Required, min 1 char, max 2000 chars | "Question text is required" |
| `marks` | integer | Required, min 1, max 100 | "Marks must be between 1 and 100" |
| `optionText` | string | Required, min 1 char, max 500 chars | "Option text is required" |
| `thumbnailUrl` | string | Optional, valid URL format, max 2048 chars | "Invalid thumbnail URL" |
| `videoUrl` | string | Optional, valid URL format, max 2048 chars | "Invalid video URL" |
| `phoneNumber` | string | Optional, valid phone format, max 20 chars | "Invalid phone number format" |

### 5.2 Business Rule Validation

| Rule | Description | HTTP Status | Error Code |
|------|-------------|-------------|------------|
| BR-001 | User cannot enroll in the same course twice | 400 | ENROLLMENT_DUPLICATE |
| BR-002 | Student cannot submit answer for question in unenrolled course | 403 | ACCESS_DENIED |
| BR-003 | Quiz must have at least 2 options per question | 400 | INVALID_QUIZ_OPTIONS |
| BR-004 | At least one option must be marked as correct | 400 | NO_CORRECT_OPTION |
| BR-005 | Progress cannot exceed 100% | 400 | INVALID_PROGRESS |
| BR-006 | Certificate can only be generated for completed courses | 400 | COURSE_NOT_COMPLETED |
| BR-007 | Instructor can only update their own courses | 403 | NOT_COURSE_OWNER |
| BR-008 | Student cannot delete another student's answer | 403 | NOT_ANSWER_OWNER |
| BR-009 | Email must be unique across all users | 400 | EMAIL_EXISTS |
| BR-010 | Password change requires old password verification | 400 | INVALID_OLD_PASSWORD |

### 5.3 File Upload Validation

| File Type | Max Size | Allowed Extensions | MIME Types |
|-----------|----------|-------------------|------------|
| Profile Picture | 5 MB | .jpg, .jpeg, .png, .webp | image/jpeg, image/png, image/webp |
| Course Thumbnail | 10 MB | .jpg, .jpeg, .png, .webp | image/jpeg, image/png, image/webp |
| Lesson Thumbnail | 10 MB | .jpg, .jpeg, .png, .webp | image/jpeg, image/png, image/webp |
| Lesson Video | 500 MB | .mp4, .webm, .mov | video/mp4, video/webm, video/quicktime |

---

## 6. Required Error Response Standardization

### 6.1 RFC 7807 ProblemDetails Format

All error responses MUST follow RFC 7807 ProblemDetails format:

```json
{
  "type": "https://ask-a-muslim.runasp.net/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "detail": "One or more validation errors occurred",
  "instance": "/api/Course/CreateCourse",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00",
  "errors": [
    {
      "field": "title",
      "message": "The title field is required"
    },
    {
      "field": "instructorId",
      "message": "Instructor not found"
    }
  ]
}
```

### 6.2 Status Code Mapping

| Status Code | Scenario | Title |
|-------------|----------|-------|
| 200 | Success | OK |
| 201 | Created | Created |
| 204 | No Content | No Content |
| 400 | Bad Request | Validation Failed |
| 401 | Unauthorized | Authentication Required |
| 403 | Forbidden | Access Denied |
| 404 | Not Found | Resource Not Found |
| 409 | Conflict | Resource Conflict |
| 422 | Unprocessable Entity | Business Rule Violation |
| 429 | Too Many Requests | Rate Limit Exceeded |
| 500 | Internal Server Error | Internal Server Error |
| 503 | Service Unavailable | Service Temporarily Unavailable |

### 6.3 Validation Error Format

```json
{
  "type": "https://ask-a-muslim.runasp.net/errors/validation",
  "title": "Validation Failed",
  "status": 400,
  "detail": "One or more validation errors occurred",
  "instance": "/api/Identity/Register/register",
  "errors": [
    {
      "field": "email",
      "code": "REQUIRED",
      "message": "Email is required"
    },
    {
      "field": "password",
      "code": "MIN_LENGTH",
      "message": "Password must be at least 6 characters",
      "constraint": 6
    },
    {
      "field": "role",
      "code": "INVALID_ENUM",
      "message": "Role must be one of: Student, Instructor, Admin"
    }
  ]
}
```

### 6.4 Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | General validation error |
| REQUIRED | 400 | Required field missing |
| MIN_LENGTH | 400 | String too short |
| MAX_LENGTH | 400 | String too long |
| INVALID_FORMAT | 400 | Invalid format (email, URL, etc.) |
| INVALID_ENUM | 400 | Invalid enum value |
| DUPLICATE_ENTRY | 409 | Duplicate resource |
| AUTHENTICATION_REQUIRED | 401 | Missing or invalid token |
| TOKEN_EXPIRED | 401 | JWT token expired |
| ACCESS_DENIED | 403 | Insufficient permissions |
| RESOURCE_NOT_FOUND | 404 | Resource does not exist |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |

---

## 7. Required Authentication & Authorization Rules

### 7.1 JWT Configuration

```json
{
  "jwtSettings": {
    "secretKey": "[CONFIGURED_IN_APPSETTINGS]",
    "issuer": "TemplateAPI",
    "audience": "TemplateUsers",
    "accessTokenExpirationMinutes": 60,
    "refreshTokenExpirationDays": 7,
    "algorithm": "HS256"
  }
}
```

### 7.2 Token Structure

**Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload:**
```json
{
  "sub": "028083f6-4241-47f4-ac52-5173cf8e1a66",
  "unique_name": "vMj8zZuWBkbkG",
  "email": "user@example.com",
  "jti": "e580584e-acfd-4a7f-9804-2942d9bbe632",
  "nbf": 1770840828,
  "exp": 1776024828,
  "iat": 1770840828,
  "iss": "TemplateAPI",
  "aud": "TemplateUsers",
  "role": "Student"
}
```

### 7.3 Token Refresh Flow

```
┌─────────────┐                    ┌─────────────┐
│   Client    │                    │    API      │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  1. Login Request                │
       │─────────────────────────────────▶│
       │                                  │
       │  2. Access Token + Refresh Token │
       │◀─────────────────────────────────│
       │                                  │
       │  3. API Request (Access Token)   │
       │─────────────────────────────────▶│
       │                                  │
       │  4. 401 Unauthorized             │
       │◀─────────────────────────────────│
       │                                  │
       │  5. Refresh Token Request        │
       │─────────────────────────────────▶│
       │                                  │
       │  6. New Access Token             │
       │◀─────────────────────────────────│
       │                                  │
       │  7. Retry API Request            │
       │─────────────────────────────────▶│
       │                                  │
       │  8. Success Response             │
       │◀─────────────────────────────────│
       │                                  │
```

### 7.4 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all endpoints, user management, system configuration |
| **Instructor** | Create/Update/Delete own courses, lessons, quizzes, questions; View enrolled students |
| **Student** | View courses, enroll, submit answers, track progress, earn certificates |
| **Guest** | View public content only (prayer times, Qibla direction) |

### 7.5 Endpoint Authorization Matrix

| Endpoint Pattern | Admin | Instructor | Student | Guest |
|-----------------|-------|------------|---------|-------|
| `/api/Identity/*` | All | Own profile | Own profile | Register/Login |
| `/api/Course/*` (GET) | ✓ | ✓ | ✓ | ✗ |
| `/api/Course/*` (POST/PUT/DELETE) | ✓ | Own courses | ✗ | ✗ |
| `/api/Enrollment/*` | All | View enrolled | Own enrollments | ✗ |
| `/api/Quiz/*` (GET) | ✓ | ✓ | ✓ | ✗ |
| `/api/Quiz/*` (POST/PUT/DELETE) | ✓ | Own quizzes | ✗ | ✗ |
| `/api/Answer/*` | All | View all | Own answers | ✗ |
| `/api/PrayerTimes/*` | ✓ | ✓ | ✓ | ✓ |
| `/api/Qibla/*` | ✓ | ✓ | ✓ | ✓ |

---

## 8. Required Pagination / Filtering / Sorting Contracts

### 8.1 Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `pageNumber` | integer | 1 | Page number (1-indexed) |
| `pageSize` | integer | 10 | Items per page (max 100) |
| `sortBy` | string | `createdAt` | Sort field |
| `sortOrder` | string | `desc` | Sort direction: `asc` or `desc` |
| `search` | string | - | Search term |

### 8.2 PagedResult Response Format

```json
{
  "items": [],
  "pageNumber": 1,
  "pageSize": 10,
  "totalPages": 5,
  "totalCount": 47,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

### 8.3 Filtering Parameters by Endpoint

#### Courses
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | enum | Filter by category |
| `level` | enum | Filter by level |
| `instructorId` | uuid | Filter by instructor |
| `search` | string | Search in title/description |

#### Questions
| Parameter | Type | Description |
|-----------|------|-------------|
| `quizId` | uuid | Filter by quiz |
| `text` | string | Search in question text |
| `isCaseSensitive` | boolean | Case-sensitive search |
| `minPoints` | integer | Minimum marks |
| `maxPoints` | integer | Maximum marks |

#### Enrollments
| Parameter | Type | Description |
|-----------|------|-------------|
| `studentId` | uuid | Filter by student |
| `courseId` | uuid | Filter by course |
| `status` | enum | Filter by status |

### 8.4 Response Headers

```
X-Pagination-TotalCount: 47
X-Pagination-PageNumber: 1
X-Pagination-PageSize: 10
X-Pagination-TotalPages: 5
X-Pagination-HasNext: true
X-Pagination-HasPrevious: false
Link: </api/Course?pageNumber=2>; rel="next", </api/Course?pageNumber=5>; rel="last"
```

---

## 9. File Handling Requirements

### 9.1 Current File Upload Endpoints

| Endpoint | Field | Purpose | Max Size |
|----------|-------|---------|----------|
| POST `/api/Identity/Register/register` | `ProfilePicture` | User profile picture | 5 MB |
| POST `/api/Course/CreateCourse` | `Thumbnail` | Course thumbnail | 10 MB |
| PUT `/api/Course/UpdateCourse/{id}` | `Thumbnail` | Course thumbnail | 10 MB |
| POST `/api/Lesson/CreateLesson` | `Thumbnail`, `Video` | Lesson media | 10 MB / 500 MB |
| PUT `/api/Lesson/UpdateLesson/{id}` | `Thumbnail`, `Video` | Lesson media | 10 MB / 500 MB |

### 9.2 File Upload Request Format

**multipart/form-data:**
```
POST /api/Course/CreateCourse
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="Title"

Introduction to Islam
------WebKitFormBoundary
Content-Disposition: form-data; name="Description"

A comprehensive introduction...
------WebKitFormBoundary
Content-Disposition: form-data; name="Category"

NewMuslimEssentials
------WebKitFormBoundary
Content-Disposition: form-data; name="Level"

Beginner
------WebKitFormBoundary
Content-Disposition: form-data; name="InstructorId"

028083f6-4241-47f4-ac52-5173cf8e1a66
------WebKitFormBoundary
Content-Disposition: form-data; name="Thumbnail"; filename="course-thumb.jpg"
Content-Type: image/jpeg

[binary data]
------WebKitFormBoundary--
```

### 9.3 File Response Format

```json
{
  "id": "028083f6-4241-47f4-ac52-5173cf8e1a66",
  "thumbnailUrl": "https://storage.example.com/courses/thumb-abc123.jpg",
  "videoUrl": "https://storage.example.com/lessons/video-xyz789.mp4"
}
```

### 9.4 Future File Requirements

| Feature | Description | Priority |
|---------|-------------|----------|
| Video Transcoding | Convert uploaded videos to multiple formats | P1 |
| Image Optimization | Auto-resize and compress images | P1 |
| CDN Integration | Serve files from CDN | P2 |
| Virus Scanning | Scan uploaded files for malware | P2 |
| Chunked Upload | Support large file uploads with resume | P3 |

---

## 10. Identified Inconsistencies or Risks

### 10.1 Critical Issues

| ID | Issue | Severity | Impact | Recommendation |
|----|-------|----------|--------|----------------|
| CRI-001 | Login endpoint returns `void` instead of `AuthResponse` | **CRITICAL** | Frontend cannot authenticate | Add proper response schema immediately |
| CRI-002 | Missing `AuthResponse` DTO in Swagger | **CRITICAL** | Type generation fails | Define and expose DTO |
| CRI-003 | No refresh token endpoint | **CRITICAL** | Users must re-login frequently | Implement `/api/Identity/refresh-token` |

### 10.2 High Priority Issues

| ID | Issue | Severity | Impact | Recommendation |
|----|-------|----------|--------|----------------|
| HIG-001 | 25+ endpoints missing response schemas | **HIGH** | Type safety broken | Add response schemas to all endpoints |
| HIG-002 | Missing `StudentReadDTO` | **HIGH** | Cannot type student responses | Define and expose DTO |
| HIG-003 | Missing `InstructorReadDTO` | **HIGH** | Cannot type instructor responses | Define and expose DTO |
| HIG-004 | Missing `EnrollmentReadDTO` | **HIGH** | Cannot type enrollment responses | Define and expose DTO |
| HIG-005 | Missing `QuestionReadDTO` | **HIGH** | Cannot type question responses | Define and expose DTO |
| HIG-006 | Missing `OptionReadDTO` | **HIGH** | Cannot type option responses | Define and expose DTO |
| HIG-007 | Missing `CertificateReadDTO` | **HIGH** | Cannot type certificate responses | Define and expose DTO |
| HIG-008 | Missing `UserReadDTO` | **HIGH** | Cannot type user responses | Define and expose DTO |
| HIG-009 | No pagination on list endpoints | **HIGH** | Performance issues | Implement `PagedResult<T>` |

### 10.3 Medium Priority Issues

| ID | Issue | Severity | Impact | Recommendation |
|----|-------|----------|--------|----------------|
| MED-001 | Inconsistent naming (PascalCase vs camelCase) | **MEDIUM** | Integration confusion | Standardize to camelCase in JSON |
| MED-002 | No rate limiting headers | **MEDIUM** | Potential abuse | Add `X-RateLimit-*` headers |
| MED-003 | No API versioning | **MEDIUM** | Breaking changes risk | Implement URL versioning |
| MED-004 | Missing request validation on some endpoints | **MEDIUM** | Invalid data accepted | Add FluentValidation |
| MED-005 | No CORS configuration documented | **MEDIUM** | Security risk | Document CORS policy |
| MED-006 | Missing `QuizEvaluationResultDTO` | **MEDIUM** | Cannot type evaluation results | Define and expose DTO |

### 10.4 Low Priority Issues

| ID | Issue | Severity | Impact | Recommendation |
|----|-------|----------|--------|----------------|
| LOW-001 | No API documentation (XML comments) | **LOW** | Developer experience | Add XML documentation |
| LOW-002 | Missing ETag support | **LOW** | Caching optimization | Implement ETag headers |
| LOW-003 | No HATEOAS links | **LOW** | API discoverability | Consider adding links |
| LOW-004 | Missing `PrayerTimesDTO` | **LOW** | Cannot type prayer times | Define and expose DTO |
| LOW-005 | Missing `QiblaDirectionDTO` | **LOW** | Cannot type Qibla data | Define and expose DTO |

### 10.5 Schema Mismatches

| Frontend Model | Backend DTO | Mismatch |
|----------------|-------------|----------|
| `CourseDto.levelId` | `CourseReadDTO.level` | Different field names |
| `EnrollmentDto.status` | Not returned | Missing field |
| `LessonDto.type` | Not returned | Missing field |
| `QuizDto.targetType` | Not returned | Missing field |
| `StudentDto.yearsOfExperience` | Not returned | Missing field |

---

## 11. Recommended Backend Improvements

### 11.1 Swagger Spec Updates

**Priority: P0 - Immediate**

1. **Add Missing Response Schemas:**
   ```csharp
   [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
   [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
   [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
   public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginViewModel model)
   ```

2. **Add Missing DTOs to Swagger:**
   - `AuthResponse`
   - `StudentReadDTO`
   - `InstructorReadDTO`
   - `EnrollmentReadDTO`
   - `QuestionReadDTO`
   - `OptionReadDTO`
   - `CertificateReadDTO`
   - `UserReadDTO`
   - `QuizEvaluationResultDTO`
   - `PrayerTimesDTO`
   - `QiblaDirectionDTO`

3. **Add XML Documentation:**
   ```csharp
   /// <summary>
   /// Authenticates a user and returns a JWT token
   /// </summary>
   /// <param name="model">Login credentials</param>
   /// <returns>Authentication response with JWT token</returns>
   /// <response code="200">Returns the authentication token</response>
   /// <response code="400">Invalid request format</response>
   /// <response code="401">Invalid credentials</response>
   ```

### 11.2 Performance Optimizations

**Priority: P1 - High**

1. **Implement Pagination:**
   ```csharp
   [HttpGet]
   public async Task<ActionResult<PagedResult<CourseReadDTO>>> GetCourses(
       [FromQuery] int pageNumber = 1,
       [FromQuery] int pageSize = 10)
   {
       var query = _context.Courses.AsQueryable();
       var totalCount = await query.CountAsync();
       var items = await query
           .Skip((pageNumber - 1) * pageSize)
           .Take(pageSize)
           .ToListAsync();
       
       return new PagedResult<CourseReadDTO>
       {
           Items = _mapper.Map<List<CourseReadDTO>>(items),
           PageNumber = pageNumber,
           PageSize = pageSize,
           TotalCount = totalCount,
           TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
       };
   }
   ```

2. **Add Caching Headers:**
   ```
   Cache-Control: public, max-age=300
   ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
   ```

3. **Add Response Compression:**
   ```csharp
   services.AddResponseCompression(options =>
   {
       options.EnableForHttps = true;
       options.Providers.Add<GzipCompressionProvider>();
       options.Providers.Add<BrotliCompressionProvider>();
   });
   ```

### 11.3 Security Enhancements

**Priority: P1 - High**

1. **Add Rate Limiting:**
   ```csharp
   services.AddRateLimiter(options =>
   {
       options.AddPolicy("ApiPolicy", context =>
           RateLimitPartition.GetSlidingWindowLimiter(
               partitionKey: context.User.Identity?.Name ?? context.Request.Headers.Host.ToString(),
               factory: _ => new SlidingWindowRateLimiterOptions
               {
                   PermitLimit = 100,
                   Window = TimeSpan.FromMinutes(1),
                   SegmentsPerWindow = 4
               }));
   });
   ```

2. **Add Security Headers:**
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   Content-Security-Policy: default-src 'self'
   ```

3. **Implement Refresh Token:**
   ```csharp
   [HttpPost("refresh-token")]
   public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
   {
       var principal = _tokenService.GetPrincipalFromExpiredToken(request.AccessToken);
       var user = await _userManager.FindByIdAsync(principal.FindFirst(ClaimTypes.NameIdentifier)?.Value);
       
       if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
       {
           return Unauthorized();
       }
       
       var newAccessToken = _tokenService.GenerateAccessToken(user);
       return Ok(new AuthResponse { AccessToken = newAccessToken });
   }
   ```

### 11.4 API Versioning

**Priority: P2 - Medium**

```csharp
services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
});

// Routes: /api/v1/Course, /api/v2/Course
```

### 11.5 Health Checks

**Priority: P2 - Medium**

```csharp
services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>()
    .AddUrlGroup(new Uri("https://storage.example.com/health"), "Storage");

app.MapHealthChecks("/health", new HealthCheckOptions
{
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

---

## Appendix A: Quick Reference

### A.1 Base URL
```
https://ask-a-muslim.runasp.net
```

### A.2 Authentication Header
```
Authorization: Bearer {jwt_token}
```

### A.3 Content Types
- Request: `application/json`, `multipart/form-data`
- Response: `application/json`

### A.4 Date Format
- ISO 8601: `2026-02-12T17:21:56.070Z`

### A.5 UUID Format
- RFC 4122: `028083f6-4241-47f4-ac52-5173cf8e1a66`

---

## Appendix B: Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-12 | AI Assistant | Initial document creation |

---

**Document End**
