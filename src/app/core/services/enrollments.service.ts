import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { EnrollmentFacade, EnrollmentReadDto } from '../../api/facades/enrollment.facade';
import type { CreateEnrollmentCommand } from '../../api/models';

@Injectable({ providedIn: 'root' })
export class EnrollmentsService {
  private readonly facade = inject(EnrollmentFacade);

  getAll(studentId?: string): Observable<EnrollmentReadDto[]> {
    return this.facade.getAllEnrollments(studentId);
  }

  getEnrollment(id: string): Observable<EnrollmentReadDto | null> {
    return this.facade.getEnrollment(id);
  }

  getStudentsByCourse(courseId: string): Observable<EnrollmentReadDto[]> {
    return this.facade.getStudentsEnrolledInCourse(courseId);
  }

  getEnrolledCourses(studentId: string): Observable<EnrollmentReadDto[]> {
    return this.facade.getEnrolledCoursesByStudent(studentId);
  }

  create(payload: CreateEnrollmentCommand): Observable<boolean> {
    return this.facade.createEnrollment(payload).pipe(
      map(enrollment => enrollment !== null)
    );
  }

  delete(id: string): Observable<boolean> {
    return this.facade.deleteEnrollment(id);
  }
}
