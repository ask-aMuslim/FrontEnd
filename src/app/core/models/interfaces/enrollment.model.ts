import { Id, ISODate } from './base.model';
import { EnrollmentStatus } from '../../../api/models/enrollment-status';

export interface EnrollmentDto {
  id: Id;
  studentId: Id;
  courseId: Id;
  enrolledAt?: ISODate;
  status?: EnrollmentStatus;
  levelProgress?: number;
  courseProgress?: number;
}

export interface CreateEnrollmentRequest {
  studentId: Id;
  courseId: Id;
}

export interface UpdateEnrollmentStatusRequest {
  id: Id;
  status: EnrollmentStatus;
}

export default EnrollmentDto;
