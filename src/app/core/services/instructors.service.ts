import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { InstructorFacade, InstructorReadDto, InstructorUpdatePayload } from '../../api/facades/instructor.facade';

@Injectable({ providedIn: 'root' })
export class InstructorsService {
  private readonly facade = inject(InstructorFacade);

  getAll(): Observable<InstructorReadDto[]> {
    return this.facade.getAllInstructors();
  }

  getById(id: string): Observable<InstructorReadDto | null> {
    return this.facade.getInstructorById(id);
  }

  me(): Observable<InstructorReadDto | null> {
    return this.facade.me();
  }

  update(id: string, payload: InstructorUpdatePayload): Observable<boolean> {
    return this.facade.updateInstructor(id, payload).pipe(
      map(instructor => instructor !== null)
    );
  }
}
