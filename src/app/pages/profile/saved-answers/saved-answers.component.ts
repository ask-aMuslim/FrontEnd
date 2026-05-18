import { Component } from '@angular/core';

import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
import { PaginationComponent } from '../../../shared/reusable-components/pagination/pagination.component';
@Component({
  selector: 'app-saved-answers',
  imports: [InlineSvgDirective, PaginationComponent],
  templateUrl: './saved-answers.component.html',
  styleUrls: ['./saved-answers.component.scss'],
})
export class SavedAnswersComponent {
  currentPage = 1;
  readonly pages = [1, 2, 3];
  arrowLeftIcon = '/icons/icons-24/arrow-left.svg';
  arrowRightIcon = '/icons/icons-24/arrow-right.svg';

  savedAnswers = [
    {
      id: '1',
      course: 'Course A',
      question: 'What Is Islam?',
      answer:
        'Islam is a monotheistic religion that teaches the oneness of God (Allah) and follows the teachings of Prophet Muhammad.',
    },
    {
      id: '2',
      course: 'Course B',
      question: 'What are the Five Pillars?',
      answer:
        'The Five Pillars are: Shahada, Salah, Zakat, Sawm, and Hajj - the fundamental practices of Islam.',
    },
    {
      id: '3',
      course: 'Course A',
      question: 'What Is Halal?',
      answer: 'Halal refers to things that are permissible according to Islamic law.',
    },
    {
      id: '4',
      course: 'Course B',
      question: 'What Is Quranic recitation?',
      answer:
        'Tajweed is the proper way of reciting the Quran with correct pronunciation and intonation.',
    },
  ];

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.pages.length) {
      this.currentPage++;
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }
}
