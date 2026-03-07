import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CourseFacade, CourseReadDto, CourseReadByIdDto, CourseCreatePayload, CourseUpdatePayload } from '../../api/facades/course.facade';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly facade = inject(CourseFacade);

  getAll(): Observable<CourseReadDto[]> {
    return this.facade.getAllCourses();
  }

  create(payload: CourseCreatePayload): Observable<boolean> {
    return this.facade.createCourse(payload).pipe(
      map(course => course !== null)
    );
  }

  getById(id: string): Observable<CourseReadByIdDto | null> {
    return this.facade.getCourseById(id);
  }

  getByIdDetailed(id: string): Observable<CourseReadByIdDto | null> {
    return this.facade.getCourseById(id);
  }

  update(id: string, payload: CourseUpdatePayload): Observable<boolean> {
    return this.facade.updateCourse(id, payload).pipe(
      map(course => course !== null)
    );
  }

  delete(id: string): Observable<boolean> {
    return this.facade.deleteCourse(id);
  }
}
