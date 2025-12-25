import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule],
  templateUrl: './qa-card.component.html',
  styleUrl: './qa-card.component.scss',
})
export class QaCardComponent {
  @Input() question!: QuestionCard;

  constructor(private router: Router) {}

  openQuestion() {
    const qp = {
      id: this.question.id,
      title: this.question.title,
      description: this.question.description,
      categories: JSON.stringify(this.question.categories ?? []),
    };
    void this.router.navigate(['/ask-and-contact/ask-qa/question'], { queryParams: qp });
  }
}
