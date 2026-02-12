import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

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

  constructor(private readonly router: Router) {}

  openQuestion(): void {
    const queryParams = {
      id: this.question.id,
      title: this.question.title,
      description: this.question.description,
      categories: JSON.stringify(this.question.categories ?? []),
    };
    void this.router.navigate(['/ask-and-contact/ask-qa/question'], { queryParams });
  }
}
