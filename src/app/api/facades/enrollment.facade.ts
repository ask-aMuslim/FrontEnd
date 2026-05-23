import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { CreateEnrollmentCommand, EnrollmentStatus } from '../models';
import { asArray, extractData } from './shared';

export interface EnrollmentReadDto {
    id?: string;
    studentId?: string;
    courseId?: string;
    status?: EnrollmentStatus | string | null;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class EnrollmentFacade {
    constructor(private readonly api: ApiService) { }

    getAllEnrollments(studentId?: string): Observable<EnrollmentReadDto[]> {
        if (!studentId) {
            return of([]);
        }
        // Disabled direct enrollment lookup by student to prevent API calls
        return of([]);
    }

    getEnrollment(id: string): Observable<EnrollmentReadDto | null> {
        return extractData(this.api.get<unknown>(`/api/Enrollments/${id}`), null);
    }

    getStudentsEnrolledInCourse(courseId: string): Observable<EnrollmentReadDto[]> {
        return extractData(this.api.get<unknown>(`/api/Enrollments/by-course/${courseId}`), []).pipe(map(asArray<EnrollmentReadDto>));
    }

    getEnrolledCoursesByStudent(studentId: string): Observable<EnrollmentReadDto[]> {
        // Disabled direct enrollment lookup by student to prevent API calls
        return of([]);
    }

    createEnrollment(payload: CreateEnrollmentCommand): Observable<EnrollmentReadDto | null> {
        return extractData(this.api.post<unknown>('/api/Enrollments', payload), null);
    }

    updateEnrollmentStatus(id: string, status: EnrollmentStatus): Observable<boolean> {
        return this.api.put<unknown>(`/api/Enrollments/${id}/status`, { status }).pipe(map(() => true));
    }

    deleteEnrollment(id: string): Observable<boolean> {
        return this.api.delete<unknown>(`/api/Enrollments/${id}`).pipe(map(() => true));
    }
}
