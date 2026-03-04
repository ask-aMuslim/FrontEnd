import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { QuizFacade } from '../api/facades/quiz.facade';
import { QuizReadDto } from '../api/generated/models';

@Injectable({ providedIn: 'root' })
@Injectable({ providedIn: 'root' })
export class QuizzesService {
  private readonly facade = inject(QuizFacade);

  getAll(): Observable<QuizReadDto[]> {
    return this.facade.getAllQuizzes();
  }

  create(payload: unknown): Observable<QuizReadDto> {
    return this.facade.createQuiz(payload);
  }

  getById(id: string): Observable<QuizReadDto> {
    return this.facade.getQuizById(id);
  }

  update(id: string, payload: unknown): Observable<void> {
    return this.facade.updateQuiz(id, payload);
  }

  delete(id: string): Observable<void> {
    return this.facade.deleteQuiz(id);
  }
}
