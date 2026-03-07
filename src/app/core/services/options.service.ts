import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { OptionFacade, OptionReadDto } from '../../api/facades/option.facade';

@Injectable({ providedIn: 'root' })
export class OptionsService {
    private readonly facade = inject(OptionFacade);

    getByQuestion(questionId: string): Observable<OptionReadDto[]> {
        return this.facade.getOptionsByQuestion(questionId);
    }
}
