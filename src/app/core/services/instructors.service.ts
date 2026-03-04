import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InstructorFacade } from '../api/facades/instructor.facade';

@Injectable({ providedIn: 'root' })
export class InstructorsService {
  private readonly facade = inject(InstructorFacade);

  getAll(): Observable<unknown> {
    return this.facade.getAllInstructors();
  }

  getById(userId: string): Observable<unknown> {
    return this.facade.getInstructorById(userId);
  }

  getByCourseId(courseId: string): Observable<unknown> {
    return this.facade.getInstructorByCourseId(courseId);
  }

  me(): Observable<unknown> {
    return this.facade.me();
  }

  update(payload: unknown): Observable<unknown> {
    return this.facade.update(payload);
  }
}
