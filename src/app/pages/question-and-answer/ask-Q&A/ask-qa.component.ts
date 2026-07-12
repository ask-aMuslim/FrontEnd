import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  PLATFORM_ID,
  QueryList,
  ViewChildren,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { QA_CATEGORIES, PAGINATION } from '../constants/ask-qa.constants';
import { QaCardComponent, QuestionCard } from './qa-card/qa-card.component';
import { QuestionSearchResultComponent } from './question-search-result/question-search-result.component';
import { PaginationComponent } from '../../../shared/reusable-components/pagination/pagination.component';
import { QasService } from '../../../core/services/qas.service';
import { asRecord, extractArray, getValue, toNumberValue, toStringArray, toStringValue } from '../../../core/helpers/api-response.helper';
import { TagsService } from '../../../core/services/tags.service';
import { AskQaResolvedData } from './ask-qa.resolver';
import { SeoService } from '../../../core/services/seo.service';

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
  // Holds an error message when Q&A API fails
  errorMessage: string | null = null;
  private static readonly tagFetchPageSize = 100;
  private static readonly minimumTotalPages = 1;

  private readonly qasService = inject(QasService);
  private readonly tagsService = inject(TagsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly seoService = inject(SeoService);
  private initialCategoryQuery: string | null = null;
  private lastScrolledCategoryIndex: number | null = null;
  private lastScrolledCategoryContainerWidth: number | null = null;
  private selectedCategoryScrollTimeout: ReturnType<typeof globalThis.setTimeout> | null = null;
  private tagFilterOptions: TagFilterOption[] = [];
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

  @Input() set resolvedData(data: AskQaResolvedData | null) {
    if (data) {
      this.tagFilterOptions = data.categories;
      this.categories = ['All', ...data.categories.map((tag) => tag.name)];
      this.questions = data.initialQuestions;
      this.totalCount = data.totalCount;
      this.totalPages = data.totalPages;
      this.selectedCategory = data.initialSelectedCategoryIndex;
      this.loadedTagId = this.selectedCategoryTagId || 'all';
      this.currentPage = PAGINATION.DEFAULT_PAGE;

      const initialQuery = this.route.snapshot.queryParamMap.get('question');
      if (initialQuery) {
        this.searchQuery = initialQuery;
        this.onSearch();
      }

      this.cdr.markForCheck();
      this.queueSelectedCategoryScroll();
    }
  }

  ngOnInit(): void {
    // If resolvedData didn't populate categories (fallback mode), perform traditional lazy loading
    if (this.categories.length === QA_CATEGORIES.length && this.categories.every((c, i) => c === QA_CATEGORIES[i])) {
      this.initialCategoryQuery = this.route.snapshot.queryParamMap.get('category')
        ?? this.route.snapshot.queryParamMap.get('tag');
      const tagIdQuery = this.route.snapshot.queryParamMap.get('tagId');
      this.loadCategories();
      if (!this.initialCategoryQuery && !tagIdQuery) {
        this.loadQuestions();
      }
    }
    const initialQuery = this.route.snapshot.queryParamMap.get('question');
    if (initialQuery) {
      this.searchQuery = initialQuery;
      this.onSearch();
    }

    this.seoService.setMetaTags({
      title: 'Islamic Q&A - Ask Questions & Find Answers',
      description: 'Search through thousands of verified Islamic questions and answers on topics of theology, jurisprudence, Quranic studies, comparative religion, and history.',
      keywords: ['Islamic Q&A', 'ask questions Islam', 'scholar answers', 'theology', 'jurisprudence', 'comparative religion']
    });
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
    return this.questions;
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

  get selectedCategoryTagId(): string | null {
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

    this.qasService.getAll({
      searchTerm: query,
      isPublished: true,
      pageSize: 50,
    }).subscribe({
      next: (response) => {
        const results = this.mapQuestions(response);
        const normalizedQuery = query.toLowerCase();
        
        this.searchResults = results.sort((a, b) => {
          const aTitleMatch = a.title.toLowerCase().includes(normalizedQuery);
          const bTitleMatch = b.title.toLowerCase().includes(normalizedQuery);

          if (aTitleMatch && !bTitleMatch) return -1;
          if (!aTitleMatch && bTitleMatch) return 1;

          const aDescMatch = a.description.toLowerCase().includes(normalizedQuery);
          const bDescMatch = b.description.toLowerCase().includes(normalizedQuery);

          if (aDescMatch && !bDescMatch) return -1;
          if (!aDescMatch && bDescMatch) return 1;

          return 0;
        });
        this.hasSearched = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Search failed', error);
        this.searchResults = [];
        this.hasSearched = true;
        this.cdr.markForCheck();
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.hasSearched = false;
  }

  onAskAI(query: string): void {
    void this.router.navigate(['/question-and-answer/ask-assistant'], {
      queryParams: { q: query },
    });
  }

  selectCategory(index: number): void {
    this.selectedCategory = index;
    this.currentPage = PAGINATION.DEFAULT_PAGE;
    this.loadQuestions();
    this.cdr.markForCheck();
    this.queueSelectedCategoryScroll();

    const selectedTag = index === 0 ? null : this.categories[index];
    const selectedTagId = this.selectedCategoryTagId;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        tag: selectedTag,
        tagId: selectedTagId,
      },
      queryParamsHandling: 'merge',
    });
  }

  onTagClicked(tagName: string): void {
    const matchedIndex = this.categories.findIndex(
      (category) => category.trim().toLowerCase() === tagName.trim().toLowerCase()
    );
    if (matchedIndex >= 0) {
      this.selectCategory(matchedIndex);
    }
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
    const queryParams: any = {
      id: question.id,
      categories: JSON.stringify(question.categories ?? []),
    };
    const tagId = this.selectedCategoryTagId;
    if (tagId) {
      queryParams.tagId = tagId;
    }
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
    const pageSize = this.itemsPerPage;

    this.questions = [];
    const params: any = {
      pageNumber: this.currentPage,
      pageSize: pageSize,
      isPublished: true,
    };
    if (selectedTagId) {
      params.tagIds = selectedTagId;
    }

    this.qasService.getAll(params).pipe(
      map((response) => {
        const questions = this.mapQuestions(response);
        const pagination = this.extractPagination(response, questions.length);
        return {
          questions,
          pagination,
        };
      }),
      catchError((error) => {
        console.error('Failed to load Q&As', error);
        this.errorMessage = 'Unable to load questions at this time. Please try again later.';
        return of({ questions: [], pagination: { totalPages: 1, totalCount: 0 } });
      })
    ).subscribe(({ questions, pagination }) => {
      // Clear any previous error on successful load
      this.errorMessage = null;
      this.loadedTagId = selectedTagId || 'all';
      this.questions = questions;
      this.totalCount = pagination.totalCount;
      this.totalPages = pagination.totalPages;

      if (this.currentPage > this.totalPages) {
        this.currentPage = this.totalPages;
      }

      this.cdr.markForCheck();

      if (this.searchQuery) {
        this.onSearch();
      }
    });
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

        const tagIdQuery = this.route.snapshot.queryParamMap.get('tagId');
        if (tagIdQuery) {
          const matchedIndex = this.tagFilterOptions.findIndex((t) => t.id === tagIdQuery);
          if (matchedIndex >= 0) {
            this.selectCategory(matchedIndex + 1);
            return;
          }
        }

        if (this.initialCategoryQuery) {
          this.applyCategoryQuery(this.initialCategoryQuery);
          return;
        }

        this.cdr.markForCheck();
      },
      error: () => {
        const tagIdQuery = this.route.snapshot.queryParamMap.get('tagId');
        if (this.initialCategoryQuery || tagIdQuery) {
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

  private extractTextFromTiptapJson(node: unknown): string {
    if (!node || typeof node !== 'object') {
      return '';
    }
    const nodeRecord = node as Record<string, unknown>;
    if (nodeRecord['type'] === 'text') {
      return (nodeRecord['text'] as string) || '';
    }
    const content = nodeRecord['content'];
    if (content && Array.isArray(content)) {
      const childrenText = content.map((child: unknown) => this.extractTextFromTiptapJson(child));
      const isBlock = [
        'doc',
        'paragraph',
        'heading',
        'blockquote',
        'bulletList',
        'orderedList',
        'listItem',
        'table',
        'tableRow',
        'tableCell',
      ].includes(nodeRecord['type'] as string);

      if (isBlock) {
        return childrenText.join('').trim() + ' ';
      } else {
        return childrenText.join('');
      }
    }
    return '';
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

    const rawAnswerJson = firstTranslation
      ? getValue(firstTranslation, 'answerTextJson', 'AnswerTextJson')
      : undefined;

    let description = '';
    if (rawAnswerJson) {
      try {
        const parsed = typeof rawAnswerJson === 'string' ? JSON.parse(rawAnswerJson) : rawAnswerJson;
        description = this.extractTextFromTiptapJson(parsed).replace(/\s+/g, ' ').trim();
      } catch {
        // Fallback
      }
    }

    if (!description) {
      description = toStringValue(
        firstTranslation ? getValue(firstTranslation, 'answerText', 'answerText', 'answer') : undefined,
      ) ?? toStringValue(getValue(record, 'description', 'Description')) ?? '';
    }

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
