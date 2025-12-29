import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LessonContentService } from '../../../core/services/lesson-content.service';
import {
  LessonContent,
  LessonData,
  LessonPlayerTab,
  LessonMetadata,
  VideoLessonContent,
  AudioLessonContent,
  ArticleLessonContent,
  isVideoContent,
  isAudioContent,
  isArticleContent
} from '../../../core/models/interfaces/lesson-content.model';

@Component({
  selector: 'app-lesson-player',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lesson-player.component.html',
  styleUrls: ['./lesson-player.component.scss']
})
export class LessonPlayerComponent implements OnInit, OnDestroy {
  // Route parameters
  courseId: string = '';
  lessonId: string = '';

  // Lesson data
  lessonData: LessonData | null = null;
  lessonContent: LessonContent | null = null;
  coarseLessons: LessonMetadata[] = [];

  // Tab management
  activeTab: LessonPlayerTab = 'overview';

  // Loading and error states
  isLoading = true;
  error: string | null = null;

  // Navigation
  nextLesson: LessonMetadata | undefined;
  previousLesson: LessonMetadata | undefined;

  // Notes Management
  noteText: string = '';
  previousNotes: Array<{ timestamp: string; text: string }> = [
    { timestamp: '[Lesson] 8:20', text: 'My note is written here. My note is written here. My note is written here. My note is written here.' },
    { timestamp: '[Lesson] 8:20', text: 'My note is written here. My note is written here. My note is written here. My note is written here.' },
    { timestamp: '[Lesson] 8:20', text: 'My note is written here. My note is written here. My note is written here. My note is written here.' },
    { timestamp: '[Lesson] 8:20', text: 'My note is written here. My note is written here. My note is written here. My note is written here.' }
  ];
  notesFilter: 'latest' | 'current-lesson' = 'latest';
  notesSearchQuery: string = '';

  // AI Assistant Management
  aiMessages: Array<{ type: 'user' | 'assistant'; text: string }> = [
    { type: 'user', text: 'Is it permissible to listen to Music' },
    { type: 'assistant', text: 'Based on hadith:\n"There will be among my ummah people who will consider as permissible illegal sexual intercourse, the wearing of silk, the drinking of alcohol and the use of musical instruments..." (Sahih al-Bukhari – some scholars debate its interpretation)\n\nScholars argue that music distracts from remembrance of Allah, and often promotes sinful themes.' }
  ];
  aiInputText: string = '';

  // Feedback Management
  lessonRating: number = 0;
  feedbackText: string = '';

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private lessonContentService: LessonContentService
  ) { }

  ngOnInit(): void {
    // Get route parameters
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.courseId = params.get('courseId') || '';
      this.lessonId = params.get('lessonId') || '';

      if (this.lessonId) {
        this.loadLesson();
        this.loadCourseLessons();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load lesson content and metadata
   */
  private loadLesson(): void {
    this.isLoading = true;
    this.error = null;

    this.lessonContentService
      .getLesson(this.lessonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: LessonData) => {
          this.lessonData = data;
          this.lessonContent = data.content;
          this.nextLesson = data.nextLesson;
          this.previousLesson = data.previousLesson;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load lesson content';
          console.error('Error loading lesson:', err);
          this.isLoading = false;
        }
      });
  }

  /**
   * Load all lessons in the course for sidebar
   */
  private loadCourseLessons(): void {
    this.lessonContentService
      .getCourseLessons(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lessons: LessonMetadata[]) => {
          this.coarseLessons = lessons;
        },
        error: (err) => {
          console.error('Error loading course lessons:', err);
        }
      });
  }

  /**
   * Content type guards
   */
  get isVideoContent(): boolean {
    return this.lessonContent ? isVideoContent(this.lessonContent) : false;
  }

  get isAudioContent(): boolean {
    return this.lessonContent ? isAudioContent(this.lessonContent) : false;
  }

  get isArticleContent(): boolean {
    return this.lessonContent ? isArticleContent(this.lessonContent) : false;
  }

  /**
   * Type-safe content accessors
   */
  get videoContent(): VideoLessonContent | null {
    return this.isVideoContent ? this.lessonContent as VideoLessonContent : null;
  }

  get audioContent(): AudioLessonContent | null {
    return this.isAudioContent ? this.lessonContent as AudioLessonContent : null;
  }

  get articleContent(): ArticleLessonContent | null {
    return this.isArticleContent ? this.lessonContent as ArticleLessonContent : null;
  }

  /**
   * Tab management
   */
  setActiveTab(tab: LessonPlayerTab): void {
    this.activeTab = tab;
  }

  /**
   * Navigation between lessons
   */
  goToNextLesson(): void {
    if (this.nextLesson) {
      this.router.navigate(['../lesson', this.nextLesson.id], { relativeTo: this.route });
    }
  }

  goToPreviousLesson(): void {
    if (this.previousLesson) {
      this.router.navigate(['../lesson', this.previousLesson.id], { relativeTo: this.route });
    }
  }

  goToLesson(lessonId: string): void {
    this.router.navigate(['../lesson', lessonId], { relativeTo: this.route });
  }

  /**
   * Action button handlers
   */
  onSave(): void {
    if (this.lessonId) {
      this.lessonContentService.saveLessonProgress(this.lessonId).subscribe({
        next: () => {
          console.log('Lesson saved successfully');
          // Show toast notification
        },
        error: (err) => {
          console.error('Error saving lesson:', err);
        }
      });
    }
  }

  onShare(): void {
    if (this.lessonContent && navigator.share) {
      navigator.share({
        title: this.lessonContent.title,
        text: this.lessonContent.description,
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback: Copy URL to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        console.log('Link copied to clipboard');
      });
    }
  }

  onDownload(): void {
    console.log('Download initiated for lesson:', this.lessonId);
    // Implementation depends on content type
    // For video/audio: download media file
    // For article: generate PDF
  }

  /**
   * Lesson status helpers for sidebar
   */
  isLessonCompleted(lesson: LessonMetadata): boolean {
    return lesson.status === 'completed';
  }

  isLessonCurrent(lesson: LessonMetadata): boolean {
    return lesson.status === 'current' || lesson.id === this.lessonId;
  }

  isLessonPending(lesson: LessonMetadata): boolean {
    return lesson.status === 'pending';
  }

  canClickLesson(lesson: LessonMetadata): boolean {
    return lesson.status !== 'pending';
  }

  /**
   * Get lesson icon based on type and status
   */
  getLessonIcon(lesson: LessonMetadata): string {
    if (lesson.status === 'completed') {
      return 'checked';
    }
    return this.getLessonTypeIcon(lesson.type);
  }

  getLessonTypeIcon(type: any): string {
    switch (type) {
      case 1: // Video
        return 'video';
      case 2: // Article
        return 'article';
      case 3: // Document
        return 'document';
      case 4: // Audio
        return 'audio';
      default:
        return 'note';
    }
  }

  /**
   * Notes Tab Methods
   */
  addNote(): void {
    if (this.noteText.trim()) {
      const newNote = {
        timestamp: `[Lesson] ${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}`,
        text: this.noteText
      };
      this.previousNotes.unshift(newNote);
      this.noteText = '';
    }
  }

  deleteNote(index: number): void {
    this.previousNotes.splice(index, 1);
  }

  /**
   * AI Assistant Methods
   */
  askQuestion(): void {
    if (this.aiInputText.trim()) {
      this.aiMessages.push({ type: 'user', text: this.aiInputText });
      const userQuestion = this.aiInputText;
      this.aiInputText = '';

      setTimeout(() => {
        const mockResponse = `Based on the lesson content regarding "${userQuestion.toLowerCase()}", here's a comprehensive answer based on Islamic teachings and scholarly interpretations...`;
        this.aiMessages.push({ type: 'assistant', text: mockResponse });
      }, 1000);
    }
  }

  /**
   * Feedback Tab Methods
   */
  setRating(stars: number): void {
    this.lessonRating = stars;
  }

  submitFeedback(): void {
    if (this.lessonRating > 0 || this.feedbackText.trim()) {
      console.log('Feedback submitted:', {
        rating: this.lessonRating,
        feedback: this.feedbackText
      });
      this.feedbackText = '';
      alert('Thank you for your feedback!');
    }
  }

  /**
   * Get breadcrumb items
   */
  get breadcrumbItems(): string[] {
    return [
      'Roadmap',
      'Prayer (Salah)',
      this.lessonContent?.title || 'Loading...'
    ];
  }

  /**
   * Course info for sidebar
   */
  get courseInfo(): { stage: number; code: string; title: string; stats: string } {
    return {
      stage: 1,
      code: 'A2',
      title: 'Prayer (Salah)',
      stats: `Lesson: ${this.lessonData?.metadata.order || 0}/${this.coarseLessons.length}`
    };
  }

  /**
   * Get filtered notes based on search and filter
   */
  get filteredNotes(): Array<{ timestamp: string; text: string }> {
    return this.previousNotes.filter(note => {
      const matchesSearch = note.text.toLowerCase().includes(this.notesSearchQuery.toLowerCase());
      return matchesSearch;
    });
  }
}
