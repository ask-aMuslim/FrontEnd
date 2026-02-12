import { environment } from '../../../environments/environment';

/**
 * Base API URL for all endpoints (from environment)
 * @constant
 */
// Normalize base URL to avoid accidental double-slashes when joining paths
const BASE_URL = environment.apiBaseUrl.replaceAll(/\/+$/g, '');

/**
 * Encode path parameters safely and consistently
 */
const encodeParam = (v: string | number) => encodeURIComponent(String(v));

/**
 * Build a full route safely from a path fragment. Ensures exactly one slash
 * between base and path and preserves any protocol/host in BASE_URL.
 */
const route = (path: string) => {
  if (!path.startsWith('/')) path = '/' + path;
  return `${BASE_URL}${path}`;
};

/**
 * Type-safe API endpoint configuration
 * Provides structured access to all backend API routes
 */
export const API_ENDPOINTS = {
  adminNotes: {
    getByStudent: (studentId: string | number): string =>
      route(`/AdminNotes/${encodeParam(studentId)}`),
    create: (): string => route('/AdminNotes'),
  },

  admins: {
    me: (): string => route('/Admins/me'),
    getById: (userId: string | number): string => route(`/Admins/${encodeParam(userId)}`),
    update: (): string => route('/Admins/me'),
  },

  auth: {
    register: (): string => `${BASE_URL}/Authentication/register`,
    login: (): string => `${BASE_URL}/Authentication/login`,
    loginGoogle: (): string => `${BASE_URL}/Authentication/login/google`,
    loginFacebook: (): string => `${BASE_URL}/Authentication/login/facebook`,
  },

  certificates: {
    getById: (id: string | number): string => route(`/Certificates/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/Certificates/${encodeParam(id)}`),
    getByStudent: (studentId: string | number): string =>
      route(`/Certificates/by-student/${encodeParam(studentId)}`),
    create: (): string => route('/Certificates'),
  },

  courses: {
    getAll: (): string => route('/Courses'),
    create: (): string => route('/Courses'),
    getById: (id: string | number): string => route(`/Courses/${encodeParam(id)}`),
    update: (id: string | number): string => route(`/Courses/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/Courses/${encodeParam(id)}`),
  },

  enrollments: {
    getById: (id: string | number): string => route(`/Enrollments/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/Enrollments/${encodeParam(id)}`),
    getByCourse: (courseId: string | number): string =>
      route(`/Enrollments/by-course/${encodeParam(courseId)}`),
    getByStudent: (studentId: string | number): string =>
      route(`/Enrollments/by-student/${encodeParam(studentId)}`),
    create: (): string => route('/Enrollments'),
    updateStatus: (id: string | number): string => route(`/Enrollments/${encodeParam(id)}/status`),
  },

  eventRegistrations: {
    getById: (id: string | number): string => route(`/EventRegistrations/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/EventRegistrations/${encodeParam(id)}`),
    getByEvent: (eventId: string | number): string =>
      route(`/EventRegistrations/by-event/${encodeParam(eventId)}`),
    getByUser: (userId: string | number): string =>
      route(`/EventRegistrations/by-user/${encodeParam(userId)}`),
    create: (): string => route('/EventRegistrations'),
    updateStatus: (id: string | number): string =>
      route(`/EventRegistrations/${encodeParam(id)}/status`),
  },

  events: {
    getAll: (): string => route('/Events'),
    create: (): string => route('/Events'),
    getById: (id: string | number): string => route(`/Events/${encodeParam(id)}`),
    update: (id: string | number): string => route(`/Events/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/Events/${encodeParam(id)}`),
  },

  inquiryRequests: {
    getById: (id: string | number): string => route(`/InquiryRequests/${encodeParam(id)}`),
    getByRequester: (requesterId: string | number): string =>
      route(`/InquiryRequests/by-requester/${encodeParam(requesterId)}`),
    getByScholar: (scholarId: string | number): string =>
      route(`/InquiryRequests/by-scholar/${encodeParam(scholarId)}`),
    create: (): string => route('/InquiryRequests'),
    updateStatus: (id: string | number): string =>
      route(`/InquiryRequests/${encodeParam(id)}/status`),
    updateResponse: (id: string | number): string =>
      route(`/InquiryRequests/${encodeParam(id)}/response`),
  },

  instructors: {
    me: (): string => route('/Instructors/me'),
    getById: (userId: string | number): string => route(`/Instructors/${encodeParam(userId)}`),
    getAll: (): string => route('/Instructors'),
    update: (): string => route('/Instructors/me'),
  },

  lessons: {
    getAll: (): string => route('/Lessons'),
    create: (): string => route('/Lessons'),
    getById: (id: string | number): string => route(`/Lessons/${encodeParam(id)}`),
    update: (id: string | number): string => route(`/Lessons/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/Lessons/${encodeParam(id)}`),
  },

  levels: {
    getAll: (): string => route('/Levels'),
    create: (): string => route('/Levels'),
    getById: (id: string | number): string => route(`/Levels/${encodeParam(id)}`),
    update: (id: string | number): string => route(`/Levels/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/Levels/${encodeParam(id)}`),
  },

  meetingRequests: {
    getById: (id: string | number): string => route(`/MeetingRequests/${encodeParam(id)}`),
    getByRequester: (requesterId: string | number): string =>
      route(`/MeetingRequests/by-requester/${encodeParam(requesterId)}`),
    getByScholar: (scholarId: string | number): string =>
      route(`/MeetingRequests/by-scholar/${encodeParam(scholarId)}`),
    create: (): string => route('/MeetingRequests'),
    updateStatus: (id: string | number): string =>
      route(`/MeetingRequests/${encodeParam(id)}/status`),
    updateResponse: (id: string | number): string =>
      route(`/MeetingRequests/${encodeParam(id)}/response`),
  },

  muslimTube: {
    channels: {
      getAll: (): string => route('/MuslimTube/channels'),
      create: (): string => route('/MuslimTube/channels'),
      delete: (channelId: string | number): string =>
        route(`/MuslimTube/channels/${encodeParam(channelId)}`),
      resync: (channelId: string | number): string =>
        route(`/MuslimTube/channels/${encodeParam(channelId)}/resync`),
      getVideos: (channelId: string | number): string =>
        route(`/MuslimTube/channels/${encodeParam(channelId)}/videos`),
    },
    videos: {
      getAll: (): string => route('/MuslimTube/videos'),
      getById: (id: string | number): string => route(`/MuslimTube/videos/${encodeParam(id)}`),
    },
  },

  notifications: {
    getByUser: (userId: string | number): string => route(`/Notifications/${encodeParam(userId)}`),
    send: (): string => route('/Notifications/send'),
    markRead: (notificationId: string | number): string =>
      route(`/Notifications/${encodeParam(notificationId)}/mark-read`),
  },

  options: {
    getByQuestion: (questionId: string | number): string =>
      route(`/Options/by-question/${encodeParam(questionId)}`),
    create: (): string => route('/Options'),
    update: (id: string | number): string => route(`/Options/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/Options/${encodeParam(id)}`),
  },

  preachers: {
    me: (): string => route('/Preachers/me'),
    getById: (userId: string | number): string => route(`/Preachers/${encodeParam(userId)}`),
    getAll: (): string => route('/Preachers'),
    update: (): string => route('/Preachers/me'),
  },

  qas: {
    getAll: (): string => route('/QAs'),
    create: (): string => route('/QAs'),
    getById: (id: string | number): string => route(`/QAs/${encodeParam(id)}`),
    update: (id: string | number): string => route(`/QAs/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/QAs/${encodeParam(id)}`),
  },

  questions: {
    getAll: (): string => route('/Questions'),
    create: (): string => route('/Questions'),
    getById: (id: string | number): string => route(`/Questions/${encodeParam(id)}`),
    update: (id: string | number): string => route(`/Questions/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/Questions/${encodeParam(id)}`),
  },

  quizAttempts: {
    getByQuiz: (quizId: string | number): string =>
      route(`/QuizAttempts/by-quiz/${encodeParam(quizId)}`),
    getByStudent: (studentId: string | number): string =>
      route(`/QuizAttempts/by-student/${encodeParam(studentId)}`),
    create: (): string => route('/QuizAttempts'),
    complete: (attemptId: string | number): string =>
      route(`/QuizAttempts/complete/${encodeParam(attemptId)}`),
  },

  quizzes: {
    getAll: (): string => route('/Quizzes'),
    create: (): string => route('/Quizzes'),
    getById: (id: string | number): string => route(`/Quizzes/${encodeParam(id)}`),
    update: (id: string | number): string => route(`/Quizzes/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/Quizzes/${encodeParam(id)}`),
  },

  studentNotes: {
    getById: (id: string | number): string => route(`/StudentNotes/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/StudentNotes/${encodeParam(id)}`),
    getByLesson: (lessonId: string | number): string =>
      route(`/StudentNotes/by-lesson/${encodeParam(lessonId)}`),
    create: (): string => route('/StudentNotes'),
  },

  studentQuestions: {
    getById: (id: string | number): string => route(`/StudentQuestions/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/StudentQuestions/${encodeParam(id)}`),
    getByLesson: (lessonId: string | number): string =>
      route(`/StudentQuestions/by-lesson/${encodeParam(lessonId)}`),
    getByStudent: (studentId: string | number): string =>
      route(`/StudentQuestions/by-student/${encodeParam(studentId)}`),
    create: (): string => route('/StudentQuestions'),
    answer: (id: string | number): string => route(`/StudentQuestions/${encodeParam(id)}/answer`),
  },

  students: {
    me: (): string => route('/Students/me'),
    getById: (userId: string | number): string => route(`/Students/${encodeParam(userId)}`),
    getAll: (): string => route('/Students'),
    dashboard: (): string => route('/Students/dashboard'),
    update: (): string => route('/Students/me'),
  },

  tags: {
    getAll: (): string => route('/Tags'),
    create: (): string => route('/Tags'),
    getById: (id: string | number): string => route(`/Tags/${encodeParam(id)}`),
    update: (id: string | number): string => route(`/Tags/${encodeParam(id)}`),
    delete: (id: string | number): string => route(`/Tags/${encodeParam(id)}`),
  },
} as const;
