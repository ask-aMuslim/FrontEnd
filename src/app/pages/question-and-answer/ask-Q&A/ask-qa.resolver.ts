import { inject } from '@angular/core';
import { type ResolveFn, type ActivatedRouteSnapshot } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { QasService } from '../../../core/services/qas.service';
import { TagsService } from '../../../core/services/tags.service';
import { QuestionCard } from './qa-card/qa-card.component';
import {
  asRecord,
  extractArray,
  getValue,
  toNumberValue,
  toStringArray,
  toStringValue
} from '../../../core/helpers/api-response.helper';

export interface TagFilterOption {
  id: string;
  name: string;
}

export interface AskQaResolvedData {
  categories: TagFilterOption[];
  initialQuestions: QuestionCard[];
  initialSelectedCategoryIndex: number;
  totalCount: number;
  totalPages: number;
}

const mapCategories = (response: unknown): TagFilterOption[] => {
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
};

const isGeneralCategoryName = (value: string): boolean => {
  const normalized = value.trim().toLowerCase();
  return normalized === 'general' || normalized.startsWith('general ');
};

const prioritizeGeneralCategory = (categories: TagFilterOption[]): TagFilterOption[] => {
  if (categories.length === 0) {
    return categories;
  }

  const generalCategories: TagFilterOption[] = [];
  const otherCategories: TagFilterOption[] = [];

  categories.forEach((category) => {
    if (isGeneralCategoryName(category.name)) {
      generalCategories.push(category);
      return;
    }
    otherCategories.push(category);
  });

  return [...generalCategories, ...otherCategories];
};

const mapQuestion = (item: unknown, index: number): QuestionCard | null => {
  const record = asRecord(item);
  const isPublished = getValue(record, 'isPublished', 'IsPublished');
  if (isPublished === false) {
    return null;
  }

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
  const id = toStringValue(getValue(record, 'id', 'Id')) ?? `Q-${index + 1}`;
  const sameQuestions = toNumberValue(getValue(record, 'sameQuestions', 'SameQuestions')) ?? 0;

  return {
    id,
    title,
    description,
    categories,
    sameQuestions,
  };
};

const mapQuestions = (response: unknown): QuestionCard[] => {
  const records = extractArray(response);
  return records
    .map((item, index) => mapQuestion(item, index))
    .filter((question): question is QuestionCard => question !== null);
};

const extractPagination = (response: unknown, fallbackCount: number): { totalPages: number; totalCount: number } => {
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
    1;

  const totalCount =
    nested?.totalCount ??
    nested?.itemCount ??
    result?.totalCount ??
    result?.itemCount ??
    fallbackCount;

  return {
    totalPages: Math.max(1, totalPages),
    totalCount,
  };
};

export const askQaResolver: ResolveFn<AskQaResolvedData | null> = (route: ActivatedRouteSnapshot) => {
  const tagsService = inject(TagsService);
  const qasService = inject(QasService);

  const initialCategoryQuery = route.queryParamMap.get('category') ?? route.queryParamMap.get('tag');
  const initialTagIdQuery = route.queryParamMap.get('tagId');

  return tagsService.getAll({ pageNumber: 1, pageSize: 100 }).pipe(
    switchMap((tagsResponse) => {
      const mapped = mapCategories(tagsResponse);
      const categories = prioritizeGeneralCategory(mapped);

      // Determine initial category index
      let selectedCategoryIndex = 0;
      let selectedTagId: string | null = null;

      if (initialTagIdQuery) {
        const matchedIndex = categories.findIndex(
          (category) => category.id === initialTagIdQuery
        );
        if (matchedIndex >= 0) {
          selectedCategoryIndex = matchedIndex + 1; // 1-based index because 0 is "All"
          selectedTagId = categories[matchedIndex].id;
        }
      } else if (initialCategoryQuery) {
        const normalizedQuery = initialCategoryQuery.trim().toLowerCase();
        const matchedIndex = categories.findIndex(
          (category) => category.name.trim().toLowerCase() === normalizedQuery
        );
        if (matchedIndex >= 0) {
          selectedCategoryIndex = matchedIndex + 1; // 1-based index because 0 is "All"
          selectedTagId = categories[matchedIndex].id;
        }
      }

      // Fetch all questions for the determined category
      const pageSize = 10;
      const params: any = { pageNumber: 1, pageSize };
      if (selectedTagId) {
        params.tagIds = selectedTagId;
      }

      return qasService.getAll(params).pipe(
        map((firstResponse) => {
          const firstPageQuestions = mapQuestions(firstResponse);
          const pagination = extractPagination(firstResponse, firstPageQuestions.length);

          return {
            categories,
            initialQuestions: firstPageQuestions,
            initialSelectedCategoryIndex: selectedCategoryIndex,
            totalCount: pagination.totalCount,
            totalPages: pagination.totalPages,
          };
        }),
        catchError(() => of({
          categories,
          initialQuestions: [],
          initialSelectedCategoryIndex: selectedCategoryIndex,
          totalCount: 0,
          totalPages: 1,
        }))
      );
    }),
    catchError(() => of(null))
  );
};
