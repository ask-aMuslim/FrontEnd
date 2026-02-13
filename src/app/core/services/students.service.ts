import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StudentFacade } from '../api/facades/student.facade';

@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly facade = inject(StudentFacade);

  getAll(): Observable<any> {
    return this.facade.getAllStudents();
  }

  getById(userId: string): Observable<any> {
    return this.facade.getStudentById(userId);
  }

  getAllCourses(studentId?: string): Observable<any> {
    return this.facade.getAllCourses(studentId);
  }

  me(): Observable<any> {
    return this.facade.me();
  }

  dashboard(): Observable<any> {
    return this.facade.dashboard();
  }

  update(payload: any): Observable<any> {
    return this.facade.update(payload);
  }
}
