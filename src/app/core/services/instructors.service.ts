import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InstructorFacade } from '../api/facades/instructor.facade';

@Injectable({ providedIn: 'root' })
export class InstructorsService {
  private readonly facade = inject(InstructorFacade);

  getAll(): Observable<any> {
    return this.facade.getAllInstructors();
  }

  getById(userId: string): Observable<any> {
    return this.facade.getInstructorById(userId);
  }

  getByCourseId(courseId: string): Observable<any> {
    return this.facade.getInstructorByCourseId(courseId);
  }

  me(): Observable<any> {
    return this.facade.me();
  }

  update(payload: any): Observable<any> {
    return this.facade.update(payload);
  }
}
