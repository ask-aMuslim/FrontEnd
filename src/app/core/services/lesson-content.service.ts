import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { LessonType } from '../models/interfaces/enums.model';
import {
  LessonContent,
  LessonData,
  LessonMetadata,
  VideoLessonContent,
  AudioLessonContent,
  ArticleLessonContent,
  IntroLessonContent
} from '../models/interfaces/lesson-content.model';
import { LessonsService } from './lessons.service';
import { LessonReadDto } from '../../api/facades/lesson.facade';
import { Id } from '../models/interfaces/base.model';
import { toApiMediaUrl } from '../helpers/media-url.helper';

/**
 * Service to manage lesson content and metadata
 * Handles fetching, structuring, and navigating between lessons
 * Integrates with LessonsService for API calls
 */
@Injectable({
  providedIn: 'root'
})
export class LessonContentService {

  constructor(
    private readonly lessonsService: LessonsService
  ) { }

  /**
   * Get lesson content and metadata by lesson ID
   */
  getLesson(lessonId: Id): Observable<LessonData> {
    // Extract courseId from lessonId (format: s1-mb-1-lesson-1)
    const parts = String(lessonId).split('-lesson-');
    const courseId = parts[0];

    return this.lessonsService.getById(lessonId).pipe(
      switchMap(lessonDto =>
        this.getCourseLessons(courseId).pipe(
          map(lessons => {
            const lessonData = this.mapLessonDtoToLessonData(lessonDto, String(lessonId), courseId);
            const currentIndex = lessons.findIndex(lesson => lesson.id === String(lessonId));

            return {
              ...lessonData,
              previousLesson: currentIndex > 0 ? lessons[currentIndex - 1] : undefined,
              nextLesson: currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : undefined,
            };
          })
        )
      ),
      catchError(() => of(this.mapLessonDtoToLessonData(null, String(lessonId), courseId)))
    );
  }

  /**
   * Get lesson content by lesson ID
   */
  getLessonContent(lessonId: Id): Observable<LessonContent> {
    return this.lessonsService.getById(lessonId).pipe(
      map(lessonDto => this.mapLessonDtoToContent(lessonDto)),
      catchError(() => of(this.mapLessonDtoToContent(null)))
    );
  }

  /**
   * Get next lesson in sequence
   */
  getNextLesson(courseId: Id, currentLessonId: Id): Observable<LessonMetadata | undefined> {
    return this.getCourseLessons(courseId).pipe(
      map(lessons => {
        const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
        return currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : undefined;
      })
    );
  }

  /**
   * Get previous lesson in sequence
   */
  getPreviousLesson(courseId: Id, currentLessonId: Id): Observable<LessonMetadata | undefined> {
    return this.getCourseLessons(courseId).pipe(
      map(lessons => {
        const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
        return currentIndex > 0 ? lessons[currentIndex - 1] : undefined;
      })
    );
  }

  /**
   * Get all lessons in a course for sidebar display
   */
  getCourseLessons(courseId: Id): Observable<LessonMetadata[]> {
    return this.lessonsService.getByCourseId(courseId).pipe(
      map(lessons => {
        const withOrder = lessons as (LessonReadDto & { order?: number })[];
        const sortedLessons = [...withOrder].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        return sortedLessons.map(lesson => this.mapLessonDtoToMetadata(lesson));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Mark lesson as saved / update progress
   */
  saveLessonProgress(lessonId: Id, completed: boolean = false): Observable<boolean> {
    return this.lessonsService.saveProgress(lessonId, { completed }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Submit lesson feedback
   */
  submitLessonFeedback(lessonId: Id, rating: number, feedback?: string): Observable<boolean> {
    return of([lessonId, rating, feedback].length > 0);
  }

  /**
   * Get user notes for a lesson
   */
  getLessonNotes(lessonId: Id): Observable<Array<{ timestamp: string; text: string }>> {
    return this.lessonsService.getNotes(lessonId).pipe(
      map(notes => notes.map(note => ({
        timestamp: note.timestamp,
        text: note.text
      }))),
      catchError(() => of([]))
    );
  }

  /**
   * Add a note to a lesson
   */
  addLessonNote(lessonId: Id, note: string, timestamp: string): Observable<{ timestamp: string; text: string }> {
    return this.lessonsService.addNote(lessonId, { timestamp, text: note }).pipe(
      map(createdNote => {
        if (!createdNote) {
          return { timestamp, text: note };
        }
        return {
          timestamp: createdNote.timestamp,
          text: createdNote.text
        };
      }),
      catchError(() => of({ timestamp, text: note }))
    );
  }

  /**
   * Map LessonReadDto to LessonData
   */
  private mapLessonDtoToLessonData(lessonDto: LessonReadDto | null, lessonId: string, courseId: string): LessonData {
    const content = this.mapLessonDtoToContent(lessonDto);
    const metadata = this.mapLessonDtoToMetadata(lessonDto);

    return {
      content,
      metadata: {
        ...metadata,
        id: metadata.id || lessonId,
        courseId: metadata.courseId || courseId,
      },
      nextLesson: undefined,
      previousLesson: undefined
    };
  }

  /**
   * Map LessonReadDto to LessonContent based on type
   */
  private mapLessonDtoToContent(lessonDto: LessonReadDto | null): LessonContent {
    if (!lessonDto) {
      return {
        id: '',
        type: LessonType.Article,
        title: 'Lesson unavailable',
        description: 'Lesson content is currently unavailable.',
        sections: [],
        language: 'English'
      } as ArticleLessonContent;
    }

    let lessonType = (lessonDto as { type?: number }).type as LessonType;
    if (!lessonType) {
      if (lessonDto.videoUrl || lessonDto.externalVideoUrl) {
        lessonType = LessonType.Video;
      } else if (lessonDto.content && lessonDto.content.trim().length > 0) {
        lessonType = LessonType.Article;
      }
    }

    switch (lessonType) {
      case LessonType.Video: {
        const primaryVideoUrl = toApiMediaUrl(lessonDto.externalVideoUrl ?? null);
        const fallbackVideoUrl = toApiMediaUrl(lessonDto.videoUrl ?? null);
        return {
          id: String(lessonDto.id ?? ''),
          type: LessonType.Video,
          title: lessonDto.title ?? '',
          description: (lessonDto as { description?: string }).description || '',
          videoUrl: primaryVideoUrl ?? fallbackVideoUrl ?? '',
          thumbnailUrl: toApiMediaUrl(lessonDto.thumbnailUrl ?? null) ?? undefined,
          duration: '0:00',
          transcript: ''
        } as VideoLessonContent;
      }

      case LessonType.Audio: {
        const audioPrimaryUrl = toApiMediaUrl(lessonDto.videoUrl ?? null);
        const audioFallbackUrl = toApiMediaUrl(lessonDto.externalVideoUrl ?? null);
        return {
          id: String(lessonDto.id ?? ''),
          type: LessonType.Audio,
          title: lessonDto.title ?? '',
          description: (lessonDto as { description?: string }).description || '',
          audioUrl: audioPrimaryUrl ?? audioFallbackUrl ?? '',
          duration: '0:00',
          transcript: ''
        } as AudioLessonContent;
      }

      case LessonType.Article:
      case LessonType.Document:
        {
          const contentJson = lessonDto['contentJson'] ?? lessonDto['ContentJson'];
          const content = this.resolveArticleSectionContent(contentJson, lessonDto.content || '');

          return {
            id: String(lessonDto.id ?? ''),
            type: LessonType.Article,
            title: lessonDto.title ?? '',
            description: (lessonDto as { description?: string }).description || '',
            sections: [
              {
                header: '',
                content,
                contentJson,
              }
            ],
            language: 'English'
          } as ArticleLessonContent;
        }

      default:
        return {
          id: String(lessonDto.id ?? ''),
          type: 'intro',
          title: lessonDto.title ?? '',
          description: (lessonDto as { description?: string }).description || '',
          courseOverview: '',
          objectives: [],
          duration: '0:00'
        } as IntroLessonContent;
    }
  }

  /**
   * Map LessonReadDto to LessonMetadata
   */
  private mapLessonDtoToMetadata(lessonDto: LessonReadDto | null): LessonMetadata {
    if (!lessonDto) {
      return {
        id: '',
        courseId: '',
        title: '',
        type: LessonType.Video,
        status: 'pending',
        duration: '0:00',
        order: 0,
        hasFeedback: false
      };
    }
    // Note: LessonReadDto doesn't have 'order' from backend, so we use 0 as default
    // The order is determined by the array position in getCourseLessons
    return {
      id: String(lessonDto.id ?? ''),
      courseId: String(lessonDto.courseId ?? ''),
      title: lessonDto.title ?? '',
      type: ((lessonDto as { type?: number }).type as LessonType) || LessonType.Video,
      status: 'pending',
      duration: '0:00',
      order: 0,
      hasFeedback: false
    };
  }

  private resolveArticleSectionContent(contentJson: unknown, fallbackContent: string): string {
    const fromJson = this.tryResolveContentJson(contentJson);
    if (fromJson) {
      return fromJson;
    }

    return fallbackContent;
  }

  private tryResolveContentJson(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      if (this.containsHtml(trimmed)) {
        return trimmed;
      }

      try {
        const parsed = JSON.parse(trimmed) as unknown;
        return this.renderStructuredJson(parsed);
      } catch {
        return `<p>${this.escapeHtml(trimmed).replaceAll('\n', '<br/>')}</p>`;
      }
    }

    return this.renderStructuredJson(value);
  }

  private renderStructuredJson(value: unknown): string | null {
    const plainText = this.collectStructuredText(value).trim();
    if (!plainText) {
      return null;
    }

    return `<p>${this.escapeHtml(plainText).replaceAll('\n', '<br/>')}</p>`;
  }

  private collectStructuredText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((entry) => this.collectStructuredText(entry)).join('\n');
    }

    if (typeof value !== 'object') {
      return '';
    }

    const record = value as Record<string, unknown>;
    const type = typeof record['type'] === 'string' ? record['type'] : null;

    if (type === 'text') {
      return typeof record['text'] === 'string' ? record['text'] : '';
    }

    if (type === 'hardBreak') {
      return '\n';
    }

    const childContent = this.collectStructuredText(record['content']);
    if (type === 'paragraph' || type === 'heading' || type === 'listItem') {
      return childContent ? `${childContent}\n` : '';
    }

    const otherValues = Object.entries(record)
      .filter(([key]) => key !== 'content' && key !== 'type' && key !== 'text')
      .map(([, entry]) => this.collectStructuredText(entry))
      .join('\n');

    return `${childContent}${otherValues}`;
  }

  private containsHtml(value: string): boolean {
    return /<\/?[a-z][\s\S]*>/i.test(value);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
