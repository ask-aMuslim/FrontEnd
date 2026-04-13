import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    PLATFORM_ID,
    inject,
    viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LessonContentService, LessonNoteItem } from '../../../core/services/lesson-content.service';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { VideoProgressService } from '../../../core/services/video-progress.service';
import {
    YOUTUBE_PLAYER_STATE,
    YouTubePlayer,
    YouTubePlayerService,
    YouTubePlayerState,
} from '../../../core/services/youtube-player.service';
import { QuizzesService } from '../../../core/services/quizzes.service';
import { TokenService } from '../../../core/auth/token.service';
import { QuizReadDto } from '../../../api/facades/quiz.facade';
import { toApiMediaUrl } from '../../../core/helpers/media-url.helper';
import {
    AcademyBreadcrumbItem,
    AcademyPageShellComponent,
} from '../shared/academy-page-shell/academy-page-shell.component';
import {
    AcademySidebarLessonItem,
} from '../shared/academy-course-sidebar/academy-course-sidebar.component';
import { AcademySidebarHostComponent } from '../shared/academy-sidebar-host/academy-sidebar-host.component';
import {
    AcademyCourse,
    AcademyLesson,
    LessonProgress,
} from '../../../core/models/interfaces/academy-progress.model';
import { LessonType } from '../../../core/models/interfaces/enums.model';
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
import { TiptapViewerComponent } from '../../../shared/components/tiptap-viewer/tiptap-viewer.component';

interface ImageInliningReport {
    total: number;
    inlined: number;
    unresolved: number;
    unresolvedCrossOrigin: number;
}

@Component({
    selector: 'app-lesson-player',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        AcademyPageShellComponent,
        AcademySidebarHostComponent,
        TiptapViewerComponent,
    ],
    templateUrl: './lesson-player.component.html',
    styleUrls: ['./lesson-player.component.scss']
})
export class LessonPlayerComponent implements OnInit, OnDestroy {
    private static readonly defaultBannerUrl = '/backgrounds/course-background.png';
    private static readonly syntheticQuizSidebarIdPrefix = 'synthetic-quiz-';
    private static readonly youtubeEmbedOrigin = 'https://www.youtube-nocookie.com';
    private static readonly youtubePlayerHostElementId = 'lesson-youtube-player-host';
    private static readonly completionThresholdPercentage = 90;
    private static readonly youtubeLabelUpdateIntervalMs = 250;
    private static readonly youtubeProgressSyncIntervalMs = 1000;

    courseId: string = '';
    lessonId: string = '';

    currentCourse: AcademyCourse | undefined;
    currentLesson: AcademyLesson | undefined;
    nextAcademyLesson: AcademyLesson | undefined;
    previousAcademyLesson: AcademyLesson | undefined;
    courseLessons: Array<AcademyLesson & { progress: LessonProgress }> = [];

    lessonData: LessonData | null = null;
    lessonContent: LessonContent | null = null;
    lessonProgressLabel = '0:00 / 0:00';
    audioProgressPercent = 0;
    audioPlaybackRate = 1;
    audioIsPlaying = false;
    audioIsMuted = false;
    audioVolume = 1;
    audioCurrentSeconds = 0;
    audioDurationSeconds = 0;
    readonly audioPlaybackRateOptions: readonly number[] = [1, 1.25, 1.5, 2];

    isIntroLesson = false;
    activeTab: LessonPlayerTab = 'overview';
    isLoading = false;
    isContentLoading = false;
    error: string | null = null;

    nextLesson: LessonMetadata | undefined;
    previousLesson: LessonMetadata | undefined;
    hasCourseQuiz = false;
    courseQuizLessonId: string | null = null;
    courseQuizTitle = 'Quiz';

    noteText: string = '';
    previousNotes: LessonNoteItem[] = [];
    notesFilter: 'latest' | 'current-lesson' = 'latest';
    notesSearchQuery: string = '';

    lessonRating: number = 0;
    feedbackText: string = '';
    feedbackSubmissionMessage: string | null = null;

    readonly breadcrumbsBase: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];
    readonly youtubePlayerHostElementId = LessonPlayerComponent.youtubePlayerHostElementId;
    readonly mediaContainer = viewChild<ElementRef<HTMLElement>>('lessonMediaContainer');
    readonly audioElementRef = viewChild<ElementRef<HTMLAudioElement>>('audioElement');

    private readonly destroy$ = new Subject<void>();
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly tokenService = inject(TokenService);
    private readonly flushProgressOnUnload = () => this.flushVideoProgress();
    private youtubePlayer: YouTubePlayer | null = null;
    private youtubeProgressIntervalId: ReturnType<typeof globalThis.setInterval> | null = null;
    private lastYouTubeProgressSyncAt = 0;
    private hasSyncedCompletion = false;
    private pendingSeekSeconds: number | null = null;
    private pendingYouTubeRestorePercentage: number | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly sanitizer: DomSanitizer,
        private readonly lessonContentService: LessonContentService,
        private readonly academyProgressService: AcademyProgressService,
        private readonly youtubePlayerService: YouTubePlayerService,
        private readonly videoProgressService: VideoProgressService,
        private readonly quizzesService: QuizzesService,
        private readonly cdr: ChangeDetectorRef,
    ) { }

    get bannerImageUrl(): string {
        if (this.isVideoContent && this.videoContent?.thumbnailUrl) {
            return this.videoContent.thumbnailUrl;
        }
        if (this.isIntroContent && this.introContent?.thumbnailUrl) {
            return this.introContent.thumbnailUrl;
        }
        if (this.currentCourse?.thumbnailUrl) {
            return this.currentCourse.thumbnailUrl;
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

    get resolvedCourseDuration(): string {
        const fallbackDuration = '0m';
        return this.academyProgressService.calculateCourseVideoDuration(this.courseLessons, fallbackDuration);
    }

    ngOnInit(): void {
        combineLatest([this.route.paramMap, this.route.queryParamMap])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([params, queryParams]) => {
                const nextCourseId = params.get('courseId') || '';
                const nextLessonId = params.get('lessonId') || '';

                if (nextCourseId && nextLessonId) {
                    const requestedTab = queryParams.get('tab') === 'notes' ? 'notes' : 'overview';
                    const requestedSeekSeconds = this.parseSeekQueryParam(queryParams.get('seek'));
                    this.resetViewStateForRouteChange(requestedTab, requestedSeekSeconds);
                    this.courseId = nextCourseId;
                    this.lessonId = nextLessonId;
                    this.loadLessonData();
                }
            });
    }

    ngOnDestroy(): void {
        this.teardownYouTubeIntegration();
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadLessonData(): void {
        this.isLoading = true;
        this.isContentLoading = true;
        this.error = null;

        combineLatest([
            this.academyProgressService.getAcademyCourseById(this.courseId),
            this.academyProgressService.getCourseLessonsWithProgress(this.courseId),
            this.quizzesService.getAll({ courseId: this.courseId, pageSize: 200 }),
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ([course, lessonsWithProgress, quizzes]) => {
                    const currentLesson = lessonsWithProgress.find((lesson) => lesson.id === this.lessonId);
                    const courseLessonIds = new Set(lessonsWithProgress.map((lesson) => lesson.id));
                    const scopedQuizzes = quizzes.filter((quiz) => {
                        const lessonId = typeof quiz.lessonId === 'string' ? quiz.lessonId.trim() : '';
                        return lessonId.length === 0 || courseLessonIds.has(lessonId);
                    });

                    if (!currentLesson) {
                        this.error = 'Lesson not found';
                        this.isLoading = false;
                        this.isContentLoading = false;
                        this.cdr.markForCheck();
                        return;
                    }

                    const aggregatedVideoDuration = this.academyProgressService.calculateCourseVideoDuration(
                        lessonsWithProgress,
                        '0m',
                    );

                    this.currentCourse = {
                        ...course,
                        duration: aggregatedVideoDuration,
                    };
                    // Check if there are any quizzes for this course (course-level or lesson-level)
                    this.hasCourseQuiz = scopedQuizzes.length > 0 || lessonsWithProgress.some((lesson) => lesson.type === 'quiz');
                    this.courseQuizLessonId = this.resolveQuizLessonId(lessonsWithProgress, scopedQuizzes);
                    this.courseQuizTitle = this.resolveCourseQuizTitle(lessonsWithProgress, scopedQuizzes);
                    this.courseLessons = lessonsWithProgress.map((lesson) => ({
                        ...lesson,
                        progress: {
                            ...lesson.progress,
                            status: lesson.id === this.lessonId ? 'current' : lesson.progress.status
                        }
                    }));
                    this.currentLesson = this.stripProgress(currentLesson);
                    this.captureRecentLessonSnapshot();
                    this.nextAcademyLesson = this.resolveNextLesson(lessonsWithProgress, this.lessonId);
                    this.previousAcademyLesson = this.resolvePreviousLesson(lessonsWithProgress, this.lessonId);
                    this.isIntroLesson = this.currentLesson.type === 'intro';

                    this.cdr.markForCheck();

                    this.academyProgressService.updateLessonProgress({
                        lessonId: this.lessonId,
                        courseId: this.courseId,
                    }).pipe(takeUntil(this.destroy$)).subscribe();

                    this.loadLessonContent();
                    this.loadLessonNotes();
                },
                error: () => {
                    this.error = 'Unable to load this lesson right now. Please try again.';
                    this.isLoading = false;
                    this.isContentLoading = false;
                    this.cdr.markForCheck();
                }
            });
    }

    private loadLessonContent(): void {
        this.lessonContentService
            .getLesson(this.lessonId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data: LessonData) => {
                    const enrichedContent = this.applyResolvedVideoDuration(data.content);
                    this.lessonData = data;
                    this.lessonContent = enrichedContent;
                    this.nextLesson = data.nextLesson;
                    this.previousLesson = data.previousLesson;
                    this.error = null;
                    this.hasSyncedCompletion = this.videoProgressService.isLessonCompleted(this.lessonId);
                    this.initializeLessonProgressLabel();
                    this.isLoading = false;
                    this.isContentLoading = false;
                    this.cdr.markForCheck();
                    this.initializeYouTubeIntegration();
                    this.captureRecentLessonSnapshot();
                    this.applyPendingPlaybackSeek();
                },
                error: () => {
                    this.error = 'Unable to load lesson content right now. Please try again.';
                    this.isLoading = false;
                    this.isContentLoading = false;
                    this.cdr.markForCheck();
                }
            });
    }

    private loadLessonNotes(): void {
        this.lessonContentService
            .getLessonNotes(this.lessonId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (notes) => {
                    this.previousNotes = notes;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.previousNotes = [];
                    this.cdr.markForCheck();
                },
            });
    }

    private resetViewStateForRouteChange(initialTab: LessonPlayerTab = 'overview', pendingSeekSeconds: number | null = null): void {
        this.teardownYouTubeIntegration();
        this.error = null;
        this.lessonData = null;
        this.lessonContent = null;
        this.currentLesson = undefined;
        this.nextAcademyLesson = undefined;
        this.previousAcademyLesson = undefined;
        this.nextLesson = undefined;
        this.previousLesson = undefined;
        this.courseLessons = [];
        this.hasCourseQuiz = false;
        this.courseQuizLessonId = null;
        this.courseQuizTitle = 'Quiz';
        this.activeTab = initialTab;
        this.lessonProgressLabel = '0:00 / 0:00';
        this.audioProgressPercent = 0;
        this.audioPlaybackRate = 1;
        this.audioIsPlaying = false;
        this.audioIsMuted = false;
        this.audioVolume = 1;
        this.audioCurrentSeconds = 0;
        this.audioDurationSeconds = 0;
        this.hasSyncedCompletion = false;
        this.pendingSeekSeconds = pendingSeekSeconds;
        this.pendingYouTubeRestorePercentage = null;
    }

    get isIntroContent(): boolean { return this.lessonContent ? isIntroContent(this.lessonContent) : false; }
    get isVideoContent(): boolean { return this.lessonContent ? isVideoContent(this.lessonContent) : false; }
    get isAudioContent(): boolean { return this.lessonContent ? isAudioContent(this.lessonContent) : false; }
    get isArticleContent(): boolean { return this.lessonContent ? isArticleContent(this.lessonContent) : false; }

    get introContent(): IntroLessonContent | null { return this.isIntroContent ? this.lessonContent as IntroLessonContent : null; }
    get videoContent(): VideoLessonContent | null { return this.isVideoContent ? this.lessonContent as VideoLessonContent : null; }
    get audioContent(): AudioLessonContent | null { return this.isAudioContent ? this.lessonContent as AudioLessonContent : null; }
    get articleContent(): ArticleLessonContent | null { return this.isArticleContent ? this.lessonContent as ArticleLessonContent : null; }

    get isYouTubeVideo(): boolean {
        return this.getYouTubeVideoId(this.videoContent?.videoUrl ?? '') !== null;
    }

    get youtubeEmbedUrl(): SafeResourceUrl | null {
        const videoId = this.getYouTubeVideoId(this.videoContent?.videoUrl ?? '');
        if (!videoId) {
            return null;
        }

        const embedUrl = `${LessonPlayerComponent.youtubeEmbedOrigin}/embed/${videoId}?rel=0&modestbranding=1`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    get useExternalEmbed(): boolean {
        const url = this.videoContent?.videoUrl ?? '';
        return !!url && !this.isYouTubeVideo && !this.isDirectVideoFileUrl(url);
    }

    get externalEmbedUrl(): SafeResourceUrl | null {
        if (!this.useExternalEmbed) {
            return null;
        }

        const rawUrl = this.videoContent?.videoUrl?.trim() ?? '';
        if (!rawUrl) {
            return null;
        }

        return this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    }

    get audioPlaybackRateLabel(): string {
        if (Number.isInteger(this.audioPlaybackRate)) {
            return `${this.audioPlaybackRate.toFixed(0)}x`;
        }

        return `${this.audioPlaybackRate}x`;
    }

    setActiveTab(tab: LessonPlayerTab): void { this.activeTab = tab; }

    goToNextLesson(): void {
        const nextId = this.nextAcademyLesson?.id || this.nextLesson?.id;
        if (nextId) {
            this.academyProgressService
                .markLessonCompleted(this.lessonId, this.courseId)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        void this.router.navigate(['/academy/course', this.courseId, 'lesson', nextId]);
                    },
                    error: () => {
                        void this.router.navigate(['/academy/course', this.courseId, 'lesson', nextId]);
                    },
                });
        }
    }

    goToPreviousLesson(): void {
        const prevId = this.previousAcademyLesson?.id || this.previousLesson?.id;
        if (prevId) {
            this.router.navigate(['/academy/course', this.courseId, 'lesson', prevId]);
        }
    }

    goToLesson(lessonId: string): void {
        this.router.navigate(['/academy/course', this.courseId, 'lesson', lessonId]);
    }

    get shouldShowStartQuizButton(): boolean {
        const lastContentLessonId = this.getLastContentLessonId();
        return this.hasCourseQuiz
            && !!lastContentLessonId
            && this.lessonId === lastContentLessonId;
    }

    onStartQuizClick(): void {
        if (!this.hasCourseQuiz) {
            return;
        }

        if (this.courseQuizLessonId) {
            void this.router.navigate(['/academy/course', this.courseId, 'quiz', this.courseQuizLessonId]);
            return;
        }

        void this.router.navigate(['/academy/course', this.courseId, 'quiz']);
    }

    onSave(): void {
        if (this.lessonId) {
            this.lessonContentService.saveLessonProgress(this.lessonId).subscribe();
        }
    }

    onShare(): void {
        if (!this.isBrowser || !this.lessonContent) {
            return;
        }

        if (globalThis.navigator.share) {
            globalThis.navigator.share({
                title: this.lessonContent.title,
                text: this.lessonContent.description,
                url: globalThis.location.href
            }).catch(() => void 0);
            return;
        }

        globalThis.navigator.clipboard?.writeText(globalThis.location.href).then(() => void 0);
    }

    async onDownload(): Promise<void> {
        if (!this.isBrowser || !this.lessonContent) {
            return;
        }

        const titleText = this.lessonContent.title || 'Lesson Content';
        const contentHtml = this.buildLessonHtmlForPdf();
        const richTextStyles = this.getPdfRichTextStyles();
        let exportContainer: HTMLDivElement | null = null;

        try {
            const jsPDF = (await import('jspdf')).jsPDF;
            const html2canvas = (await import('html2canvas')).default;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            exportContainer = globalThis.document.createElement('div');
            exportContainer.style.position = 'fixed';
            exportContainer.style.left = '-10000px';
            exportContainer.style.top = '0';
            exportContainer.style.width = '794px';
            exportContainer.style.background = '#ffffff';
            exportContainer.style.color = '#111827';
            exportContainer.style.padding = '32px';
            exportContainer.style.fontFamily = 'Arial, sans-serif';
            exportContainer.style.lineHeight = '1.65';

            exportContainer.innerHTML = `
                            <style>${richTextStyles}</style>
                            <div class="pdf-export-root">
                                <h1 style="font-size:28px;line-height:1.3;margin:0 0 16px;color:#111827;">${this.escapeHtml(titleText)}</h1>
                                <div class="pdf-export-content">${contentHtml}</div>
                            </div>
                        `;

            globalThis.document.body.appendChild(exportContainer);
            const imageReport = await this.inlineContainerImages(exportContainer);
            await this.waitForImages(exportContainer);

            if (imageReport.unresolvedCrossOrigin > 0) {
                this.openPrintFallbackWindow(titleText, contentHtml, richTextStyles);
                return;
            }

            const canvas = await html2canvas(exportContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false,
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const imageHeight = (canvas.height * pageWidth) / canvas.width;

            let heightLeft = imageHeight;
            let position = 0;

            doc.addImage(imgData, 'JPEG', 0, position, pageWidth, imageHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imageHeight;
                doc.addPage();
                doc.addImage(imgData, 'JPEG', 0, position, pageWidth, imageHeight);
                heightLeft -= pageHeight;
            }

            const safeTitle = titleText.replaceAll(/[^a-z0-9-]/gi, '_').slice(0, 60);
            doc.save(`${safeTitle || 'lesson'}.pdf`);
        } catch {
            this.openPrintFallbackWindow(titleText, contentHtml, richTextStyles);
        } finally {
            exportContainer?.remove();
        }
    }

    isLessonCompleted(lesson: AcademyLesson & { progress: LessonProgress }): boolean { return lesson.progress.status === 'completed'; }
    isLessonCurrent(lesson: AcademyLesson & { progress: LessonProgress }): boolean { return lesson.id === this.lessonId; }
    isLessonPending(lesson: AcademyLesson & { progress: LessonProgress }): boolean { return lesson.progress.status === 'locked'; }
    canClickLesson(lesson: AcademyLesson & { progress: LessonProgress }): boolean { return lesson.progress.status !== 'locked'; }

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
        const trimmedNote = this.noteText.trim();
        if (!trimmedNote) {
            return;
        }
        const timestampSeconds = this.resolveCurrentLessonTimestampSeconds();

        this.lessonContentService
            .addLessonNote(this.lessonId, trimmedNote, timestampSeconds)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (createdNote) => {
                    this.previousNotes = [createdNote, ...this.previousNotes];
                    this.noteText = '';
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.noteText = '';
                    this.cdr.markForCheck();
                },
            });
    }

    onDeleteNoteClick(event: Event, noteId: string, index: number): void {
        event.stopPropagation();
        this.deleteNote(noteId, index);
    }

    onLessonNoteClick(note: LessonNoteItem): void {
        this.scrollToMediaSection();
        this.seekPlaybackTo(note.progressSeconds);
    }

    deleteNote(noteId: string, index: number): void {
        this.lessonContentService
            .deleteLessonNote(noteId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (deleted) => {
                    if (deleted) {
                        this.previousNotes.splice(index, 1);
                        this.cdr.markForCheck();
                    }
                },
            });
    }

    setRating(stars: number): void { this.lessonRating = stars; }

    submitFeedback(): void {
        if (this.lessonRating > 0 || this.feedbackText.trim()) {
            this.feedbackText = '';
            this.feedbackSubmissionMessage = 'Thank you for your feedback!';
        }
    }

    get breadcrumbItems(): string[] {
        const courseTitle = this.currentCourse?.title || 'Course';
        const lessonTitle = this.lessonContent?.title || this.currentLesson?.title || 'Loading...';
        return ['Academy', courseTitle, lessonTitle];
    }

    get courseInfo(): { stage: number; code: string; title: string; stats: string } {
        const stage = this.currentCourse?.stageId || 0;
        const title = this.currentCourse?.title || '';
        const currentOrder = this.lessonData?.metadata.order || (this.currentLesson?.order || 0);
        return {
            stage,
            code: '',
            title,
            stats: `Lesson: ${currentOrder}/${this.courseLessons.length}`
        };
    }

    get filteredNotes(): LessonNoteItem[] {
        const query = this.notesSearchQuery.trim().toLowerCase();
        const notesForLesson = this.notesFilter === 'latest'
            ? [...this.previousNotes].sort(
                (a, b) => this.toTimestampMillis(b.createdAt) - this.toTimestampMillis(a.createdAt),
            )
            : this.previousNotes;

        if (!query) {
            return notesForLesson;
        }

        return notesForLesson.filter(note => note.text.toLowerCase().includes(query));
    }

    get sidebarLessons(): AcademySidebarLessonItem[] {
        const lastContentLessonId = this.getLastContentLessonId();
        const isViewingLastCourseLesson = !!lastContentLessonId && this.lessonId === lastContentLessonId;

        const mappedLessons = this.courseLessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.type === 'quiz' ? this.courseQuizTitle : lesson.title,
            duration: lesson.type === 'quiz' ? 'Assessment' : lesson.duration,
            type: lesson.type,
            quizLessonId: lesson.type === 'quiz' ? lesson.id : undefined,
            isCompleted: this.isLessonCompleted(lesson),
            isCurrent: this.isLessonCurrent(lesson),
            isLastCourseLesson:
                isViewingLastCourseLesson
                && !!lastContentLessonId
                && lesson.id === lastContentLessonId,
            isLocked: this.isLessonPending(lesson),
        }));

        if (mappedLessons.some((lesson) => lesson.type === 'quiz') || !this.hasCourseQuiz) {
            return mappedLessons;
        }

        return [
            ...mappedLessons,
            {
                id: `${LessonPlayerComponent.syntheticQuizSidebarIdPrefix}${this.courseId}`,
                quizLessonId: this.courseQuizLessonId ?? undefined,
                title: this.courseQuizTitle,
                duration: 'Assessment',
                type: 'quiz',
                isCompleted: false,
                isCurrent: false,
                isLocked: false,
            },
        ];
    }

    private getLastContentLessonId(): string | null {
        const nonQuizLessons = this.courseLessons
            .filter((lesson) => lesson.type !== 'quiz')
            .sort((a, b) => a.order - b.order);

        const lastLesson = nonQuizLessons.at(-1);
        return lastLesson?.id ?? null;
    }

    onSidebarLessonSelect(lesson: AcademySidebarLessonItem): void {
        if (lesson.type === 'quiz') {
            const quizLessonId = lesson.quizLessonId
                ?? (lesson.id.startsWith(LessonPlayerComponent.syntheticQuizSidebarIdPrefix) ? null : lesson.id);

            if (quizLessonId) {
                void this.router.navigate(['/academy/course', this.courseId, 'quiz', quizLessonId]);
            } else {
                void this.router.navigate(['/academy/course', this.courseId, 'quiz']);
            }

            return;
        }

        this.goToLesson(lesson.id);
    }

    private initializeYouTubeIntegration(): void {
        if (!this.isBrowser || !this.isVideoContent || !this.isYouTubeVideo) {
            this.teardownYouTubeIntegration(false);
            return;
        }

        this.hasSyncedCompletion = this.videoProgressService.isLessonCompleted(this.lessonId);

        const videoId = this.getYouTubeVideoId(this.videoContent?.videoUrl ?? '');
        if (!videoId) {
            this.teardownYouTubeIntegration(false);
            return;
        }

        globalThis.setTimeout(() => {
            const hostElement = globalThis.document.getElementById(this.youtubePlayerHostElementId);
            if (!(hostElement instanceof HTMLElement)) {
                return;
            }

            this.teardownYouTubeIntegration(false);

            void this.youtubePlayerService
                .createPlayer(hostElement, videoId, {
                    onStateChange: (event) => this.onYouTubePlayerStateChange(event.data as YouTubePlayerState),
                })
                .then((player) => {
                    this.youtubePlayer = player;
                    this.restorePlaybackProgress();
                    this.applyPendingPlaybackSeek();
                    this.startYouTubeProgressTracking();

                    globalThis.addEventListener('beforeunload', this.flushProgressOnUnload);
                    this.cdr.markForCheck();
                })
                .catch(() => {
                    this.teardownYouTubeIntegration(false);
                });
        }, 0);
    }

    private onYouTubePlayerStateChange(state: YouTubePlayerState): void {
        if (state === YOUTUBE_PLAYER_STATE.PAUSED) {
            this.updateVideoProgressLabel();
            this.trackVideoProgress();
            this.flushVideoProgress();
            return;
        }

        if (state === YOUTUBE_PLAYER_STATE.ENDED) {
            const payload = this.buildVideoProgressPayload();
            if (payload) {
                this.videoProgressService.syncCompletion({
                    ...payload,
                    videoProgressPercentage: 100,
                });
            }
            this.syncLessonCompletionState();
            this.flushVideoProgress();
        }
    }

    private startYouTubeProgressTracking(): void {
        this.stopYouTubeProgressTracking();
        this.updateVideoProgressLabel();
        this.lastYouTubeProgressSyncAt = 0;

        this.youtubeProgressIntervalId = globalThis.setInterval(() => {
            this.updateVideoProgressLabel();
            const now = Date.now();
            if (now - this.lastYouTubeProgressSyncAt >= LessonPlayerComponent.youtubeProgressSyncIntervalMs) {
                this.trackVideoProgress();
                this.lastYouTubeProgressSyncAt = now;
            }
        }, LessonPlayerComponent.youtubeLabelUpdateIntervalMs);
    }

    private stopYouTubeProgressTracking(): void {
        if (this.youtubeProgressIntervalId) {
            globalThis.clearInterval(this.youtubeProgressIntervalId);
            this.youtubeProgressIntervalId = null;
        }
    }

    private updateVideoProgressLabel(): void {
        const duration = this.safelyGetYouTubeDuration();
        const restoredCurrentTime = this.tryApplyPendingYouTubeRestore(duration);
        const currentTime = restoredCurrentTime
            ?? this.boundPlaybackTime(this.safelyGetYouTubeCurrentTime(), duration);

        this.lessonProgressLabel = `${this.formatPlaybackClock(currentTime)} / ${this.formatPlaybackClock(duration)}`;
        const playbackProgress = duration > 0
            ? Math.max(0, Math.min(100, (currentTime / duration) * 100))
            : 0;
        this.captureRecentLessonSnapshot({
            currentTimeSeconds: currentTime,
            totalTimeSeconds: duration,
            progressPercentage: playbackProgress,
        });
        this.cdr.markForCheck();
    }

    private initializeLessonProgressLabel(): void {
        const savedProgressPercentage = this.videoProgressService.getSavedProgressPercentage(this.lessonId);
        const boundedProgressPercentage = Math.max(0, Math.min(100, savedProgressPercentage));

        if (this.isVideoContent) {
            const totalSeconds = this.parseDurationLabelToSeconds(
                this.videoContent?.duration ?? this.currentLesson?.duration ?? '',
            );
            this.lessonProgressLabel = this.buildProgressLabel(boundedProgressPercentage, totalSeconds);
            return;
        }

        if (this.isAudioContent) {
            const totalSeconds = this.parseDurationLabelToSeconds(
                this.audioContent?.duration ?? this.currentLesson?.duration ?? '',
            );
            const currentSeconds = totalSeconds > 0
                ? (boundedProgressPercentage / 100) * totalSeconds
                : 0;

            this.audioCurrentSeconds = currentSeconds;
            this.audioDurationSeconds = totalSeconds;
            this.audioProgressPercent = boundedProgressPercentage;
            this.audioPlaybackRate = 1;
            this.audioIsPlaying = false;
            this.audioIsMuted = false;
            this.audioVolume = 1;
            this.lessonProgressLabel = this.buildProgressLabel(boundedProgressPercentage, totalSeconds);
            return;
        }

        this.lessonProgressLabel = '0:00 / 0:00';
    }

    private buildProgressLabel(savedProgressPercentage: number, totalSeconds: number): string {
        const boundedTotalSeconds = Math.max(0, totalSeconds);
        const boundedProgressPercentage = Math.max(0, Math.min(100, savedProgressPercentage));
        const currentSeconds = boundedTotalSeconds > 0
            ? (boundedProgressPercentage / 100) * boundedTotalSeconds
            : 0;

        return `${this.formatPlaybackClock(currentSeconds)} / ${this.formatPlaybackClock(boundedTotalSeconds)}`;
    }

    private parseDurationLabelToSeconds(durationLabel: string): number {
        const normalized = durationLabel.trim().toLowerCase();
        if (normalized.length === 0) {
            return 0;
        }

        if (normalized.includes(':')) {
            const parts = normalized
                .split(':')
                .map((part) => Number.parseInt(part, 10))
                .filter((part) => Number.isFinite(part) && part >= 0);

            if (parts.length === 2) {
                return (parts[0] * 60) + parts[1];
            }

            if (parts.length === 3) {
                return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
            }
        }

        const hourMatch = /([\d.]+)\s*h/.exec(normalized);
        const minuteMatch = /([\d.]+)\s*m/.exec(normalized);
        const secondMatch = /([\d.]+)\s*s/.exec(normalized);

        const hours = hourMatch ? Number.parseFloat(hourMatch[1]) : 0;
        const minutes = minuteMatch ? Number.parseFloat(minuteMatch[1]) : 0;
        const seconds = secondMatch ? Number.parseFloat(secondMatch[1]) : 0;

        const computedSeconds = (hours * 3600) + (minutes * 60) + seconds;
        if (Number.isFinite(computedSeconds) && computedSeconds > 0) {
            return Math.max(0, Math.round(computedSeconds));
        }

        const directMinutes = Number.parseFloat(normalized);
        if (Number.isFinite(directMinutes) && directMinutes >= 0) {
            return Math.round(directMinutes * 60);
        }

        return 0;
    }

    onVideoLoadedMetadata(player: HTMLVideoElement): void {
        if (!this.isVideoContent || this.isYouTubeVideo || !this.courseId || !this.lessonId) {
            return;
        }

        this.restoreMediaProgress(player);
        this.syncNativeVideoProgress(player, false, false);
    }

    onVideoTimeUpdate(player: HTMLVideoElement): void {
        this.syncNativeVideoProgress(player, false, false);
    }

    onVideoPause(player: HTMLVideoElement): void {
        this.syncNativeVideoProgress(player, true, false);
    }

    onVideoEnded(player: HTMLVideoElement): void {
        this.syncNativeVideoProgress(player, true, true);
    }

    private syncNativeVideoProgress(
        player: HTMLVideoElement,
        shouldFlush: boolean,
        markCompleted: boolean,
    ): void {
        if (!this.isVideoContent || this.isYouTubeVideo || !this.courseId || !this.lessonId) {
            return;
        }

        const duration = Number.isFinite(player.duration) ? Math.max(0, player.duration) : 0;
        const current = Number.isFinite(player.currentTime) ? Math.max(0, player.currentTime) : 0;
        const boundedCurrent = duration > 0 ? Math.min(duration, current) : current;
        const rawProgress = duration > 0 ? (boundedCurrent / duration) * 100 : 0;
        const progressPercentage = markCompleted
            ? 100
            : Math.max(0, Math.min(100, rawProgress));

        this.lessonProgressLabel = `${this.formatPlaybackClock(boundedCurrent)} / ${this.formatPlaybackClock(duration)}`;

        const payload = this.buildMediaProgressPayload(progressPercentage);
        if (!payload) {
            return;
        }

        if (shouldFlush || markCompleted) {
            this.videoProgressService.flushProgress(payload);
        } else {
            this.videoProgressService.recordProgress(payload);
        }

        if ((markCompleted || progressPercentage >= LessonPlayerComponent.completionThresholdPercentage)
            && !this.hasSyncedCompletion) {
            this.videoProgressService.syncCompletion(payload);
            this.syncLessonCompletionState();
        }

        this.captureRecentLessonSnapshot({
            currentTimeSeconds: boundedCurrent,
            totalTimeSeconds: duration,
            progressPercentage,
        });
        this.cdr.markForCheck();
    }

    onAudioLoadedMetadata(player: HTMLAudioElement): void {
        if (!this.isAudioContent || !this.courseId || !this.lessonId) {
            return;
        }

        this.restoreMediaProgress(player);
        this.syncAudioProgress(player, false, false);
        this.applyPendingPlaybackSeek();
    }

    onAudioTimeUpdate(player: HTMLAudioElement): void {
        this.syncAudioProgress(player, false, false);
    }

    onAudioPause(player: HTMLAudioElement): void {
        this.syncAudioProgress(player, true, false);
    }

    onAudioEnded(player: HTMLAudioElement): void {
        this.syncAudioProgress(player, true, true);
    }

    onAudioPlay(player: HTMLAudioElement): void {
        this.audioIsPlaying = !player.paused && !player.ended;
        this.audioPlaybackRate = Number.isFinite(player.playbackRate)
            ? Math.max(0.25, player.playbackRate)
            : 1;
        this.cdr.markForCheck();
    }

    onAudioRateChange(player: HTMLAudioElement): void {
        this.audioPlaybackRate = Number.isFinite(player.playbackRate)
            ? Math.max(0.25, player.playbackRate)
            : 1;
        this.cdr.markForCheck();
    }

    onAudioVolumeChange(player: HTMLAudioElement): void {
        this.audioVolume = Number.isFinite(player.volume)
            ? Math.max(0, Math.min(1, player.volume))
            : 1;
        this.audioIsMuted = player.muted || this.audioVolume <= 0;
        this.cdr.markForCheck();
    }

    toggleAudioPlayback(): void {
        const audioPlayer = this.getAudioElement();
        if (!audioPlayer) {
            return;
        }

        if (audioPlayer.paused || audioPlayer.ended) {
            void audioPlayer.play().catch(() => void 0);
            return;
        }

        audioPlayer.pause();
    }

    seekAudioBy(deltaSeconds: number): void {
        const audioPlayer = this.getAudioElement();
        if (!audioPlayer) {
            return;
        }

        const duration = Number.isFinite(audioPlayer.duration)
            ? Math.max(0, audioPlayer.duration)
            : this.audioDurationSeconds;
        const currentTime = Number.isFinite(audioPlayer.currentTime)
            ? Math.max(0, audioPlayer.currentTime)
            : 0;
        const nextTime = Math.max(0, Math.min(duration, currentTime + deltaSeconds));

        audioPlayer.currentTime = nextTime;
        this.syncAudioProgress(audioPlayer, false, false);
    }

    toggleAudioPlaybackRate(): void {
        const audioPlayer = this.getAudioElement();
        if (!audioPlayer) {
            return;
        }

        const currentIndex = this.audioPlaybackRateOptions.findIndex(
            (rate) => Math.abs(rate - audioPlayer.playbackRate) < 0.01,
        );
        const normalizedIndex = Math.max(currentIndex, 0);
        const nextIndex = (normalizedIndex + 1) % this.audioPlaybackRateOptions.length;
        const nextRate = this.audioPlaybackRateOptions[nextIndex];

        audioPlayer.playbackRate = nextRate;
        this.audioPlaybackRate = nextRate;
        this.cdr.markForCheck();
    }

    onAudioProgressInput(event: Event): void {
        const audioPlayer = this.getAudioElement();
        if (!audioPlayer) {
            return;
        }

        const inputElement = event.target;
        if (!(inputElement instanceof HTMLInputElement)) {
            return;
        }

        const nextProgressPercent = Number.parseFloat(inputElement.value);
        if (!Number.isFinite(nextProgressPercent)) {
            return;
        }

        const duration = Number.isFinite(audioPlayer.duration)
            ? Math.max(0, audioPlayer.duration)
            : this.audioDurationSeconds;
        if (duration <= 0) {
            return;
        }

        const boundedProgressPercent = Math.max(0, Math.min(100, nextProgressPercent));
        audioPlayer.currentTime = (boundedProgressPercent / 100) * duration;
        this.syncAudioProgress(audioPlayer, false, false);
    }

    toggleAudioMute(): void {
        const audioPlayer = this.getAudioElement();
        if (!audioPlayer) {
            return;
        }

        audioPlayer.muted = !audioPlayer.muted;
        this.audioIsMuted = audioPlayer.muted;
        this.audioVolume = Number.isFinite(audioPlayer.volume)
            ? Math.max(0, Math.min(1, audioPlayer.volume))
            : this.audioVolume;
        this.cdr.markForCheck();
    }

    private syncAudioProgress(
        player: HTMLAudioElement,
        shouldFlush: boolean,
        markCompleted: boolean,
    ): void {
        if (!this.isAudioContent || !this.courseId || !this.lessonId) {
            return;
        }

        const duration = Number.isFinite(player.duration) ? Math.max(0, player.duration) : 0;
        const current = Number.isFinite(player.currentTime) ? Math.max(0, player.currentTime) : 0;
        const boundedCurrent = duration > 0 ? Math.min(duration, current) : current;
        const rawProgress = duration > 0 ? (boundedCurrent / duration) * 100 : 0;
        const progressPercentage = markCompleted
            ? 100
            : Math.max(0, Math.min(100, rawProgress));

        this.audioCurrentSeconds = boundedCurrent;
        this.audioDurationSeconds = duration;
        this.audioProgressPercent = progressPercentage;
        this.audioIsPlaying = !player.paused && !player.ended;
        this.audioPlaybackRate = Number.isFinite(player.playbackRate)
            ? Math.max(0.25, player.playbackRate)
            : this.audioPlaybackRate;
        this.audioVolume = Number.isFinite(player.volume)
            ? Math.max(0, Math.min(1, player.volume))
            : this.audioVolume;
        this.audioIsMuted = player.muted || this.audioVolume <= 0;
        this.lessonProgressLabel = `${this.formatPlaybackClock(boundedCurrent)} / ${this.formatPlaybackClock(duration)}`;

        const payload = this.buildMediaProgressPayload(progressPercentage);
        if (!payload) {
            return;
        }

        if (shouldFlush || markCompleted) {
            this.videoProgressService.flushProgress(payload);
        } else {
            this.videoProgressService.recordProgress(payload);
        }

        if ((markCompleted || progressPercentage >= LessonPlayerComponent.completionThresholdPercentage)
            && !this.hasSyncedCompletion) {
            this.videoProgressService.syncCompletion(payload);
            this.syncLessonCompletionState();
        }

        this.captureRecentLessonSnapshot({
            currentTimeSeconds: boundedCurrent,
            totalTimeSeconds: duration,
            progressPercentage,
        });
        this.cdr.markForCheck();
    }

    private restoreMediaProgress(player: HTMLMediaElement): void {
        const duration = Number.isFinite(player.duration) ? Math.max(0, player.duration) : 0;
        const restoredPositionSeconds = this.resolveRestoredPlaybackPosition(duration);
        if (restoredPositionSeconds === null) {
            return;
        }

        player.currentTime = restoredPositionSeconds;
    }

    private resolveRestoredPlaybackPosition(durationSeconds: number): number | null {
        const savedProgressPercentage = this.videoProgressService.getSavedProgressPercentage(this.lessonId);
        if (savedProgressPercentage <= 0 || durationSeconds <= 0) {
            return null;
        }

        const restoredPositionSeconds = (savedProgressPercentage / 100) * durationSeconds;
        return Math.max(0, Math.min(durationSeconds, restoredPositionSeconds));
    }

    private buildMediaProgressPayload(videoProgressPercentage: number): {
        courseId: string;
        lessonId: string;
        videoProgressPercentage: number;
    } | null {
        if (!this.courseId || !this.lessonId) {
            return null;
        }

        return {
            courseId: this.courseId,
            lessonId: this.lessonId,
            videoProgressPercentage,
        };
    }

    private trackVideoProgress(): void {
        const payload = this.buildVideoProgressPayload();
        if (!payload) {
            return;
        }

        this.videoProgressService.recordProgress(payload);

        if (
            payload.videoProgressPercentage >= LessonPlayerComponent.completionThresholdPercentage
            && !this.hasSyncedCompletion
        ) {
            this.videoProgressService.syncCompletion(payload);
            this.syncLessonCompletionState();
        }
    }

    private restorePlaybackProgress(): void {
        if (!this.youtubePlayer || !this.lessonId) {
            return;
        }

        const savedProgressPercentage = this.videoProgressService.getSavedProgressPercentage(this.lessonId);
        const boundedProgressPercentage = Math.max(0, Math.min(100, savedProgressPercentage));
        if (boundedProgressPercentage <= 0) {
            this.pendingYouTubeRestorePercentage = null;
            return;
        }

        this.pendingYouTubeRestorePercentage = boundedProgressPercentage;
        this.tryApplyPendingYouTubeRestore(this.safelyGetYouTubeDuration());
    }

    private tryApplyPendingYouTubeRestore(duration: number): number | null {
        if (!this.youtubePlayer || this.pendingYouTubeRestorePercentage === null) {
            return null;
        }

        if (!Number.isFinite(duration) || duration <= 0) {
            return null;
        }

        const savedPositionSeconds = (this.pendingYouTubeRestorePercentage / 100) * duration;
        const seekPosition = Math.max(0, Math.min(duration, savedPositionSeconds));

        if (seekPosition > 0) {
            this.youtubePlayer.seekTo(seekPosition, true);
        }

        this.pendingYouTubeRestorePercentage = null;

        return seekPosition;
    }

    private flushVideoProgress(): void {
        const payload = this.buildVideoProgressPayload();
        if (payload) {
            this.videoProgressService.flushProgress(payload);
            return;
        }

        if (!this.isBrowser || !this.isVideoContent || this.isYouTubeVideo) {
            return;
        }

        const htmlVideo = globalThis.document.querySelector('video.video-player');
        if (htmlVideo instanceof HTMLVideoElement) {
            this.syncNativeVideoProgress(htmlVideo, true, false);
        }
    }

    private syncLessonCompletionState(): void {
        if (this.hasSyncedCompletion) {
            return;
        }

        this.hasSyncedCompletion = true;
        this.videoProgressService.markLessonCompleted(this.lessonId);

        this.academyProgressService
            .markLessonCompleted(this.lessonId, this.courseId)
            .pipe(takeUntil(this.destroy$))
            .subscribe();
    }

    private buildVideoProgressPayload(): {
        courseId: string;
        lessonId: string;
        videoProgressPercentage: number;
    } | null {
        if (!this.courseId || !this.lessonId) {
            return null;
        }

        const duration = this.safelyGetYouTubeDuration();
        if (duration <= 0) {
            return null;
        }

        const restoredCurrentTime = this.tryApplyPendingYouTubeRestore(duration);
        if (this.pendingYouTubeRestorePercentage !== null) {
            return null;
        }

        const currentTime = restoredCurrentTime
            ?? this.boundPlaybackTime(this.safelyGetYouTubeCurrentTime(), duration);
        const rawProgress = (currentTime / duration) * 100;
        const videoProgressPercentage = Number.isFinite(rawProgress)
            ? Math.max(0, Math.min(100, rawProgress))
            : 0;

        return {
            courseId: this.courseId,
            lessonId: this.lessonId,
            videoProgressPercentage,
        };
    }

    private safelyGetYouTubeCurrentTime(): number {
        if (!this.youtubePlayer) {
            return 0;
        }

        try {
            const value = this.youtubePlayer.getCurrentTime();
            return Number.isFinite(value) ? Math.max(0, value) : 0;
        } catch {
            return 0;
        }
    }

    private safelyGetYouTubeDuration(): number {
        if (!this.youtubePlayer) {
            return 0;
        }

        try {
            const value = this.youtubePlayer.getDuration();
            return Number.isFinite(value) ? Math.max(0, value) : 0;
        } catch {
            return 0;
        }
    }

    private boundPlaybackTime(rawCurrentTime: number, duration: number): number {
        const boundedCurrentTime = Number.isFinite(rawCurrentTime)
            ? Math.max(0, rawCurrentTime)
            : 0;

        if (!Number.isFinite(duration) || duration <= 0) {
            return boundedCurrentTime;
        }

        return Math.min(duration, boundedCurrentTime);
    }

    private formatPlaybackClock(totalSeconds: number): string {
        const safeSeconds = Math.max(0, Math.floor(totalSeconds));
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        const seconds = safeSeconds % 60;

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    private resolveCurrentLessonTimestampSeconds(): number {
        if (this.isVideoContent) {
            const youtubeSeconds = this.safelyGetYouTubeCurrentTime();
            if (youtubeSeconds > 0) {
                return Math.floor(youtubeSeconds);
            }

            if (this.isBrowser) {
                const htmlVideo = globalThis.document.querySelector('video.video-player');
                if (htmlVideo instanceof HTMLVideoElement && Number.isFinite(htmlVideo.currentTime)) {
                    return Math.max(0, Math.floor(htmlVideo.currentTime));
                }
            }

            return 0;
        }

        if (this.isAudioContent && this.isBrowser) {
            const audioElement = this.getAudioElement();
            if (audioElement && Number.isFinite(audioElement.currentTime)) {
                return Math.max(0, Math.floor(audioElement.currentTime));
            }
        }

        return 0;
    }

    private seekPlaybackTo(progressSeconds: number): boolean {
        const safeTarget = Math.max(0, Math.floor(progressSeconds));

        if (this.isYouTubeVideo && this.youtubePlayer) {
            this.youtubePlayer.seekTo(safeTarget, true);
            this.updateVideoProgressLabel();
            return true;
        }

        if (this.isAudioContent && this.isBrowser) {
            const audioElement = this.getAudioElement();
            if (audioElement) {
                audioElement.currentTime = safeTarget;
                this.syncAudioProgress(audioElement, false, false);
                return true;
            }

            return false;
        }

        if (!this.isBrowser || !this.isVideoContent) {
            return false;
        }

        const htmlVideo = globalThis.document.querySelector('video.video-player');
        if (htmlVideo instanceof HTMLVideoElement) {
            htmlVideo.currentTime = safeTarget;
            this.syncNativeVideoProgress(htmlVideo, false, false);
            return true;
        }

        return false;
    }

    private applyPendingPlaybackSeek(): void {
        if (this.pendingSeekSeconds === null) {
            return;
        }

        const seekApplied = this.seekPlaybackTo(this.pendingSeekSeconds);
        if (seekApplied) {
            this.pendingSeekSeconds = null;
        }
    }

    private parseSeekQueryParam(rawValue: string | null): number | null {
        if (!rawValue || rawValue.trim().length === 0) {
            return null;
        }

        const parsedValue = Number.parseFloat(rawValue);
        if (!Number.isFinite(parsedValue) || parsedValue < 0) {
            return null;
        }

        return Math.floor(parsedValue);
    }

    private scrollToMediaSection(): void {
        if (!this.isBrowser) {
            return;
        }

        const mediaElement = this.mediaContainer()?.nativeElement;
        if (mediaElement) {
            mediaElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        globalThis.scrollTo({ top: 0, behavior: 'smooth' });
    }

    private getAudioElement(): HTMLAudioElement | null {
        return this.audioElementRef()?.nativeElement ?? null;
    }

    private toTimestampMillis(value: string): number {
        const parsed = new Date(value).getTime();
        return Number.isFinite(parsed) ? parsed : 0;
    }

    private captureRecentLessonSnapshot(snapshot?: {
        currentTimeSeconds?: number;
        totalTimeSeconds?: number;
        progressPercentage?: number;
    }): void {
        if (!this.courseId || !this.lessonId) {
            return;
        }

        this.academyProgressService.rememberRecentLessonVisit({
            courseId: this.courseId,
            lessonId: this.lessonId,
            lessonType: this.currentLesson?.type,
            lessonNumber: this.currentLesson?.order,
            lessonTitle: this.currentLesson?.title,
            currentTimeSeconds: snapshot?.currentTimeSeconds,
            totalTimeSeconds: snapshot?.totalTimeSeconds,
            progressPercentage: snapshot?.progressPercentage,
        });
    }

    private teardownYouTubeIntegration(emitFinalProgress = true): void {
        if (emitFinalProgress) {
            this.flushVideoProgress();
        }

        this.stopYouTubeProgressTracking();
        if (this.isBrowser) {
            globalThis.removeEventListener('beforeunload', this.flushProgressOnUnload);
        }

        this.youtubePlayerService.destroyPlayer(this.youtubePlayer);
        this.youtubePlayer = null;
    }

    private buildLessonHtmlForPdf(): string {
        const descriptionHtml = this.lessonContent?.description
            ? `<p>${this.escapeHtml(this.lessonContent.description)}</p>`
            : '';

        if (this.isArticleContent && this.articleContent) {
            const renderedSectionsHtml = this.getRenderedArticleSectionsHtmlForPdf();
            if (renderedSectionsHtml) {
                return `${descriptionHtml}${renderedSectionsHtml}`;
            }

            const sections = this.articleContent.sections
                .map((section) => {
                    const header = section.header
                        ? `<h2 style="font-size:22px;line-height:1.4;margin:20px 0 10px;">${this.escapeHtml(section.header)}</h2>`
                        : '';
                    const content = this.normalizeHtmlMediaSources(section.content);
                    return `${header}<div>${content}</div>`;
                })
                .join('');

            return `${descriptionHtml}${sections}`;
        }

        if (this.isIntroContent && this.introContent) {
            const objectivesHtml = this.introContent.objectives.length > 0
                ? `<ul>${this.introContent.objectives
                    .map((objective) => `<li>${this.escapeHtml(objective)}</li>`)
                    .join('')}</ul>`
                : '';

            const overviewHtml = this.introContent.courseOverview
                ? `<p>${this.escapeHtml(this.introContent.courseOverview)}</p>`
                : '';

            return `${descriptionHtml}${overviewHtml}${objectivesHtml}`;
        }

        if (this.isVideoContent && this.videoContent?.videoUrl) {
            const videoUrl = this.escapeHtml(this.videoContent.videoUrl);
            return `${descriptionHtml}<p><strong>Video URL:</strong> <a href="${videoUrl}" target="_blank" rel="noopener noreferrer">${videoUrl}</a></p>`;
        }

        if (this.isAudioContent && this.audioContent?.transcript) {
            return `${descriptionHtml}<div>${this.escapeHtml(this.audioContent.transcript).replaceAll('\n', '<br/>')}</div>`;
        }

        return descriptionHtml;
    }

    private getRenderedArticleSectionsHtmlForPdf(): string | null {
        if (!this.isBrowser || !this.isArticleContent) {
            return null;
        }

        const sectionElements = Array.from(globalThis.document.querySelectorAll('.article-section'));
        if (sectionElements.length === 0) {
            return null;
        }

        const sectionsHtml = sectionElements
            .map((sectionElement) => {
                const sectionHost = sectionElement as HTMLElement;
                const headerNode = sectionHost.querySelector('.section-header');
                const renderedArticleNode = sectionHost.querySelector('.ProseMirror');

                const headerHtml = headerNode instanceof HTMLElement ? headerNode.outerHTML : '';
                const contentHtml = renderedArticleNode instanceof HTMLElement
                    ? this.normalizeHtmlMediaSources(`<div class="ProseMirror">${renderedArticleNode.innerHTML}</div>`)
                    : this.normalizeHtmlMediaSources(sectionHost.innerHTML);

                return `<section class="pdf-article-section">${headerHtml}${contentHtml}</section>`;
            })
            .join('');

        return sectionsHtml.length > 0 ? sectionsHtml : null;
    }

    private getPdfRichTextStyles(): string {
        return `
                    .pdf-export-root {
                        font-family: Arial, sans-serif;
                        color: #111827;
                        line-height: 1.65;
                    }

                    .pdf-export-root .pdf-export-content,
                    .pdf-export-root .ProseMirror {
                        font-size: 16px;
                        line-height: 1.75;
                    }

                    .pdf-export-root :where(p, div) {
                        margin: 0 0 0.9rem;
                    }

                    .pdf-export-root :where(h1, h2, h3, h4, h5, h6) {
                        font-weight: 700;
                        line-height: 1.35;
                        margin: 1rem 0 0.6rem;
                    }

                    .pdf-export-root ul {
                        list-style: disc;
                        padding-inline-start: 1.5rem;
                        margin: 0 0 0.9rem;
                    }

                    .pdf-export-root ul ul {
                        list-style: circle;
                    }

                    .pdf-export-root ul ul ul {
                        list-style: square;
                    }

                    .pdf-export-root ol {
                        list-style: decimal;
                        padding-inline-start: 1.5rem;
                        margin: 0 0 0.9rem;
                    }

                    .pdf-export-root li {
                        margin: 0.2rem 0;
                    }

                    .pdf-export-root blockquote {
                        border-inline-start: 3px solid #156b40;
                        margin: 0.8rem 0;
                        padding-inline-start: 0.75rem;
                        color: #4b5563;
                    }

                    .pdf-export-root a {
                        color: #156b40;
                        text-decoration: underline;
                        text-underline-offset: 2px;
                    }

                    .pdf-export-root img {
                        display: block;
                        max-width: 100% !important;
                        height: auto !important;
                        margin: 0.75rem auto;
                        border-radius: 8px;
                    }
                `;
    }

    private normalizeHtmlMediaSources(html: string): string {
        const parser = new DOMParser();
        const documentNode = parser.parseFromString(`<div id="pdf-lesson-root">${html}</div>`, 'text/html');
        const root = documentNode.body.querySelector('#pdf-lesson-root');
        if (!root) {
            return html;
        }

        const images = Array.from(root.querySelectorAll('img'));
        for (const image of images) {
            const srcCandidate = (image.getAttribute('src') ?? image.dataset['src'] ?? '').trim();
            if (!srcCandidate) {
                continue;
            }

            const normalizedSrc = this.isInlineImageSource(srcCandidate)
                ? srcCandidate
                : (toApiMediaUrl(srcCandidate) ?? srcCandidate);

            image.setAttribute('src', normalizedSrc);
            image.removeAttribute('srcset');
            image.removeAttribute('sizes');
            image.setAttribute('loading', 'eager');
            image.style.maxWidth = '100%';
            image.style.height = 'auto';
            image.style.display = 'block';
            image.style.margin = '12px 0';
        }

        return root.innerHTML;
    }

    private async inlineContainerImages(container: HTMLElement): Promise<ImageInliningReport> {
        const images = Array.from(container.querySelectorAll('img'));
        const report: ImageInliningReport = {
            total: images.length,
            inlined: 0,
            unresolved: 0,
            unresolvedCrossOrigin: 0,
        };

        if (images.length === 0) {
            return report;
        }

        await Promise.all(
            images.map(async (image) => {
                const source = (image.getAttribute('src') ?? '').trim();
                if (!source || this.isInlineImageSource(source)) {
                    if (source) {
                        report.inlined += 1;
                    }
                    return;
                }

                const normalizedSource = toApiMediaUrl(source) ?? source;
                const dataUrl = await this.resolveImageDataUrl(normalizedSource);
                if (dataUrl) {
                    image.setAttribute('src', dataUrl);
                    report.inlined += 1;
                    return;
                }

                image.setAttribute('crossorigin', 'anonymous');

                if (this.isCrossOriginSource(normalizedSource)) {
                    report.unresolvedCrossOrigin += 1;
                }

                report.unresolved += 1;
                image.setAttribute('src', normalizedSource);
            }),
        );

        return report;
    }

    private async resolveImageDataUrl(source: string): Promise<string | null> {
        const authToken = this.readAccessTokenFromMemory();
        const requestOptions: RequestInit[] = authToken
            ? [
                {
                    mode: 'cors',
                    cache: 'force-cache',
                    credentials: 'include',
                },
                {
                    mode: 'cors',
                    cache: 'force-cache',
                    credentials: 'include',
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                },
                {
                    mode: 'cors',
                    cache: 'force-cache',
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                },
            ]
            : [
                {
                    mode: 'cors',
                    cache: 'force-cache',
                    credentials: 'include',
                },
            ];

        for (const options of requestOptions) {
            try {
                const response = await globalThis.fetch(source, options);
                if (!response.ok) {
                    continue;
                }

                const blob = await response.blob();
                if (blob.size === 0) {
                    continue;
                }

                return await this.convertBlobToDataUrl(blob);
            } catch {
                continue;
            }
        }

        return null;
    }

    private readAccessTokenFromMemory(): string | null {
        const accessToken = this.tokenService.accessToken();
        return accessToken && accessToken.trim().length > 0 ? accessToken : null;
    }

    private isCrossOriginSource(source: string): boolean {
        try {
            const sourceUrl = new URL(source, globalThis.location.href);
            return sourceUrl.origin !== globalThis.location.origin;
        } catch {
            return false;
        }
    }

    private openPrintFallbackWindow(titleText: string, contentHtml: string, richTextStyles: string): void {
        const printWindow = globalThis.open('', '_blank');
        if (!printWindow) {
            return;
        }

        const printDocument = printWindow.document;
        printDocument.title = this.escapeHtml(titleText);

        while (printDocument.head.firstChild) {
            printDocument.head.firstChild.remove();
        }

        while (printDocument.body.firstChild) {
            printDocument.body.firstChild.remove();
        }

        const style = printDocument.createElement('style');
        style.textContent = `
                    @page { size: A4; margin: 16mm; }
                    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.65; }
                    .pdf-export-content { font-size: 16px; line-height: 1.75; }
                    ${richTextStyles}
                `;
        printDocument.head.appendChild(style);

        const title = printDocument.createElement('h1');
        title.style.fontSize = '28px';
        title.style.lineHeight = '1.3';
        title.style.margin = '0 0 16px';
        title.style.color = '#111827';
        title.textContent = titleText;

        const content = printDocument.createElement('div');
        content.className = 'pdf-export-content';
        content.innerHTML = contentHtml;

        printDocument.body.appendChild(title);
        printDocument.body.appendChild(content);

        printWindow.focus();
        globalThis.setTimeout(() => {
            printWindow.print();
        }, 350);
    }

    private isInlineImageSource(value: string): boolean {
        return value.startsWith('data:') || value.startsWith('blob:');
    }

    private convertBlobToDataUrl(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                    return;
                }

                reject(new Error('Failed to convert image blob to data URL.'));
            };
            reader.onerror = () => {
                reject(reader.error ?? new Error('Unable to read image blob.'));
            };
            reader.readAsDataURL(blob);
        });
    }

    private async waitForImages(container: HTMLElement): Promise<void> {
        const images = Array.from(container.querySelectorAll('img'));
        if (images.length === 0) {
            return;
        }

        await Promise.all(
            images.map(
                (image) =>
                    new Promise<void>((resolve) => {
                        if (image.complete) {
                            resolve();
                            return;
                        }

                        image.addEventListener('load', () => resolve(), { once: true });
                        image.addEventListener('error', () => resolve(), { once: true });
                    }),
            ),
        );
    }

    private getYouTubeVideoId(urlValue: string): string | null {
        const raw = urlValue.trim();
        if (!raw) {
            return null;
        }

        const directIdMatch = /^[a-zA-Z0-9_-]{11}$/.exec(raw);
        if (directIdMatch?.[0]) {
            return directIdMatch[0];
        }

        const parsedUrl = this.tryParseUrl(raw);
        if (!parsedUrl) {
            return null;
        }

        return this.getYouTubeVideoIdFromUrl(parsedUrl);
    }

    private isDirectVideoFileUrl(value: string): boolean {
        const raw = value.trim().toLowerCase();
        if (!raw) {
            return false;
        }

        return /\.(mp4|webm|ogg|mov|m4v|m3u8)(\?.*)?$/.test(raw);
    }

    private tryParseUrl(raw: string): URL | null {
        try {
            return new URL(raw);
        } catch {
            return null;
        }
    }

    private getYouTubeVideoIdFromUrl(url: URL): string | null {
        const host = url.hostname.replace(/^www\./, '');

        if (host === 'youtu.be') {
            return this.toCanonicalYouTubeId(url.pathname.split('/').find(Boolean) ?? null);
        }

        const isYouTubeHost = host === 'youtube.com'
            || host === 'm.youtube.com'
            || host === 'youtube-nocookie.com';
        if (!isYouTubeHost) {
            return null;
        }

        const pathMatchId = this.extractYouTubePathVideoId(url.pathname);
        if (pathMatchId) {
            return pathMatchId;
        }

        const fromQuery = url.searchParams.get('v');
        return this.toCanonicalYouTubeId(fromQuery);
    }

    private extractYouTubePathVideoId(pathname: string): string | null {
        const supportedPrefixes = ['/embed/', '/live/', '/shorts/'];
        for (const prefix of supportedPrefixes) {
            if (!pathname.startsWith(prefix)) {
                continue;
            }

            const candidateId = pathname.slice(prefix.length).split('/')[0] ?? null;
            return this.toCanonicalYouTubeId(candidateId);
        }

        return null;
    }

    private toCanonicalYouTubeId(candidate: string | null): string | null {
        if (!candidate || candidate.length < 11) {
            return null;
        }

        return candidate.slice(0, 11);
    }

    private escapeHtml(value: string): string {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    private resolveCourseQuizTitle(
        lessons: Array<AcademyLesson & { progress: LessonProgress }>,
        quizzes: QuizReadDto[],
    ): string {
        const courseQuiz = quizzes.find(
            (quiz) => !quiz.lessonId || (typeof quiz.lessonId === 'string' && quiz.lessonId.trim().length === 0),
        );

        if (typeof courseQuiz?.title === 'string' && courseQuiz.title.trim().length > 0) {
            return courseQuiz.title.trim();
        }

        const explicitQuizLesson = lessons.find((lesson) => lesson.type === 'quiz');
        const lessonQuiz = explicitQuizLesson
            ? quizzes.find(
                (quiz) => quiz.lessonId === explicitQuizLesson.id
                    && typeof quiz.title === 'string'
                    && quiz.title.trim().length > 0,
            )
            : undefined;

        const fallbackQuizTitle = lessonQuiz?.title
            ?? quizzes.find((quiz) => typeof quiz.title === 'string' && quiz.title.trim().length > 0)?.title
            ?? null;

        return typeof fallbackQuizTitle === 'string' && fallbackQuizTitle.trim().length > 0
            ? fallbackQuizTitle.trim()
            : 'Quiz';
    }

    private applyResolvedVideoDuration(content: LessonContent): LessonContent {
        if (!isVideoContent(content)) {
            return content;
        }

        const currentDuration = this.currentLesson?.duration?.trim();
        if (!currentDuration || currentDuration.length === 0) {
            return content;
        }

        return {
            ...content,
            duration: currentDuration,
        };
    }

    private resolveQuizLessonId(
        lessons: Array<AcademyLesson & { progress: LessonProgress }>,
        quizzes: QuizReadDto[],
    ): string | null {
        // First, look for a course quiz (quiz without a specific lessonId)
        const courseQuiz = quizzes.find(
            (quiz) => !quiz.lessonId || (typeof quiz.lessonId === 'string' && quiz.lessonId.trim().length === 0),
        );

        if (courseQuiz) {
            // If there's an explicit quiz lesson, return it to potentially link with that
            const quizLesson = lessons.find((lesson) => lesson.type === 'quiz');
            if (quizLesson) {
                return quizLesson.id;
            }
            // Otherwise, no lesson ID means use default quiz route
            return null;
        }

        // Fall back to lesson quiz
        const explicitQuizLesson = lessons.find((lesson) => lesson.type === 'quiz');
        if (explicitQuizLesson) {
            return explicitQuizLesson.id;
        }

        return quizzes.find(
            (quiz) => typeof quiz.lessonId === 'string' && quiz.lessonId.trim().length > 0,
        )?.lessonId ?? null;
    }

    private stripProgress(lesson: AcademyLesson & { progress: LessonProgress }): AcademyLesson {
        return {
            id: lesson.id,
            courseId: lesson.courseId,
            title: lesson.title,
            duration: lesson.duration,
            videoUrl: lesson.videoUrl,
            type: lesson.type,
            order: lesson.order,
            description: lesson.description,
        };
    }

    private resolveNextLesson(
        lessons: Array<AcademyLesson & { progress: LessonProgress }>,
        lessonId: string,
    ): AcademyLesson | undefined {
        const sorted = [...lessons].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((lesson) => lesson.id === lessonId);
        return index >= 0 && index < sorted.length - 1 ? this.stripProgress(sorted[index + 1]) : undefined;
    }

    private resolvePreviousLesson(
        lessons: Array<AcademyLesson & { progress: LessonProgress }>,
        lessonId: string,
    ): AcademyLesson | undefined {
        const sorted = [...lessons].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((lesson) => lesson.id === lessonId);
        return index > 0 ? this.stripProgress(sorted[index - 1]) : undefined;
    }
}
