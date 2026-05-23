import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, tap, BehaviorSubject, takeUntil } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';
import { EnrollmentFacade } from './enrollment.facade';
import { CourseFacade } from './course.facade';
import {
  StudentProfileService,
  ProfileError,
} from '../../core/services/student-profile.service';
import type {
  StudentProfile,
  CreateStudentProfileRequest,
  UpdateStudentProfileRequest,
  LanguageDetail,
} from '../../core/models/interfaces/student-profile.model';

export type {
  StudentProfile,
  CreateStudentProfileRequest,
  UpdateStudentProfileRequest,
  LanguageDetail,
};

export interface StudentCourseDto {
  id?: string;
  title?: string;
  [key: string]: unknown;
}

/**
 * Legacy interface for backward compatibility.
 * @deprecated Use StudentProfile instead.
 */
export interface StudentProfileDto extends StudentProfile {
  [key: string]: unknown;
}

/**
 * Legacy interface for backward compatibility.
 * @deprecated Use UpdateStudentProfileRequest instead.
 */
export interface UpdateProfileRequest extends UpdateStudentProfileRequest { }

@Injectable({ providedIn: 'root' })
export class StudentFacade {
  private readonly api = inject(ApiService);
  private readonly enrollmentFacade = inject(EnrollmentFacade);
  private readonly courseFacade = inject(CourseFacade);
  private readonly profileService = inject(StudentProfileService);

  // Cache for profile data
  private readonly profileCache$ = new BehaviorSubject<StudentProfile | null>(null);
  private profileLoading = false;
  private profileFetched = false;

  /**
   * Get all students (admin only)
   * GET /api/Students
   */
  getAllStudents(): Observable<StudentProfile[]> {
    return extractData(this.api.get<unknown>('/api/Students'), []).pipe(map(asArray<StudentProfile>));
  }

  /**
   * Get student by ID
   * GET /api/Students/{userId}
   */
  getStudentById(userId: string): Observable<StudentProfile | null> {
    return extractData(this.api.get<unknown>(`/api/Students/${userId}`), null);
  }

  /**
   * Get student courses
   * Uses the current user's profile to fetch enrolled courses
   */
  getStudentCourses(): Observable<StudentCourseDto[]> {
    return this.me().pipe(
      switchMap((profile) => {
        const studentId = profile?.id;
        if (!studentId) {
          return of([]);
        }

        return this.enrollmentFacade.getEnrolledCoursesByStudent(studentId).pipe(
          switchMap((enrollments) => {
            const courseIds = enrollments
              .map((enrollment) => enrollment.courseId)
              .filter((courseId): courseId is string => typeof courseId === 'string' && courseId.length > 0);

            if (courseIds.length === 0) {
              return of([]);
            }

            const uniqueCourseIds = Array.from(new Set(courseIds));
            return forkJoin(uniqueCourseIds.map((courseId) => this.courseFacade.getCourseById(courseId))).pipe(
              map((courses) => this.mapCourses(courses))
            );
          })
        );
      })
    );
  }

  private mapCourses(courses: Array<{ id?: string; title?: string } | null>): StudentCourseDto[] {
    return courses
      .filter((course): course is { id?: string; title?: string } => course !== null)
      .map((course) => ({
        id: course.id,
        title: course.title,
      }));
  }

  /**
   * Get the current student's profile
   * GET /api/StudentProfiles/me
   *
   * This method uses caching to avoid redundant API calls.
   */
  me(): Observable<StudentProfile | null> {
    // Trigger fetch if cache is empty, not already loading, and not yet fetched
    if (this.profileCache$.getValue() === null && !this.profileLoading && !this.profileFetched) {
      this.fetchProfile().subscribe();
    }

    // Return the continuous observable stream so components react to auth changes
    return this.profileCache$.asObservable();
  }

  private fetchProfile(): Observable<StudentProfile | null> {
    this.profileLoading = true;
    return this.profileService.getMyProfile().pipe(
      tap({
        next: (profile) => {
          this.profileCache$.next(profile);
          this.profileLoading = false;
          this.profileFetched = true;
        },
        error: () => {
          this.profileLoading = false;
          this.profileFetched = true;
        },
      })
    );
  }

  /**
   * Get the current student's profile (alias for me())
   * GET /api/StudentProfiles/me
   */
  getProfile(): Observable<StudentProfile | null> {
    return this.me();
  }

  /**
   * Get the current student's profile (alias for me())
   * GET /api/StudentProfiles/me
   */
  getMyProfile(): Observable<StudentProfile | null> {
    return this.me();
  }

  /**
   * Fetch the current student's profile directly from API
   * GET /api/StudentProfiles/me
   */
  getMyProfileFromApi(): Observable<StudentProfile | null> {
    return this.profileService.getMyProfile().pipe(
      tap((profile) => {
        this.profileCache$.next(profile);
        this.profileFetched = true;
      })
    );
  }

  /**
   * Get student profile by student ID
   * GET /api/StudentProfiles/{studentId}
   */
  getProfileByStudentId(studentId: string): Observable<StudentProfile | null> {
    return this.profileService.getProfileByStudentId(studentId);
  }

  /**
   * Get student profile by user ID
   * GET /api/StudentProfiles/user/{userId}
   */
  getProfileByUserId(userId: string): Observable<StudentProfile | null> {
    return this.profileService.getProfileByUserId(userId);
  }

  /**
   * Update the current student's profile
   * PUT /api/StudentProfiles/me
   */
  updateProfile(data: UpdateStudentProfileRequest): Observable<StudentProfile | null> {
    return this.profileService.updateProfile(data).pipe(
      tap((profile) => {
        this.profileCache$.next(profile);
      })
    );
  }

  /**
   * Create a new student profile
   * POST /api/StudentProfiles/me
   */
  createProfile(data: CreateStudentProfileRequest): Observable<StudentProfile | null> {
    return this.profileService.createProfile(data).pipe(
      tap((profile) => {
        this.profileCache$.next(profile);
      })
    );
  }

  /**
   * Create or update the student's profile
   * This method handles the create/update logic automatically
   */
  createOrUpdateProfile(data: CreateStudentProfileRequest | UpdateStudentProfileRequest): Observable<StudentProfile | null> {
    return this.profileService.createOrUpdateProfile(data).pipe(
      tap((profile) => {
        this.profileCache$.next(profile);
      })
    );
  }

  /**
   * Upload profile picture
   * POST /api/StudentProfiles/picture
   */
  updateProfilePicture(file: File): Observable<{ imageUrl: string } | null> {
    return this.profileService.uploadProfilePicture(file).pipe(
      tap((result) => {
        if (result?.imageUrl) {
          const currentProfile = this.profileCache$.getValue();
          if (currentProfile) {
            this.profileCache$.next({
              ...currentProfile,
              imageUrl: result.imageUrl,
            });
          }
        }
      })
    );
  }

  /**
   * Clear the profile cache
   * Call this method after logout or when profile data needs to be refreshed
   */
  clearCache(): void {
    this.profileCache$.next(null);
    this.profileLoading = false;
    this.profileFetched = false;
    this.profileService.clearCache();
  }

  /**
   * Refresh the profile data from the server
   */
  refreshProfile(): Observable<StudentProfile | null> {
    this.clearCache();
    return this.me();
  }
}
