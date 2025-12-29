import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LessonPlayerComponent } from './lesson-player.component';
import { LessonContentService } from '../../../core/services/lesson-content.service';
import {
  LessonData,
  LessonMetadata,
  VideoContent,
  AudioContent,
  ArticleContent,
  LessonType
} from '../../../core/models/interfaces/lesson-content.model';

describe('LessonPlayerComponent', () => {
  let component: LessonPlayerComponent;
  let fixture: ComponentFixture<LessonPlayerComponent>;
  let mockLessonContentService: jasmine.SpyObj<LessonContentService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  // Mock data
  const mockVideoContent: VideoContent = {
    id: 'lesson-1',
    type: LessonType.Video,
    title: 'Introduction to Fiqh',
    description: 'Learn the basics of Fiqh',
    videoUrl: 'https://example.com/video.mp4',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    duration: '10:30',
    transcript: 'This is a transcript'
  };

  const mockAudioContent: AudioContent = {
    id: 'lesson-2',
    type: LessonType.Audio,
    title: 'Audio Lesson on Prayer',
    description: 'Audio introduction to prayer',
    audioUrl: 'https://example.com/audio.mp3',
    duration: '15:45',
    transcript: 'Audio transcript content'
  };

  const mockArticleContent: ArticleContent = {
    id: 'lesson-3',
    type: LessonType.Article,
    title: 'Article about Fiqh Principles',
    description: 'Comprehensive article on Fiqh',
    sections: [
      { header: 'Introduction', content: 'Introduction content' },
      { header: 'Main Points', content: 'Main points content' }
    ]
  };

  const mockLessonMetadata: LessonMetadata = {
    id: 'lesson-1',
    title: 'Introduction to Fiqh',
    type: LessonType.Video,
    status: 'current',
    duration: '10:30',
    order: 1
  };

  const mockNextLesson: LessonMetadata = {
    id: 'lesson-2',
    title: 'Audio Lesson on Prayer',
    type: LessonType.Audio,
    status: 'pending',
    duration: '15:45',
    order: 2
  };

  const mockPreviousLesson: LessonMetadata = {
    id: 'lesson-0',
    title: 'Intro',
    type: LessonType.Video,
    status: 'completed',
    duration: '5:00',
    order: 0
  };

  const mockLessonData: LessonData = {
    content: mockVideoContent,
    metadata: mockLessonMetadata,
    nextLesson: mockNextLesson,
    previousLesson: mockPreviousLesson
  };

  const mockCourseLessons: LessonMetadata[] = [
    mockPreviousLesson,
    mockLessonMetadata,
    mockNextLesson
  ];

  beforeEach(async () => {
    mockLessonContentService = jasmine.createSpyObj('LessonContentService', [
      'getLesson',
      'getCourseLessons',
      'saveLessonProgress'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockActivatedRoute = {
      paramMap: of(
        new Map([
          ['courseId', 'course-a2'],
          ['lessonId', 'lesson-1']
        ])
      )
    };

    mockLessonContentService.getLesson.and.returnValue(of(mockLessonData));
    mockLessonContentService.getCourseLessons.and.returnValue(of(mockCourseLessons));
    mockLessonContentService.saveLessonProgress.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [LessonPlayerComponent],
      providers: [
        { provide: LessonContentService, useValue: mockLessonContentService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LessonPlayerComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.courseId).toBe('');
      expect(component.lessonId).toBe('');
      expect(component.activeTab).toBe('overview');
      expect(component.isLoading).toBe(true);
      expect(component.error).toBeNull();
      expect(component.lessonData).toBeNull();
      expect(component.lessonContent).toBeNull();
    });

    it('should load route parameters on init', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.courseId).toBe('course-a2');
        expect(component.lessonId).toBe('lesson-1');
        done();
      }, 0);
    });

    it('should load lesson data on init', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(mockLessonContentService.getLesson).toHaveBeenCalledWith('lesson-1');
        expect(component.lessonData).toEqual(mockLessonData);
        expect(component.lessonContent).toEqual(mockVideoContent);
        expect(component.isLoading).toBe(false);
        done();
      }, 0);
    });

    it('should load course lessons on init', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(mockLessonContentService.getCourseLessons).toHaveBeenCalledWith('course-a2');
        expect(component.coarseLessons).toEqual(mockCourseLessons);
        done();
      }, 0);
    });

    it('should set next and previous lessons', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.nextLesson).toEqual(mockNextLesson);
        expect(component.previousLesson).toEqual(mockPreviousLesson);
        done();
      }, 0);
    });
  });

  describe('Content Type Detection', () => {
    it('should detect video content correctly', (done) => {
      mockLessonContentService.getLesson.and.returnValue(of(mockLessonData));
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.isVideoContent).toBe(true);
        expect(component.isAudioContent).toBe(false);
        expect(component.isArticleContent).toBe(false);
        done();
      }, 0);
    });

    it('should detect audio content correctly', (done) => {
      const audioLessonData: LessonData = {
        ...mockLessonData,
        content: mockAudioContent
      };
      mockLessonContentService.getLesson.and.returnValue(of(audioLessonData));
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.isVideoContent).toBe(false);
        expect(component.isAudioContent).toBe(true);
        expect(component.isArticleContent).toBe(false);
        done();
      }, 0);
    });

    it('should detect article content correctly', (done) => {
      const articleLessonData: LessonData = {
        ...mockLessonData,
        content: mockArticleContent
      };
      mockLessonContentService.getLesson.and.returnValue(of(articleLessonData));
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.isVideoContent).toBe(false);
        expect(component.isAudioContent).toBe(false);
        expect(component.isArticleContent).toBe(true);
        done();
      }, 0);
    });

    it('should return false for all content types when lessonContent is null', () => {
      component.lessonContent = null;
      expect(component.isVideoContent).toBe(false);
      expect(component.isAudioContent).toBe(false);
      expect(component.isArticleContent).toBe(false);
    });
  });

  describe('Tab Management', () => {
    it('should set active tab to overview by default', () => {
      expect(component.activeTab).toBe('overview');
    });

    it('should change active tab when setActiveTab is called', () => {
      component.setActiveTab('notes');
      expect(component.activeTab).toBe('notes');

      component.setActiveTab('ai-assistant');
      expect(component.activeTab).toBe('ai-assistant');

      component.setActiveTab('feedback');
      expect(component.activeTab).toBe('feedback');
    });

    it('should support all valid tab values', () => {
      const tabs: Array<'overview' | 'notes' | 'ai-assistant' | 'feedback'> = [
        'overview',
        'notes',
        'ai-assistant',
        'feedback'
      ];
      tabs.forEach(tab => {
        component.setActiveTab(tab);
        expect(component.activeTab).toBe(tab);
      });
    });
  });

  describe('Lesson Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should navigate to next lesson when goToNextLesson is called', (done) => {
      setTimeout(() => {
        component.goToNextLesson();
        expect(mockRouter.navigate).toHaveBeenCalledWith([
          '/roadmap/course',
          'course-a2',
          'lesson',
          'lesson-2'
        ]);
        done();
      }, 0);
    });

    it('should navigate to previous lesson when goToPreviousLesson is called', (done) => {
      setTimeout(() => {
        component.goToPreviousLesson();
        expect(mockRouter.navigate).toHaveBeenCalledWith([
          '/roadmap/course',
          'course-a2',
          'lesson',
          'lesson-0'
        ]);
        done();
      }, 0);
    });

    it('should navigate to specific lesson when goToLesson is called', (done) => {
      setTimeout(() => {
        component.goToLesson('lesson-5');
        expect(mockRouter.navigate).toHaveBeenCalledWith([
          '/roadmap/course',
          'course-a2',
          'lesson',
          'lesson-5'
        ]);
        done();
      }, 0);
    });

    it('should not navigate if nextLesson is undefined', (done) => {
      setTimeout(() => {
        component.nextLesson = undefined;
        component.goToNextLesson();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should not navigate if previousLesson is undefined', (done) => {
      setTimeout(() => {
        component.previousLesson = undefined;
        component.goToPreviousLesson();
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      }, 0);
    });
  });

  describe('Action Button Handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should save lesson progress when onSave is called', (done) => {
      setTimeout(() => {
        component.onSave();
        expect(mockLessonContentService.saveLessonProgress).toHaveBeenCalledWith('lesson-1');
        done();
      }, 0);
    });

    it('should not attempt to save if lessonId is empty', () => {
      component.lessonId = '';
      component.onSave();
      expect(mockLessonContentService.saveLessonProgress).not.toHaveBeenCalled();
    });

    it('should handle save error gracefully', (done) => {
      mockLessonContentService.saveLessonProgress.and.returnValue(throwError(() => new Error('Save failed')));
      spyOn(console, 'error');
      
      setTimeout(() => {
        component.onSave();
        setTimeout(() => {
          expect(console.error).toHaveBeenCalled();
          done();
        }, 0);
      }, 0);
    });

    it('should call share when onShare is called', (done) => {
      setTimeout(() => {
        spyOn(navigator, 'share').and.returnValue(Promise.resolve());
        component.onShare();
        setTimeout(() => {
          expect(navigator.share).toHaveBeenCalled();
          done();
        }, 0);
      }, 0);
    });

    it('should copy to clipboard if share is not available', (done) => {
      setTimeout(() => {
        const shareStub = spyOn(navigator, 'share');
        shareStub.and.returnValue(Promise.reject(new Error('Share not available')));
        spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
        
        component.onShare();
        done();
      }, 0);
    });

    it('should call onDownload', (done) => {
      setTimeout(() => {
        spyOn(console, 'log');
        component.onDownload();
        expect(console.log).toHaveBeenCalledWith('Download initiated for lesson:', 'lesson-1');
        done();
      }, 0);
    });
  });

  describe('Lesson Status Helpers', () => {
    it('should identify completed lesson correctly', () => {
      expect(component.isLessonCompleted(mockPreviousLesson)).toBe(true);
      expect(component.isLessonCompleted(mockLessonMetadata)).toBe(false);
      expect(component.isLessonCompleted(mockNextLesson)).toBe(false);
    });

    it('should identify current lesson correctly', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.isLessonCurrent(mockLessonMetadata)).toBe(true);
        expect(component.isLessonCurrent(mockPreviousLesson)).toBe(false);
        expect(component.isLessonCurrent(mockNextLesson)).toBe(false);
        done();
      }, 0);
    });

    it('should identify pending lesson correctly', () => {
      expect(component.isLessonPending(mockNextLesson)).toBe(true);
      expect(component.isLessonPending(mockLessonMetadata)).toBe(false);
      expect(component.isLessonPending(mockPreviousLesson)).toBe(false);
    });

    it('should allow clicking non-pending lessons', () => {
      expect(component.canClickLesson(mockLessonMetadata)).toBe(true);
      expect(component.canClickLesson(mockPreviousLesson)).toBe(true);
      expect(component.canClickLesson(mockNextLesson)).toBe(false);
    });
  });

  describe('Lesson Icon Generation', () => {
    it('should return checked icon for completed lesson', () => {
      const completedLesson: LessonMetadata = {
        ...mockLessonMetadata,
        status: 'completed'
      };
      expect(component.getLessonIcon(completedLesson)).toBe('checked');
    });

    it('should return video icon for video type', () => {
      expect(component.getLessonIcon(mockLessonMetadata)).toBe('video');
    });

    it('should return article icon for article type', () => {
      const articleLesson: LessonMetadata = {
        ...mockLessonMetadata,
        type: LessonType.Article
      };
      expect(component.getLessonIcon(articleLesson)).toBe('article');
    });

    it('should return audio icon for audio type', () => {
      const audioLesson: LessonMetadata = {
        ...mockLessonMetadata,
        type: LessonType.Audio
      };
      expect(component.getLessonIcon(audioLesson)).toBe('audio');
    });

    it('should return document icon for document type', () => {
      const documentLesson: LessonMetadata = {
        ...mockLessonMetadata,
        type: LessonType.Document
      };
      expect(component.getLessonIcon(documentLesson)).toBe('document');
    });
  });

  describe('Breadcrumb Items', () => {
    it('should return breadcrumb items with lesson title', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        const breadcrumbs = component.breadcrumbItems;
        expect(breadcrumbs).toContain('Roadmap');
        expect(breadcrumbs).toContain('Prayer (Salah)');
        expect(breadcrumbs).toContain('Introduction to Fiqh');
        done();
      }, 0);
    });

    it('should show Loading when lesson title is not available', () => {
      component.lessonContent = null;
      const breadcrumbs = component.breadcrumbItems;
      expect(breadcrumbs[2]).toBe('Loading...');
    });
  });

  describe('Course Info', () => {
    it('should return course info with correct structure', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        const courseInfo = component.courseInfo;
        expect(courseInfo.stage).toBe(1);
        expect(courseInfo.code).toBe('A2');
        expect(courseInfo.title).toBe('Prayer (Salah)');
        expect(courseInfo.stats).toContain('Lesson:');
        done();
      }, 0);
    });
  });

  describe('Error Handling', () => {
    it('should handle lesson loading error', (done) => {
      mockLessonContentService.getLesson.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );
      spyOn(console, 'error');

      fixture.detectChanges();
      setTimeout(() => {
        expect(component.error).toBe('Failed to load lesson content');
        expect(component.isLoading).toBe(false);
        expect(console.error).toHaveBeenCalled();
        done();
      }, 0);
    });

    it('should handle course lessons loading error gracefully', (done) => {
      mockLessonContentService.getCourseLessons.and.returnValue(
        throwError(() => new Error('Failed to load course lessons'))
      );
      spyOn(console, 'error');

      fixture.detectChanges();
      setTimeout(() => {
        expect(console.error).toHaveBeenCalled();
        done();
      }, 0);
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe from observables on destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should load lesson data and update UI state correctly', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        expect(component.lessonData).toBeTruthy();
        expect(component.lessonContent).toBeTruthy();
        expect(component.coarseLessons.length).toBeGreaterThan(0);
        expect(component.nextLesson).toBeTruthy();
        expect(component.previousLesson).toBeTruthy();
        expect(component.isLoading).toBe(false);
        done();
      }, 0);
    });

    it('should handle full lesson navigation flow', (done) => {
      fixture.detectChanges();
      setTimeout(() => {
        // Start with first lesson
        expect(component.lessonId).toBe('lesson-1');

        // Change tab
        component.setActiveTab('notes');
        expect(component.activeTab).toBe('notes');

        // Navigate to next
        component.goToNextLesson();
        expect(mockRouter.navigate).toHaveBeenCalledWith([
          '/roadmap/course',
          'course-a2',
          'lesson',
          'lesson-2'
        ]);

        done();
      }, 0);
    });
  });
});
