import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export interface StudentProfileDto {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    level?: string;
    [key: string]: unknown;
}

export interface StudentCourseDto {
    id?: string;
    title?: string;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class StudentFacade {
    constructor(private readonly api: ApiService) { }

    getAllStudents(): Observable<StudentProfileDto[]> {
        return extractData(this.api.get<unknown>('/api/Students'), []).pipe(map(asArray<StudentProfileDto>));
    }

    getStudentById(userId: string): Observable<StudentProfileDto | null> {
        return extractData(this.api.get<unknown>(`/api/Students/${userId}`), null);
    }

    getStudentCourses(): Observable<StudentCourseDto[]> {
        return extractData(this.api.get<unknown>('/api/Students/courses'), []).pipe(map(asArray<StudentCourseDto>));
    }

    me(): Observable<StudentProfileDto | null> {
        return extractData(this.api.get<unknown>('/api/StudentProfiles/me'), null);
    }

    getProfile(): Observable<StudentProfileDto | null> {
        return this.me();
    }

    getMyProfile(): Observable<StudentProfileDto | null> {
        return this.me();
    }
}
