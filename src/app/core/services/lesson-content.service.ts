import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
import { LessonReadDto } from '../api/generated/models';
import { Id } from '../models/interfaces/base.model';
import { AcademyMockDataService } from './mock-data/academy-mock-data.service';

/**
 * Service to manage lesson content and metadata
 * Handles fetching, structuring, and navigating between lessons
 * Integrates with LessonsService for API calls and AcademyMockDataService for mock data
 */
@Injectable({
  providedIn: 'root'
})
export class LessonContentService {

  constructor(
    private readonly lessonsService: LessonsService,
    private readonly mockDataService: AcademyMockDataService
  ) { }

  /**
   * Get lesson content and metadata by lesson ID
   * Uses mock data service as primary source for development
   */
  getLesson(lessonId: Id): Observable<LessonData> {
    // Extract courseId from lessonId (format: s1-mb-1-lesson-1)
    const parts = String(lessonId).split('-lesson-');
    const courseId = parts[0];

    // Use mock data service as primary source
    return this.mockDataService.getLessonData(String(lessonId), courseId).pipe(
      map(data => {
        if (!data) {
          throw new Error('Lesson not found');
        }
        return data;
      }),
      catchError(() => {
        // Fallback to API if mock service fails
        return this.lessonsService.getById(lessonId).pipe(
          map(lessonDto => this.mapLessonDtoToLessonData(lessonDto as LessonReadDto & { order?: number })),
          catchError(() => of(this.getMockLessonData(String(lessonId))))
        );
      })
    );
  }

  /**
   * Get lesson content by lesson ID
   * Uses mock data service as primary source
   */
  getLessonContent(lessonId: Id): Observable<LessonContent> {
    return this.mockDataService.getLessonContent(String(lessonId)).pipe(
      map(content => {
        if (!content) {
          throw new Error('Lesson content not found');
        }
        return content;
      }),
      catchError(() => {
        return this.lessonsService.getById(lessonId).pipe(
          map(lessonDto => this.mapLessonDtoToContent(lessonDto as LessonReadDto & { order?: number })),
          catchError(() => of(this.getMockLessonContent(String(lessonId))))
        );
      })
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
   * Uses mock data service as primary source
   */
  getCourseLessons(courseId: Id): Observable<LessonMetadata[]> {
    return this.mockDataService.getCourseLessonsMetadata(String(courseId)).pipe(
      catchError(() => {
        return this.lessonsService.getByCourseId(courseId).pipe(
          map(lessons => {
            const withOrder = lessons as (LessonReadDto & { order?: number })[];
            const sortedLessons = [...withOrder].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            return sortedLessons.map(lesson => this.mapLessonDtoToMetadata(lesson));
          }),
          catchError(() => of(this.getMockLessonsList(String(courseId))))
        );
      })
    );
  }

  /**
   * Mark lesson as saved / update progress
   */
  saveLessonProgress(lessonId: Id, completed: boolean = false): Observable<boolean> {
    return this.lessonsService.saveProgress(lessonId, { completed }).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error saving lesson progress:', error);
        return of(false);
      })
    );
  }

  /**
   * Submit lesson feedback
   */
  submitLessonFeedback(lessonId: Id, rating: number, feedback?: string): Observable<boolean> {
    console.log(`Submitting feedback for lesson ${lessonId}:`, { rating, feedback });
    return of(true);
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
      map(createdNote => ({
        timestamp: createdNote.timestamp,
        text: createdNote.text
      })),
      catchError(error => {
        console.error('Error adding note:', error);
        return of({ timestamp, text: note });
      })
    );
  }

  /**
   * Map LessonReadDto to LessonData
   */
  private mapLessonDtoToLessonData(lessonDto: LessonReadDto & { order?: number }): LessonData {
    const content = this.mapLessonDtoToContent(lessonDto);
    const metadata = this.mapLessonDtoToMetadata(lessonDto);

    return {
      content,
      metadata,
      nextLesson: undefined,
      previousLesson: undefined
    };
  }

  /**
   * Map LessonReadDto to LessonContent based on type
   */
  private mapLessonDtoToContent(lessonDto: LessonReadDto & { order?: number }): LessonContent {
    const lessonType = (lessonDto as { type?: number }).type as LessonType;

    switch (lessonType) {
      case LessonType.Video:
        return {
          id: String(lessonDto.id ?? ''),
          type: LessonType.Video,
          title: lessonDto.title ?? '',
          description: (lessonDto as { description?: string }).description || '',
          videoUrl: lessonDto.externalVideoUrl || lessonDto.videoUrl || '',
          thumbnailUrl: lessonDto.thumbnailUrl ?? undefined,
          duration: '0:00',
          transcript: ''
        } as VideoLessonContent;

      case LessonType.Audio:
        return {
          id: String(lessonDto.id ?? ''),
          type: LessonType.Audio,
          title: lessonDto.title ?? '',
          description: (lessonDto as { description?: string }).description || '',
          audioUrl: lessonDto.videoUrl || lessonDto.externalVideoUrl || '',
          duration: '0:00',
          transcript: ''
        } as AudioLessonContent;

      case LessonType.Article:
      case LessonType.Document:
        return {
          id: String(lessonDto.id ?? ''),
          type: LessonType.Article,
          title: lessonDto.title ?? '',
          description: (lessonDto as { description?: string }).description || '',
          sections: [],
          language: 'English'
        } as ArticleLessonContent;

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
  private mapLessonDtoToMetadata(lessonDto: LessonReadDto & { order?: number }): LessonMetadata {
    return {
      id: String(lessonDto.id ?? ''),
      courseId: String(lessonDto.courseId ?? ''),
      title: lessonDto.title ?? '',
      type: ((lessonDto as { type?: number }).type as LessonType) || LessonType.Video,
      status: 'pending',
      duration: '0:00',
      order: lessonDto.order ?? 0,
      hasFeedback: false
    };
  }

  /**
   * Mock data generators for fallback when API fails
   */
  private getMockLessonData(lessonId: string): LessonData {
    const mockContent = this.getMockLessonContent(lessonId);
    const mockMetadata = this.getMockLessonMetadata(lessonId);

    return {
      content: mockContent,
      metadata: mockMetadata,
      nextLesson: {
        id: 'lesson-4',
        courseId: 'course-a2',
        title: 'How to pray - part 4',
        type: LessonType.Video,
        status: 'pending',
        duration: '3 min',
        order: 6
      },
      previousLesson: {
        id: 'lesson-2',
        courseId: 'course-a2',
        title: 'How to pray - part 1',
        type: LessonType.Video,
        status: 'completed',
        duration: '3 min',
        order: 4
      }
    };
  }

  private getMockLessonContent(lessonId: string): LessonContent {
    if (lessonId.includes('lesson-1') || lessonId.includes('intro')) {
      return this.createMockIntroContent(lessonId);
    } else if (lessonId.includes('video')) {
      return this.createMockVideoContent(lessonId);
    } else if (lessonId.includes('audio')) {
      return this.createMockAudioContent(lessonId);
    } else {
      return this.createMockArticleContent(lessonId);
    }
  }

  private getMockLessonMetadata(lessonId: string): LessonMetadata {
    return {
      id: lessonId,
      courseId: 'course-a2',
      title: 'How to pray - part 3',
      type: LessonType.Video,
      status: 'current',
      duration: '3 min',
      order: 5,
      hasFeedback: false
    };
  }

  private getMockLessonsList(courseId: string): LessonMetadata[] {
    return [
      {
        id: 'lesson-1',
        courseId,
        title: 'Intro',
        type: LessonType.Video,
        status: 'pending',
        duration: '1 min',
        order: 1
      },
      {
        id: 'lesson-2',
        courseId,
        title: 'Introduction to Fiqh',
        type: LessonType.Video,
        status: 'completed',
        duration: '3 min',
        order: 2
      },
      {
        id: 'lesson-3',
        courseId,
        title: 'How to pray - part 1',
        type: LessonType.Video,
        status: 'completed',
        duration: '3 min',
        order: 3
      },
      {
        id: 'lesson-4',
        courseId,
        title: 'How to pray - part 2',
        type: LessonType.Audio,
        status: 'completed',
        duration: '3 min',
        order: 4,
        hasFeedback: true
      },
      {
        id: 'lesson-5',
        courseId,
        title: 'How to pray - part 3',
        type: LessonType.Article,
        status: 'current',
        duration: '3 min',
        order: 5
      },
      {
        id: 'lesson-6',
        courseId,
        title: 'How to pray - part 4',
        type: LessonType.Video,
        status: 'pending',
        duration: '3 min',
        order: 6
      },
      {
        id: 'lesson-7',
        courseId,
        title: 'Quiz',
        type: LessonType.Document,
        status: 'pending',
        duration: '3 min',
        order: 7
      }
    ];
  }

  private createMockVideoContent(lessonId: string): VideoLessonContent {
    return {
      id: lessonId,
      type: LessonType.Video,
      title: 'How to pray - part 3',
      description: 'Learn the proper way to perform prayer according to Islamic teachings.',
      videoUrl: 'https://api.builder.io/api/v1/image/assets/TEMP/172913ef2a5b638d048a298d496fb377c8f82dd9?width=1776',
      thumbnailUrl: 'https://api.builder.io/api/v1/image/assets/TEMP/172913ef2a5b638d048a298d496fb377c8f82dd9?width=400',
      duration: '3:45',
      transcript: 'In this lesson, you\'ll learn about the actions that break wudu (ablution) according to the Hanafi Madhhab...'
    };
  }

  private createMockIntroContent(lessonId: string): IntroLessonContent {
    return {
      id: lessonId,
      type: 'intro',
      title: 'Course Introduction',
      description: 'Welcome to this comprehensive course on Islamic teachings.',
      courseOverview: 'This course is designed to provide you with a solid foundation in Islamic teachings and practices.',
      objectives: [
        'Understand the fundamental principles of Islamic faith',
        'Learn the proper way to perform prayer (Salah)',
        'Gain knowledge about the five pillars of Islam'
      ],
      duration: '5 min',
      thumbnailUrl: 'https://api.builder.io/api/v1/image/assets/TEMP/98e741733a4ff78c0a93a200a7ab2b126de36fb0?width=400'
    };
  }

  private createMockAudioContent(lessonId: string): AudioLessonContent {
    return {
      id: lessonId,
      type: LessonType.Audio,
      title: 'How to pray - part 2',
      description: 'Audio lesson on prayer techniques and practices.',
      audioUrl: 'https://example.com/audio/lesson-audio.mp3',
      duration: '5:10',
      transcript: 'According to the Hanafi Madhhab, there are several actions that break wudu...',
      language: 'English',
      subtitles: 'English, Arabic'
    };
  }

  private createMockArticleContent(lessonId: string): ArticleLessonContent {
    return {
      id: lessonId,
      type: LessonType.Article,
      title: 'How to pray - part 3',
      description: 'Comprehensive guide to understanding prayer in Islam.',
      sections: [
        {
          header: 'Introduction',
          content: 'According to the Hanafi Madhhab, there are several actions that break wudu...'
        }
      ],
      language: 'English',
      lastUpdated: 'June 2025'
    };
  }
}
