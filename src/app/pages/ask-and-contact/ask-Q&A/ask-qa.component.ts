import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { QA_CATEGORIES, PAGINATION } from '../constants/ask-qa.constants';
import { QaCardComponent, QuestionCard } from './qa-card/qa-card.component';
import { QuestionSearchResultComponent } from './question-search-result/question-search-result.component';
import { PaginationComponent } from '../../../shared/reusable-components/pagination/pagination.component';
import { QasService } from '../../../core/services/qas.service';
import { asRecord, extractArray, getValue, toNumberValue, toStringArray, toStringValue } from '../../../core/helpers/api-response.helper';

@Component({
  selector: 'app-ask-qa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    QaCardComponent,
    QuestionSearchResultComponent,
    PaginationComponent
  ],
  templateUrl: './ask-qa.component.html',
  styleUrls: ['./ask-qa.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskQaComponent implements OnInit {
  private static readonly fallbackQuestionCount = 0;
  private static readonly fallbackIdPrefix = 'Q-';
  private static readonly idOffset = 1;

  private readonly qasService = inject(QasService);
  readonly categories = QA_CATEGORIES;
  selectedCategory = 0;
  currentPage = PAGINATION.DEFAULT_PAGE;
  readonly pages = [1, 2, 3];
  searchQuery = '';
  hasSearched = false;
  searchResults: QuestionCard[] = [];

  questions: QuestionCard[] = [];
  arrowRightIcon = '/icons/icons-24/arrow-right.svg';
  arrowLeftIcon = '/icons/icons-24/arrow-left.svg';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadQuestions();
    const initialQuery = this.route.snapshot.queryParamMap.get('question');
    if (initialQuery) {
      this.searchQuery = initialQuery;
      this.onSearch();
    }
  }

  get isShowingResults(): boolean {
    return this.hasSearched && this.searchQuery.trim().length > 0;
  }

  get filteredQuestions(): QuestionCard[] {
    if (this.selectedCategory === 0) {
      return this.questions;
    }
    const selectedCategoryName = this.categories[this.selectedCategory];
    return this.questions.filter((question) => question.categories.includes(selectedCategoryName));
  }

  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      this.clearSearch();
      return;
    }

    const normalizedQuery = query.toLowerCase();
    this.searchResults = this.questions.filter((question) =>
      this.matchesQuery(question, normalizedQuery),
    );
    this.hasSearched = true;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.hasSearched = false;
  }

  selectCategory(index: number): void {
    this.selectedCategory = index;
    this.cdr.markForCheck();
  }

  goToPage(page: number): void {
    if (!Number.isFinite(page)) return;
    const maxPage = this.pages.length || PAGINATION.DEFAULT_PAGE;
    this.currentPage = Math.min(
      Math.max(page, PAGINATION.MIN_PAGE),
      maxPage,
    ) as typeof this.currentPage;
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

  trackByQuestionId(_index: number, question: QuestionCard): string {
    return question.id;
  }

  private matchesQuery(question: QuestionCard, normalizedQuery: string): boolean {
    return (
      question.title.toLowerCase().includes(normalizedQuery) ||
      question.description.toLowerCase().includes(normalizedQuery) ||
      question.categories.some((category) => category.toLowerCase().includes(normalizedQuery))
    );
  }

  private loadQuestions(): void {
    this.qasService.getAll().subscribe({
      next: (response) => {
        const mapped = this.mapQuestions(response);
        if (mapped.length > 0) {
          this.questions = mapped;
        }
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  private mapQuestions(response: unknown): QuestionCard[] {
    const records = extractArray(response);
    return records.map((item, index) => this.mapQuestion(item, index));
  }

  private mapQuestion(item: unknown, index: number): QuestionCard {
    const record = asRecord(item);
    const title = toStringValue(getValue(record, 'title', 'Title')) ?? '';
    const description = toStringValue(getValue(record, 'description', 'Description')) ?? '';
    const categories = toStringArray(getValue(record, 'categories', 'Categories', 'tags', 'Tags'));
    const id =
      toStringValue(getValue(record, 'id', 'Id')) ??
      `${AskQaComponent.fallbackIdPrefix}${index + AskQaComponent.idOffset}`;
    const sameQuestions = toNumberValue(getValue(record, 'sameQuestions', 'SameQuestions')) ??
      AskQaComponent.fallbackQuestionCount;

    return {
      id,
      title,
      description,
      categories,
      sameQuestions,
    };
  }
}
