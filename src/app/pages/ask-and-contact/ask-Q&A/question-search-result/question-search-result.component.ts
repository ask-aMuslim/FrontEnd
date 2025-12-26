import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { QaCardComponent, QuestionCard } from '../qa-card/qa-card.component';

@Component({
  selector: 'app-question-search-result',
  standalone: true,
  imports: [CommonModule, QaCardComponent],
  templateUrl: './question-search-result.component.html',
  styleUrl: './question-search-result.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionSearchResultComponent {
  @Input() query = '';
  @Input() results: QuestionCard[] = [];
  @Output() clearSearch = new EventEmitter<void>();

  get hasResults(): boolean {
    return (this.results?.length ?? 0) > 0;
  }

  onClear(): void {
    this.clearSearch.emit();
  }

  trackByQuestionId(index: number, question: QuestionCard): string {
    return question.id;
  }
}
