# AskAMuslim API Layer Analysis

**Generated:** 2026-02-12  
**Source:** `swagger.json` (OpenAPI 3.0.1)  
**Generated Client:** `src/app/core/api/generated/`

---

## Executive Summary

This document provides a comprehensive analysis of the auto-generated API client layer for the AskAMuslim application. The API is built on ASP.NET Core and follows RESTful conventions with JWT Bearer authentication.

### Key Statistics

| Metric | Count |
|--------|-------|
| Total Endpoints | 73 |
| API Tags/Controllers | 13 |
| DTO Models | 22 |
| Authentication Required | All endpoints (global Bearer token) |

---

## Authentication

All endpoints require JWT Bearer authentication as defined in the global security scheme:

```json
{
  "securitySchemes": {
    "Bearer": {
      "type": "http",
      "scheme": "Bearer",
      "bearerFormat": "JWT"
    }
  },
  "security": [{ "Bearer": [] }]
}
```

---

## API Endpoints by Controller

### 1. Answer Controller

**Base Path:** `/api/Answer`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Answer` | Get all answers | - | `AnswerReadDTO[]` |
| POST | `/api/Answer` | Create new answer | `AnswerCreateDTO` | `AnswerReadDTO` |
| GET | `/api/Answer/{studentId}/{questionId}` | Get answer by student and question | - | `AnswerReadDTO` |
| PUT | `/api/Answer/{studentId}/{questionId}` | Update answer | `AnswerUpdateDTO` | `AnswerReadDTO` |
| DELETE | `/api/Answer/{studentId}/{questionId}` | Delete answer | - | `void` |

**Path Parameters:**
- `studentId` (string, required)
- `questionId` (string, required)

---

### 2. Certificate Controller

**Base Path:** `/api/Certificate`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/Certificate/AutoGenerateCertificate` | Auto-generate certificate | - | `void` |
| GET | `/api/Certificate/GetCertificates` | Get all certificates | - | `void` |
| GET | `/api/Certificate/GetCertificateById` | Get certificate by ID | - | `void` |
| PUT | `/api/Certificate/UpdateCertificateRemarks` | Update certificate remarks | - | `void` |

**Query Parameters:**
- `AutoGenerateCertificate`: `progressId` (string)
- `GetCertificateById`: `id` (string)
- `UpdateCertificateRemarks`: `id` (string), `remarks` (string)

---

### 3. Course Controller

**Base Path:** `/api/Course`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Course/GetCourses` | Get all courses | - | `CourseReadDTO[]` |
| GET | `/api/Course/GetCourseById/{id}` | Get course by ID | - | `CourseReadByIdDTO` |
| GET | `/api/Course/GetCourseByCategoryName/ByName/{categoryName}` | Get courses by category | - | `CourseReadDTO[]` |
| GET | `/api/Course/GetCourseByLevelName/ByLevelName/{levelName}` | Get courses by level | - | `CourseReadDTO[]` |
| GET | `/api/Course/GetInstructorCourses/{instructorId}` | Get instructor courses | - | `CourseReadDTO[]` |
| POST | `/api/Course/CreateCourse` | Create new course | `multipart/form-data` | `CourseReadByIdDTO` |
| PUT | `/api/Course/UpdateCourse/{id}` | Update course | `multipart/form-data` | `void` |
| DELETE | `/api/Course/DeleteCourse/{id}` | Delete course | - | `void` |

**Path Parameters:**
- `id` (string, required) - Course ID
- `categoryName` (string, required) - Category name
- `levelName` (string, required) - Level name
- `instructorId` (string, required) - Instructor ID

**Multipart Form Data (CreateCourse):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Title | string | Yes | Course title |
| Description | string | No | Course description |
| Category | enum | No | Course category |
| Level | enum | No | Difficulty level |
| Thumbnail | binary | No | Course thumbnail image |
| InstructorId | string | Yes | Instructor ID |

---

### 4. Enrollment Controller

**Base Path:** `/api/Enrollment`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Enrollment/GetAllEnrollments` | Get all enrollments | - | `void` |
| GET | `/api/Enrollment/GetEnrollment` | Get enrollment by student/course | - | `void` |
| GET | `/api/Enrollment/GetEnrolledCoursesByStudent` | Get student enrolled courses | - | `void` |
| GET | `/api/Enrollment/GetStudentsEnrolledInCourse` | Get course enrolled students | - | `void` |
| POST | `/api/Enrollment/Enroll` | Enroll student in course | `EnrollmentCreateDTO` | `void` |
| DELETE | `/api/Enrollment/UnEnroll` | Unenroll student | - | `void` |

**Query Parameters:**
- `GetEnrollment`: `studentId` (string), `courseId` (string)
- `GetEnrolledCoursesByStudent`: `studentId` (string)
- `GetStudentsEnrolledInCourse`: `courseId` (string)
- `UnEnroll`: `studentId` (string), `courseId` (string)

---

### 5. Identity Controller

**Base Path:** `/api/Identity`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/Identity/Register/register` | Register new user | `multipart/form-data` | `void` |
| POST | `/api/Identity/Login/login` | User login | `LoginViewModel` | **void** |
| POST | `/api/Identity/Logout/logout` | User logout | - | `void` |
| GET | `/api/Identity/GetAllUsers/Users` | Get all users (Admin) | - | `void` |
| GET | `/api/Identity/GetUserById/Users/{id}` | Get user by ID | - | `void` |
| PUT | `/api/Identity/UpdateEmail/update-email` | Update user email | `UpdateEmailDTO` | `void` |
| PUT | `/api/Identity/UpdatePassword/update-password` | Update user password | `UpdatePasswordDTO` | `void` |
| PUT | `/api/Identity/UpdateName/update-name` | Update user name | `UpdateNameDTO` | `void` |
| DELETE | `/api/Identity/DeleteUser/delete-user/{id}` | Delete user | - | `void` |

**Multipart Form Data (Register):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| FirstName | string | No | User first name |
| LastName | string | No | User last name |
| Email | string (email) | Yes | User email |
| Password | string (min: 6) | Yes | User password |
| PhoneNumber | string (tel) | No | Phone number |
| Role | enum | Yes | Student, Instructor, Admin |
| ProfilePicture | binary | No | Profile picture |

---

### 6. Instructor Controller

**Base Path:** `/api/Instructor`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Instructor/GetAllInstructors` | Get all instructors | - | `void` |
| GET | `/api/Instructor/GetInstructorById/{id}` | Get instructor by ID | - | `void` |
| GET | `/api/Instructor/GetInstructorByCourseId/{id}/Instructor` | Get instructor by course | - | `void` |

**Path Parameters:**
- `id` (string, required) - Instructor ID or Course ID

---

### 7. Lesson Controller

**Base Path:** `/api/Lesson`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Lesson/GetAllLessons` | Get all lessons | - | `LessonReadDTO[]` |
| GET | `/api/Lesson/GetLessonByID/{id}` | Get lesson by ID | - | `LessonReadDTO` |
| GET | `/api/Lesson/GetCourseLessons/{courseId}` | Get lessons by course | - | `LessonReadDTO[]` |
| POST | `/api/Lesson/CreateLesson` | Create new lesson | `multipart/form-data` | `LessonReadDTO` |
| PUT | `/api/Lesson/UpdateLesson/{id}` | Update lesson | `multipart/form-data` | `void` |
| DELETE | `/api/Lesson/DeleteLesson/{id}` | Delete lesson | - | `void` |

**Query Parameters (CreateLesson/UpdateLesson):**
- `Title` (string, required)
- `Content` (string, optional)
- `CourseId` (string, required - CreateLesson only)
- `ExternalVideoUrl` (URI, optional)

**Multipart Form Data:**
| Field | Type | Description |
|-------|------|-------------|
| Thumbnail | binary | Lesson thumbnail |
| Video | binary | Lesson video file |

---

### 8. Option Controller

**Base Path:** `/api/Option`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Option/{questionId}` | Get options by question | - | `void` |
| POST | `/api/Option/{questionId}` | Create option | `OptionCreateDTO` | `void` |
| PUT | `/api/Option/{optionId}` | Update option | `OptionUpdateDTO` | `void` |
| DELETE | `/api/Option/{optionId}` | Delete option | - | `void` |
| GET | `/api/Option/option/{optionId}` | Get option by ID | - | `void` |
| DELETE | `/api/Option/question/{questionId}` | Delete options by question | - | `void` |

**Path Parameters:**
- `questionId` (string, required)
- `optionId` (string, required)

---

### 9. Prayer Times Controller

**Base Path:** `/api/PrayerTimes`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/PrayerTimes` | Get prayer times | - | `void` |
| GET | `/api/PrayerTimes/location` | Get prayer times by location | - | `void` |

---

### 10. Progress Controller

**Base Path:** `/api/Progress`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Progress/GetAllProgresses` | Get all progress records | - | `ProgressReadDTO[]` |
| GET | `/api/Progress/GetProgressById/{id}` | Get progress by ID | - | `ProgressReadDTO` |
| GET | `/api/Progress/GetProgressByStudentId/ByStudent/{studentId}` | Get progress by student | - | `ProgressReadDTO[]` |
| GET | `/api/Progress/GetProgressByCourseId/ByCourse/{courseId}` | Get progress by course | - | `ProgressReadDTO[]` |
| POST | `/api/Progress/CreateProgress` | Create progress record | `ProgressCreateDTO` | `ProgressReadDTO` |
| PUT | `/api/Progress/UpdateProgress/{id}` | Update progress | `ProgressUpdateDTO` | `void` |
| DELETE | `/api/Progress/DeleteProgress/{id}` | Delete progress | - | `void` |
| PUT | `/api/Progress/MarkProgressAsCompleted/MarkAsCompleted/{id}` | Mark as completed | - | `void` |

**Path Parameters:**
- `id` (string, required) - Progress ID
- `studentId` (string, required) - Student ID
- `courseId` (string, required) - Course ID

---

### 11. Qibla Controller

**Base Path:** `/api/Qibla`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Qibla/direction` | Get Qibla direction | - | `void` |

---

### 12. Question Controller

**Base Path:** `/api/Question`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Question` | Get all questions | - | `void` |
| POST | `/api/Question` | Create question | `QuestionCreateDTO` | `void` |
| GET | `/api/Question/{id}` | Get question by ID | - | `void` |
| PUT | `/api/Question/{id}` | Update question | `QuestionUpdateDTO` | `void` |
| DELETE | `/api/Question/{id}` | Delete question | - | `void` |
| GET | `/api/Question/quiz/{quizId}` | Get questions by quiz | - | `void` |
| GET | `/api/Question/search` | Search questions | - | `void` |
| GET | `/api/Question/filter` | Filter questions | - | `void` |
| POST | `/api/Question/bulk-create` | Bulk create questions | `QuestionCreateDTO[]` | `void` |
| PUT | `/api/Question/bulk-update` | Bulk update questions | `QuestionBulkUpdateDTO[]` | `void` |
| DELETE | `/api/Question/bulk-delete` | Bulk delete questions | `string[]` | `void` |

**Query Parameters:**
- `search`: `quizId` (string), `text` (string), `isCaseSensitive` (boolean, default: false)
- `filter`: `quizId` (string), `text` (string), `isCaseSensitive` (boolean), `minPoints` (int32), `maxPoints` (int32)

---

### 13. Quiz Controller

**Base Path:** `/api/Quiz`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Quiz` | Get all quizzes | - | `QuizReadDTO[]` |
| POST | `/api/Quiz` | Create quiz | `QuizCreateDTO` | `QuizReadDTO` |
| GET | `/api/Quiz/{id}` | Get quiz by ID | - | `QuizReadDTO` |
| PUT | `/api/Quiz/{id}` | Update quiz | `multipart/form-data` | `void` |
| DELETE | `/api/Quiz/{id}` | Delete quiz | - | `void` |

---

### 14. Quiz Evaluation Controller

**Base Path:** `/api/QuizEvaluation`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| POST | `/api/QuizEvaluation/evaluate/{quizId}` | Evaluate quiz | - | `void` |
| POST | `/api/QuizEvaluation/evaluate/{quizId}/student/{studentId}` | Evaluate quiz for student | - | `void` |

**Path Parameters:**
- `quizId` (string, required)
- `studentId` (string, required)

---

### 15. Student Controller

**Base Path:** `/api/Student`

| Method | Endpoint | Purpose | Request Body | Response |
|--------|----------|---------|--------------|----------|
| GET | `/api/Student` | Get all students | - | `void` |
| GET | `/api/Student/{id}` | Get student by ID | - | `void` |
| GET | `/api/Student/GetAllCourses` | Get student courses | - | `void` |

**Query Parameters:**
- `GetAllCourses`: `StudentId` (string)

---

## Data Transfer Objects (DTOs)

### AnswerCreateDTO

```typescript
interface AnswerCreateDto {
  questionId: string;      // Required
  selectedOptionId: string; // Required
  studentId: string;       // Required
}
```

### AnswerReadDTO

```typescript
interface AnswerReadDto {
  questionId?: string | null;
  selectedOptionId?: string | null;
  studentId?: string | null;
}
```

### AnswerUpdateDTO

```typescript
interface AnswerUpdateDto {
  selectedOptionId?: string | null;
}
```

### CourseReadDTO

```typescript
interface CourseReadDto {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  category?: 'Tafseer' | 'Hadith' | 'Fiqh' | 'Aqeeda' | 'Seerah' | 
            'QuranMemorization' | 'ArabicLanguage' | 'MannersAndEtiquette' | 
            'IslamicJurisprudence' | 'NewMuslimEssentials' | 'DuasAndSupplications' | 
            'IslamicEthics' | 'FamilyAndMarriage' | 'ContemporaryIssues' | 
            'BiographyOfProphets' | 'Quran' | 'Faith' | 'Other';
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'AllLevels';
  instructorID?: string | null;
  instructorName?: string | null;
  numberOfLessons?: number;
  numberOfStudentsEnrolled?: number;
}
```

### CourseReadByIdDTO

```typescript
interface CourseReadByIdDto {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  thumbnailUrl?: string | null;
  category?: Category; // Same enum as CourseReadDTO
  level?: Level;       // Same enum as CourseReadDTO
  instructorID?: string | null;
  instructorName?: string | null;
  lessons?: LessonReadDto[] | null;
  numberOfLessons?: number;
  numberOfStudentsEnrolled?: number;
}
```

### EnrollmentCreateDTO

```typescript
interface EnrollmentCreateDto {
  studentId?: string | null;
  courseId?: string | null;
}
```

### LessonReadDTO

```typescript
interface LessonReadDto {
  id?: string | null;
  title?: string | null;
  content?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  externalVideoUrl?: string | null;
  courseId?: string | null;
}
```

### LoginViewModel

```typescript
interface LoginViewModel {
  email: string;    // Required
  password: string; // Required
}
```

### OptionCreateDTO

```typescript
interface OptionCreateDto {
  optionText: string;  // Required
  isCorrect: boolean;  // Required
}
```

### OptionUpdateDTO

```typescript
interface OptionUpdateDto {
  optionText?: string | null;
  isCorrect?: boolean | null;
}
```

### ProgressCreateDTO

```typescript
interface ProgressCreateDto {
  courseId?: string | null;
  studentId?: string | null;
  totalLessonsCompleted?: number;
  completedProgress?: boolean;
}
```

### ProgressReadDTO

```typescript
interface ProgressReadDto {
  id?: string | null;
  totalLessonsCompleted?: number;
  lessonCompletionRate?: number;
  completedProgress?: boolean;
  lastUpdated?: string;        // ISO date-time
  isCompleted?: boolean;
  isCertified?: boolean;
  certificateNumber?: string | null;
  courseId?: string | null;
}
```

### ProgressUpdateDTO

```typescript
interface ProgressUpdateDto {
  totalLessonsCompleted?: number;
}
```

### ProblemDetails

```typescript
interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: any; // Additional properties allowed
}
```

### QuestionCreateDTO

```typescript
interface QuestionCreateDto {
  questionText: string;              // Required
  marks: number;                     // Required
  quizId: string;                    // Required
  options: OptionCreateDto[];        // Required
}
```

### QuestionUpdateDTO

```typescript
interface QuestionUpdateDto {
  questionText?: string | null;
  marks?: number | null;
}
```

### QuestionBulkUpdateDTO

```typescript
interface QuestionBulkUpdateDto {
  id: string;                        // Required
  questionText?: string | null;
  marks?: number | null;
  options?: OptionUpdateDto[] | null;
}
```

### QuizCreateDTO

```typescript
interface QuizCreateDto {
  title: string;           // Required
  description?: string | null;
  lessonId: string;        // Required
}
```

### QuizReadDTO

```typescript
interface QuizReadDto {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  totalQuestions?: number;
  totalMarks?: number;
  lessonId?: string | null;
}
```

### UpdateEmailDTO

```typescript
interface UpdateEmailDto {
  userId?: string | null;
  newEmail: string;        // Required
}
```

### UpdateNameDTO

```typescript
interface UpdateNameDto {
  userId?: string | null;
  firstName: string;       // Required, min length: 2
  lastName: string;        // Required, min length: 2
}
```

### UpdatePasswordDTO

```typescript
interface UpdatePasswordDto {
  userId?: string | null;
  oldPassword: string;     // Required
  newPassword: string;     // Required, min length: 6
}
```

---

## Enumerations

### Course Category

```typescript
type CourseCategory = 
  | 'Tafseer'
  | 'Hadith'
  | 'Fiqh'
  | 'Aqeeda'
  | 'Seerah'
  | 'QuranMemorization'
  | 'ArabicLanguage'
  | 'MannersAndEtiquette'
  | 'IslamicJurisprudence'
  | 'NewMuslimEssentials'
  | 'DuasAndSupplications'
  | 'IslamicEthics'
  | 'FamilyAndMarriage'
  | 'ContemporaryIssues'
  | 'BiographyOfProphets'
  | 'Quran'
  | 'Faith'
  | 'Other';
```

### Course Level

```typescript
type CourseLevel = 
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'AllLevels';
```

### User Role

```typescript
type UserRole = 
  | 'Student'
  | 'Instructor'
  | 'Admin';
```

---

## Identified Gaps and Issues

### Critical Issues

#### 1. Login Endpoint Returns `void`
**Severity:** HIGH  
**Endpoint:** `POST /api/Identity/Login/login`

The login endpoint response is defined as returning `void` with only a 200 description of "Returns authentication token". This is incorrect because:
- The frontend expects a JWT token in the response
- No response schema is defined for the token structure
- The generated client cannot properly type the login response

**Expected Response Schema:**
```json
{
  "token": "string",
  "refreshToken": "string",
  "expiration": "date-time",
  "user": {
    "id": "string",
    "email": "string",
    "role": "string"
  }
}
```

#### 2. Missing Response Schemas for Multiple Endpoints
**Severity:** MEDIUM

The following endpoints return `void` but should have defined response types:

| Endpoint | Expected Response |
|----------|-------------------|
| `GET /api/Certificate/GetCertificates` | `CertificateDTO[]` |
| `GET /api/Certificate/GetCertificateById` | `CertificateDTO` |
| `GET /api/Enrollment/GetAllEnrollments` | `EnrollmentReadDTO[]` |
| `GET /api/Enrollment/GetEnrollment` | `EnrollmentReadDTO` |
| `GET /api/Enrollment/GetEnrolledCoursesByStudent` | `CourseReadDTO[]` |
| `GET /api/Enrollment/GetStudentsEnrolledInCourse` | `StudentDTO[]` |
| `GET /api/Identity/GetAllUsers/Users` | `UserDTO[]` |
| `GET /api/Identity/GetUserById/Users/{id}` | `UserDTO` |
| `GET /api/Instructor/GetAllInstructors` | `InstructorDTO[]` |
| `GET /api/Instructor/GetInstructorById/{id}` | `InstructorDTO` |
| `GET /api/Instructor/GetInstructorByCourseId/{id}/Instructor` | `InstructorDTO` |
| `GET /api/Option/{questionId}` | `OptionReadDTO[]` |
| `GET /api/Option/option/{optionId}` | `OptionReadDTO` |
| `GET /api/PrayerTimes` | `PrayerTimesDTO` |
| `GET /api/PrayerTimes/location` | `PrayerTimesDTO` |
| `GET /api/Qibla/direction` | `QiblaDirectionDTO` |
| `GET /api/Question` | `QuestionReadDTO[]` |
| `GET /api/Question/{id}` | `QuestionReadDTO` |
| `GET /api/Question/quiz/{quizId}` | `QuestionReadDTO[]` |
| `GET /api/Question/search` | `QuestionReadDTO[]` |
| `GET /api/Question/filter` | `QuestionReadDTO[]` |
| `GET /api/Student` | `StudentDTO[]` |
| `GET /api/Student/{id}` | `StudentDTO` |
| `GET /api/Student/GetAllCourses` | `CourseReadDTO[]` |
| `POST /api/QuizEvaluation/evaluate/{quizId}` | `QuizResultDTO` |
| `POST /api/QuizEvaluation/evaluate/{quizId}/student/{studentId}` | `QuizResultDTO` |

#### 3. Missing DTOs in Generated Models
**Severity:** MEDIUM

The following DTOs are referenced in endpoints but not defined in the generated models:

- `CertificateDTO` / `CertificateReadDTO`
- `EnrollmentReadDTO`
- `InstructorDTO` / `InstructorReadDTO`
- `OptionReadDTO`
- `PrayerTimesDTO`
- `QiblaDirectionDTO`
- `QuestionReadDTO`
- `QuizResultDTO`
- `StudentDTO` / `StudentReadDTO`
- `UserDTO` / `UserReadDTO`

### Minor Issues

#### 4. Inconsistent Naming Conventions
- Some endpoints use PascalCase in paths (`/GetCourses`) while others use kebab-case (`/get-courses`)
- DTOs use PascalCase in JSON but camelCase in TypeScript

#### 5. Missing Operation IDs
- No `operationId` is defined for any endpoint, making it harder to generate unique function names

#### 6. No Pagination Support
- List endpoints like `GetAllCourses`, `GetAllLessons`, etc. lack pagination parameters
- This could lead to performance issues with large datasets

#### 7. No Rate Limiting Information
- No `x-rate-limit` or similar headers defined in responses

---

## Generated Function Mapping

The generated API client in [`functions.ts`](src/app/core/api/generated/functions.ts:1) exports 73 endpoint functions organized by controller:

| Controller | Function Count |
|------------|----------------|
| Answer | 9 |
| Certificate | 4 |
| Course | 12 |
| Enrollment | 6 |
| Identity | 9 |
| Instructor | 3 |
| Lesson | 8 |
| Option | 6 |
| PrayerTimes | 2 |
| Progress | 10 |
| Qibla | 1 |
| Question | 11 |
| Quiz | 6 |
| QuizEvaluation | 2 |
| Student | 3 |

---

## Recommendations

### Immediate Actions Required

1. **Fix Login Response Schema** - Add proper response type for the login endpoint
2. **Add Missing Response Schemas** - Define response types for all endpoints currently returning `void`
3. **Add Missing DTOs** - Generate all referenced DTOs

### Future Improvements

1. **Add Operation IDs** - Include unique operation IDs for better code generation
2. **Implement Pagination** - Add `page`, `pageSize`, `sortBy`, `sortOrder` parameters
3. **Add API Versioning** - Include version in the path or header
4. **Document Error Responses** - Add 400, 401, 403, 404, 500 response schemas
5. **Add Rate Limiting Headers** - Document rate limiting in the spec

---

## Appendix: Complete Endpoint Reference

| # | Method | Path | Tag | Has Request Body | Has Response Schema |
|---|--------|------|-----|------------------|---------------------|
| 1 | GET | /api/Answer | Answer | No | Yes |
| 2 | POST | /api/Answer | Answer | Yes | Yes |
| 3 | GET | /api/Answer/{studentId}/{questionId} | Answer | No | Yes |
| 4 | PUT | /api/Answer/{studentId}/{questionId} | Answer | Yes | Yes |
| 5 | DELETE | /api/Answer/{studentId}/{questionId} | Answer | No | No |
| 6 | POST | /api/Certificate/AutoGenerateCertificate | Certificate | No | No |
| 7 | GET | /api/Certificate/GetCertificates | Certificate | No | No |
| 8 | GET | /api/Certificate/GetCertificateById | Certificate | No | No |
| 9 | PUT | /api/Certificate/UpdateCertificateRemarks | Certificate | No | No |
| 10 | GET | /api/Course/GetCourses | Course | No | Yes |
| 11 | GET | /api/Course/GetCourseById/{id} | Course | No | Yes |
| 12 | GET | /api/Course/GetCourseByCategoryName/ByName/{categoryName} | Course | No | Yes |
| 13 | GET | /api/Course/GetCourseByLevelName/ByLevelName/{levelName} | Course | No | Yes |
| 14 | GET | /api/Course/GetInstructorCourses/{instructorId} | Course | No | Yes |
| 15 | POST | /api/Course/CreateCourse | Course | Yes | Yes |
| 16 | PUT | /api/Course/UpdateCourse/{id} | Course | Yes | No |
| 17 | DELETE | /api/Course/DeleteCourse/{id} | Course | No | No |
| 18 | GET | /api/Enrollment/GetAllEnrollments | Enrollment | No | No |
| 19 | GET | /api/Enrollment/GetEnrollment | Enrollment | No | No |
| 20 | GET | /api/Enrollment/GetEnrolledCoursesByStudent | Enrollment | No | No |
| 21 | GET | /api/Enrollment/GetStudentsEnrolledInCourse | Enrollment | No | No |
| 22 | POST | /api/Enrollment/Enroll | Enrollment | Yes | No |
| 23 | DELETE | /api/Enrollment/UnEnroll | Enrollment | No | No |
| 24 | POST | /api/Identity/Register/register | Identity | Yes | No |
| 25 | POST | /api/Identity/Login/login | Identity | Yes | **No (ISSUE)** |
| 26 | POST | /api/Identity/Logout/logout | Identity | No | No |
| 27 | GET | /api/Identity/GetAllUsers/Users | Identity | No | No |
| 28 | GET | /api/Identity/GetUserById/Users/{id} | Identity | No | No |
| 29 | PUT | /api/Identity/UpdateEmail/update-email | Identity | Yes | No |
| 30 | PUT | /api/Identity/UpdatePassword/update-password | Identity | Yes | No |
| 31 | PUT | /api/Identity/UpdateName/update-name | Identity | Yes | No |
| 32 | DELETE | /api/Identity/DeleteUser/delete-user/{id} | Identity | No | No |
| 33 | GET | /api/Instructor/GetAllInstructors | Instructor | No | No |
| 34 | GET | /api/Instructor/GetInstructorById/{id} | Instructor | No | No |
| 35 | GET | /api/Instructor/GetInstructorByCourseId/{id}/Instructor | Instructor | No | No |
| 36 | GET | /api/Lesson/GetAllLessons | Lesson | No | Yes |
| 37 | GET | /api/Lesson/GetLessonByID/{id} | Lesson | No | Yes |
| 38 | GET | /api/Lesson/GetCourseLessons/{courseId} | Lesson | No | Yes |
| 39 | POST | /api/Lesson/CreateLesson | Lesson | Yes | Yes |
| 40 | PUT | /api/Lesson/UpdateLesson/{id} | Lesson | Yes | No |
| 41 | DELETE | /api/Lesson/DeleteLesson/{id} | Lesson | No | No |
| 42 | GET | /api/Option/{questionId} | Option | No | No |
| 43 | POST | /api/Option/{questionId} | Option | Yes | No |
| 44 | PUT | /api/Option/{optionId} | Option | Yes | No |
| 45 | DELETE | /api/Option/{optionId} | Option | No | No |
| 46 | GET | /api/Option/option/{optionId} | Option | No | No |
| 47 | DELETE | /api/Option/question/{questionId} | Option | No | No |
| 48 | GET | /api/PrayerTimes | PrayerTimes | No | No |
| 49 | GET | /api/PrayerTimes/location | PrayerTimes | No | No |
| 50 | GET | /api/Progress/GetAllProgresses | Progress | No | Yes |
| 51 | GET | /api/Progress/GetProgressById/{id} | Progress | No | Yes |
| 52 | GET | /api/Progress/GetProgressByStudentId/ByStudent/{studentId} | Progress | No | Yes |
| 53 | GET | /api/Progress/GetProgressByCourseId/ByCourse/{courseId} | Progress | No | Yes |
| 54 | POST | /api/Progress/CreateProgress | Progress | Yes | Yes |
| 55 | PUT | /api/Progress/UpdateProgress/{id} | Progress | Yes | No |
| 56 | DELETE | /api/Progress/DeleteProgress/{id} | Progress | No | No |
| 57 | PUT | /api/Progress/MarkProgressAsCompleted/MarkAsCompleted/{id} | Progress | No | No |
| 58 | GET | /api/Qibla/direction | Qibla | No | No |
| 59 | GET | /api/Question | Question | No | No |
| 60 | POST | /api/Question | Question | Yes | No |
| 61 | GET | /api/Question/{id} | Question | No | No |
| 62 | PUT | /api/Question/{id} | Question | Yes | No |
| 63 | DELETE | /api/Question/{id} | Question | No | No |
| 64 | GET | /api/Question/quiz/{quizId} | Question | No | No |
| 65 | GET | /api/Question/search | Question | No | No |
| 66 | GET | /api/Question/filter | Question | No | No |
| 67 | POST | /api/Question/bulk-create | Question | Yes | No |
| 68 | PUT | /api/Question/bulk-update | Question | Yes | No |
| 69 | DELETE | /api/Question/bulk-delete | Question | Yes | No |
| 70 | GET | /api/Quiz | Quiz | No | Yes |
| 71 | POST | /api/Quiz | Quiz | Yes | Yes |
| 72 | GET | /api/Quiz/{id} | Quiz | No | Yes |
| 73 | PUT | /api/Quiz/{id} | Quiz | Yes | No |
| 74 | DELETE | /api/Quiz/{id} | Quiz | No | No |
| 75 | POST | /api/QuizEvaluation/evaluate/{quizId} | QuizEvaluation | No | No |
| 76 | POST | /api/QuizEvaluation/evaluate/{quizId}/student/{studentId} | QuizEvaluation | No | No |
| 77 | GET | /api/Student | Student | No | No |
| 78 | GET | /api/Student/{id} | Student | No | No |
| 79 | GET | /api/Student/GetAllCourses | Student | No | No |

---

*Document generated from Swagger specification analysis*
