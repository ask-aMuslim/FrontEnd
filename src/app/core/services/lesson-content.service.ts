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

export interface LessonNoteItem {
  id: string;
  timestamp: string;
  progressSeconds: number;
  text: string;
  createdAt: string;
}

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
        const withOrder = lessons
          .filter((lesson) => lesson.isPublished !== false) as (LessonReadDto & { order?: number })[];
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
  getLessonNotes(
    lessonId: Id,
  ): Observable<LessonNoteItem[]> {
    return this.lessonsService.getNotes(lessonId).pipe(
      map(notes => notes.map(note => ({
        id: String(note.id),
        timestamp: note.timestamp,
        progressSeconds: note.progressSeconds,
        text: note.text,
        createdAt: note.createdAt,
      }))),
      catchError(() => of([]))
    );
  }

  /**
   * Add a note to a lesson
   */
  addLessonNote(
    lessonId: Id,
    note: string,
    timestampSeconds: number,
  ): Observable<LessonNoteItem> {
    const safeProgressSeconds = Math.max(0, timestampSeconds);
    const fallbackTimestamp = this.formatLessonProgressTime(safeProgressSeconds);

    return this.lessonsService.addNote(lessonId, { timestampSeconds: safeProgressSeconds, text: note }).pipe(
      map(createdNote => {
        if (!createdNote) {
          return {
            id: `${String(lessonId)}-${Date.now()}`,
            timestamp: fallbackTimestamp,
            progressSeconds: safeProgressSeconds,
            text: note,
            createdAt: new Date().toISOString(),
          };
        }
        return {
          id: String(createdNote.id),
          timestamp: createdNote.timestamp,
          progressSeconds: createdNote.progressSeconds,
          text: createdNote.text,
          createdAt: createdNote.createdAt,
        };
      }),
      catchError(() =>
        of({
          id: `${String(lessonId)}-${Date.now()}`,
          timestamp: fallbackTimestamp,
          progressSeconds: safeProgressSeconds,
          text: note,
          createdAt: new Date().toISOString(),
        }),
      )
    );
  }

  deleteLessonNote(noteId: Id): Observable<boolean> {
    return this.lessonsService.deleteNote(noteId).pipe(
      map(() => true),
      catchError(() => of(false)),
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
    if (!lessonDto || lessonDto.isPublished === false) {
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
      if (lessonDto.videoUrl || lessonDto.externalVideoUrl || lessonDto.contentUrl) {
        lessonType = LessonType.Video;
      } else if (lessonDto.content && lessonDto.content.trim().length > 0) {
        lessonType = LessonType.Article;
      }
    }

    switch (lessonType) {
      case LessonType.Video: {
        const primaryVideoUrl = toApiMediaUrl(lessonDto.externalVideoUrl ?? null);
        const secondaryVideoUrl = toApiMediaUrl(lessonDto.videoUrl ?? null);
        const fallbackVideoUrl = toApiMediaUrl(lessonDto.contentUrl ?? null);
        return {
          id: String(lessonDto.id ?? ''),
          type: LessonType.Video,
          title: lessonDto.title ?? '',
          description: (lessonDto as { description?: string }).description || '',
          videoUrl: primaryVideoUrl ?? secondaryVideoUrl ?? fallbackVideoUrl ?? '',
          thumbnailUrl: toApiMediaUrl(lessonDto.thumbnailUrl ?? null) ?? undefined,
          duration: '0:00',
          transcript: ''
        } as VideoLessonContent;
      }

      case LessonType.Audio: {
        const audioPrimaryUrl = toApiMediaUrl(lessonDto.videoUrl ?? null);
        const audioSecondaryUrl = toApiMediaUrl(lessonDto.externalVideoUrl ?? null);
        const audioFallbackUrl = toApiMediaUrl(lessonDto.contentUrl ?? null);
        return {
          id: String(lessonDto.id ?? ''),
          type: LessonType.Audio,
          title: lessonDto.title ?? '',
          description: (lessonDto as { description?: string }).description || '',
          audioUrl: audioPrimaryUrl ?? audioSecondaryUrl ?? audioFallbackUrl ?? '',
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
    const directFallback = this.tryExtractHtml(fallbackContent);
    if (directFallback) {
      return directFallback;
    }

    const fromJson = this.tryResolveContentJson(contentJson);
    if (fromJson) {
      return fromJson;
    }

    const fallbackText = fallbackContent.trim();
    if (!fallbackText) {
      return '';
    }

    return `<p>${this.escapeHtml(fallbackText).replaceAll('\n', '<br/>')}</p>`;
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

      const directHtml = this.tryExtractHtml(trimmed);
      if (directHtml) {
        return directHtml;
      }

      const fromJsonString = this.tryExtractHtmlFromJsonString(trimmed);
      if (fromJsonString) {
        return fromJsonString;
      }

      if (this.containsHtml(trimmed)) {
        return trimmed;
      }

      try {
        const parsed = JSON.parse(trimmed) as unknown;
        const directFromUnknown = this.tryExtractHtmlFromUnknown(parsed);
        if (directFromUnknown) {
          return directFromUnknown;
        }

        return this.renderStructuredContent(parsed);
      } catch {
        return `<p>${this.escapeHtml(trimmed).replaceAll('\n', '<br/>')}</p>`;
      }
    }

    const directFromUnknown = this.tryExtractHtmlFromUnknown(value);
    if (directFromUnknown) {
      return directFromUnknown;
    }

    return this.renderStructuredContent(value);
  }

  private tryExtractHtml(value: string | null): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    return /<\/?[a-z][\s\S]*>/i.test(trimmed) ? trimmed : null;
  }

  private tryExtractHtmlFromJsonString(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
      return null;
    }

    try {
      const parsed = JSON.parse(trimmed);
      const direct = this.tryExtractHtmlFromUnknown(parsed);
      if (direct) {
        return direct;
      }

      return this.renderStructuredContent(parsed);
    } catch {
      return null;
    }
  }

  private renderStructuredContent(value: unknown): string | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const content = record['content'];
    let maybeNodes: unknown[] | null = null;
    if (Array.isArray(content)) {
      maybeNodes = content;
    } else if (Array.isArray(value)) {
      maybeNodes = value;
    }

    if (!maybeNodes) {
      return null;
    }

    const html = maybeNodes
      .map((node) => this.renderNode(node))
      .filter((node): node is string => typeof node === 'string' && node.trim().length > 0)
      .join('');

    return html.length > 0 ? html : null;
  }

  private renderNode(node: unknown): string | null {
    if (!node || typeof node !== 'object') {
      return null;
    }

    const record = node as Record<string, unknown>;
    const type = typeof record['type'] === 'string' ? record['type'] : null;
    const content = this.renderChildContent(record['content']);

    const renderedByType = this.renderNodeByType(type, record, content);
    if (renderedByType !== null) {
      return renderedByType;
    }

    const wrapped = this.wrapNode(type, content);
    if (wrapped) {
      return wrapped;
    }

    return content || null;
  }

  private renderNodeByType(type: string | null, record: Record<string, unknown>, content: string): string | null {
    switch (type) {
      case 'text':
        return this.renderTextNode(record);
      case 'hardBreak':
        return '<br/>';
      case 'image':
        return this.renderImageNode(record);
      case 'heading':
        return this.renderHeadingNode(record, content);
      case 'doc':
        return content;
      default:
        return null;
    }
  }

  private renderTextNode(record: Record<string, unknown>): string {
    const textValue = this.escapeHtml(typeof record['text'] === 'string' ? record['text'] : '');
    return this.applyMarks(textValue, record['marks']);
  }

  private renderImageNode(record: Record<string, unknown>): string | null {
    const attrs = record['attrs'];
    const attrsRecord = attrs && typeof attrs === 'object' ? (attrs as Record<string, unknown>) : null;
    const srcRaw = typeof attrsRecord?.['src'] === 'string' ? attrsRecord['src'] : '';

    if (!srcRaw) {
      return null;
    }

    const normalizedSrc = toApiMediaUrl(srcRaw) ?? srcRaw;
    const src = this.escapeHtml(normalizedSrc);
    const alt = this.escapeHtml(
      typeof attrsRecord?.['alt'] === 'string' ? attrsRecord['alt'] : 'Article image',
    );
    const title = this.escapeHtml(typeof attrsRecord?.['title'] === 'string' ? attrsRecord['title'] : '');
    const titleAttr = title ? ` title="${title}"` : '';

    return `<img src="${src}" alt="${alt}" loading="lazy"${titleAttr} />`;
  }

  private renderHeadingNode(record: Record<string, unknown>, content: string): string {
    const attrs = record['attrs'];
    const attrsRecord = attrs && typeof attrs === 'object' ? (attrs as Record<string, unknown>) : null;
    const levelRaw = typeof attrsRecord?.['level'] === 'number' ? attrsRecord['level'] : 2;
    const level = Math.min(6, Math.max(1, levelRaw));
    return `<h${level}>${content}</h${level}>`;
  }

  private wrapNode(type: string | null, content: string): string | null {
    const wrappers: Record<string, [string, string]> = {
      paragraph: ['<p>', '</p>'],
      blockquote: ['<blockquote>', '</blockquote>'],
      bulletList: ['<ul>', '</ul>'],
      orderedList: ['<ol>', '</ol>'],
      listItem: ['<li>', '</li>'],
    };

    if (!type || !wrappers[type]) {
      return null;
    }

    const [openTag, closeTag] = wrappers[type];
    return `${openTag}${content}${closeTag}`;
  }

  private renderChildContent(content: unknown): string {
    if (!Array.isArray(content)) {
      return '';
    }

    return content
      .map((item) => this.renderNode(item))
      .filter((item): item is string => typeof item === 'string')
      .join('');
  }

  private applyMarks(value: string, marks: unknown): string {
    if (!Array.isArray(marks) || marks.length === 0) {
      return value;
    }

    return marks.reduce((result, mark) => {
      if (!mark || typeof mark !== 'object') {
        return result;
      }

      const record = mark as Record<string, unknown>;
      const type = typeof record['type'] === 'string' ? record['type'] : '';

      if (type === 'bold' || type === 'strong') {
        return `<strong>${result}</strong>`;
      }

      if (type === 'italic' || type === 'em') {
        return `<em>${result}</em>`;
      }

      if (type === 'underline') {
        return `<u>${result}</u>`;
      }

      if (type === 'strike') {
        return `<s>${result}</s>`;
      }

      if (type === 'link') {
        const attrs = record['attrs'];
        const attrsRecord = attrs && typeof attrs === 'object' ? (attrs as Record<string, unknown>) : null;
        const href = typeof attrsRecord?.['href'] === 'string' ? attrsRecord['href'] : '#';
        const escapedHref = this.escapeHtml(href);
        return `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer">${result}</a>`;
      }

      return result;
    }, value);
  }

  private tryExtractHtmlFromUnknown(value: unknown): string | null {
    if (typeof value === 'string') {
      return this.tryExtractHtml(value);
    }

    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'object') {
      return null;
    }

    const record = value as Record<string, unknown>;
    const directHtml = this.readDirectHtml(record);
    if (directHtml) {
      return directHtml;
    }

    return this.readNestedHtml(record);
  }

  private readDirectHtml(record: Record<string, unknown>): string | null {
    const directHtml = this.tryExtractHtml(typeof record['html'] === 'string' ? record['html'] : null);
    if (directHtml) {
      return directHtml;
    }

    return this.tryExtractHtml(typeof record['content'] === 'string' ? record['content'] : null);
  }

  private readNestedHtml(record: Record<string, unknown>): string | null {
    const values = Object.values(record);
    for (const entry of values) {
      if (Array.isArray(entry)) {
        const arrayHtml = this.readHtmlFromArray(entry);
        if (arrayHtml) {
          return arrayHtml;
        }
        continue;
      }

      const nestedHtml = this.tryExtractHtmlFromUnknown(entry);
      if (nestedHtml) {
        return nestedHtml;
      }
    }

    return null;
  }

  private readHtmlFromArray(values: unknown[]): string | null {
    for (const nestedEntry of values) {
      const nestedHtml = this.tryExtractHtmlFromUnknown(nestedEntry);
      if (nestedHtml) {
        return nestedHtml;
      }
    }

    return null;
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

  private formatLessonProgressTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;

    if (hours > 0) {
      return `[Lesson] ${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `[Lesson] ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
