import { Injectable } from '@angular/core';
import { Observable, map, shareReplay, finalize } from 'rxjs';
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
    prerequisiteIds?: string[];
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
    prerequisiteIds?: string[];
    levelId?: string;
    numberOfLessons?: number;
    lessonsCount?: number;
    lessons?: unknown[];
    duration?: string;
    [key: string]: unknown;
}

export type CourseCreatePayload = Record<string, unknown>;
export type CourseUpdatePayload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class CourseFacade {
    private readonly activeRequests = new Map<string, Observable<any>>();

    constructor(private readonly api: ApiService) { }

    getAllCourses(): Observable<CourseReadDto[]> {
        const cacheKey = 'allCourses';
        if (this.activeRequests.has(cacheKey)) return this.activeRequests.get(cacheKey)!;

        const request$ = extractData(this.api.get<unknown>('/api/Courses'), []).pipe(
            map(asArray<CourseReadDto>),
            finalize(() => this.activeRequests.delete(cacheKey)),
            shareReplay(1)
        );

        this.activeRequests.set(cacheKey, request$);
        return request$;
    }

    getCoursesByLevel(levelId: string): Observable<CourseReadDto[]> {
        const cacheKey = `level_${levelId}`;
        if (this.activeRequests.has(cacheKey)) return this.activeRequests.get(cacheKey)!;

        const request$ = extractData(
            this.api.get<unknown>('/api/Courses', { LevelId: levelId, IsPublished: 'true' }),
            []
        ).pipe(
            map(asArray<CourseReadDto>),
            finalize(() => this.activeRequests.delete(cacheKey)),
            shareReplay(1)
        );

        this.activeRequests.set(cacheKey, request$);
        return request$;
    }

    getRoadmap(levelId: string, studentId?: string, isPublished?: boolean): Observable<RoadmapCourseDto[]> {
        const cacheKey = `roadmap_${levelId}_${studentId || ''}_${isPublished !== undefined ? isPublished : ''}`;
        if (this.activeRequests.has(cacheKey)) return this.activeRequests.get(cacheKey)!;

        const params: Record<string, string> = {};
        if (studentId) {
            params['studentId'] = studentId;
        }
        if (isPublished !== undefined) {
            params['isPublished'] = String(isPublished);
            params['IsPublished'] = String(isPublished);
        }

        const request$ = extractData(
            this.api.get<unknown>(`/api/Courses/roadmap/${levelId}`, params),
            []
        ).pipe(
            map(asArray<RoadmapCourseDto>),
            finalize(() => this.activeRequests.delete(cacheKey)),
            shareReplay(1)
        );

        this.activeRequests.set(cacheKey, request$);
        return request$;
    }

    getCourseById(id: string): Observable<CourseReadByIdDto | null> {
        const cacheKey = `courseById_${id}`;
        if (this.activeRequests.has(cacheKey)) return this.activeRequests.get(cacheKey)!;

        const request$ = extractData(this.api.get<unknown>(`/api/Courses/${id}`), null).pipe(
            finalize(() => this.activeRequests.delete(cacheKey)),
            shareReplay(1)
        );

        this.activeRequests.set(cacheKey, request$);
        return request$;
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
