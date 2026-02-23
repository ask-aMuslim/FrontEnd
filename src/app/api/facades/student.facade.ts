import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';
import { EnrollmentFacade } from './enrollment.facade';
import { CourseFacade } from './course.facade';

export interface StudentProfileDto {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    level?: string;
    bio?: string;
    gender?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    address?: string;
    country?: string;
    [key: string]: unknown;
}

export interface StudentCourseDto {
    id?: string;
    title?: string;
    [key: string]: unknown;
}

export interface UpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    bio?: string;
    gender?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    address?: string;
    country?: string;
}

@Injectable({ providedIn: 'root' })
export class StudentFacade {
    constructor(
        private readonly api: ApiService,
        private readonly enrollmentFacade: EnrollmentFacade,
        private readonly courseFacade: CourseFacade,
    ) { }

    getAllStudents(): Observable<StudentProfileDto[]> {
        return extractData(this.api.get<unknown>('/api/Students'), []).pipe(map(asArray<StudentProfileDto>));
    }

    getStudentById(userId: string): Observable<StudentProfileDto | null> {
        return extractData(this.api.get<unknown>(`/api/Students/${userId}`), null);
    }

    getStudentCourses(): Observable<StudentCourseDto[]> {
        return this.me().pipe(
            switchMap(profile => {
                const studentId = profile?.id;
                if (!studentId) {
                    return of([]);
                }

                return this.enrollmentFacade.getEnrolledCoursesByStudent(studentId).pipe(
                    switchMap(enrollments => {
                        const courseIds = enrollments
                            .map(enrollment => enrollment.courseId)
                            .filter((courseId): courseId is string => typeof courseId === 'string' && courseId.length > 0);

                        if (courseIds.length === 0) {
                            return of([]);
                        }

                        const uniqueCourseIds = Array.from(new Set(courseIds));
                        return forkJoin(uniqueCourseIds.map(courseId => this.courseFacade.getCourseById(courseId))).pipe(
                            map(courses => this.mapCourses(courses))
                        );
                    })
                );
            })
        );
    }

    private mapCourses(courses: Array<{ id?: string; title?: string } | null>): StudentCourseDto[] {
        return courses
            .filter((course): course is { id?: string; title?: string } => course !== null)
            .map(course => ({
                id: course.id,
                title: course.title,
            }));
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

    updateProfile(data: UpdateProfileRequest): Observable<StudentProfileDto | null> {
        return extractData(
            this.api.put<unknown>('/api/StudentProfiles/me', data),
            null
        );
    }

    updateProfilePicture(file: File): Observable<StudentProfileDto | null> {
        const formData = new FormData();
        formData.append('file', file);
        return extractData(
            this.api.post<unknown>('/api/StudentProfiles/picture', formData),
            null
        );
    }
}
