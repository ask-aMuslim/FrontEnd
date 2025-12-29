import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { LessonType } from '../models/interfaces/enums.model';
import {
  LessonContent,
  LessonData,
  LessonMetadata,
  VideoLessonContent,
  AudioLessonContent,
  ArticleLessonContent
} from '../models/interfaces/lesson-content.model';

/**
 * Service to manage lesson content and metadata
 * Handles fetching, structuring, and navigating between lessons
 */
@Injectable({
  providedIn: 'root'
})
export class LessonContentService {

  constructor() {}

  /**
   * Get lesson content and metadata by lesson ID
   * @param lessonId The ID of the lesson to fetch
   * @returns Observable of LessonData with content and metadata
   */
  getLesson(lessonId: string): Observable<LessonData> {
    // Mock data - Replace with API call
    const mockLessonData = this.getMockLessonData(lessonId);
    return of(mockLessonData);
  }

  /**
   * Get lesson content by lesson ID
   * @param lessonId The ID of the lesson
   * @returns Observable of LessonContent
   */
  getLessonContent(lessonId: string): Observable<LessonContent> {
    return new Observable(observer => {
      const lessonData = this.getMockLessonData(lessonId);
      observer.next(lessonData.content);
      observer.complete();
    });
  }

  /**
   * Get next lesson in sequence
   * @param courseId The course ID
   * @param currentLessonId The current lesson ID
   * @returns Observable of next LessonMetadata or undefined
   */
  getNextLesson(courseId: string, currentLessonId: string): Observable<LessonMetadata | undefined> {
    const mockLessons = this.getMockLessonsList(courseId);
    const currentIndex = mockLessons.findIndex(l => l.id === currentLessonId);
    const nextLesson = currentIndex < mockLessons.length - 1 ? mockLessons[currentIndex + 1] : undefined;
    return of(nextLesson);
  }

  /**
   * Get previous lesson in sequence
   * @param courseId The course ID
   * @param currentLessonId The current lesson ID
   * @returns Observable of previous LessonMetadata or undefined
   */
  getPreviousLesson(courseId: string, currentLessonId: string): Observable<LessonMetadata | undefined> {
    const mockLessons = this.getMockLessonsList(courseId);
    const currentIndex = mockLessons.findIndex(l => l.id === currentLessonId);
    const previousLesson = currentIndex > 0 ? mockLessons[currentIndex - 1] : undefined;
    return of(previousLesson);
  }

  /**
   * Get all lessons in a course for sidebar display
   * @param courseId The course ID
   * @returns Observable of LessonMetadata array
   */
  getCourseLessons(courseId: string): Observable<LessonMetadata[]> {
    const mockLessons = this.getMockLessonsList(courseId);
    return of(mockLessons);
  }

  /**
   * Mark lesson as saved
   * @param lessonId The lesson ID
   * @returns Observable of success status
   */
  saveLessonProgress(lessonId: string): Observable<boolean> {
    // API call to save progress
    console.log(`Saving lesson progress for: ${lessonId}`);
    return of(true);
  }

  /**
   * Mock data generators for development/testing
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
    // Return different content types based on lessonId
    if (lessonId.includes('video')) {
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

  private createMockAudioContent(lessonId: string): AudioLessonContent {
    return {
      id: lessonId,
      type: LessonType.Audio,
      title: 'How to pray - part 2',
      description: 'Audio lesson on prayer techniques and practices.',
      audioUrl: 'https://example.com/audio/lesson-audio.mp3',
      duration: '5:10',
      transcript: `According to the Hanafi Madhhab, there are several actions that break wudu (ablution), and it's important for every Muslim to know them to maintain purity before prayer. The first and most common nullifier is anything that exits from the front or back private parts, such as urine, stool, or wind. This is agreed upon by all scholars and clearly stated in Hanafi references such as SeekersGuidance – "Could You Please List All the Nullifiers of Ablution According to the Hanafi School."

Another act that breaks wudu is flowing blood or pus that leaves the surface of the skin. If blood merely appears but doesn't flow, wudu remains valid. This ruling is supported by IslamQA and SeekersGuidance under the section "Why Does Bleeding Break One's Wudu According to the Hanafi School." Similarly, vomiting a mouthful or more invalidates wudu, while small amounts do not. This is mentioned in Questions on Islam and IslamQA's discussion on nullifiers of wudu.`,
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
          header: 'Header',
          content: 'According to the Hanafi Madhhab, there are several actions that break wudu (ablution), and it\'s important for every Muslim to know them to maintain purity before prayer. The first and most common nullifier is anything that exits from the front or back private parts, such as urine, stool, or wind. This is agreed upon by all scholars and clearly stated in Hanafi references such as SeekersGuidance – "Could You Please List All the Nullifiers of Ablution According to the Hanafi School."\n\nAnother act that breaks wudu is flowing blood or pus that leaves the surface of the skin. If blood merely appears but doesn\'t flow, wudu remains valid. This ruling is supported by IslamQA and SeekersGuidance under the section "Why Does Bleeding Break One\'s Wudu According to the Hanafi School." Similarly, vomiting a mouthful or more invalidates wudu, while small amounts do not. This is mentioned in Questions on Islam and IslamQA\'s discussion on nullifiers of wudu.'
        },
        {
          header: 'Header',
          content: 'According to the Hanafi Madhhab, there are several actions that break wudu (ablution), and it\'s important for every Muslim to know them to maintain purity before prayer. The first and most common nullifier is anything that exits from the front or back private parts, such as urine, stool, or wind. This is agreed upon by all scholars and clearly stated in Hanafi references such as SeekersGuidance – "Could You Please List All the Nullifiers of Ablution According to the Hanafi School."\n\nAnother act that breaks wudu is flowing blood or pus that leaves the surface of the skin. If blood merely appears but doesn\'t flow, wudu remains valid. This ruling is supported by IslamQA and SeekersGuidance under the section "Why Does Bleeding Break One\'s Wudu According to the Hanafi School." Similarly, vomiting a mouthful or more invalidates wudu, while small amounts do not. This is mentioned in Questions on Islam and IslamQA\'s discussion on nullifiers of wudu.'
        }
      ],
      language: 'English',
      lastUpdated: 'June 2025'
    };
  }
}
