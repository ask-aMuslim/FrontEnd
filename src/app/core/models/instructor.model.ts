import { Id, ISODate } from './base.model';

export interface InstructorDto {
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
  isVerified?: boolean;
  isActive?: boolean;
  joinedDate?: ISODate;
  rating?: number;
  totalReviews?: number;
  totalCourses?: number;
}

export interface UpdateInstructorRequest {
  bio?: string | null;
  specialization?: string | null;
  phoneNumber?: string | null;
  website?: string | null;
  linkedInProfile?: string | null;
  yearsOfExperience?: number;
}

export default InstructorDto;
