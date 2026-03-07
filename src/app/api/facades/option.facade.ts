import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { asArray, extractData } from './shared';

export interface OptionReadDto {
    id?: string;
    questionId?: string;
    text?: string;
    isCorrect?: boolean;
    [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class OptionFacade {
    constructor(private readonly api: ApiService) { }

    getOptionsByQuestion(questionId: string): Observable<OptionReadDto[]> {
        return extractData(this.api.get<unknown>(`/api/Options/by-question/${questionId}`), []).pipe(map(asArray<OptionReadDto>));
    }
}
