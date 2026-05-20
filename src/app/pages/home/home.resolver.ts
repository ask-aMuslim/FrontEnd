import { inject } from '@angular/core';
import { type ResolveFn } from '@angular/router';
import { QasService } from '../../core/services/qas.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  asRecord,
  extractArray,
  getValue,
  toStringValue,
  toStringArray
} from '../../core/helpers/api-response.helper';

export const homeResolver: ResolveFn<string[]> = () => {
  const qasService = inject(QasService);
  const heroTag = 'Hero Page Questions';

  const fallbackBubbles = [
    'Who Is Allah?',
    'What Is Islam?',
    'Is Islam peaceful?',
    'What Is Shahada?',
    'How to start praying?',
    'Why do Muslims fast?',
    'What Is Zakat?',
    'How to perform Hajj?',
  ];

  return qasService.getAll({ pageNumber: 1, pageSize: 12, tags: heroTag }).pipe(
    map((response) => {
      const records = extractArray(response);
      if (records.length > 0) {
        const allMatchingQuestions = records
          .map(item => asRecord(item))
          .filter(record => {
            const tags = toStringArray(getValue(record, 'categories', 'Categories', 'tags', 'Tags'));
            return tags.some(t => t.trim() === heroTag);
          })
          .map(record => {
            const translations = extractArray(getValue(record, 'translations', 'Translations'));
            const firstTranslation = translations.length > 0 ? asRecord(translations[0]) : null;
            return toStringValue(
              firstTranslation ? getValue(firstTranslation, 'questionText', 'questionText', 'question') : undefined,
            ) ?? toStringValue(getValue(record, 'title', 'Title')) ?? '';
          })
          .filter(val => val.trim().length > 0);

        const fetchedBubbles = allMatchingQuestions.slice(0, 8);
        return fetchedBubbles.length > 0 ? fetchedBubbles : fallbackBubbles;
      }
      return fallbackBubbles;
    }),
    catchError(() => of(fallbackBubbles))
  );
};
