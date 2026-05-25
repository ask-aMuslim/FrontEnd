# API Endpoint Documentation

This document provides a comprehensive inventory of all HTTP/API requests initiated by the application, organized by feature module and page.

---

## 1. Environment Configuration

The application uses two primary API base URLs:

| Environment | Base URL |
| :--- | :--- |
| **Primary API** | `https://api.askamuslim.com` (or `/backend` on Netlify) |
| **Assistant API** | `https://readings-handed-poem-packaging.trycloudflare.com` (or `/assistant-api` on Netlify) |

---

## 2. API Endpoint Inventory

### A. Academy Module (`/academy`)

| Component | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Academy Home** | `/api/Levels` | GET | List academy levels |
| | `/api/Courses/roadmap/{levelId}` | GET | Load level roadmap |
| **Course Detail** | `/api/Courses/{id}` | GET | Get course details |
| | `/api/Quizzes?CourseId={id}` | GET | Get course quizzes |
| | `/api/Enrollments` | POST | Enroll in course |
| **Lesson Player** | `/api/Lessons/{id}` | GET | Get lesson content |
| | `/api/StudentNotes/by-lesson/{id}` | GET | Load student notes |
| | `/api/StudentNotes` | POST | Add new note |
| | `/api/StudentNotes/{id}` | PUT/DEL | Update/Delete note |
| | `/api/Progress/lesson/complete` | POST | Sync progress |
| | `/api/LessonFeedback` | POST | Submit feedback |
| **Quiz** | `/api/QuizAttempts` | POST | Start quiz attempt |
| | `/api/QuizAttempts/complete/{id}` | PUT | Finish quiz attempt |

### B. Question & Answer (`/question-and-answer`)

| Component | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Topics/List** | `/api/Tags` | GET | List category tags |
| | `/api/QAs` | GET | List questions |
| **Question Detail**| `/api/QAs/{id}` | GET | Get full question/answer |
| **Ask Assistant** | `/api/users/{userId}/threads` | GET | List user threads |
| | `/api/threads/{threadId}` | GET | Get thread details |
| | `/api/chat?stream=true` | POST | Stream chat response |

### C. Events (`/events`)

| Component | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **List/Home** | `/api/Events` | GET | List all events |
| | `/api/Events/next` | GET | Get featured event |
| **Detail** | `/api/EventRegistrations` | POST | Register for event |
| | `/api/EventRegistrations/my-status/{id}` | GET | Check registration |
| | `/api/EventRegistrations/park-question` | PUT | Submit event question |

### D. Forms (`/forms`)

| Component | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **List** | `/api/Forms` | GET | List available forms |
| **Detail** | `/api/Forms/{formId}/submissions` | POST | Submit form (multipart) |

### E. Mosques (`/mosques`)

| Component | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **List** | `/api/Mosques` | GET | Search/List mosques |
| **Nearby** | `/api/Mosques/nearby` | GET | Search nearby |
| **Detail** | `/api/Mosques/{id}` | GET | Get specific mosque |

### F. Profile & Authentication (`/profile`, `/login`, `/register`)

| Component | Endpoint | Method | Purpose |
| :--- | :--- | :--- | :--- |
| **Identity** | `/api/Authentication/register` | POST | User registration |
| | `/api/Authentication/login` | POST | User login |
| | `/api/Authentication/logout` | POST | User logout |
| **Profile** | `/api/StudentProfiles/me` | GET/PUT | Manage profile data |
| | `/api/Media/upload` | POST | Upload avatar |

---

## 3. Global Interceptors

All requests passing through the central `ApiService` are handled by these interceptors:

*   **`AuthInterceptor`**: Automatically injects JWT Bearer tokens into the `Authorization` header. Handles token refreshing on 401 errors.
*   **`ErrorInterceptor`**: Global error handling; redirects to `/login` on authentication failures.
*   **`LoadingInterceptor`**: Triggers global loading spinners.

*Note: Specific requests can opt-out of these interceptors using `HttpContextToken` (e.g., `SKIP_AUTH`).*
