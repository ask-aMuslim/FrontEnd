import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../constants/api-endpoints';
import { CourseDto, CreateCourseRequest, UpdateCourseRequest } from '../models/course.model';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<CourseDto[]> {
    return this.http.get<CourseDto[]>(API_ENDPOINTS.courses.getAll());
  }

  getById(id: string): Observable<CourseDto> {
    return this.http.get<CourseDto>(API_ENDPOINTS.courses.getById(encodeURIComponent(id)));
  }

  create(payload: CreateCourseRequest): Observable<CourseDto> {
    return this.http.post<CourseDto>(API_ENDPOINTS.courses.create(), payload);
  }

  update(id: string, payload: UpdateCourseRequest): Observable<CourseDto> {
    return this.http.put<CourseDto>(API_ENDPOINTS.courses.update(encodeURIComponent(id)), payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(API_ENDPOINTS.courses.delete(encodeURIComponent(id)));
  }
}

export default CourseService;
