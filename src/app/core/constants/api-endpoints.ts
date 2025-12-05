import { environment } from '../../../environments/environment';

/**
 * Base API URL for all endpoints (from environment)
 * @constant
 */
const BASE_URL = environment.apiBaseUrl;

/**
 * Type-safe API endpoint configuration
 * Provides structured access to all backend API routes
 */
export const API_ENDPOINTS = {
  adminNotes: {
    getByStudent: (studentId: string): string => `${BASE_URL}/AdminNotes/${studentId}`,
    create: (): string => `${BASE_URL}/AdminNotes`,
  },

  admins: {
    me: (): string => `${BASE_URL}/Admins/me`,
    getById: (userId: string): string => `${BASE_URL}/Admins/${userId}`,
    update: (): string => `${BASE_URL}/Admins/me`,
  },

  auth: {
    register: (): string => `${BASE_URL}/Authentication/register`,
    login: (): string => `${BASE_URL}/Authentication/login`,
    loginGoogle: (): string => `${BASE_URL}/Authentication/login/google`,
    loginFacebook: (): string => `${BASE_URL}/Authentication/login/facebook`,
  },

  certificates: {
    getById: (id: string): string => `${BASE_URL}/Certificates/${id}`,
    delete: (id: string): string => `${BASE_URL}/Certificates/${id}`,
    getByStudent: (studentId: string): string => `${BASE_URL}/Certificates/by-student/${studentId}`,
    create: (): string => `${BASE_URL}/Certificates`,
  },

  courses: {
    getAll: (): string => `${BASE_URL}/Courses`,
    create: (): string => `${BASE_URL}/Courses`,
    getById: (id: string): string => `${BASE_URL}/Courses/${id}`,
    update: (id: string): string => `${BASE_URL}/Courses/${id}`,
    delete: (id: string): string => `${BASE_URL}/Courses/${id}`,
  },

  enrollments: {
    getById: (id: string): string => `${BASE_URL}/Enrollments/${id}`,
    delete: (id: string): string => `${BASE_URL}/Enrollments/${id}`,
    getByCourse: (courseId: string): string => `${BASE_URL}/Enrollments/by-course/${courseId}`,
    getByStudent: (studentId: string): string => `${BASE_URL}/Enrollments/by-student/${studentId}`,
    create: (): string => `${BASE_URL}/Enrollments`,
    updateStatus: (id: string): string => `${BASE_URL}/Enrollments/${id}/status`,
  },

  eventRegistrations: {
    getById: (id: string): string => `${BASE_URL}/EventRegistrations/${id}`,
    delete: (id: string): string => `${BASE_URL}/EventRegistrations/${id}`,
    getByEvent: (eventId: string): string => `${BASE_URL}/EventRegistrations/by-event/${eventId}`,
    getByUser: (userId: string): string => `${BASE_URL}/EventRegistrations/by-user/${userId}`,
    create: (): string => `${BASE_URL}/EventRegistrations`,
    updateStatus: (id: string): string => `${BASE_URL}/EventRegistrations/${id}/status`,
  },

  events: {
    getAll: (): string => `${BASE_URL}/Events`,
    create: (): string => `${BASE_URL}/Events`,
    getById: (id: string): string => `${BASE_URL}/Events/${id}`,
    update: (id: string): string => `${BASE_URL}/Events/${id}`,
    delete: (id: string): string => `${BASE_URL}/Events/${id}`,
  },

  inquiryRequests: {
    getById: (id: string): string => `${BASE_URL}/InquiryRequests/${id}`,
    getByRequester: (requesterId: string): string =>
      `${BASE_URL}/InquiryRequests/by-requester/${requesterId}`,
    getByScholar: (scholarId: string): string =>
      `${BASE_URL}/InquiryRequests/by-scholar/${scholarId}`,
    create: (): string => `${BASE_URL}/InquiryRequests`,
    updateStatus: (id: string): string => `${BASE_URL}/InquiryRequests/${id}/status`,
    updateResponse: (id: string): string => `${BASE_URL}/InquiryRequests/${id}/response`,
  },

  instructors: {
    me: (): string => `${BASE_URL}/Instructors/me`,
    getById: (userId: string): string => `${BASE_URL}/Instructors/${userId}`,
    getAll: (): string => `${BASE_URL}/Instructors`,
    update: (): string => `${BASE_URL}/Instructors/me`,
  },

  lessons: {
    getAll: (): string => `${BASE_URL}/Lessons`,
    create: (): string => `${BASE_URL}/Lessons`,
    getById: (id: string): string => `${BASE_URL}/Lessons/${id}`,
    update: (id: string): string => `${BASE_URL}/Lessons/${id}`,
    delete: (id: string): string => `${BASE_URL}/Lessons/${id}`,
  },

  levels: {
    getAll: (): string => `${BASE_URL}/Levels`,
    create: (): string => `${BASE_URL}/Levels`,
    getById: (id: string): string => `${BASE_URL}/Levels/${id}`,
    update: (id: string): string => `${BASE_URL}/Levels/${id}`,
    delete: (id: string): string => `${BASE_URL}/Levels/${id}`,
  },

  meetingRequests: {
    getById: (id: string): string => `${BASE_URL}/MeetingRequests/${id}`,
    getByRequester: (requesterId: string): string =>
      `${BASE_URL}/MeetingRequests/by-requester/${requesterId}`,
    getByScholar: (scholarId: string): string =>
      `${BASE_URL}/MeetingRequests/by-scholar/${scholarId}`,
    create: (): string => `${BASE_URL}/MeetingRequests`,
    updateStatus: (id: string): string => `${BASE_URL}/MeetingRequests/${id}/status`,
    updateResponse: (id: string): string => `${BASE_URL}/MeetingRequests/${id}/response`,
  },

  muslimTube: {
    channels: {
      getAll: (): string => `${BASE_URL}/MuslimTube/channels`,
      create: (): string => `${BASE_URL}/MuslimTube/channels`,
      delete: (channelId: string): string => `${BASE_URL}/MuslimTube/channels/${channelId}`,
      resync: (channelId: string): string => `${BASE_URL}/MuslimTube/channels/${channelId}/resync`,
      getVideos: (channelId: string): string =>
        `${BASE_URL}/MuslimTube/channels/${channelId}/videos`,
    },
    videos: {
      getAll: (): string => `${BASE_URL}/MuslimTube/videos`,
      getById: (id: string): string => `${BASE_URL}/MuslimTube/videos/${id}`,
    },
  },

  notifications: {
    getByUser: (userId: string): string => `${BASE_URL}/Notifications/${userId}`,
    send: (): string => `${BASE_URL}/Notifications/send`,
    markRead: (notificationId: string): string =>
      `${BASE_URL}/Notifications/${notificationId}/mark-read`,
  },

  options: {
    getByQuestion: (questionId: string): string => `${BASE_URL}/Options/by-question/${questionId}`,
    create: (): string => `${BASE_URL}/Options`,
    update: (id: string): string => `${BASE_URL}/Options/${id}`,
    delete: (id: string): string => `${BASE_URL}/Options/${id}`,
  },

  preachers: {
    me: (): string => `${BASE_URL}/Preachers/me`,
    getById: (userId: string): string => `${BASE_URL}/Preachers/${userId}`,
    getAll: (): string => `${BASE_URL}/Preachers`,
    update: (): string => `${BASE_URL}/Preachers/me`,
  },

  qas: {
    getAll: (): string => `${BASE_URL}/QAs`,
    create: (): string => `${BASE_URL}/QAs`,
    getById: (id: string): string => `${BASE_URL}/QAs/${id}`,
    update: (id: string): string => `${BASE_URL}/QAs/${id}`,
    delete: (id: string): string => `${BASE_URL}/QAs/${id}`,
  },

  questions: {
    getAll: (): string => `${BASE_URL}/Questions`,
    create: (): string => `${BASE_URL}/Questions`,
    getById: (id: string): string => `${BASE_URL}/Questions/${id}`,
    update: (id: string): string => `${BASE_URL}/Questions/${id}`,
    delete: (id: string): string => `${BASE_URL}/Questions/${id}`,
  },

  quizAttempts: {
    getByQuiz: (quizId: string): string => `${BASE_URL}/QuizAttempts/by-quiz/${quizId}`,
    getByStudent: (studentId: string): string => `${BASE_URL}/QuizAttempts/by-student/${studentId}`,
    create: (): string => `${BASE_URL}/QuizAttempts`,
    complete: (attemptId: string): string => `${BASE_URL}/QuizAttempts/complete/${attemptId}`,
  },

  quizzes: {
    getAll: (): string => `${BASE_URL}/Quizzes`,
    create: (): string => `${BASE_URL}/Quizzes`,
    getById: (id: string): string => `${BASE_URL}/Quizzes/${id}`,
    update: (id: string): string => `${BASE_URL}/Quizzes/${id}`,
    delete: (id: string): string => `${BASE_URL}/Quizzes/${id}`,
  },

  studentNotes: {
    getById: (id: string): string => `${BASE_URL}/StudentNotes/${id}`,
    delete: (id: string): string => `${BASE_URL}/StudentNotes/${id}`,
    getByLesson: (lessonId: string): string => `${BASE_URL}/StudentNotes/by-lesson/${lessonId}`,
    create: (): string => `${BASE_URL}/StudentNotes`,
  },

  studentQuestions: {
    getById: (id: string): string => `${BASE_URL}/StudentQuestions/${id}`,
    delete: (id: string): string => `${BASE_URL}/StudentQuestions/${id}`,
    getByLesson: (lessonId: string): string => `${BASE_URL}/StudentQuestions/by-lesson/${lessonId}`,
    getByStudent: (studentId: string): string =>
      `${BASE_URL}/StudentQuestions/by-student/${studentId}`,
    create: (): string => `${BASE_URL}/StudentQuestions`,
    answer: (id: string): string => `${BASE_URL}/StudentQuestions/${id}/answer`,
  },

  students: {
    me: (): string => `${BASE_URL}/Students/me`,
    getById: (userId: string): string => `${BASE_URL}/Students/${userId}`,
    getAll: (): string => `${BASE_URL}/Students`,
    dashboard: (): string => `${BASE_URL}/Students/dashboard`,
    update: (): string => `${BASE_URL}/Students/me`,
  },

  tags: {
    getAll: (): string => `${BASE_URL}/Tags`,
    create: (): string => `${BASE_URL}/Tags`,
    getById: (id: string): string => `${BASE_URL}/Tags/${id}`,
    update: (id: string): string => `${BASE_URL}/Tags/${id}`,
    delete: (id: string): string => `${BASE_URL}/Tags/${id}`,
  },
} as const;
