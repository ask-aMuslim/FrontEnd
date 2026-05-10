/** Shared enums — values should match server API contract */
export enum Status {
  Unknown = 0,
  Active = 1,
  Inactive = 2,
}

export enum EventStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3,
  Cancelled = 4,
}

import { EnrollmentStatus } from '../../../api/models/enrollment-status';
export { EnrollmentStatus };

export enum Language {
  English = 1,
  Arabic = 2,
  French = 3,
  Spanish = 4,
  German = 5,
  Portuguese = 6,
}

export enum LessonType {
  Video = 1,
  Article = 2,
  Document = 3,
  Audio = 4,
}

export enum LevelDifficulty {
  Beginner = 1,
  Intermediate = 2,
  Advanced = 3,
  Expert = 4,
}

export enum MeetingInquiryRequestStatus {
  Pending = 1,
  Accepted = 2,
  Rejected = 3,
  Cancelled = 4,
  Completed = 5,
}

export enum MeetingInquiryTopic {
  GeneralInquiry = 1,
  Quran = 2,
  Hadith = 3,
  ComparativeReligion = 4,
  ConversionGuidance = 5,
  IslamicHistory = 6,
  Fiqh = 7,
  Theology = 8,
}

export enum PriorityLevel {
  None = 0,
  Low = 1,
  Medium = 2,
  High = 3,
}

export enum QuizTargetType {
  Level = 1,
  Course = 2,
  Lesson = 3,
}

export enum UserRole {
  Admin = 1,
  Student = 2,
  Instructor = 3,
  Preacher = 4,
  NonMuslim = 5,
}

export enum ReligiousStatus {
  NonMuslim = 1,
  BornMuslim = 2,
  RevertedMuslim = 3,
}

export default Status;
