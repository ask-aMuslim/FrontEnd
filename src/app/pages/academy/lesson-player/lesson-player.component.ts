import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LessonContentService } from '../../../core/services/lesson-content.service';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import {
    AcademyBreadcrumbItem,
    AcademyPageShellComponent,
} from '../shared/academy-page-shell/academy-page-shell.component';
import {
    AcademyCourse,
    AcademyLesson,
} from '../../../core/models/interfaces/academy-progress.model';
import {
    LessonContent,
    LessonData,
    LessonPlayerTab,
    LessonMetadata,
    VideoLessonContent,
    AudioLessonContent,
    ArticleLessonContent,
    IntroLessonContent,
    isVideoContent,
    isAudioContent,
    isArticleContent,
    isIntroContent
} from '../../../core/models/interfaces/lesson-content.model';
import { LessonType } from '../../../core/models/interfaces/enums.model';

@Component({
    selector: 'app-lesson-player',
    standalone: true,
    imports: [FormsModule, AcademyPageShellComponent],
    templateUrl: './lesson-player.component.html',
    styleUrls: ['./lesson-player.component.scss']
})
export class LessonPlayerComponent implements OnInit, OnDestroy {
    private static readonly defaultBannerUrl = '/backgrounds/course-background.png';

    courseId: string = '';
    lessonId: string = '';

    currentCourse: AcademyCourse | undefined;
    currentLesson: AcademyLesson | undefined;
    nextAcademyLesson: AcademyLesson | undefined;
    previousAcademyLesson: AcademyLesson | undefined;
    courseLessons: AcademyLesson[] = [];

    lessonData: LessonData | null = null;
    lessonContent: LessonContent | null = null;
    coarseLessons: LessonMetadata[] = [];

    isIntroLesson = false;
    activeTab: LessonPlayerTab = 'overview';
    isLoading = false;
    isContentLoading = false;
    error: string | null = null;

    nextLesson: LessonMetadata | undefined;
    previousLesson: LessonMetadata | undefined;

    noteText: string = '';
    previousNotes: Array<{ timestamp: string; text: string }> = [
        { timestamp: '[Lesson] 8:20', text: 'My note is written here. My note is written here. My note is written here. My note is written here.' },
        { timestamp: '[Lesson] 8:20', text: 'My note is written here. My note is written here. My note is written here. My note is written here.' },
        { timestamp: '[Lesson] 8:20', text: 'My note is written here. My note is written here. My note is written here. My note is written here.' },
        { timestamp: '[Lesson] 8:20', text: 'My note is written here. My note is written here. My note is written here. My note is written here.' }
    ];
    notesFilter: 'latest' | 'current-lesson' = 'latest';
    notesSearchQuery: string = '';

    lessonRating: number = 0;
    feedbackText: string = '';

    readonly breadcrumbsBase: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];

    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly lessonContentService: LessonContentService,
        private readonly academyProgressService: AcademyProgressService
    ) { }

    get bannerImageUrl(): string {
        if (this.isVideoContent && this.videoContent?.thumbnailUrl) {
            return this.videoContent.thumbnailUrl;
        }
        if (this.isIntroContent && this.introContent?.thumbnailUrl) {
            return this.introContent.thumbnailUrl;
        }
        return LessonPlayerComponent.defaultBannerUrl;
    }

    get bannerAlt(): string {
        if (this.isIntroContent) {
            return 'Course introduction background';
        }
        return 'Course background';
    }

    get breadcrumbs(): readonly AcademyBreadcrumbItem[] {
        return [
            ...this.breadcrumbsBase,
            {
                label: this.currentCourse?.title || 'Course',
                link: ['/academy/course', this.courseId],
            },
        ];
    }

    get currentBreadcrumb(): string {
        return this.lessonContent?.title || this.currentLesson?.title || 'Lesson';
    }

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.courseId = params.get('courseId') || '';
            this.lessonId = params.get('lessonId') || '';

            if (this.courseId && this.lessonId) {
                this.loadLessonData();
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadLessonData(): void {
        this.isLoading = true;
        this.isContentLoading = true;
        this.error = null;

        this.currentCourse = this.academyProgressService.getCourseById(this.courseId);
        this.currentLesson = this.academyProgressService.getLessonById(this.lessonId);
        this.courseLessons = this.academyProgressService.getCourseLessons(this.courseId);

        this.nextAcademyLesson = this.academyProgressService.getNextLesson(this.courseId, this.lessonId);
        this.previousAcademyLesson = this.academyProgressService.getPreviousLesson(this.courseId, this.lessonId);

        if (!this.currentCourse || !this.currentLesson) {
            this.error = 'Lesson not found';
            this.isLoading = false;
            this.isContentLoading = false;
            return;
        }

        this.isIntroLesson = this.currentLesson.type === 'intro';

        this.academyProgressService.updateLessonProgress({
            lessonId: this.lessonId,
            courseId: this.courseId,
        }).pipe(takeUntil(this.destroy$)).subscribe();

        this.loadLessonContent();
        this.loadCourseLessonsForSidebar();
    }

    private loadLessonContent(): void {
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
                    this.isContentLoading = false;
                },
                error: (err) => {
                    console.warn('Content service failed, using academy data:', err);
                    this.isLoading = false;
                    this.isContentLoading = false;
                }
            });
    }

    private loadCourseLessonsForSidebar(): void {
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

    get isIntroContent(): boolean { return this.lessonContent ? isIntroContent(this.lessonContent) : false; }
    get isVideoContent(): boolean { return this.lessonContent ? isVideoContent(this.lessonContent) : false; }
    get isAudioContent(): boolean { return this.lessonContent ? isAudioContent(this.lessonContent) : false; }
    get isArticleContent(): boolean { return this.lessonContent ? isArticleContent(this.lessonContent) : false; }

    get introContent(): IntroLessonContent | null { return this.isIntroContent ? this.lessonContent as IntroLessonContent : null; }
    get videoContent(): VideoLessonContent | null { return this.isVideoContent ? this.lessonContent as VideoLessonContent : null; }
    get audioContent(): AudioLessonContent | null { return this.isAudioContent ? this.lessonContent as AudioLessonContent : null; }
    get articleContent(): ArticleLessonContent | null { return this.isArticleContent ? this.lessonContent as ArticleLessonContent : null; }

    setActiveTab(tab: LessonPlayerTab): void { this.activeTab = tab; }

    goToNextLesson(): void {
        const nextId = this.nextAcademyLesson?.id || this.nextLesson?.id;
        if (nextId) {
            this.router.navigate(['../lesson', nextId], { relativeTo: this.route });
        }
    }

    goToPreviousLesson(): void {
        const prevId = this.previousAcademyLesson?.id || this.previousLesson?.id;
        if (prevId) {
            this.router.navigate(['../lesson', prevId], { relativeTo: this.route });
        }
    }

    goToLesson(lessonId: string): void {
        this.router.navigate(['../lesson', lessonId], { relativeTo: this.route });
    }

    onSave(): void {
        if (this.lessonId) {
            this.lessonContentService.saveLessonProgress(this.lessonId).subscribe({
                next: () => console.log('Lesson saved successfully'),
                error: (err) => console.error('Error saving lesson:', err)
            });
        }
    }

    onShare(): void {
        if (this.lessonContent && navigator.share) {
            navigator.share({
                title: this.lessonContent.title,
                text: this.lessonContent.description,
                url: globalThis.location.href
            }).catch(err => console.error('Error sharing:', err));
        } else {
            navigator.clipboard.writeText(globalThis.location.href).then(() => {
                console.log('Link copied to clipboard');
            });
        }
    }

    onDownload(): void {
        console.log('Download initiated for lesson:', this.lessonId);
    }

    isLessonCompleted(lesson: LessonMetadata): boolean { return lesson.status === 'completed'; }
    isLessonCurrent(lesson: LessonMetadata): boolean { return lesson.status === 'current' || lesson.id === this.lessonId; }
    isLessonPending(lesson: LessonMetadata): boolean { return lesson.status === 'pending'; }
    canClickLesson(lesson: LessonMetadata): boolean { return lesson.status !== 'pending'; }

    getLessonIcon(lesson: LessonMetadata): string {
        if (lesson.status === 'completed') return 'checked';
        return this.getLessonTypeIcon(lesson.type);
    }

    getLessonTypeIcon(type: LessonType): string {
        switch (type) {
            case 1: return 'video';
            case 2: return 'article';
            case 3: return 'document';
            case 4: return 'audio';
            default: return 'note';
        }
    }

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

    deleteNote(index: number): void { this.previousNotes.splice(index, 1); }

    setRating(stars: number): void { this.lessonRating = stars; }

    submitFeedback(): void {
        if (this.lessonRating > 0 || this.feedbackText.trim()) {
            console.log('Feedback submitted:', { rating: this.lessonRating, feedback: this.feedbackText });
            this.feedbackText = '';
            alert('Thank you for your feedback!');
        }
    }

    get breadcrumbItems(): string[] {
        const courseTitle = this.currentCourse?.title || 'Course';
        const lessonTitle = this.lessonContent?.title || this.currentLesson?.title || 'Loading...';
        return ['Academy', courseTitle, lessonTitle];
    }

    get courseInfo(): { stage: number; code: string; title: string; stats: string } {
        const stage = this.currentCourse?.stageId || 0;
        const code = (this.currentCourse?.id || '').split('-').slice(0, 2).join('-').toUpperCase() || '';
        const title = this.currentCourse?.title || '';
        const currentOrder = this.lessonData?.metadata.order || (this.currentLesson?.order || 0);
        return {
            stage,
            code,
            title,
            stats: `Lesson: ${currentOrder}/${this.courseLessons.length}`
        };
    }

    get filteredNotes(): Array<{ timestamp: string; text: string }> {
        return this.previousNotes.filter(note => note.text.toLowerCase().includes(this.notesSearchQuery.toLowerCase()));
    }
}
