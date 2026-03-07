import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { QuizFacade, QuizReadDto, QuizCreateDto, QuizUpdateDto, QuizQuery } from '../../api/facades/quiz.facade';

@Injectable({ providedIn: 'root' })
export class QuizzesService {
  private readonly facade = inject(QuizFacade);

  getAll(query?: QuizQuery): Observable<QuizReadDto[]> {
    return this.facade.getAllQuizzes(query);
  }

  getById(id: string): Observable<QuizReadDto | null> {
    return this.facade.getQuizById(id);
  }

  create(payload: QuizCreateDto): Observable<boolean> {
    return this.facade.createQuiz(payload).pipe(
      map(quiz => quiz !== null)
    );
  }

  update(id: string, payload: QuizUpdateDto): Observable<boolean> {
    return this.facade.updateQuiz(id, payload).pipe(
      map(quiz => quiz !== null)
    );
  }

  delete(id: string): Observable<boolean> {
    return this.facade.deleteQuiz(id);
  }
}
