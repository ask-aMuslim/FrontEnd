import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Router } from '@angular/router';

export interface QuestionCard {
  categories: string[];
  id: string;
  title: string;
  description: string;
  sameQuestions: number;
}

@Component({
  selector: 'app-qa-card',
  standalone: true,
  imports: [],
  templateUrl: './qa-card.component.html',
  styleUrls: ['./qa-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QaCardComponent {
  @Input({ required: true }) question!: QuestionCard;
  @Input() activeTagId: string | null = null;
  @Output() tagClicked = new EventEmitter<string>();

  constructor(private readonly router: Router) { }

  openQuestion(): void {
    // Only pass the question id and categories to avoid leaking the answer/content in the URL
    const queryParams: any = {
      id: this.question.id,
      categories: JSON.stringify(this.question.categories ?? []),
    };
    if (this.activeTagId) {
      queryParams.tagId = this.activeTagId;
    }
    void this.router.navigate(['/question-and-answer/topics/question'], { queryParams });
  }

  onTagClick(category: string): void {
    this.tagClicked.emit(category);
  }
}
