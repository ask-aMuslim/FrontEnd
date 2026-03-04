import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StudentFacade } from '../api/facades/student.facade';

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly facade = inject(StudentFacade);

  getAll(): Observable<unknown> {
    return this.facade.getAllStudents();
  }

  getById(userId: string): Observable<unknown> {
    return this.facade.getStudentById(userId);
  }

  getAllCourses(studentId?: string): Observable<unknown> {
    return this.facade.getAllCourses(studentId);
  }

  me(): Observable<unknown> {
    return this.facade.me();
  }

  dashboard(): Observable<unknown> {
    return this.facade.dashboard();
  }

  update(payload: unknown): Observable<unknown> {
    return this.facade.update(payload);
  }
}
