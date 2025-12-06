import { Id } from './base.model';

export interface PreacherDto {
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

export interface UpdatePreacherRequest {
  bio?: string | null;
  specialization?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  linkedInProfile?: string | null;
  yearsOfExperience?: number;
  certifications?: string | null;
  organization?: string | null;
}

export default PreacherDto;
