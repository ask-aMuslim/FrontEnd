import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AskAssistantService {
  generateAnswer(question: string): Observable<string> {
    const safeQuestion = this.previewQuestion(question);
    const response =
      `Thank you for asking about "${safeQuestion}". ` +
      'Our assistant will provide a detailed response shortly. ' +
      'Please consider context, intent, and consult trusted scholars for authoritative guidance.';

    return of(response).pipe(delay(250));
  }

  private previewQuestion(question: string): string {
    const trimmed = question.trim();
    return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
  }
}
