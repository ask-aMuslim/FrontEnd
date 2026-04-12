import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, catchError, timeout, timer, map, switchMap } from 'rxjs';
import { retryWhen, mergeMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  StudentProfile,
  CreateStudentProfileRequest,
  UpdateStudentProfileRequest,
  ApiResponse,
} from '../models/interfaces/student-profile.model';

/**
 * Error types for student profile operations
 */
export type ProfileErrorType = 'validation' | 'unauthorized' | 'not_found' | 'rate_limit' | 'server' | 'network' | 'unknown';

export interface ProfileError {
  type: ProfileErrorType;
  status: number;
  message: string;
  details?: Record<string, string[]>;
  retryable: boolean;
}

/**
 * Student Profile Service
 *
 * Handles all API operations for student profiles with proper error handling,
 * retry logic, and type safety.
 *
 * Endpoints:
 * - GET  /api/StudentProfiles/{studentId} - Get student profile by ID
 * - GET  /api/StudentProfiles/user/{userId} - Get student profile by user ID
 * - GET  /api/StudentProfiles/me - Get current student's profile
 * - POST /api/StudentProfiles/me - Create student profile
 * - PUT  /api/StudentProfiles/me - Update student profile
 */
@Injectable({
  providedIn: 'root',
})
export class StudentProfileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replaceAll(/\/+$/g, '');

  // Configuration constants
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1 second base delay
  private readonly RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

  /**
   * Get the current student's profile
   * GET /api/StudentProfiles/me
   */
  getMyProfile(): Observable<StudentProfile | null> {
    return this.http.get<ApiResponse<StudentProfile>>(`${this.baseUrl}/api/StudentProfiles/me`).pipe(
      map(response => response?.data ?? null),
      timeout(this.DEFAULT_TIMEOUT),
      this.retryWithBackoff(),
      catchError((error) => this.handleError(error, 'getMyProfile'))
    );
  }

  /**
   * Get student profile by student ID
   * GET /api/StudentProfiles/{studentId}
   */
  getProfileByStudentId(studentId: string): Observable<StudentProfile | null> {
    if (!studentId?.trim()) {
      return throwError(() => this.createError('validation', 400, 'Student ID is required', false));
    }

    return this.http.get<ApiResponse<StudentProfile>>(`${this.baseUrl}/api/StudentProfiles/${encodeURIComponent(studentId)}`).pipe(
      map(response => response?.data ?? null),
      timeout(this.DEFAULT_TIMEOUT),
      this.retryWithBackoff(),
      catchError((error) => this.handleError(error, 'getProfileByStudentId'))
    );
  }

  /**
   * Get student profile by user ID
   * GET /api/StudentProfiles/user/{userId}
   */
  getProfileByUserId(userId: string): Observable<StudentProfile | null> {
    if (!userId?.trim()) {
      return throwError(() => this.createError('validation', 400, 'User ID is required', false));
    }

    return this.http.get<ApiResponse<StudentProfile>>(`${this.baseUrl}/api/StudentProfiles/user/${encodeURIComponent(userId)}`).pipe(
      map(response => response?.data ?? null),
      timeout(this.DEFAULT_TIMEOUT),
      this.retryWithBackoff(),
      catchError((error) => this.handleError(error, 'getProfileByUserId'))
    );
  }

  /**
   * Create a new student profile
   * POST /api/StudentProfiles/me
   */
  createProfile(request: CreateStudentProfileRequest): Observable<StudentProfile> {
    this.validateProfileRequest(request);

    return this.http.post<ApiResponse<StudentProfile>>(`${this.baseUrl}/api/StudentProfiles/me`, request).pipe(
      map(response => response?.data),
      timeout(this.DEFAULT_TIMEOUT),
      catchError((error) => this.handleError(error, 'createProfile'))
    );
  }

  /**
   * Update the current student's profile
   * PUT /api/StudentProfiles/me
   */
  updateProfile(request: UpdateStudentProfileRequest): Observable<StudentProfile> {
    this.validateProfileRequest(request);

    return this.http.put<ApiResponse<StudentProfile>>(`${this.baseUrl}/api/StudentProfiles/me`, request).pipe(
      map(response => response?.data),
      timeout(this.DEFAULT_TIMEOUT),
      catchError((error) => this.handleError(error, 'updateProfile'))
    );
  }

  /**
   * Create profile if it doesn't exist, update if it does
   * This is a convenience method that handles the create/update logic
   */
  createOrUpdateProfile(request: CreateStudentProfileRequest | UpdateStudentProfileRequest): Observable<StudentProfile> {
    return new Observable((observer) => {
      this.getMyProfile().subscribe({
        next: (existingProfile) => {
          if (existingProfile) {
            // Profile exists, update it
            this.updateProfile(request as UpdateStudentProfileRequest).subscribe({
              next: (updated) => observer.next(updated),
              error: (err) => observer.error(err),
              complete: () => observer.complete(),
            });
          } else {
            // Profile doesn't exist, create it
            this.createProfile(request as CreateStudentProfileRequest).subscribe({
              next: (created) => observer.next(created),
              error: (err) => observer.error(err),
              complete: () => observer.complete(),
            });
          }
        },
        error: (err) => {
          // If profile not found (404), create new profile
          if (err?.status === 404 || err?.type === 'not_found') {
            this.createProfile(request as CreateStudentProfileRequest).subscribe({
              next: (created) => observer.next(created),
              error: (createErr) => observer.error(createErr),
              complete: () => observer.complete(),
            });
          } else {
            observer.error(err);
          }
        },
      });
    });
  }

  /**
   * Upload profile picture
   * POST /api/Media/upload?containerName=profile-images
   * PUT /api/StudentProfiles/me with returned imageUrl
   */
  uploadProfilePicture(file: File): Observable<{ imageUrl: string }> {
    if (!file) {
      return throwError(() => this.createError('validation', 400, 'File is required', false));
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return throwError(() => this.createError(
        'validation',
        400,
        'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP',
        false
      ));
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return throwError(() => this.createError(
        'validation',
        400,
        'File size exceeds 5MB limit',
        false
      ));
    }

    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<unknown>(`${this.baseUrl}/api/Media/upload`, formData, {
      params: { containerName: 'profile-images' },
    }).pipe(
      map((response) => {
        const imageUrl = this.extractUploadedImageUrl(response);
        if (!imageUrl) {
          throw this.createError('server', 500, 'Media upload succeeded but image URL was not returned.', false);
        }

        return imageUrl;
      }),
      switchMap((imageUrl) => this.updateProfile({ imageUrl }).pipe(
        map(() => ({ imageUrl }))
      )),
      timeout(this.DEFAULT_TIMEOUT * 2), // Double timeout for file uploads
      this.retryWithBackoff(),
      catchError((error) => this.handleError(error, 'uploadProfilePicture'))
    );
  }

  private extractUploadedImageUrl(response: unknown): string | null {
    const getString = (value: unknown): string | null => {
      if (typeof value !== 'string') {
        return null;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const pickImageUrl = (value: unknown): string | null => {
      if (!value || typeof value !== 'object') {
        return null;
      }

      const record = value as Record<string, unknown>;
      return (
        getString(record['imageUrl']) ??
        getString(record['url']) ??
        getString(record['fileUrl']) ??
        getString(record['path'])
      );
    };

    const responseRecord = (response && typeof response === 'object')
      ? response as Record<string, unknown>
      : null;

    if (!responseRecord) {
      return getString(response);
    }

    // 1) { imageUrl: '...' } or { url: '...' }
    const fromRoot = pickImageUrl(responseRecord);
    if (fromRoot) {
      return fromRoot;
    }

    // 2) { data: 'https://...' }
    const dataValue = responseRecord['data'];
    const fromDataString = getString(dataValue);
    if (fromDataString) {
      return fromDataString;
    }

    // 3) { data: { imageUrl: '...' } } or similar object keys
    const fromDataObject = pickImageUrl(dataValue);
    if (fromDataObject) {
      return fromDataObject;
    }

    // 4) { data: [{ imageUrl: '...' }] }
    if (Array.isArray(dataValue) && dataValue.length > 0) {
      return pickImageUrl(dataValue[0]);
    }

    return null;
  }

  /**
   * Validate profile request data
   */
  private validateProfileRequest(request: CreateStudentProfileRequest | UpdateStudentProfileRequest): void {
    const errors: string[] = [];

    // Validate phone number format if provided
    if (request.phoneNumber && !this.isValidPhoneNumber(request.phoneNumber)) {
      errors.push('Invalid phone number format');
    }

    // Validate country code format if provided
    if (request.countryCode && !this.isValidCountryCode(request.countryCode)) {
      errors.push('Invalid country code format (should be 2-3 letters)');
    }

    // Validate date format if provided
    if (request.dateOfBirth && !this.isValidDate(request.dateOfBirth)) {
      errors.push('Invalid date of birth format (should be ISO 8601)');
    }

    if (request.dateOfIslamConversion && !this.isValidDate(request.dateOfIslamConversion)) {
      errors.push('Invalid date of Islam conversion format (should be ISO 8601)');
    }

    if (errors.length > 0) {
      throw this.createError('validation', 400, errors.join('; '), false);
    }
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Basic phone validation: allows +, digits, spaces, dashes, parentheses
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
  }

  private isValidCountryCode(code: string): boolean {
    // ISO 3166-1 alpha-2 or alpha-3
    return /^[A-Za-z]{2,3}$/.test(code);
  }

  private isValidDate(date: string): boolean {
    // ISO 8601 date format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (!dateRegex.test(date)) return false;

    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }

  /**
   * Retry operator with exponential backoff
   */
  private retryWithBackoff<T>(): import('rxjs').MonoTypeOperatorFunction<T> {
    return retryWhen((errors) =>
      errors.pipe(
        mergeMap((error, i) => {
          const retryAttempt = i + 1;

          // Only retry for retryable errors
          if (!this.isRetryable(error) || retryAttempt > this.MAX_RETRIES) {
            return throwError(() => error);
          }

          // Exponential backoff: 1s, 2s, 4s
          const delayMs = this.RETRY_DELAY_BASE * Math.pow(2, i);

          console.warn(`[StudentProfileService] Retry attempt ${retryAttempt}/${this.MAX_RETRIES} after ${delayMs}ms`);

          return timer(delayMs);
        })
      )
    );
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof HttpErrorResponse) {
      return this.RETRYABLE_STATUS_CODES.includes(error.status);
    }

    const err = error as { status?: number; retryable?: boolean };
    // Network errors are retryable
    if (err?.status === 0) return true;

    // Check our custom error type
    const isRetryable = err?.retryable;
    if (isRetryable !== undefined) {
      return isRetryable;
    }

    return false;
  }

  /**
   * Handle HTTP errors and convert to ProfileError
   */
  private handleError(error: unknown, operation: string): Observable<never> {
    let profileError: ProfileError;

    if (error instanceof HttpErrorResponse) {
      profileError = this.convertHttpError(error);
    } else if (error instanceof Error) {
      profileError = this.createError('unknown', 0, error.message, false);
    } else if (this.isProfileError(error)) {
      profileError = error;
    } else {
      profileError = this.createError('unknown', 0, 'An unexpected error occurred', false);
    }

    console.error(`[StudentProfileService] ${operation} failed:`, profileError);

    return throwError(() => profileError);
  }

  private convertHttpError(error: HttpErrorResponse): ProfileError {
    const status = error.status;
    let type: ProfileErrorType;
    let message: string;
    let retryable: boolean;
    let details: Record<string, string[]> | undefined;

    switch (status) {
      case 400:
        type = 'validation';
        message = this.extractValidationMessage(error);
        details = this.extractValidationDetails(error);
        retryable = false;
        break;

      case 401:
        type = 'unauthorized';
        message = 'Authentication required. Please log in again.';
        retryable = false;
        break;

      case 403:
        type = 'unauthorized';
        message = 'You do not have permission to perform this action.';
        retryable = false;
        break;

      case 404:
        type = 'not_found';
        message = 'Profile not found.';
        retryable = false;
        break;

      case 429:
        type = 'rate_limit';
        message = 'Too many requests. Please wait before trying again.';
        retryable = true;
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        type = 'server';
        message = 'Server error. Please try again later.';
        retryable = true;
        break;

      case 0:
        type = 'network';
        message = 'Network error. Please check your connection.';
        retryable = true;
        break;

      default:
        type = 'unknown';
        message = error.message || 'An unexpected error occurred.';
        retryable = false;
    }

    return {
      type,
      status,
      message,
      details,
      retryable,
    };
  }

  private extractValidationMessage(error: HttpErrorResponse): string {
    const body = error.error;

    if (typeof body === 'string') {
      return body;
    }

    if (body?.message) {
      return body.message;
    }

    if (body?.title) {
      return body.title;
    }

    if (body?.errors) {
      const errorMessages = Object.values(body.errors).flat();
      return errorMessages.join('; ');
    }

    return 'Validation failed. Please check your input.';
  }

  private extractValidationDetails(error: HttpErrorResponse): Record<string, string[]> | undefined {
    const body = error.error;

    if (body?.errors && typeof body.errors === 'object') {
      return body.errors;
    }

    return undefined;
  }

  private isProfileError(error: unknown): error is ProfileError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      'status' in error &&
      'message' in error &&
      'retryable' in error
    );
  }

  private createError(
    type: ProfileErrorType,
    status: number,
    message: string,
    retryable: boolean,
    details?: Record<string, string[]>
  ): ProfileError {
    return {
      type,
      status,
      message,
      retryable,
      details,
    };
  }
}
