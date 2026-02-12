import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { Api } from '../api/generated/api';
// Removed unused imports
// import {
//   apiEnrollmentGetEnrollmentGet,
// ...
import { EnrollmentCreateDto } from '../api/generated/models';
import { EnrollmentFacade } from '../api/facades/enrollment.facade';

@Injectable({ providedIn: 'root' })
export class EnrollmentsService {
  private facade = inject(EnrollmentFacade);

  getEnrollment(studentId?: string, courseId?: string): Observable<any> {
    return this.facade.getEnrollment(studentId, courseId);
  }

  delete(studentId: string, courseId: string): Observable<void> {
    return this.facade.deleteEnrollment(studentId, courseId);
  }

  getByCourse(courseId: string): Observable<any> {
    return this.facade.getStudentsByCourse(courseId);
  }

  getByStudent(studentId: string): Observable<any> {
    return this.facade.getEnrolledCourses(studentId);
  }

  create(payload: EnrollmentCreateDto): Observable<void> {
    return this.facade.createEnrollment(payload);
  }

  updateStatus(id: string, payload: any): Observable<any> {
    // This endpoint not in Swagger spec, keep legacy implementation if needed
    throw new Error('updateStatus endpoint not available in generated API');
  }
}
