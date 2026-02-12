/**
 * API Facade Layer
 * 
 * Exports all service facades that wrap generated API functions.
 * Use these facades instead of raw generated functions for:
 * - Consistent error handling
 * - RxJS-based reactive patterns
 * - Caching and loading states
 * - Business logic encapsulation
 * 
 * FACADES FOR SWAGGER-EXPOSED ENDPOINTS:
 * - IdentityFacade: Authentication (login, register, refresh, password management)
 * - CourseFacade: Course CRUD operations
 * - EnrollmentFacade: Student enrollments
 * - InstructorFacade: Instructor management
 * - LessonFacade: Lesson CRUD operations
 * - QuizFacade: Quiz management
 * - StudentFacade: Student profiles and dashboard
 * - AnswerFacade: Student answers to questions
 * 
 * LEGACY SERVICES (NOT IN SWAGGER - keep using ApiService):
 * - AdminNotes, Admins, Certificates (partial)
 * - EventRegistrations, Events, InquiryRequests
 * - Levels, MeetingRequests, MuslimTube
 * - Notifications, Options, Preachers
 * - QAs, Questions (partial), QuizAttempts
 * - StudentNotes, StudentQuestions, Tags
 */

// Core facades (Swagger-exposed endpoints)
export * from './identity.facade';
export * from './course.facade';
export * from './enrollment.facade';
export * from './instructor.facade';
export * from './lesson.facade';
export * from './quiz.facade';
export * from './student.facade';
export * from './answer.facade';
