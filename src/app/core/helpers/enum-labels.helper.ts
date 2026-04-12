import {
  EnrollmentStatus,
  EventStatus,
  Language,
  LessonType,
  LevelDifficulty,
  MeetingInquiryRequestStatus,
  MeetingInquiryTopic,
  PriorityLevel,
  QuizTargetType,
  ReligiousStatus,
  UserRole,
} from '../models/interfaces/enums.model';

export const enrollmentStatusLabels: Readonly<
  Record<EnrollmentStatus, string>
> = {
  [EnrollmentStatus.Active]: 'Active',
  [EnrollmentStatus.Completed]: 'Completed',
  [EnrollmentStatus.Cancelled]: 'Cancelled',
  [EnrollmentStatus.Paused]: 'Paused',
};

export const eventStatusLabels: Readonly<Record<EventStatus, string>> = {
  [EventStatus.Pending]: 'Pending',
  [EventStatus.Approved]: 'Approved',
  [EventStatus.Rejected]: 'Rejected',
  [EventStatus.Cancelled]: 'Cancelled',
};

export const languageLabels: Readonly<Record<Language, string>> = {
  [Language.English]: 'English',
  [Language.Arabic]: 'Arabic',
  [Language.French]: 'French',
  [Language.Spanish]: 'Spanish',
  [Language.German]: 'German',
};

export const lessonTypeLabels: Readonly<Record<LessonType, string>> = {
  [LessonType.Video]: 'Video',
  [LessonType.Article]: 'Article',
  [LessonType.Document]: 'Document',
  [LessonType.Audio]: 'Audio',
};

export const levelDifficultyLabels: Readonly<Record<LevelDifficulty, string>> =
{
  [LevelDifficulty.Beginner]: 'Beginner',
  [LevelDifficulty.Intermediate]: 'Intermediate',
  [LevelDifficulty.Advanced]: 'Advanced',
  [LevelDifficulty.Expert]: 'Expert',
};

export const meetingInquiryRequestStatusLabels: Readonly<
  Record<MeetingInquiryRequestStatus, string>
> = {
  [MeetingInquiryRequestStatus.Pending]: 'Pending',
  [MeetingInquiryRequestStatus.Accepted]: 'Accepted',
  [MeetingInquiryRequestStatus.Rejected]: 'Rejected',
  [MeetingInquiryRequestStatus.Cancelled]: 'Cancelled',
  [MeetingInquiryRequestStatus.Completed]: 'Completed',
};

export const meetingInquiryTopicLabels: Readonly<
  Record<MeetingInquiryTopic, string>
> = {
  [MeetingInquiryTopic.GeneralInquiry]: 'General Inquiry',
  [MeetingInquiryTopic.Quran]: 'Quran',
  [MeetingInquiryTopic.Hadith]: 'Hadith',
  [MeetingInquiryTopic.ComparativeReligion]: 'Comparative Religion',
  [MeetingInquiryTopic.ConversionGuidance]: 'Conversion Guidance',
  [MeetingInquiryTopic.IslamicHistory]: 'Islamic History',
  [MeetingInquiryTopic.Fiqh]: 'Fiqh',
  [MeetingInquiryTopic.Theology]: 'Theology',
};

export const priorityLevelLabels: Readonly<Record<PriorityLevel, string>> = {
  [PriorityLevel.None]: 'None',
  [PriorityLevel.Low]: 'Low',
  [PriorityLevel.Medium]: 'Medium',
  [PriorityLevel.High]: 'High',
};

export const quizTargetTypeLabels: Readonly<Record<QuizTargetType, string>> = {
  [QuizTargetType.Level]: 'Level',
  [QuizTargetType.Course]: 'Course',
  [QuizTargetType.Lesson]: 'Lesson',
};

export const userRoleLabels: Readonly<Record<UserRole, string>> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.Student]: 'Student',
  [UserRole.Instructor]: 'Instructor',
  [UserRole.Preacher]: 'Preacher',
  [UserRole.NonMuslim]: 'NonMuslim',
};

export const religiousStatusLabels: Readonly<Record<ReligiousStatus, string>> =
{
  [ReligiousStatus.NonMuslim]: 'Non-Muslim',
  [ReligiousStatus.BornMuslim]: 'Born Muslim',
  [ReligiousStatus.RevertedMuslim]: 'New Muslim',
};
