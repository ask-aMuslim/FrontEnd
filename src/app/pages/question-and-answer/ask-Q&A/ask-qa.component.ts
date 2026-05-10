import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { QA_CATEGORIES, PAGINATION } from '../constants/ask-qa.constants';
import { QaCardComponent, QuestionCard } from './qa-card/qa-card.component';
import { QuestionSearchResultComponent } from './question-search-result/question-search-result.component';
import { PaginationComponent } from '../../../shared/reusable-components/pagination/pagination.component';
import { QasService } from '../../../core/services/qas.service';
import { asRecord, extractArray, getValue, toNumberValue, toStringArray, toStringValue } from '../../../core/helpers/api-response.helper';
import { TagsService } from '../../../core/services/tags.service';

interface TagFilterOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-question-and-answer-topics',
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
  private static readonly tagFetchPageSize = 100;
  private static readonly minimumTotalPages = 1;

  private readonly qasService = inject(QasService);
  private readonly tagsService = inject(TagsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private initialCategoryQuery: string | null = null;
  private lastScrolledCategoryIndex: number | null = null;
  private lastScrolledCategoryContainerWidth: number | null = null;
  private selectedCategoryScrollTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
  private tagFilterOptions: TagFilterOption[] = [];
  private allFilteredQuestions: QuestionCard[] = [];
  private loadedTagId: string | null = null;
  categories: string[] = [...QA_CATEGORIES];
  selectedCategory = 0;
  currentPage: number = PAGINATION.DEFAULT_PAGE;
  itemsPerPage = AskQaComponent.defaultPageSize;
  totalPages = 1;
  totalCount = 0;
  searchQuery = '';
  hasSearched = false;
  searchResults: QuestionCard[] = [];

  questions: QuestionCard[] = [];
  arrowRightIcon = '/icons/icons-24/arrow-right.svg';
  arrowLeftIcon = '/icons/icons-24/arrow-left.svg';

  @ViewChildren('categoryButton')
  private readonly categoryButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.initialCategoryQuery = this.route.snapshot.queryParamMap.get('category')
      ?? this.route.snapshot.queryParamMap.get('tag');
    this.loadCategories();
    if (!this.initialCategoryQuery) {
      this.loadQuestions();
    }
    const initialQuery = this.route.snapshot.queryParamMap.get('question');
    if (initialQuery) {
      this.searchQuery = initialQuery;
    }
  }

  get isShowingResults(): boolean {
    return this.hasSearched && this.searchQuery.trim().length > 0;
  }

  get searchPreviewQuestion(): QuestionCard | null {
    if (!this.isShowingResults) {
      return null;
    }

    return this.searchResults.find((question) => this.toPlainText(question.description).length > 0) ?? null;
  }

  get showQuestionPreviewSection(): boolean {
    return this.searchPreviewQuestion !== null;
  }

  get searchPreviewAnswerText(): string {
    const previewQuestion = this.searchPreviewQuestion;
    if (!previewQuestion) {
      return '';
    }

    return this.toPlainText(previewQuestion.description);
  }

  get paginatedFilteredQuestions(): QuestionCard[] {
    return this.selectedCategory === 0 ? this.questions : this.getTagPaginatedQuestions();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_value, index) => index + PAGINATION.DEFAULT_PAGE);
  }

  get showPagination(): boolean {
    // Only show pagination when there is more than one page of results
    return this.totalPages > 1;
  }

  get showEmptyCategoryHint(): boolean {
    return this.questions.length === 0;
  }

  get selectedCategoryName(): string {
    return this.categories[this.selectedCategory] ?? '';
  }

  private get selectedCategoryTagId(): string | null {
    if (this.selectedCategory === 0) {
      return null;
    }

    const option = this.tagFilterOptions[this.selectedCategory - 1];
    return option?.id ?? null;
  }

  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      this.clearSearch();
      return;
    }

    const normalizedQuery = query.toLowerCase();
    const sourceQuestions = this.selectedCategory === 0 ? this.questions : this.allFilteredQuestions;
    this.searchResults = sourceQuestions.filter((question) =>
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
    this.queueSelectedCategoryScroll();
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

  isGeneralCategory(index: number): boolean {
    if (index !== 1) {
      return false;
    }

    const category = this.categories[index] ?? '';
    return this.isGeneralCategoryName(category);
  }

  getPreviewTags(question: QuestionCard): string[] {
    if (question.categories.length > 0) {
      return question.categories;
    }

    return ['General'];
  }

  openSearchPreviewQuestion(question: QuestionCard): void {
    const queryParams = {
      id: question.id,
      categories: JSON.stringify(question.categories ?? []),
    };
    void this.router.navigate(['/question-and-answer/topics/question'], { queryParams });
  }

  private matchesQuery(question: QuestionCard, normalizedQuery: string): boolean {
    return (
      question.title.toLowerCase().includes(normalizedQuery) ||
      question.description.toLowerCase().includes(normalizedQuery) ||
      question.categories.some((category) => category.toLowerCase().includes(normalizedQuery))
    );
  }

  private toPlainText(value: string): string {
    return value
      .replaceAll(/<[^>]+>/g, ' ')
      .replaceAll('&nbsp;', ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
  }

  private loadQuestions(): void {
    const selectedTagId = this.selectedCategoryTagId;
    if (selectedTagId && this.selectedCategoryName) {
      if (this.loadedTagId === selectedTagId && this.allFilteredQuestions.length > 0) {
        this.questions = this.getTagPaginatedQuestions();
        this.cdr.markForCheck();
        if (this.searchQuery) {
          this.onSearch();
        }
        return;
      }

      this.loadAllTagQuestions(selectedTagId);
      return;
    }

    this.loadedTagId = null;
    this.allFilteredQuestions = [];
    const pageNumber = this.currentPage;
    const pageSize = this.itemsPerPage;
    this.qasService.getAll({ pageNumber, pageSize }).subscribe({
      next: (response: unknown) => {
        const mapped = this.mapQuestions(response);
        this.questions = mapped;

        const { totalPages, totalCount } = this.extractPagination(response, mapped.length);
        this.totalPages = totalPages;
        this.totalCount = totalCount;

        this.cdr.markForCheck();

        if (this.searchQuery) {
          this.onSearch();
        }
      },
      error: () => this.cdr.markForCheck(),
    });
  }

  private loadAllTagQuestions(tagId: string): void {
    const pageSize = AskQaComponent.tagFetchPageSize;

    this.qasService.getAll({ pageNumber: 1, pageSize, tagIds: tagId }).pipe(
      switchMap((firstResponse) => {
        const firstPageQuestions = this.mapQuestions(firstResponse);
        const pagination = this.extractPagination(firstResponse, firstPageQuestions.length);
        const totalPages = pagination.totalPages;

        if (totalPages <= AskQaComponent.minimumTotalPages) {
          return of({
            allQuestions: firstPageQuestions,
          });
        }

        const remainingPageRequests: Observable<QuestionCard[]>[] = Array.from(
          { length: totalPages - 1 },
          (_item, index) => this.qasService
            .getAll({ pageNumber: index + 2, pageSize, tagIds: tagId })
            .pipe(map((response) => this.mapQuestions(response))),
        );

        return forkJoin(remainingPageRequests).pipe(
          map((remainingPages) => {
            const allQuestions = [
              ...firstPageQuestions,
              ...remainingPages.flat(),
            ];
            return {
              allQuestions,
            };
          }),
        );
      }),
      catchError(() => of({ allQuestions: [] })),
    ).subscribe(({ allQuestions }) => {
      this.loadedTagId = tagId;
      this.allFilteredQuestions = allQuestions;
      this.totalCount = allQuestions.length;
      this.totalPages = Math.max(
        AskQaComponent.minimumTotalPages,
        Math.ceil(this.totalCount / this.itemsPerPage),
      );

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }

      this.questions = this.getTagPaginatedQuestions();
      this.cdr.markForCheck();

      if (this.searchQuery) {
        this.onSearch();
      }
    });
  }

  private getTagPaginatedQuestions(): QuestionCard[] {
    const start = (this.currentPage - PAGINATION.DEFAULT_PAGE) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.allFilteredQuestions.slice(start, end);
  }

  private extractPagination(response: unknown, fallbackCount: number): { totalPages: number; totalCount: number } {
    const result = response as {
      data?: { totalPages?: number; totalCount?: number; pageCount?: number; itemCount?: number };
      totalPages?: number;
      totalCount?: number;
      pageCount?: number;
      itemCount?: number;
    };

    const nested = result?.data;
    const totalPages =
      nested?.totalPages ??
      nested?.pageCount ??
      result?.totalPages ??
      result?.pageCount ??
      AskQaComponent.minimumTotalPages;

    const totalCount =
      nested?.totalCount ??
      nested?.itemCount ??
      result?.totalCount ??
      result?.itemCount ??
      fallbackCount;

    return {
      totalPages: Math.max(AskQaComponent.minimumTotalPages, totalPages),
      totalCount,
    };
  }

  private loadCategories(): void {
    this.tagsService.getAll({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (response) => {
        const mapped = this.mapCategories(response);
        const ordered = this.prioritizeGeneralCategory(mapped);
        if (ordered.length > 0) {
          this.tagFilterOptions = ordered;
          this.categories = ['All', ...ordered.map((tag) => tag.name)];
        }

        if (this.initialCategoryQuery) {
          this.applyCategoryQuery(this.initialCategoryQuery);
          return;
        }

        this.cdr.markForCheck();
      },
      error: () => {
        if (this.initialCategoryQuery) {
          this.loadQuestions();
          return;
        }

        this.cdr.markForCheck();
      },
    });
  }

  private applyCategoryQuery(categoryQuery: string): void {
    const normalizedQuery = categoryQuery.trim().toLowerCase();
    const matchedIndex = this.categories.findIndex(
      (category) => category.trim().toLowerCase() === normalizedQuery,
    );

    if (matchedIndex > 0) {
      this.selectCategory(matchedIndex);
      return;
    }

    this.selectedCategory = PAGINATION.DEFAULT_PAGE - 1;
    this.currentPage = PAGINATION.DEFAULT_PAGE;
    this.loadQuestions();
    this.queueSelectedCategoryScroll();
  }

  private queueSelectedCategoryScroll(): void {
    if (!this.isBrowser) {
      return;
    }

    if (this.selectedCategoryScrollTimeout !== null) {
      globalThis.clearTimeout(this.selectedCategoryScrollTimeout);
    }

    this.selectedCategoryScrollTimeout = globalThis.setTimeout(() => {
      this.selectedCategoryScrollTimeout = null;
      this.scrollSelectedCategoryIntoView();
    }, 300);
  }

  private scrollSelectedCategoryIntoView(): void {
    if (!this.isBrowser || this.selectedCategory === 0) {
      return;
    }

    const activeButton = this.categoryButtons?.toArray()[this.selectedCategory]?.nativeElement;
    const container = activeButton?.parentElement;
    if (!activeButton || !container) {
      return;
    }

    const containerWidth = container.clientWidth;
    if (
      this.lastScrolledCategoryIndex === this.selectedCategory &&
      this.lastScrolledCategoryContainerWidth === containerWidth
    ) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();
    const targetScrollLeft = container.scrollLeft + (buttonRect.left - containerRect.left);
    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    const scrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft));

    container.scrollTo({
      left: scrollLeft,
      behavior: 'auto',
    });
    this.lastScrolledCategoryIndex = this.selectedCategory;
    this.lastScrolledCategoryContainerWidth = containerWidth;
  }

  private mapCategories(response: unknown): TagFilterOption[] {
    const records = extractArray(response);
    const uniqueCategories = new Map<string, TagFilterOption>();

    records.forEach((item) => {
      const record = asRecord(item);
      const id = toStringValue(getValue(record, 'id', 'Id'));
      const name = toStringValue(getValue(record, 'name', 'Name', 'title', 'Title'));
      if (id && name && name !== 'Hero Page Questions') {
        uniqueCategories.set(id, { id, name });
      }
    });

    return Array.from(uniqueCategories.values());
  }

  private prioritizeGeneralCategory(categories: TagFilterOption[]): TagFilterOption[] {
    if (categories.length === 0) {
      return categories;
    }

    const generalCategories: TagFilterOption[] = [];
    const otherCategories: TagFilterOption[] = [];

    categories.forEach((category) => {
      if (this.isGeneralCategoryName(category.name)) {
        generalCategories.push(category);
        return;
      }

      otherCategories.push(category);
    });

    return [...generalCategories, ...otherCategories];
  }

  private isGeneralCategoryName(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === 'general' || normalized.startsWith('general ');
  }

  private scrollToTopOfSection(): void {
    if (!this.isBrowser) {
      return;
    }

    const section = globalThis.document?.getElementById('qa-list-section');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private mapQuestions(response: unknown): QuestionCard[] {
    const records = extractArray(response);
    return records
      .map((item, index) => this.mapQuestion(item, index))
      .filter((question): question is QuestionCard => question !== null);
  }

  private mapQuestion(item: unknown, index: number): QuestionCard | null {
    const record = asRecord(item);
    const isPublished = getValue(record, 'isPublished', 'IsPublished');
    if (isPublished === false) {
      return null;
    }

    // API returns translations array with questionText/answerText; prefer those if present
    const translations = extractArray(getValue(record, 'translations', 'Translations'));
    const firstTranslation = translations
      .map((translation) => asRecord(translation))
      .find((translation) => {
        const translationPublished = getValue(translation, 'isPublished', 'IsPublished');
        const translationDeleted = getValue(translation, 'isDeleted', 'IsDeleted');
        return translationPublished !== false && translationDeleted !== true;
      }) ?? null;

    const title = toStringValue(
      firstTranslation ? getValue(firstTranslation, 'questionText', 'questionText', 'question') : undefined,
    ) ?? toStringValue(getValue(record, 'title', 'Title')) ?? '';

    const description = toStringValue(
      firstTranslation ? getValue(firstTranslation, 'answerText', 'answerText', 'answer') : undefined,
    ) ?? toStringValue(getValue(record, 'description', 'Description')) ?? '';

    if (!title.trim() || !description.trim()) {
      return null;
    }

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
