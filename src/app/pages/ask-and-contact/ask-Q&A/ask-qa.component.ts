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
import { TagsService } from '../../../core/services/tags.service';

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
  private static readonly defaultPageSize = 10;

  private readonly qasService = inject(QasService);
  private readonly tagsService = inject(TagsService);
  categories: string[] = [...QA_CATEGORIES];
  selectedCategory = 0;
  currentPage = PAGINATION.DEFAULT_PAGE;
  itemsPerPage = AskQaComponent.defaultPageSize;
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
    this.loadCategories();
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
    const selectedCategoryName = this.selectedCategoryName;
    if (!selectedCategoryName) {
      return [];
    }

    const normalizedCategory = selectedCategoryName.toLowerCase();
    return this.questions.filter((question) =>
      question.categories.some((category) => category.toLowerCase() === normalizedCategory),
    );
  }

  get paginatedFilteredQuestions(): QuestionCard[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredQuestions.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get pages(): number[] {
    const totalPages = Math.max(
      PAGINATION.DEFAULT_PAGE,
      Math.ceil(this.filteredQuestions.length / this.itemsPerPage),
    );

    return Array.from({ length: totalPages }, (_value, index) => index + PAGINATION.DEFAULT_PAGE);
  }

  get showPagination(): boolean {
    // Only show pagination when there is more than one page of results
    return this.pages.length > 1;
  }

  get showEmptyCategoryHint(): boolean {
    return this.filteredQuestions.length === 0;
  }

  get selectedCategoryName(): string {
    return this.categories[this.selectedCategory] ?? '';
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
    this.currentPage = PAGINATION.DEFAULT_PAGE;
    this.loadQuestions();
    this.cdr.markForCheck();
  }

  goToPage(page: number): void {
    if (!Number.isFinite(page)) return;
    const maxPage = this.pages.length || PAGINATION.DEFAULT_PAGE;
    this.currentPage = Math.min(
      Math.max(page, PAGINATION.MIN_PAGE),
      maxPage,
    ) as typeof this.currentPage;

    this.loadQuestions();
    this.scrollToTopOfSection();
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
    const pageNumber = this.currentPage;
    const pageSize = this.itemsPerPage;

    this.qasService.getAll({ pageNumber, pageSize }).subscribe({
      next: (response) => {
        const mapped = this.mapQuestions(response);
        this.questions = mapped;
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  private loadCategories(): void {
    this.tagsService.getAll({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (response) => {
        const mapped = this.mapCategories(response);
        if (mapped.length > 0) {
          this.categories = ['All Categories', ...mapped];
          this.selectedCategory = PAGINATION.DEFAULT_PAGE - 1;
        }
        this.cdr.markForCheck();
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  private mapCategories(response: unknown): string[] {
    const records = extractArray(response);
    const uniqueCategories = new Set<string>();

    records.forEach((item) => {
      const record = asRecord(item);
      const name = toStringValue(getValue(record, 'name', 'Name', 'title', 'Title'));
      if (name) {
        uniqueCategories.add(name);
      }
    });

    return Array.from(uniqueCategories);
  }

  private scrollToTopOfSection(): void {
    const section = globalThis.document?.getElementById('qa-list-section');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private mapQuestions(response: unknown): QuestionCard[] {
    const records = extractArray(response);
    return records.map((item, index) => this.mapQuestion(item, index));
  }

  private mapQuestion(item: unknown, index: number): QuestionCard {
    const record = asRecord(item);
    // API returns translations array with questionText/answerText; prefer those if present
    const translations = extractArray(getValue(record, 'translations', 'Translations'));
    const firstTranslation = translations.length > 0 ? asRecord(translations[0]) : null;
    const title = toStringValue(
      firstTranslation ? getValue(firstTranslation, 'questionText', 'questionText', 'question') : undefined,
    ) ?? toStringValue(getValue(record, 'title', 'Title')) ?? '';

    const description = toStringValue(
      firstTranslation ? getValue(firstTranslation, 'answerText', 'answerText', 'answer') : undefined,
    ) ?? toStringValue(getValue(record, 'description', 'Description')) ?? '';
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
