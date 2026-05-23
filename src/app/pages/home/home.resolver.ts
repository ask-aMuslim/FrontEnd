import { inject } from '@angular/core';
import { type ResolveFn } from '@angular/router';
import { QasService } from '../../core/services/qas.service';
import { TagsService } from '../../core/services/tags.service';
import { map, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  asRecord,
  extractArray,
  getValue,
  toStringValue,
  toStringArray
} from '../../core/helpers/api-response.helper';

export interface HomeResolvedData {
  heroBubbles: string[];
  faithPillarQuestionIds: Record<string, string>;
  islamPillarQuestionIds: Record<string, string>;
}

export const homeResolver: ResolveFn<HomeResolvedData> = () => {
  const qasService = inject(QasService);
  const tagsService = inject(TagsService);

  const fallbackData: HomeResolvedData = {
    heroBubbles: [
      'Who Is Allah?',
      'What Is Islam?',
      'Is Islam peaceful?',
      'What Is Shahada?',
      'How to start praying?',
      'Why do Muslims fast?',
      'What Is Zakat?',
      'How to perform Hajj?',
    ],
    faithPillarQuestionIds: {
      'Allah': '019e2fc8-a676-7a56-9a98-b49529ea3bbe',
      'Angels': '019e2fca-255a-7af6-8617-b683e5bf1fe7',
      'Books': '019e2fca-ae8c-7ba6-a84b-1dd070d4ee7e',
      'Messengers': '019e2fcb-227d-7feb-b572-10ac6b584367',
      'Judgement Day': '019e2fcb-7024-7b15-b011-2c575d3c755d',
      'Divine Decree': '019e2fcb-ffb1-7ba3-a0f5-f9dd9e064c13',
    },
    islamPillarQuestionIds: {
      'Shahada': '019e2fcd-6e95-7cbf-83f8-fb2da9f4c8df',
      'Salah': '019e2fcd-d029-76c4-93a0-db33b9c07436',
      'Zakat': '019e2fcf-33c2-741c-9dfb-2588fb1706a5',
      'Sawm': '019e2fcf-a5f8-7017-9d44-1851a15821c6',
      'Hajj': '019e2fd0-6564-76bd-b09d-308d62caa379',
    }
  };

  return tagsService.getAll({ pageNumber: 1, pageSize: 100 }).pipe(
    switchMap((tagsResponse) => {
      const tagsList = extractArray(tagsResponse).map(item => asRecord(item));

      // Look up target tags (case-insensitive for robustness)
      const heroTag = tagsList.find(t => {
        const title = toStringValue(getValue(t, 'title', 'Title', 'name', 'Name')) ?? '';
        return title.trim().toLowerCase() === 'hero page questions';
      });
      const islamTag = tagsList.find(t => {
        const title = toStringValue(getValue(t, 'title', 'Title', 'name', 'Name')) ?? '';
        return title.trim().toLowerCase() === '5 pillars of islam';
      });
      const faithTag = tagsList.find(t => {
        const title = toStringValue(getValue(t, 'title', 'Title', 'name', 'Name')) ?? '';
        return title.trim().toLowerCase() === '6 pillars of faith';
      });

      const tagIds: string[] = [];
      if (heroTag) tagIds.push(toStringValue(getValue(heroTag, 'id', 'Id')) ?? '');
      if (islamTag) tagIds.push(toStringValue(getValue(islamTag, 'id', 'Id')) ?? '');
      if (faithTag) tagIds.push(toStringValue(getValue(faithTag, 'id', 'Id')) ?? '');

      if (tagIds.length === 0) {
        return of(fallbackData);
      }

      // Fetch all questions for these tags
      return qasService.getAll({ pageNumber: 1, pageSize: 100, tagIds, isPublished: true }).pipe(
        map((response) => {
          const records = extractArray(response).map(item => asRecord(item));
          if (records.length === 0) {
            return fallbackData;
          }

          // 1. Process Hero bubbles
          const heroTagName = 'Hero Page Questions';
          const heroQuestions = records
            .filter(record => {
              const tags = toStringArray(getValue(record, 'categories', 'Categories', 'tags', 'Tags'));
              return tags.some(t => t.trim().toLowerCase() === heroTagName.toLowerCase());
            })
            .map(record => {
              const translations = extractArray(getValue(record, 'translations', 'Translations'));
              const firstTranslation = translations.length > 0 ? asRecord(translations[0]) : null;
              return toStringValue(
                firstTranslation ? getValue(firstTranslation, 'questionText', 'questionText', 'question') : undefined,
              ) ?? toStringValue(getValue(record, 'title', 'Title')) ?? '';
            })
            .filter(val => val.trim().length > 0);

          const heroBubbles = heroQuestions.slice(0, 8);

          // 2. Process Faith Pillar question IDs
          const faithTagName = '6 Pillars of Faith';
          const faithPillarQuestionIds = { ...fallbackData.faithPillarQuestionIds };

          const faithQuestions = records.filter(record => {
            const tags = toStringArray(getValue(record, 'categories', 'Categories', 'tags', 'Tags'));
            return tags.some(t => t.trim().toLowerCase() === faithTagName.toLowerCase());
          });

          faithQuestions.forEach(record => {
            const id = toStringValue(getValue(record, 'id', 'Id'));
            if (!id) return;

            const translations = extractArray(getValue(record, 'translations', 'Translations'));
            const firstTranslation = translations.length > 0 ? asRecord(translations[0]) : null;
            const questionTitle = toStringValue(
              firstTranslation ? getValue(firstTranslation, 'questionText', 'questionText', 'question') : undefined,
            ) ?? toStringValue(getValue(record, 'title', 'Title')) ?? '';

            const normalizedTitle = questionTitle.trim().toLowerCase();

            // Match title to faith pillar name
            if (normalizedTitle === 'allah') faithPillarQuestionIds['Allah'] = id;
            else if (normalizedTitle === 'angels') faithPillarQuestionIds['Angels'] = id;
            else if (normalizedTitle === 'books') faithPillarQuestionIds['Books'] = id;
            else if (normalizedTitle === 'messengers') faithPillarQuestionIds['Messengers'] = id;
            else if (normalizedTitle === 'judgement day') faithPillarQuestionIds['Judgement Day'] = id;
            else if (normalizedTitle === 'divine decree') faithPillarQuestionIds['Divine Decree'] = id;
          });

          // 3. Process Islam Pillar question IDs
          const islamTagName = '5 Pillars of Islam';
          const islamPillarQuestionIds = { ...fallbackData.islamPillarQuestionIds };

          const islamQuestions = records.filter(record => {
            const tags = toStringArray(getValue(record, 'categories', 'Categories', 'tags', 'Tags'));
            return tags.some(t => t.trim().toLowerCase() === islamTagName.toLowerCase());
          });

          islamQuestions.forEach(record => {
            const id = toStringValue(getValue(record, 'id', 'Id'));
            if (!id) return;

            const translations = extractArray(getValue(record, 'translations', 'Translations'));
            const firstTranslation = translations.length > 0 ? asRecord(translations[0]) : null;
            const questionTitle = toStringValue(
              firstTranslation ? getValue(firstTranslation, 'questionText', 'questionText', 'question') : undefined,
            ) ?? toStringValue(getValue(record, 'title', 'Title')) ?? '';

            const normalizedTitle = questionTitle.trim().toLowerCase();

            // Match title to islam pillar label (Testimony of Faith / Prayer / Charity / Fasting / Pilgrimage)
            if (normalizedTitle === 'testimony of faith' || normalizedTitle === 'shahada') {
              islamPillarQuestionIds['Shahada'] = id;
            } else if (normalizedTitle === 'prayer' || normalizedTitle === 'salah') {
              islamPillarQuestionIds['Salah'] = id;
            } else if (normalizedTitle === 'charity' || normalizedTitle === 'zakat') {
              islamPillarQuestionIds['Zakat'] = id;
            } else if (normalizedTitle === 'fasting' || normalizedTitle === 'sawm') {
              islamPillarQuestionIds['Sawm'] = id;
            } else if (normalizedTitle === 'pilgrimage' || normalizedTitle === 'hajj') {
              islamPillarQuestionIds['Hajj'] = id;
            }
          });

          return {
            heroBubbles: heroBubbles.length > 0 ? heroBubbles : fallbackData.heroBubbles,
            faithPillarQuestionIds,
            islamPillarQuestionIds
          };
        }),
        catchError(() => of(fallbackData))
      );
    }),
    catchError(() => of(fallbackData))
  );
};
