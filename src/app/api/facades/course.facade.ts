import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export interface CourseReadDto {
    id?: string;
    title?: string;
    category?: string;
    level?: string;
    levelId?: string;
    numberOfLessons?: number;
    lessons?: unknown[];
    instructorID?: string;
    instructorName?: string;
    numberOfStudentsEnrolled?: number;
    thumbnailUrl?: string;
    description?: string;
    order?: number;
    isPublished?: boolean;
    prerequisites?: RoadmapCourseDto[];
    [key: string]: unknown;
}

export interface CourseReadByIdDto extends CourseReadDto {
    description?: string;
}

export interface RoadmapCourseDto {
    id?: string;
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    order?: number;
    isCompleted?: boolean;
    isLocked?: boolean;
    prerequisites?: RoadmapCourseDto[];
    levelId?: string;
    [key: string]: unknown;
}

export type CourseCreatePayload = Record<string, unknown>;
export type CourseUpdatePayload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class CourseFacade {
    constructor(private readonly api: ApiService) { }

    getAllCourses(): Observable<CourseReadDto[]> {
        return extractData(this.api.get<unknown>('/api/Courses'), []).pipe(map(asArray<CourseReadDto>));
    }

    getCoursesByLevel(levelId: string): Observable<CourseReadDto[]> {
        return extractData(
            this.api.get<unknown>('/api/Courses', { LevelId: levelId, IsPublished: 'true' }),
            []
        ).pipe(map(asArray<CourseReadDto>));
    }

    getRoadmap(levelId: string, studentId?: string): Observable<RoadmapCourseDto[]> {
        const params: Record<string, string> = {};
        if (studentId) {
            params['studentId'] = studentId;
        }
        return extractData(
            this.api.get<unknown>(`/api/Courses/roadmap/${levelId}`, params),
            []
        ).pipe(map(asArray<RoadmapCourseDto>));
    }

    getCourseById(id: string): Observable<CourseReadByIdDto | null> {
        return extractData(this.api.get<unknown>(`/api/Courses/${id}`), null);
    }

    createCourse(payload: CourseCreatePayload): Observable<CourseReadByIdDto | null> {
        return extractData(this.api.post<unknown>('/api/Courses', payload), null);
    }

    updateCourse(id: string, payload: CourseUpdatePayload): Observable<CourseReadByIdDto | null> {
        return extractData(this.api.put<unknown>(`/api/Courses/${id}`, payload), null);
    }

    deleteCourse(id: string): Observable<boolean> {
        return this.api.delete<unknown>(`/api/Courses/${id}`).pipe(map(() => true));
    }
}
