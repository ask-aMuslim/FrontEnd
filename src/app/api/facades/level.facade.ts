import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export interface LevelReadDto {
    id?: string;
    title?: string;
    description?: string;
    order?: number;
    difficulty?: number;
    isPublished?: boolean;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class LevelFacade {
    constructor(private readonly api: ApiService) { }

    getAllLevels(params?: { IsPublished?: boolean }): Observable<LevelReadDto[]> {
        return extractData(this.api.get<unknown>('/api/Levels', params), []).pipe(map(asArray<LevelReadDto>));
    }

    getLevelById(id: string): Observable<LevelReadDto | null> {
        return extractData(this.api.get<unknown>(`/api/Levels/${id}`), null);
    }
}
