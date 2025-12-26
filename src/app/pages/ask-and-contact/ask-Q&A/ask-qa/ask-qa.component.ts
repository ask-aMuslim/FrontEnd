import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QaCardComponent, QuestionCard } from '../qa-card/qa-card.component';
import { QA_CATEGORIES, PAGINATION } from '../../constants/ask-qa.constants';

@Component({
  selector: 'app-ask-qa',
  standalone: true,
  imports: [CommonModule, QaCardComponent],
  templateUrl: './ask-qa.component.html',
  styleUrl: './ask-qa.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskQaComponent {
  readonly categories = QA_CATEGORIES;
  selectedCategory = 1;
  currentPage = PAGINATION.DEFAULT_PAGE;
  readonly pages = [1, 2, 3];

  readonly questions: QuestionCard[] = Array(8)
    .fill(null)
    .map((_, index) => ({
      categories: ['Prayer & Worship', 'Quran & Hadith'],
      id: `Question ${1453 + index}`,
      title: 'What are the Five Pillars of Islam?',
      description:
        'The Five Pillars of Islam are the core beliefs and practices that every Muslim follows. They are:\n • Shahada (Faith): Declaring that “There is no god but Allah, and Muhammad is His Messenger.” \n • Salah (Prayer): Performing the five daily prayers at their prescribed times.\n • Zakat (Charity): Giving a fixed portion of one’s wealth to help the poor and needy. \n • Sawm (Fasting): Fasting from dawn to sunset during the month of Ramadan. \n • Hajj (Pilgrimage): Performing the pilgrimage to Makkah at least once in a lifetime, if financially and physically able.',
      sameQuestions: 3,
    }));

  goToPage(page: number): void {
    if (!Number.isFinite(page)) return;
    const maxPage = this.pages.length || PAGINATION.DEFAULT_PAGE;
    this.currentPage = Math.min(Math.max(page, PAGINATION.MIN_PAGE), maxPage) as typeof this.currentPage;
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  trackByIndex(index: number): number {
    return index;
  }

  trackByQuestionId(index: number, question: QuestionCard): string {
    return question.id;
  }
}
