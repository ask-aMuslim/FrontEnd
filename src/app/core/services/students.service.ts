import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StudentFacade, StudentProfileDto, StudentCourseDto, UpdateProfileRequest } from '../../api/facades/student.facade';

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
   * Create or update the student's profile using the API. The server will
   * create a new record if one does not exist yet.
   */
  createProfile(data: UpdateProfileRequest): Observable<StudentProfileDto | null> {
    return this.facade.createProfile(data);
  }

  /**
   * Update existing profile data.
   */
  updateProfile(data: UpdateProfileRequest): Observable<StudentProfileDto | null> {
    return this.facade.updateProfile(data);
  }
}
