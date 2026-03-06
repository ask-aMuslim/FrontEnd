# API Contracts Documentation

**Project:** AskAMuslim  
**Last Updated:** 2026-02-21  
**Source:** [API Integration Audit Report](../docs/API_INTEGRATION_AUDIT_REPORT_2026-02-21.md)

---

## Base Configuration

### Base URLs

| Environment     | URL                                 |
| --------------- | ----------------------------------- |
| **Production**  | `https://aam-api.ask-a-muslim.com`  |
| **Development** | `https://aam-api.ask-a-muslim.com`  |
| **Local Proxy** | `/api` → configured in angular.json |

### Authentication

- **Type:** JWT Bearer Token
- **Header:** `Authorization: Bearer {token}`
- **Token Structure:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiration": "2026-02-21T18:00:00Z",
  "userId": "string",
  "email": "user@example.com",
  "role": "Student"
}
```

---

## Response Envelopes

### Standard Response Wrapper

All API responses use a consistent envelope structure:

```typescript
interface ApiResponse<T> {
  succeeded: boolean;
  errors: string[];
  data: T;
}
```

### Paginated Response

Pagination responses use the following structure:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

---

## Endpoint Categories

### Authentication

**Base Path:** `/api/Authentication/*`

| Endpoint           | Method | Status      | Description                            |
| ------------------ | ------ | ----------- | -------------------------------------- |
| `/login`           | POST   | ✅ Working  | User login, returns JWT                |
| `/forgot-password` | POST   | ✅ Working  | Initiates password reset               |
| `/register`        | POST   | ⚠️ Partial  | User registration (schema mismatch)    |
| `/reset-password`  | POST   | ⚠️ Untested | Requires OTP flow                      |
| `/verify-otp`      | POST   | ⚠️ Untested | OTP verification                       |
| `/refresh`         | POST   | ❌ Missing  | Token refresh (not implemented)        |
| `/logout`          | POST   | ❌ Missing  | Session invalidation (not implemented) |

**Login Request:**

```typescript
interface LoginCommand {
  email: string;
  password: string;
}
```

**Login Response:**

```typescript
interface AuthenticationResponse {
  token: string;
  expiration: string;
  userId: string;
  email: string;
  role: string;
  refreshToken?: string; // MISSING in frontend model
  refreshTokenExpiration?: string; // MISSING in frontend model
}
```

---

### Courses

**Base Path:** `/api/Courses/*`  
**Facade:** [`CourseFacade`](../src/app/api/facades/course.facade.ts)

| Endpoint             | Method | Status      | Description                       |
| -------------------- | ------ | ----------- | --------------------------------- |
| `/`                  | GET    | ✅ Working  | List all courses                  |
| `/{id}`              | GET    | ✅ Working  | Get course by ID                  |
| `/{id}/detail`       | GET    | ⚠️ Mismatch | Course detail (path differs)      |
| `/roadmap/{levelId}` | GET    | ⚠️ Param    | Course roadmap (requires levelId) |
| `/`                  | POST   | ✅ Working  | Create course                     |
| `/{id}`              | PUT    | ✅ Working  | Update course                     |
| `/{id}`              | DELETE | ✅ Working  | Delete course                     |

**Known Issues:**

- Frontend expects `/api/Courses/detail/{id}` but backend provides `/api/Courses/{id}/detail`
- Roadmap endpoint requires `levelId` parameter which may not always be available

---

### Lessons

**Base Path:** `/api/Lessons/*`  
**Facade:** [`LessonFacade`](../src/app/api/facades/lesson.facade.ts)

| Endpoint         | Method | Status     | Description                      |
| ---------------- | ------ | ---------- | -------------------------------- |
| `/`              | GET    | ✅ Working | List all lessons                 |
| `/{id}`          | GET    | ✅ Working | Get lesson by ID                 |
| `?CourseId={id}` | GET    | ⚠️ Query   | Lessons by course (query param)  |
| `/`              | POST   | ✅ Working | Create lesson                    |
| `/{id}`          | PUT    | ✅ Working | Update lesson                    |
| `/{id}`          | DELETE | ✅ Working | Delete lesson                    |
| `/{id}/progress` | GET    | ❌ Fail    | **Use `/api/Progress/` instead** |

**Known Issues:**

- Lessons by course uses query parameter instead of path parameter
- Progress endpoint path mismatch (see Progress section)

---

### Enrollments

**Base Path:** `/api/Enrollments/*`  
**Facade:** [`EnrollmentFacade`](../src/app/api/facades/enrollment.facade.ts)

| Endpoint                  | Method | Status      | Description                                 |
| ------------------------- | ------ | ----------- | ------------------------------------------- |
| `/`                       | GET    | ❌ 405      | **Not allowed - use alternative endpoints** |
| `/`                       | POST   | ✅ Working  | Create enrollment                           |
| `/{id}`                   | GET    | ⚠️ Partial  | Get enrollment by ID                        |
| `/by-student/{studentId}` | GET    | ⚠️ Mismatch | Enrollments by student                      |
| `/by-course/{courseId}`   | GET    | ⚠️ Mismatch | Enrollments by course                       |

**Known Issues:**

- `GET /api/Enrollments` returns `405 Method Not Allowed`
- Must use `/by-student/{studentId}` or `/by-course/{courseId}` for listing

---

### Students & Profiles

**Base Path:** `/api/Students/*`, `/api/StudentProfiles/*`  
**Facade:** [`StudentFacade`](../src/app/api/facades/student.facade.ts)

| Endpoint                  | Method | Status     | Description                    |
| ------------------------- | ------ | ---------- | ------------------------------ |
| `/api/Students`           | GET    | ✅ Working | List all students (admin)      |
| `/api/Students/{userId}`  | GET    | ✅ Working | Get student profile            |
| `/api/Students/courses`   | GET    | ❌ Error   | Returns "Invalid user ID"      |
| `/api/Students/me`        | GET    | ⚠️ Alias   | Maps to StudentProfiles/me     |
| `/api/StudentProfiles/me` | GET    | ✅ Working | Get authenticated user profile |
| `/api/StudentProfiles/me` | PUT    | ✅ Working | Update profile                 |

**Known Issues:**

- `/api/Students/courses` returns 400 with "Invalid user ID"

---

### Progress

**Base Path:** `/api/Progress/*`  
**Facade:** [`ProgressFacade`](../src/app/api/facades/progress.facade.ts)

| Endpoint                                        | Method | Status | Description         |
| ----------------------------------------------- | ------ | ------ | ------------------- |
| `/GetProgressByStudentId/ByStudent/{studentId}` | GET    | ❌ 404 | Progress by student |

**Known Issues:**

- Frontend expects `/api/Lessons/{id}/progress` but backend uses `/api/Progress/`
- Endpoint returns 404 - route binding issue suspected

---

### Events

**Base Path:** `/api/Events/*`

| Endpoint | Method | Status     | Description                 |
| -------- | ------ | ---------- | --------------------------- |
| `/`      | GET    | ✅ Working | List events with pagination |
| `/{id}`  | GET    | ✅ Working | Get event by ID             |
| `/`      | POST   | ✅ Working | Create event                |
| `/{id}`  | PUT    | ✅ Working | Update event                |
| `/{id}`  | DELETE | ✅ Working | Delete event                |

---

### Muslim Tube

**Base Path:** `/api/MuslimTube/*`  
**Facade:** Not implemented (components use mock data)

| Endpoint                | Method | Status       | Description       |
| ----------------------- | ------ | ------------ | ----------------- |
| `/channels`             | GET    | ✅ Available | List channels     |
| `/videos`               | GET    | ✅ Available | List videos       |
| `/videos/{id}`          | GET    | ✅ Available | Get video by ID   |
| `/channels/{id}/videos` | GET    | ✅ Available | Videos by channel |

**Known Issues:**

- All Muslim Tube components use hardcoded mock data
- No backend integration exists
- Requires `MuslimTubeFacade` implementation

---

### Q&A

**Base Path:** `/api/QAs/*`

| Endpoint | Method | Status     | Description      |
| -------- | ------ | ---------- | ---------------- |
| `/`      | GET    | ✅ Working | List Q&A entries |
| `/`      | POST   | ✅ Working | Create Q&A entry |

---

### Inquiry Requests

**Base Path:** `/api/InquiryRequests/*`

| Endpoint | Method | Status     | Description    |
| -------- | ------ | ---------- | -------------- |
| `/`      | POST   | ✅ Working | Submit inquiry |

---

### Meeting Requests

**Base Path:** `/api/MeetingRequests/*`

| Endpoint | Method | Status | Description            |
| -------- | ------ | ------ | ---------------------- |
| `/`      | POST   | ❌ 400 | Create meeting request |

**Known Issues:**

- POST returns 400 with no actionable validation message
- Request body structure may not match backend expectations

---

## Known Issues Summary

### Critical (P0)

| Issue           | Frontend Expects             | Backend Provides        | Resolution                              |
| --------------- | ---------------------------- | ----------------------- | --------------------------------------- |
| Lesson Progress | `/api/Lessons/{id}/progress` | `/api/Progress/`        | Update frontend or add backend alias    |
| Enrollments GET | `/api/Enrollments`           | Not allowed (POST only) | Use `/by-student/{id}` endpoint         |
| Meeting Request | POST with body               | Returns 400             | Backend needs structured error response |

### High (P1)

| Issue              | Description               | Resolution                      |
| ------------------ | ------------------------- | ------------------------------- |
| Students/courses   | Returns "Invalid user ID" | Verify auth context propagation |
| Muslim Tube        | No API integration        | Create MuslimTubeFacade         |
| Questions endpoint | Returns 400               | Fix backend validation          |

### Medium (P2)

| Issue          | Frontend Expects           | Backend Provides           |
| -------------- | -------------------------- | -------------------------- |
| Course detail  | `/api/Courses/detail/{id}` | `/api/Courses/{id}/detail` |
| Course roadmap | Optional levelId           | Required levelId parameter |

---

## Model Reference

### Generated DTOs Location

All DTOs are auto-generated from Swagger in:

- [`src/app/api/models/`](../src/app/api/models/)

### Key Models

| Model                    | File                                                                             | Description        |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------ |
| `AuthenticationResponse` | [`authentication-response.ts`](../src/app/api/models/authentication-response.ts) | JWT token response |
| `LoginCommand`           | [`login-command.ts`](../src/app/api/models/login-command.ts)                     | Login request body |
| `CourseDetailDto`        | Generated                                                                        | Course details     |
| `LessonReadDto`          | Generated                                                                        | Lesson data        |
| `EnrollmentDto`          | Generated                                                                        | Enrollment data    |

### Schema Mismatches

**AuthenticationResponse Missing Fields:**

- `role` - Present in backend, missing in frontend
- `refreshToken` - Present in backend, missing in frontend
- `refreshTokenExpiration` - Present in backend, missing in frontend

---

## Error Handling

### HTTP Status Codes

| Code | Meaning            | Action                        |
| ---- | ------------------ | ----------------------------- |
| 200  | Success            | Process response data         |
| 400  | Bad Request        | Check request body/parameters |
| 401  | Unauthorized       | Re-authenticate user          |
| 403  | Forbidden          | Check user permissions        |
| 404  | Not Found          | Verify endpoint path          |
| 405  | Method Not Allowed | Use correct HTTP method       |
| 429  | Too Many Requests  | Implement retry with backoff  |
| 500  | Server Error       | Log and report                |

### Error Response Format

```typescript
interface ErrorResponse {
  succeeded: false;
  errors: string[];
  data: null;
}
```

---

## File References

### Facade Files

- [`src/app/api/facades/course.facade.ts`](../src/app/api/facades/course.facade.ts)
- [`src/app/api/facades/enrollment.facade.ts`](../src/app/api/facades/enrollment.facade.ts)
- [`src/app/api/facades/identity.facade.ts`](../src/app/api/facades/identity.facade.ts)
- [`src/app/api/facades/lesson.facade.ts`](../src/app/api/facades/lesson.facade.ts)
- [`src/app/api/facades/progress.facade.ts`](../src/app/api/facades/progress.facade.ts)
- [`src/app/api/facades/student.facade.ts`](../src/app/api/facades/student.facade.ts)

### Component Files

- [`src/app/pages/muslim-tube/`](../src/app/pages/muslim-tube/) - Muslim Tube components (mock data)
- [`src/app/pages/academy/`](../src/app/pages/academy/) - Academy components
- [`src/app/pages/auth/`](../src/app/pages/auth/) - Authentication components

---

## Related Documentation

- [Architecture Overview](architecture.md)
- [Current Task](current-task.md)
- [API Integration Audit Report](../docs/API_INTEGRATION_AUDIT_REPORT_2026-02-21.md)
- [Swagger Specification](../swagger.json)
