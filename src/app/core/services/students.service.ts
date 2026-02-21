import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StudentFacade, StudentProfileDto, StudentCourseDto } from '../../api/facades/student.facade';

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly facade = inject(StudentFacade);

  /**
   * Get all students
   * Uses facade which calls GET /api/Student
   */
  getAll(): Observable<StudentProfileDto[]> {
    return this.facade.getAllStudents();
  }

  /**
   * Get student by ID
   * Uses facade which calls GET /api/Student/{id}
   */
  getById(userId: string): Observable<StudentProfileDto | null> {
    return this.facade.getStudentById(userId);
  }

  /**
   * Get all courses for a student
   * Uses facade which calls GET /api/Student/GetAllCourses
   */
  getAllCourses(): Observable<StudentCourseDto[]> {
    return this.facade.getStudentCourses();
  }

  /**
   * Get current student's profile
   * Uses facade which calls GET /api/Student/me
   */
  me(): Observable<StudentProfileDto | null> {
    return this.facade.me();
  }

  /**
   * Get profile (alias for me())
   */
  getProfile(): Observable<StudentProfileDto | null> {
    return this.facade.getProfile();
  }

  /**
   * NOTE: createProfile and updateProfile are NOT available on the backend.
   * Student profiles are managed through the identity/registration flow.
   * These methods are kept for backward compatibility but will return false.
   */

  /**
   * @deprecated Backend does not expose student profile creation endpoint.
   * Use identity registration flow instead.
   */
  createProfile(data: unknown): Observable<boolean> {
    return of(Boolean(data) && false);
  }

  /**
   * @deprecated Backend does not expose student profile update endpoint.
   * Use identity profile update instead.
   */
  update(payload: unknown): Observable<boolean> {
    return of(Boolean(payload) && false);
  }
}
