import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CourseReadDto, CourseReadByIdDto } from '../api/generated/models';
import { CourseFacade } from '../api/facades/course.facade';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly facade = inject(CourseFacade);

  getAll(): Observable<CourseReadDto[]> {
    return this.facade.getAllCourses();
  }

  create(payload: any): Observable<CourseReadByIdDto> {
    // Note: The facade's createCourse should return the created object
    // Verification needed if generated API returns generic response or typed DTO
    return this.facade.createCourse(payload);
  }

  getById(id: string): Observable<CourseReadByIdDto> {
    return this.facade.getCourseById(id);
  }

  update(id: string, payload: any): Observable<void> {
    return this.facade.updateCourse(id, payload);
  }

  delete(id: string): Observable<void> {
    return this.facade.deleteCourse(id);
  }
}
