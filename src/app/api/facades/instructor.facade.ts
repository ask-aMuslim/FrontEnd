import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export interface InstructorReadDto {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    [key: string]: unknown;
}

export type InstructorUpdatePayload = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class InstructorFacade {
    constructor(private readonly api: ApiService) { }

    getAllInstructors(): Observable<InstructorReadDto[]> {
        return extractData(this.api.get<unknown>('/api/Instructors'), []).pipe(map(asArray<InstructorReadDto>));
    }

    getInstructorById(id: string): Observable<InstructorReadDto | null> {
        return extractData(this.api.get<unknown>(`/api/Instructors/${id}`), null);
    }

    me(): Observable<InstructorReadDto | null> {
        return extractData(this.api.get<unknown>('/api/Instructors/me'), null);
    }

    updateInstructor(id: string, payload: InstructorUpdatePayload): Observable<InstructorReadDto | null> {
        return extractData(this.api.put<unknown>(`/api/Instructors/${id}`, payload), null);
    }
}
