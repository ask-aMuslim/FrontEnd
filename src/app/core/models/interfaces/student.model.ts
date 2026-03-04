import { Id } from './base.model';

export interface StudentDto {
  id: Id;
  userId?: Id;
  email?: string;
  firstName?: string;
  lastName?: string;
  bio?: string | null;
  specialization?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  linkedInProfile?: string | null;
  yearsOfExperience?: number;
  certifications?: string | null;
  organization?: string | null;
}

export type CreateStudentRequest = Partial<StudentDto>;

export interface UpdateStudentRequest extends Partial<StudentDto> {
  id: Id;
}

export default StudentDto;
