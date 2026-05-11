
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { QaCardComponent, QuestionCard } from '../qa-card/qa-card.component';

@Component({
  selector: 'app-question-search-result',
  standalone: true,
  imports: [QaCardComponent],
  templateUrl: './question-search-result.component.html',
  styleUrl: './question-search-result.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionSearchResultComponent {
  @Input() query = '';
  @Input() results: QuestionCard[] = [];
  @Output() clearSearch = new EventEmitter<void>();
  @Output() askAI = new EventEmitter<string>();

  get hasResults(): boolean {
    return (this.results?.length ?? 0) > 0;
  }

  onClear(): void {
    this.clearSearch.emit();
  }

  onAskAI(): void {
    this.askAI.emit(this.query);
  }

  trackByQuestionId(_index: number, question: QuestionCard): string {
    return question.id;
  }
}
