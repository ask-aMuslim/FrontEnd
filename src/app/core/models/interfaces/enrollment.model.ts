import { Id, ISODate } from './base.model';

export interface EnrollmentDto {
  id: Id;
  studentId: Id;
  courseId: Id;
  enrolledAt?: ISODate;
  status?: number;
  levelProgress?: number;
  courseProgress?: number;
}

export interface CreateEnrollmentRequest {
  studentId: Id;
  courseId: Id;
}

export interface UpdateEnrollmentStatusRequest {
  id: Id;
  status: number;
}

export default EnrollmentDto;
