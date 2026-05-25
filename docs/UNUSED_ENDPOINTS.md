# Unused API Endpoints

This document lists generated API endpoints (from `src/app/api/fn/`) that are **not currently utilized** by any application facade, service, or component. 

These endpoints exist in the generated API client but are likely candidates for removal or refactoring as they are not consumed by the frontend application.

> **Note:** Please verify these endpoints are not intended for future use or required by other parts of the system before deletion.

## Unused Generated Endpoints

| Category | Endpoint Path | Method |
| :--- | :--- | :--- |
| **Achievements** | `/api/Achievements` | GET/POST |
| | `/api/Achievements/{hijriYear}` | GET |
| | `/api/Achievements/{hijriYear}/{hijriMonth}` | PUT |
| **Admin Notes** | `/api/AdminNotes/{studentId}` | GET |
| | `/api/AdminNotes` | POST |
| **Admins** | `/api/Admins/me` | GET/PUT |
| | `/api/Admins/{userId}` | GET |
| | `/api/Admins` | GET |
| **Certificates** | `/api/Certificates/{id}` | GET/DELETE |
| | `/api/Certificates/by-student/{studentId}` | GET |
| | `/api/Certificates` | POST |
| **Contact Us** | `/api/ContactUs` | POST |
| **Courses** | `/api/Courses/{id}/prerequisites` | PUT/DELETE |
| **Enrollments** | `/api/Enrollments/my` | GET |
| | `/api/Enrollments/uncompleted` | GET |
| **Event Registrations**| `/api/EventRegistrations/{id}` | GET/DELETE |
| | `/api/EventRegistrations/by-event/{eventId}` | GET |
| | `/api/EventRegistrations/by-user/{userId}` | GET |
| **Forms** | `/api/Forms/{formId}/submissions` | GET |
| **Inquiry Requests** | `/api/InquiryRequests` | GET |
| **Instructors** | `/api/Instructors/me` | GET/PUT |
| | `/api/Instructors/{userId}` | GET |
| | `/api/Instructors` | GET |
| **Languages** | `/api/Languages` | GET |
| **Learn Islam Req** | `/api/LearnIslamRequests` | GET/POST/PUT |
| **Lesson Feedback** | `/api/LessonFeedback/{id}` | GET |
| **Lessons** | `/api/Lessons/{id}/duration` | PUT |
| **Levels** | `/api/Levels` | POST/PUT/DELETE |
| **Moderators** | `/api/Moderators` | GET/POST/PUT |
| **Mosques** | `/api/Mosques` | POST/PUT/DELETE |
| | `/api/Mosques/{id}/activate` | PUT |
| | `/api/Mosques/{id}/deactivate` | PUT |
| | `/api/Mosques/{id}/verify` | PUT |
| **Muslim Tube** | `/api/MuslimTube/channels` | POST |
| | `/api/MuslimTube/channels/{channelId}/resync` | POST |
| | `/api/MuslimTube/channels/{channelId}` | DELETE |
| **Newsletters** | `/api/Newsletters/send` | POST |
| **Permissions** | `/api/Permissions/*` | ALL |
| **Preachers** | `/api/Preachers/*` | ALL |
| **Reports** | `/api/Reports` | GET/POST/DELETE/PUT |
| **Roles** | `/api/Roles` | GET |
| **Statistics** | `/api/Statistics` | GET |
| **Student Questions**| `/api/StudentQuestions/{id}` | GET/DELETE |
| | `/api/StudentQuestions/{id}/answer` | PUT |
| **Students** | `/api/Students/me` | PUT |
| | `/api/Students/{id}/status` | PUT |
| **Volunteers** | `/api/Volunteers` | GET/POST |

---

### Cleanup Recommendations
1. **Verification**: Confirm with the backend team that these endpoints are indeed obsolete.
2. **Code Removal**:
    - Remove the unused generated functions from `src/app/api/fn/`.
    - If the `facade` or `service` layer is unused, consider removing the facade/service entirely.
3. **Configuration**: If using `ng-openapi-gen`, update the configuration to exclude these tags if they are not needed in the future to reduce bundle size and maintenance overhead.
