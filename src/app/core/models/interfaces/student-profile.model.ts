/**
 * Student Profile Model
 * Generated from API schema - StudentProfiles endpoints
 *
 * Fields: address, bio, country, countryCode, dateOfBirth, dateOfIslamConversion,
 *         firstName, imageUrl, lastName, languages, oldReligion, phoneNumber,
 *         reasonForConversion, reasonOfReligion
 */

import { Language, ReligiousStatus } from './enums.model';

/**
 * Language detail as returned from the API
 * GET endpoints return full language objects, PUT/POST send just IDs
 */
export interface LanguageDetail {
  id: Language;
  name: string;
  code: string;
}

export interface StudentProfile {
  id?: string;
  studentId?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  imageUrl?: string;
  bio?: string;
  phoneNumber?: string;
  address?: string;
  country?: string;
  countryCode?: string;
  languages?: LanguageDetail[];
  dateOfBirth?: string;
  dateOfIslamConversion?: string;
  oldReligion?: string;
  reasonForConversion?: string;
  reasonOfReligion?: string;
  gender?: string;
  level?: string;
  religiousStatus?: number;
  isMuslim?: boolean;
  isNewMuslim?: boolean;
  [key: string]: unknown; // Index signature for compatibility with DTOs
}

export interface CreateStudentProfileRequest {
  // Note: firstName, lastName, imageUrl are NOT included in Create request per API contract
  // These fields are only available in Update request
  bio?: string;
  languages?: Language[];
  phoneNumber?: string;
  address?: string;
  country?: string;
  countryCode?: string;
  dateOfBirth?: string;
  dateOfIslamConversion?: string;
  oldReligion?: string;
  reasonForConversion?: string;
  reasonOfReligion?: string;
}

export interface UpdateStudentProfileRequest {
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  bio?: string;
  religionStatus?: ReligiousStatus;
  religiousStatus?: ReligiousStatus;
  languages?: Language[];
  phoneNumber?: string;
  address?: string;
  country?: string;
  countryCode?: string;
  dateOfBirth?: string;
  dateOfIslamConversion?: string;
  oldReligion?: string;
  reasonForConversion?: string;
  reasonOfReligion?: string;
  gender?: string;
}

export interface StudentProfileErrorResponse {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Profile API result wrapper for handling success/error states
 */
export interface ProfileApiResult<T> {
  data: T | null;
  error: StudentProfileErrorResponse | null;
  isLoading: boolean;
}

/**
 * API response wrapper from backend
 * The backend wraps all responses in this structure
 */
export interface ApiResponse<T> {
  succeeded: boolean;
  errors: string[];
  data: T;
}
