# API Models Analysis

**Generated:** 2026-02-21  
**Source:** `src/app/api/models/` (ng-openapi-gen generated from swagger.json)  
**API Base URL:** `https://aam-api.ask-a-muslim.com/`

---

## Table of Contents

1. [Enum Types Summary](#1-enum-types-summary)
2. [Command Models Summary](#2-command-models-summary)
3. [Response Models Summary](#3-response-models-summary)
4. [Key Observations](#4-key-observations)

---

## 1. Enum Types Summary

All enums are generated as TypeScript union types with numeric values. Each enum also has a corresponding array constant for iteration purposes.

### UserRole

**File:** [`user-role.ts`](src/app/api/models/user-role.ts)

```typescript
export type UserRole = 1 | 2 | 3 | 4 | 5;
```

| Value | Description (Inferred) |
| ----- | ---------------------- |
| 1     | Student                |
| 2     | Instructor             |
| 3     | Admin                  |
| 4     | Moderator              |
| 5     | Preacher               |

---

### ReligiousStatus

**File:** [`religious-status.ts`](src/app/api/models/religious-status.ts)

```typescript
export type ReligiousStatus = 1 | 2 | 3;
```

| Value | Description (Inferred) |
| ----- | ---------------------- |
| 1     | Muslim (Born)          |
| 2     | Muslim (Convert)       |
| 3     | Non-Muslim             |

---

### Permission

**File:** [`permission.ts`](src/app/api/models/permission.ts)

```typescript
export type Permission =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 8
  | 16
  | 32
  | 64
  | 128
  | 256
  | 512
  | 1024
  | 2048
  | 4096
  | 8192
  | 16384
  | 32768
  | 65536
  | 130688
  | 131072
  | 262144
  | 524288
  | 1048576
  | 2097152
  | 4194304
  | 8388608
  | 16777216
  | 33554432
  | 67108864
  | 134217728
  | 268435456
  | 536870912
  | 1073741824
  | 2147483648
  | 4294967296
  | 8589934592
  | 17179869184
  | 34359738368
  | 68719476736
  | 137417850880
  | 137438953472
  | 274877906944
  | 549755813888
  | 1099511627776
  | 2199023255552
  | 4260607557632
  | 4398046511104
  | 8796093022208
  | 17592186044416
  | 35184372088832
  | 70368744177664
  | 136339441844224
  | 140737488355328
  | 281474976710656
  | 562949953421312
  | 1125899906842624
  | 2251799813685248
  | 4503599627370496
  | 9007199254740992
  | 18014398509481984
  | 36028797018963970
  | 72057594037927940
  | 144115188075855870
  | 288230376151711740
  | 558446353793941500
  | 576460752303423500
  | 1152921504606847000
  | 2305843009213694000
  | 4611686018427388000
  | -9223372036854776000
  | -1;
```

**Note:** Uses **flags/bitmask pattern** - values are powers of 2 for bitwise operations. Negative values represent special cases (likely "All" or "None" flags).

---

### EnrollmentStatus

**File:** [`enrollment-status.ts`](src/app/api/models/enrollment-status.ts)

```typescript
export type EnrollmentStatus = 1 | 2 | 3 | 4;
```

| Value | Description (Inferred) |
| ----- | ---------------------- |
| 1     | Active                 |
| 2     | Completed              |
| 3     | Dropped                |
| 4     | Suspended              |

---

### EventStatus

**File:** [`event-status.ts`](src/app/api/models/event-status.ts)

```typescript
export type EventStatus = 1 | 2 | 3 | 4;
```

| Value | Description (Inferred) |
| ----- | ---------------------- |
| 1     | Upcoming               |
| 2     | Ongoing                |
| 3     | Completed              |
| 4     | Cancelled              |

---

### LessonType

**File:** [`lesson-type.ts`](src/app/api/models/lesson-type.ts)

```typescript
export type LessonType = 1 | 2 | 3 | 4;
```

| Value | Description (Inferred) |
| ----- | ---------------------- |
| 1     | Video                  |
| 2     | Text                   |
| 3     | Quiz                   |
| 4     | Interactive            |

---

### LevelDifficulty

**File:** [`level-difficulty.ts`](src/app/api/models/level-difficulty.ts)

```typescript
export type LevelDifficulty = 1 | 2 | 3 | 4;
```

| Value | Description (Inferred) |
| ----- | ---------------------- |
| 1     | Beginner               |
| 2     | Intermediate           |
| 3     | Advanced               |
| 4     | Expert                 |

---

### Language

**File:** [`language.ts`](src/app/api/models/language.ts)

```typescript
export type Language = 1 | 2 | 3 | 4 | 5;
```

| Value | Description (Inferred) |
| ----- | ---------------------- |
| 1     | English                |
| 2     | Arabic                 |
| 3     | French                 |
| 4     | Spanish                |
| 5     | Urdu                   |

---

### MeetingInquiryRequestStatus

**File:** [`meeting-inquiry-request-status.ts`](src/app/api/models/meeting-inquiry-request-status.ts)

```typescript
export type MeetingInquiryRequestStatus = 1 | 2 | 3 | 4 | 5;
```

| Value | Description (Inferred) |
| ----- | ---------------------- |
| 1     | Pending                |
| 2     | InProgress             |
| 3     | Resolved               |
| 4     | Rejected               |
| 5     | Closed                 |

---

### MeetingInquiryTopic

**File:** [`meeting-inquiry-topic.ts`](src/app/api/models/meeting-inquiry-topic.ts)

```typescript
export type MeetingInquiryTopic = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
```

| Value | Description (Inferred) |
| ----- | ---------------------- |
| 1     | General Question       |
| 2     | Prayer Guidance        |
| 3     | Quran Interpretation   |
| 4     | Islamic Rulings        |
| 5     | Marriage/Family        |
| 6     | Business/Ethics        |
| 7     | Conversion             |
| 8     | Other                  |

---

### QuizTargetType

**File:** [`quiz-target-type.ts`](src/app/api/models/quiz-target-type.ts)

```typescript
export type QuizTargetType = 1 | 2 | 3;
```

| Value | Description (Inferred) |
| ----- | ---------------------- |
| 1     | Course                 |
| 2     | Lesson                 |
| 3     | Level                  |

---

## 2. Command Models Summary

Commands are grouped by domain. All properties are optional (marked with `?`) as they're used in request bodies.

### Authentication Domain

| Command                      | File                                                                                  | Properties                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **LoginCommand**             | [`login-command.ts`](src/app/api/models/login-command.ts)                             | `email?: string`, `password?: string`                                                                                             |
| **LoginAdminCommand**        | [`login-admin-command.ts`](src/app/api/models/login-admin-command.ts)                 | `email?: string`, `password?: string`                                                                                             |
| **LoginWithGoogleCommand**   | [`login-with-google-command.ts`](src/app/api/models/login-with-google-command.ts)     | `idToken?: string`                                                                                                                |
| **LoginWithFacebookCommand** | [`login-with-facebook-command.ts`](src/app/api/models/login-with-facebook-command.ts) | `accessToken?: string`                                                                                                            |
| **RegisterCommand**          | [`register-command.ts`](src/app/api/models/register-command.ts)                       | `email?: string`, `firstName?: string`, `lastName?: string`, `password?: string`, `religion?: ReligiousStatus`, `role?: UserRole` |
| **ForgotPasswordCommand**    | [`forgot-password-command.ts`](src/app/api/models/forgot-password-command.ts)         | `email?: string`                                                                                                                  |
| **ResetPasswordCommand**     | [`reset-password-command.ts`](src/app/api/models/reset-password-command.ts)           | `email?: string`, `newPassword?: string`, `otp?: string`                                                                          |
| **VerifyOtpCommand**         | [`verify-otp-command.ts`](src/app/api/models/verify-otp-command.ts)                   | `email?: string`, `otp?: string`                                                                                                  |
| **RefreshTokenCommand**      | [`refresh-token-command.ts`](src/app/api/models/refresh-token-command.ts)             | `refreshToken?: string`                                                                                                           |

---

### Course Domain

| Command                          | File                                                                                          | Properties                                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CreateCourseCommand**          | [`create-course-command.ts`](src/app/api/models/create-course-command.ts)                     | `description?: string \| null`, `isPublished?: boolean`, `levelId?: string`, `order?: number`, `tagIds?: string[]`, `thumbnailUrl?: string \| null`, `title?: string` |
| **UpdateCourseCommand**          | [`update-course-command.ts`](src/app/api/models/update-course-command.ts)                     | `description?: string \| null`, `isPublished?: boolean`, `levelId?: string`, `order?: number`, `tagIds?: string[]`, `thumbnailUrl?: string \| null`, `title?: string` |
| **AddCoursePrerequisiteCommand** | [`add-course-prerequisite-command.ts`](src/app/api/models/add-course-prerequisite-command.ts) | `order?: number`, `prerequisiteCourseId?: string`                                                                                                                     |

---

### Level Domain

| Command                | File                                                                    | Properties                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **CreateLevelCommand** | [`create-level-command.ts`](src/app/api/models/create-level-command.ts) | `description?: string \| null`, `difficulty?: LevelDifficulty`, `isPublished?: boolean`, `order?: number`, `title?: string` |
| **UpdateLevelCommand** | [`update-level-command.ts`](src/app/api/models/update-level-command.ts) | `description?: string \| null`, `difficulty?: LevelDifficulty`, `isPublished?: boolean`, `order?: number`, `title?: string` |

---

### Lesson Domain

| Command                 | File                                                                      | Properties                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CreateLessonCommand** | [`create-lesson-command.ts`](src/app/api/models/create-lesson-command.ts) | `contentJson?: string \| null`, `contentUrl?: string \| null`, `courseId?: string`, `description?: string \| null`, `isPublished?: boolean`, `order?: number`, `thumbnailUrl?: string \| null`, `title?: string`, `transcript?: string \| null`, `type?: LessonType` |
| **UpdateLessonCommand** | [`update-lesson-command.ts`](src/app/api/models/update-lesson-command.ts) | `contentJson?: string \| null`, `contentUrl?: string \| null`, `courseId?: string`, `description?: string \| null`, `isPublished?: boolean`, `order?: number`, `thumbnailUrl?: string \| null`, `title?: string`, `transcript?: string \| null`, `type?: LessonType` |

---

### Enrollment Domain

| Command                           | File                                                                                            | Properties                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **CreateEnrollmentCommand**       | [`create-enrollment-command.ts`](src/app/api/models/create-enrollment-command.ts)               | `courseId?: string`, `studentId?: string` |
| **UpdateEnrollmentStatusCommand** | [`update-enrollment-status-command.ts`](src/app/api/models/update-enrollment-status-command.ts) | `status?: EnrollmentStatus`               |

---

### Event Domain

| Command                                  | File                                                                                                            | Properties                                                                                                                                                                                                                                                |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CreateEventCommand**                   | [`create-event-command.ts`](src/app/api/models/create-event-command.ts)                                         | `description?: string \| null`, `endDateTime?: string`, `imageUrl?: string \| null`, `isPublished?: boolean`, `meetingLink?: string \| null`, `speakerName?: string \| null`, `startDateTime?: string`, `targetRole?: UserRole \| null`, `title?: string` |
| **UpdateEventCommand**                   | [`update-event-command.ts`](src/app/api/models/update-event-command.ts)                                         | `description?: string \| null`, `endDateTime?: string`, `imageUrl?: string \| null`, `isPublished?: boolean`, `meetingLink?: string \| null`, `speakerName?: string \| null`, `startDateTime?: string`, `title?: string`                                  |
| **CreateEventRegistrationCommand**       | [`create-event-registration-command.ts`](src/app/api/models/create-event-registration-command.ts)               | `eventId?: string`, `questionText?: string \| null`, `userId?: string`                                                                                                                                                                                    |
| **UpdateEventRegistrationStatusCommand** | [`update-event-registration-status-command.ts`](src/app/api/models/update-event-registration-status-command.ts) | `status?: EventStatus`                                                                                                                                                                                                                                    |

---

### Quiz Domain

| Command                        | File                                                                                      | Properties                                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CreateQuizCommand**          | [`create-quiz-command.ts`](src/app/api/models/create-quiz-command.ts)                     | `courseId?: string \| null`, `lessonId?: string \| null`, `levelId?: string \| null`, `targetType?: QuizTargetType`, `title?: string`, `totalMarks?: number` |
| **UpdateQuizCommand**          | [`update-quiz-command.ts`](src/app/api/models/update-quiz-command.ts)                     | `courseId?: string \| null`, `lessonId?: string \| null`, `levelId?: string \| null`, `targetType?: QuizTargetType`, `title?: string`, `totalMarks?: number` |
| **CreateQuizAttemptCommand**   | [`create-quiz-attempt-command.ts`](src/app/api/models/create-quiz-attempt-command.ts)     | `quizId?: string`, `studentId?: string`                                                                                                                      |
| **CompleteQuizAttemptCommand** | [`complete-quiz-attempt-command.ts`](src/app/api/models/complete-quiz-attempt-command.ts) | `answers?: QuizAnswerDto[]`                                                                                                                                  |

**Supporting DTO:**

```typescript
// quiz-answer-dto.ts
export interface QuizAnswerDto {
  questionId?: string;
  selectedOptionId?: string;
}
```

---

### Question & Option Domain

| Command                   | File                                                                          | Properties                                                    |
| ------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **CreateQuestionCommand** | [`create-question-command.ts`](src/app/api/models/create-question-command.ts) | `quizId?: string`, `text?: string`                            |
| **UpdateQuestionCommand** | [`update-question-command.ts`](src/app/api/models/update-question-command.ts) | `text?: string`                                               |
| **CreateOptionCommand**   | [`create-option-command.ts`](src/app/api/models/create-option-command.ts)     | `isCorrect?: boolean`, `questionId?: string`, `text?: string` |
| **UpdateOptionCommand**   | [`update-option-command.ts`](src/app/api/models/update-option-command.ts)     | `isCorrect?: boolean`, `text?: string`                        |

---

### Student Profile Domain

| Command                         | File                                                                                        | Properties                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CreateStudentProfileCommand** | [`create-student-profile-command.ts`](src/app/api/models/create-student-profile-command.ts) | `address?: string \| null`, `bio?: string \| null`, `country?: string \| null`, `countryCode?: string \| null`, `dateOfBirth?: string \| null`, `dateOfIslamConversion?: string \| null`, `oldReligion?: string \| null`, `phoneNumber?: string \| null`, `reasonForConversion?: string \| null`                                                                                         |
| **UpdateStudentProfileCommand** | [`update-student-profile-command.ts`](src/app/api/models/update-student-profile-command.ts) | `address?: string \| null`, `bio?: string \| null`, `country?: string \| null`, `countryCode?: string \| null`, `dateOfBirth?: string \| null`, `dateOfIslamConversion?: string \| null`, `firstName?: string \| null`, `imageUrl?: string \| null`, `lastName?: string \| null`, `oldReligion?: string \| null`, `phoneNumber?: string \| null`, `reasonForConversion?: string \| null` |
| **UpdateStudentStatusCommand**  | [`update-student-status-command.ts`](src/app/api/models/update-student-status-command.ts)   | `isActive?: boolean`                                                                                                                                                                                                                                                                                                                                                                     |

---

### Instructor Profile Domain

| Command                            | File                                                                                              | Properties                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UpdateInstructorProfileCommand** | [`update-instructor-profile-command.ts`](src/app/api/models/update-instructor-profile-command.ts) | `bio?: string \| null`, `firstName?: string \| null`, `imageUrl?: string \| null`, `lastName?: string \| null`, `linkedInProfile?: string \| null`, `phoneNumber?: string \| null`, `specialization?: string \| null`, `website?: string \| null`, `yearsOfExperience?: number \| null` |

---

### Preacher Profile Domain

| Command                          | File                                                                                          | Properties                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UpdatePreacherProfileCommand** | [`update-preacher-profile-command.ts`](src/app/api/models/update-preacher-profile-command.ts) | `bio?: string \| null`, `certifications?: string \| null`, `firstName?: string \| null`, `imageUrl?: string \| null`, `lastName?: string \| null`, `linkedInProfile?: string \| null`, `organization?: string \| null`, `phoneNumber?: string \| null`, `specialization?: string \| null`, `website?: string \| null`, `yearsOfExperience?: number \| null` |

---

### Admin Domain

| Command                       | File                                                                                    | Properties                                                                                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CreateAdminCommand**        | [`create-admin-command.ts`](src/app/api/models/create-admin-command.ts)                 | `bio?: string \| null`, `email?: string`, `firstName?: string`, `imageUrl?: string \| null`, `lastName?: string`, `phoneNumber?: string \| null`, `role?: string`             |
| **UpdateAdminProfileCommand** | [`update-admin-profile-command.ts`](src/app/api/models/update-admin-profile-command.ts) | `bio?: string \| null`, `department?: string \| null`, `firstName?: string \| null`, `imageUrl?: string \| null`, `lastName?: string \| null`, `phoneNumber?: string \| null` |

---

### Inquiry Request Domain

| Command                                 | File                                                                                                          | Properties                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **CreateInquiryRequestCommand**         | [`create-inquiry-request-command.ts`](src/app/api/models/create-inquiry-request-command.ts)                   | `languages?: Language[]`, `message?: string`, `topic?: MeetingInquiryTopic` |
| **UpdateInquiryRequestStatusCommand**   | [`update-inquiry-request-status-command.ts`](src/app/api/models/update-inquiry-request-status-command.ts)     | `status?: MeetingInquiryRequestStatus`                                      |
| **UpdateInquiryRequestResponseCommand** | [`update-inquiry-request-response-command.ts`](src/app/api/models/update-inquiry-request-response-command.ts) | `response?: string`                                                         |
| **AssignInquiryRequestCommand**         | [`assign-inquiry-request-command.ts`](src/app/api/models/assign-inquiry-request-command.ts)                   | `moderatorId?: string`                                                      |

---

### Meeting Request Domain

| Command                                 | File                                                                                                          | Properties                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **CreateMeetingRequestCommand**         | [`create-meeting-request-command.ts`](src/app/api/models/create-meeting-request-command.ts)                   | `languages?: Language[]`, `message?: string`, `scheduledAt?: string`, `topic?: MeetingInquiryTopic` |
| **UpdateMeetingRequestStatusCommand**   | [`update-meeting-request-status-command.ts`](src/app/api/models/update-meeting-request-status-command.ts)     | `status?: MeetingInquiryRequestStatus`                                                              |
| **UpdateMeetingRequestResponseCommand** | [`update-meeting-request-response-command.ts`](src/app/api/models/update-meeting-request-response-command.ts) | `response?: string`                                                                                 |
| **AssignMeetingRequestCommand**         | [`assign-meeting-request-command.ts`](src/app/api/models/assign-meeting-request-command.ts)                   | `moderatorId?: string`                                                                              |

---

### Notification Domain

| Command                              | File                                                                                                    | Properties                                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SendNotificationCommand**          | [`send-notification-command.ts`](src/app/api/models/send-notification-command.ts)                       | `actionUrl?: string \| null`, `customData?: {[key: string]: string} \| null`, `imageUrl?: string \| null`, `message?: string`, `title?: string`, `userId?: string`    |
| **SendBulkNotificationsCommand**     | [`send-bulk-notifications-command.ts`](src/app/api/models/send-bulk-notifications-command.ts)           | `actionUrl?: string \| null`, `customData?: {[key: string]: string} \| null`, `imageUrl?: string \| null`, `message?: string`, `title?: string`, `userIds?: string[]` |
| **SendBroadcastNotificationCommand** | [`send-broadcast-notification-command.ts`](src/app/api/models/send-broadcast-notification-command.ts)   | `actionUrl?: string \| null`, `customData?: {[key: string]: string} \| null`, `imageUrl?: string \| null`, `message?: string`, `title?: string`                       |
| **SendRoleBasedNotificationCommand** | [`send-role-based-notification-command.ts`](src/app/api/models/send-role-based-notification-command.ts) | `actionUrl?: string \| null`, `customData?: {[key: string]: string} \| null`, `imageUrl?: string \| null`, `message?: string`, `role?: UserRole`, `title?: string`    |
| **RegisterFcmTokenCommand**          | [`register-fcm-token-command.ts`](src/app/api/models/register-fcm-token-command.ts)                     | `fcmToken?: string`                                                                                                                                                   |
| **MarkNotificationAsReadCommand**    | [`mark-notification-as-read-command.ts`](src/app/api/models/mark-notification-as-read-command.ts)       | _(empty - no properties)_                                                                                                                                             |

---

### Moderator Domain

| Command                          | File                                                                                          | Properties           |
| -------------------------------- | --------------------------------------------------------------------------------------------- | -------------------- |
| **UpdateModeratorRoleCommand**   | [`update-moderator-role-command.ts`](src/app/api/models/update-moderator-role-command.ts)     | `newRole?: UserRole` |
| **UpdateModeratorStatusCommand** | [`update-moderator-status-command.ts`](src/app/api/models/update-moderator-status-command.ts) | `isActive?: boolean` |

---

### Permissions Domain

| Command                          | File                                                                                          | Properties                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **UpdateRolePermissionsCommand** | [`update-role-permissions-command.ts`](src/app/api/models/update-role-permissions-command.ts) | `notes?: string \| null`, `permissionNames?: string[] \| null`                                     |
| **UpdateUserPermissionsCommand** | [`update-user-permissions-command.ts`](src/app/api/models/update-user-permissions-command.ts) | `notes?: string \| null`, `permissionNames?: string[] \| null`, `permissions?: Permission \| null` |

---

### Tag Domain

| Command              | File                                                                | Properties                                       |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| **CreateTagCommand** | [`create-tag-command.ts`](src/app/api/models/create-tag-command.ts) | `description?: string \| null`, `title?: string` |
| **UpdateTagCommand** | [`update-tag-command.ts`](src/app/api/models/update-tag-command.ts) | `description?: string \| null`, `title?: string` |

---

### Q&A Domain

| Command             | File                                                              | Properties                                                                                |
| ------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **CreateQaCommand** | [`create-qa-command.ts`](src/app/api/models/create-qa-command.ts) | `isPublished?: boolean`, `tagIds?: string[]`, `translations?: QaTranslationInput[]`       |
| **UpdateQaCommand** | [`update-qa-command.ts`](src/app/api/models/update-qa-command.ts) | `isPublished?: boolean`, `tagIds?: string[]`, `translations?: UpdateQaTranslationInput[]` |

**Supporting DTOs:**

```typescript
// qa-translation-input.ts
export interface QaTranslationInput {
  answerText?: string;
  answerTextJson?: string | null;
  language?: Language;
  questionText?: string;
}

// update-qa-translation-input.ts
export interface UpdateQaTranslationInput {
  answerText?: string;
  answerTextJson?: string | null;
  id?: string | null;
  isDeleted?: boolean;
  language?: Language;
  questionText?: string;
}
```

---

### Certificate Domain

| Command                      | File                                                                                | Properties                                               |
| ---------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **CreateCertificateCommand** | [`create-certificate-command.ts`](src/app/api/models/create-certificate-command.ts) | `levelId?: string`, `studentId?: string`, `url?: string` |

---

### Notes Domain

| Command                      | File                                                                                  | Properties                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **CreateAdminNoteCommand**   | [`create-admin-note-command.ts`](src/app/api/models/create-admin-note-command.ts)     | `content?: string`, `isPrivate?: boolean`, `studentId?: string`                  |
| **CreateStudentNoteCommand** | [`create-student-note-command.ts`](src/app/api/models/create-student-note-command.ts) | `lessonId?: string`, `studentId?: string`, `text?: string`, `timestamp?: number` |

---

### Student Questions Domain

| Command                          | File                                                                                          | Properties                                                                               |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **CreateStudentQuestionCommand** | [`create-student-question-command.ts`](src/app/api/models/create-student-question-command.ts) | `lessonId?: string`, `questionText?: string`, `studentId?: string`, `timestamp?: number` |
| **AnswerStudentQuestionCommand** | [`answer-student-question-command.ts`](src/app/api/models/answer-student-question-command.ts) | `answerText?: string`                                                                    |

---

### MuslimTube Domain

| Command                         | File                                                                                          | Properties                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **AddMuslimTubeChannelCommand** | [`add-muslim-tube-channel-command.ts`](src/app/api/models/add-muslim-tube-channel-command.ts) | `channelUrlOrId?: string`, `fetchVideosImmediately?: boolean`, `initialVideoLimit?: number` |

---

## 3. Response Models Summary

### AuthenticationResponse

**File:** [`authentication-response.ts`](src/app/api/models/authentication-response.ts)

```typescript
export interface AuthenticationResponse {
  email?: string;
  expiresAt?: string; // ISO 8601 datetime
  firstName?: string;
  lastName?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string; // ISO 8601 datetime
  religiousStatus?: ReligiousStatus | null;
  role?: UserRole;
  token?: string; // JWT access token
  userId?: string; // GUID
}
```

---

### Result Wrapper Pattern

The API uses a generic Result wrapper pattern for all responses:

#### Base Result

**File:** [`result.ts`](src/app/api/models/result.ts)

```typescript
export interface Result {
  errors?: string[];
  succeeded?: boolean;
}
```

#### Generic Result<T>

**File:** [`result-of-authentication-response.ts`](src/app/api/models/result-of-authentication-response.ts)

```typescript
export interface ResultOfAuthenticationResponse {
  data?: AuthenticationResponse | null;
  errors?: string[];
  succeeded?: boolean;
}
```

**Pattern Usage:**

- All API responses wrap data in a `Result<T>` structure
- `succeeded: boolean` indicates success/failure
- `errors: string[]` contains error messages on failure
- `data: T | null` contains the response payload on success

---

## 4. Key Observations

### Design Patterns

1. **Result Wrapper Pattern**
   - All API responses use `Result<T>` wrapper
   - Provides consistent error handling
   - `succeeded` flag for quick status check
   - `errors` array for detailed error messages

2. **Command Pattern**
   - All request bodies use dedicated Command types
   - Clear separation between Create and Update operations
   - Consistent naming: `CreateXxxCommand`, `UpdateXxxCommand`

3. **Flags/Bitmask Pattern**
   - `Permission` enum uses powers of 2
   - Allows combining multiple permissions via bitwise operations
   - Negative values represent special aggregate flags

---

### Data Types Used

| Type                      | Usage                      | Examples                                    |
| ------------------------- | -------------------------- | ------------------------------------------- |
| `string`                  | IDs, emails, names, URLs   | `userId`, `email`, `title`                  |
| `string \| null`          | Optional text fields       | `description`, `thumbnailUrl`               |
| `string` (ISO 8601)       | Dates and datetimes        | `startDateTime`, `expiresAt`, `dateOfBirth` |
| `number`                  | Orders, counts, timestamps | `order`, `totalMarks`, `timestamp`          |
| `boolean`                 | Flags                      | `isPublished`, `isCorrect`, `isActive`      |
| `Array<string>`           | Collections of IDs         | `tagIds`, `userIds`                         |
| `Array<Enum>`             | Multi-select enums         | `languages`                                 |
| `{[key: string]: string}` | Dynamic key-value pairs    | `customData`                                |

---

### ID Format

All IDs are **GUIDs** represented as strings:

- `userId?: string`
- `courseId?: string`
- `lessonId?: string`
- `quizId?: string`
- etc.

Example: `"3fa85f64-5717-4562-b3fc-2c963f66afa6"`

---

### Nullable vs Optional

- **Optional (`?`)**: Property may be absent from JSON
- **Nullable (`\| null`)**: Property may be explicitly `null`
- Many properties are both optional AND nullable: `string | null` with `?`

---

### Enum Implementation

- Enums are **numeric union types**, not TypeScript `enum`
- Each enum has a corresponding `*Array.ts` file with constant for iteration
- Example: `UserRole` type + `USER_ROLE` constant array

---

### File Organization

```
src/app/api/models/
├── models.ts                    # Barrel export file
├── xxx.ts                       # Individual type definitions
├── xxx-array.ts                 # Constant arrays for enums
└── ...
```

---

### Generation Metadata

All files include auto-generated header:

```typescript
/* eslint-disable */
/* Code generated by ng-openapi-gen DO NOT EDIT. */
```

**Generator:** ng-openapi-gen  
**Source:** swagger.json  
**Do not manually edit** - regenerate from swagger when API changes

---

## Summary Statistics

| Category              | Count |
| --------------------- | ----- |
| **Enum Types**        | 11    |
| **Command Models**    | 52    |
| **Response Models**   | 3     |
| **Supporting DTOs**   | 4     |
| **Total Model Files** | 70    |

---

_Document generated from analysis of ng-openapi-gen output files._
