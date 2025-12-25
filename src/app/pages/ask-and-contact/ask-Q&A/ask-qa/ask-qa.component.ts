import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { QaCardComponent, QuestionCard } from '../qa-card/qa-card.component';

@Component({
  selector: 'app-ask-qa',
  standalone: true,
  imports: [CommonModule, QaCardComponent],
  templateUrl: './ask-qa.component.html',
  styleUrl: './ask-qa.component.scss',
})
export class AskQaComponent {
  categories = [
    'All Categories',
    'Player & Worship',
    'Quran & Hadith',
    'Islamic History',
    'Family & Relationships',
    'Comparative Religion',
    'Modern Challenges',
  ];

  selectedCategory = 1;
  currentPage = 1;

  pages = [1, 2, 3];

  goToPage(page: number) {
    if (!Number.isFinite(page)) return;
    const minPage = 1;
    const maxPage = this.pages.length || 1;
    this.currentPage = Math.min(Math.max(page, minPage), maxPage);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  questions: QuestionCard[] = Array(8)
    .fill(null)
    .map(() => ({
      categories: ['Prayer & Worship', 'Quran & Hadith'],
      id: 'Question 1453',
      title: 'What are the Five Pillars of Islam?',
      description:
        'The Five Pillars of Islam are the core beliefs and practices that every Muslim follows. They are:\n • Shahada (Faith): Declaring that “There is no god but Allah, and Muhammad is His Messenger.” \n • Salah (Prayer): Performing the five daily prayers at their prescribed times.\n • Zakat (Charity): Giving a fixed portion of one’s wealth to help the poor and needy. \n • Sawm (Fasting): Fasting from dawn to sunset during the month of Ramadan. \n • Hajj (Pilgrimage): Performing the pilgrimage to Makkah at least once in a lifetime, if financially and physically able.',
      sameQuestions: 3,
    }));
}
