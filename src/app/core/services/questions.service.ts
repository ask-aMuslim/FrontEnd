import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { QuestionFacade, QuestionReadDto, QuestionCreateDto, QuestionUpdateDto } from '../../api/facades/question.facade';

/**
 * Domain service for question operations.
 *
 * Delegates to QuestionFacade (generated API paths via HttpClient).
 */
@Injectable({ providedIn: 'root' })
export class QuestionsService {
  private readonly facade = inject(QuestionFacade);

  getAllByQuizId(quizId: string): Observable<QuestionReadDto[]> {
    return this.facade.getAllQuestions(quizId);
  }

  create(payload: QuestionCreateDto): Observable<boolean> {
    return this.facade.createQuestion(payload).pipe(
      map(question => question !== null)
    );
  }

  getById(id: string): Observable<QuestionReadDto | null> {
    return this.facade.getQuestionById(id);
  }

  update(id: string, payload: QuestionUpdateDto): Observable<boolean> {
    return this.facade.updateQuestion(id, payload).pipe(
      map(question => question !== null)
    );
  }

  delete(id: string): Observable<boolean> {
    return this.facade.deleteQuestion(id);
  }
}
