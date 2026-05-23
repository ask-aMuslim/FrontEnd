import { ChangeDetectorRef, Component, OnInit, OnDestroy, HostListener, inject, PLATFORM_ID, ElementRef, viewChild } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { takeUntil, catchError, take } from 'rxjs/operators';
import { LessonContentService, LessonNoteItem } from '../../../core/services/lesson-content.service';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { VideoProgressService } from '../../../core/services/video-progress.service';
import {
    YOUTUBE_PLAYER_STATE,
    YouTubePlayer,
    YouTubePlayerService,
    YouTubePlayerState,
} from '../../../core/services/youtube-player.service';
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
    UpdateLessonProgressRequest,
} from '../../../core/models/interfaces/academy-progress.model';
import { LessonPlayerResolvedData } from './lesson-player.resolver';
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

    courseId: string = '';
    lessonId: string = '';

    currentCourse: AcademyCourse | undefined;
    currentLesson: AcademyLesson | undefined;
    nextAcademyLesson: AcademyLesson | undefined;
    previousAcademyLesson: AcademyLesson | undefined;
    courseLessons: Array<AcademyLesson & { progress: LessonProgress }> = [];
    courseQuizzes: QuizReadDto[] = [];

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
    activeNoteMenuId: string | null = null;
    editingNote: LessonNoteItem | null = null;
    previousNotes: LessonNoteItem[] = [];
    notesFilter: 'latest' | 'current-lesson' = 'latest';
    notesSearchQuery: string = '';
    appliedNotesSearchQuery: string = '';

    lessonRating: number = 0;
    feedbackText: string = '';
    feedbackSubmissionMessage: string | null = null;
    feedbackSubmissionStatus: 'success' | 'error' | null = null;
    isSubmittingFeedback = false;
    levelName = '';

    readonly breadcrumbsBase: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];
    readonly youtubePlayerHostElementId = LessonPlayerComponent.youtubePlayerHostElementId;
    readonly mediaContainer = viewChild<ElementRef<HTMLElement>>('lessonMediaContainer');
    readonly audioElementRef = viewChild<ElementRef<HTMLAudioElement>>('audioElement');

    private currentLoadedLessonId: string | null = null;
    private currentLoadedCourseId: string | null = null;

    private readonly destroy$ = new Subject<void>();
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly document = inject(DOCUMENT);
    private readonly tokenService = inject(TokenService);
    private readonly flushProgressOnUnload = () => this.flushVideoProgress();
    private youtubePlayer: YouTubePlayer | null = null;
    private youtubeProgressIntervalId: any = null;
    private hasSyncedCompletion = false;
    private pendingSeekSeconds: number | null = null;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly sanitizer: DomSanitizer,
        private readonly lessonContentService: LessonContentService,
        private readonly academyProgressService: AcademyProgressService,
        private readonly youtubePlayerService: YouTubePlayerService,
        private readonly videoProgressService: VideoProgressService,
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
        const list: AcademyBreadcrumbItem[] = [
            ...this.breadcrumbsBase
        ];
        if (this.levelName) {
            list.push({
                label: this.levelName,
                link: ['/academy'],
            });
        }
        list.push({
            label: this.currentCourse?.title || 'Course',
            link: ['/academy/course', this.courseId],
        });
        return list;
    }

    get currentBreadcrumb(): string {
        return this.lessonContent?.title || this.currentLesson?.title || 'Lesson';
    }

    get currentLessonTitle(): string {
        return this.lessonContent?.title || this.currentLesson?.title || 'this lesson';
    }

    get resolvedCourseDuration(): string {
        const fallbackDuration = '0m';
        return this.academyProgressService.calculateCourseVideoDuration(this.courseLessons, fallbackDuration);
    }

    ngOnInit(): void {
        combineLatest([this.route.paramMap, this.route.queryParamMap, this.route.data])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([params, queryParams, routeData]) => {
                const newCourseId = params.get('courseId') || '';
                const newLessonId = params.get('lessonId') || '';

                if (newCourseId && newLessonId) {
                    const requestedTab = queryParams.get('tab') === 'notes' ? 'notes' : 'overview';
                    const requestedSeekSeconds = this.parseSeekQueryParam(queryParams.get('seek'));

                    const isSameLesson = newLessonId === this.currentLoadedLessonId && newCourseId === this.currentLoadedCourseId;

                    if (!isSameLesson) {
                        this.courseId = newCourseId;
                        this.lessonId = newLessonId;
                        this.currentLoadedCourseId = newCourseId;
                        this.currentLoadedLessonId = newLessonId;

                        this.resetViewStateForRouteChange(requestedTab, requestedSeekSeconds);

                        const resolved = routeData['resolvedData'] as LessonPlayerResolvedData | null;
                        if (resolved?.lessonData.content.id === this.lessonId) {
                            this.applyResolvedLessonData(resolved);
                        } else {
                            this.loadLessonData();
                        }
                    } else {
                        if (requestedTab !== this.activeTab) {
                            this.setActiveTab(requestedTab);
                        }
                        if (requestedSeekSeconds !== null && requestedSeekSeconds !== this.pendingSeekSeconds) {
                            this.pendingSeekSeconds = requestedSeekSeconds;
                            this.applyPendingPlaybackSeek();
                        }
                    }
                }
            });
    }

    ngOnDestroy(): void {
        this.teardownYouTubeIntegration();
        this.destroy$.next();
        this.destroy$.complete();
    }

    private applyResolvedLessonData(resolved: LessonPlayerResolvedData): void {
        const { course, lessonsWithProgress, quizzes, lessonData, notes } = resolved;
        const currentLesson = lessonsWithProgress.find((lesson) => lesson.id === this.lessonId);
        const courseLessonIds = new Set(lessonsWithProgress.map((lesson) => lesson.id));
        const scopedQuizzes = quizzes.filter((quiz) => {
            const lessonId = typeof quiz.lessonId === 'string' ? quiz.lessonId.trim() : '';
            return lessonId.length === 0 || courseLessonIds.has(lessonId);
        });

        this.courseQuizzes = scopedQuizzes;

        if (!currentLesson) {
            this.error = 'Lesson not found';
            this.isLoading = false;
            this.isContentLoading = false;
            this.cdr.detectChanges();
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
        this.levelName = course.stageLabel || '';
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
        this.nextAcademyLesson = this.resolveNextLesson(lessonsWithProgress, this.lessonId);
        this.previousAcademyLesson = this.resolvePreviousLesson(lessonsWithProgress, this.lessonId);
        this.isIntroLesson = this.currentLesson.type === 'intro';

        const enrichedContent = this.applyResolvedVideoDuration(lessonData.content);
        this.lessonData = lessonData;
        this.lessonContent = enrichedContent;
        this.nextLesson = lessonData.nextLesson;
        this.previousLesson = lessonData.previousLesson;
        this.hasSyncedCompletion = this.videoProgressService.isLessonCompleted(this.lessonId);
        this.initializeYouTubeIntegration();
        this.applyPendingPlaybackSeek();

        this.previousNotes = notes;
        this.captureRecentLessonSnapshot();

        this.isLoading = false;
        this.isContentLoading = false;
        this.cdr.detectChanges();

        const initialProgressRequest = this.buildInitialLessonProgressRequest();
        if (initialProgressRequest) {
            this.academyProgressService.updateLessonProgress(initialProgressRequest)
                .pipe(takeUntil(this.destroy$))
                .subscribe();
        }
    }

    private loadLessonData(): void {
        this.isLoading = true;
        this.isContentLoading = true;
        this.error = null;

        combineLatest([
            this.academyProgressService.getCourseByIdDirect(this.courseId),
            this.academyProgressService.getCourseQuizzesDirect(this.courseId),
            this.lessonContentService.getLesson(this.lessonId),
            this.lessonContentService.getLessonNotes(this.lessonId).pipe(catchError(() => of([])))
        ])
            .pipe(
                take(1),
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: ([rawCourse, quizzes, lessonData, notes]) => {
                    if (!rawCourse || !lessonData) {
                        this.error = 'Unable to load this lesson right now. Please try again.';
                        this.isLoading = false;
                        this.isContentLoading = false;
                        this.cdr.detectChanges();
                        return;
                    }

                    // Map AcademyCourse
                    const category = (rawCourse.category as any) || 'social-topics';
                    const course: AcademyCourse = {
                        id: rawCourse.id ?? '',
                        stageId: 1,
                        levelId: rawCourse.levelId ?? '',
                        title: rawCourse.title ?? 'Untitled Course',
                        category,
                        categoryLabel: rawCourse.category ? String(rawCourse.category).toUpperCase() : 'Social Topics',
                        lessons: Array.isArray(rawCourse.lessons) ? rawCourse.lessons.length : 0,
                        duration: '0m',
                        thumbnailUrl: rawCourse.thumbnailUrl,
                        description: rawCourse.description,
                        stageLabel: rawCourse.level ?? 'Course',
                    };

                    // Map lessonsWithProgress
                    const rawLessons = Array.isArray(rawCourse.lessons) ? rawCourse.lessons : [];
                    const parseLessonType = (raw: unknown): 'intro' | 'video' | 'article' | 'document' | 'quiz' | 'audio' => {
                        const str = String(raw ?? '').toLowerCase();
                        if (str === '1' || str === 'video') return 'video';
                        if (str === '2' || str === 'article') return 'article';
                        if (str === '3' || str === 'document') return 'document';
                        if (str === '4' || str === 'audio') return 'audio';
                        if (str === '5' || str === 'quiz') return 'quiz';
                        return 'intro';
                    };

                    const lessonsWithProgress = rawLessons
                        .filter((l: any) => l.isPublished !== false)
                        .map((l: any, index: number) => {
                            const lId = l.lessonId ?? l.id ?? '';
                            const lessonType = parseLessonType(l.lessonType ?? l.type);
                            const isCompleted = !!(l.isLessonCompleted ?? l.isCompleted);

                            const academyLesson: AcademyLesson = {
                                id: lId,
                                courseId: this.courseId,
                                title: l.lessonName ?? l.title ?? '',
                                duration: l.lessonDuration ?? l.duration ?? '~5min',
                                type: lessonType,
                                order: index + 1,
                            };

                            const progress: LessonProgress = {
                                lessonId: lId,
                                courseId: this.courseId,
                                status: lId === this.lessonId ? 'current' : (isCompleted ? 'completed' : 'available'),
                                isCompleted,
                            };

                            return {
                                ...academyLesson,
                                progress,
                            };
                        });

                    this.applyResolvedLessonData({
                        course,
                        lessonsWithProgress,
                        quizzes: quizzes || [],
                        lessonData,
                        notes,
                    });
                },
                error: () => {
                    this.error = 'Unable to load this lesson right now. Please try again.';
                    this.isLoading = false;
                    this.isContentLoading = false;
                    this.cdr.detectChanges();
                }
            });
    }

    private resetViewStateForRouteChange(initialTab: LessonPlayerTab = 'overview', pendingSeekSeconds: number | null = null): void {
        this.teardownYouTubeIntegration();
        this.error = null;
        this.lessonData = null;
        this.lessonContent = null;
        this.currentCourse = undefined;
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
        this.hasSyncedCompletion = false;
        this.pendingSeekSeconds = pendingSeekSeconds;
        this.lessonRating = 0;
        this.feedbackText = '';
        this.feedbackSubmissionMessage = null;
        this.feedbackSubmissionStatus = null;
        this.isSubmittingFeedback = false;
        this.audioProgressPercent = 0;
        this.audioPlaybackRate = 1;
        this.audioIsPlaying = false;
        this.audioIsMuted = false;
        this.audioVolume = 1;
        this.audioCurrentSeconds = 0;
        this.audioDurationSeconds = 0;
        this.notesFilter = 'latest';
        this.notesSearchQuery = '';
        this.appliedNotesSearchQuery = '';
        this.activeNoteMenuId = null;
        this.editingNote = null;
    }

    get isIntroContent(): boolean { return this.lessonContent ? isIntroContent(this.lessonContent) : false; }
    get isVideoContent(): boolean { return this.lessonContent ? isVideoContent(this.lessonContent) : false; }
    get isAudioContent(): boolean { return this.lessonContent ? isAudioContent(this.lessonContent) : false; }
    get isArticleContent(): boolean { return this.lessonContent ? isArticleContent(this.lessonContent) : false; }
    get isDocumentContent(): boolean { return this.lessonContent?.type === LessonType.Document; }

    get introContent(): IntroLessonContent | null { return this.isIntroContent ? this.lessonContent as IntroLessonContent : null; }
    get videoContent(): VideoLessonContent | null { return this.isVideoContent ? this.lessonContent as VideoLessonContent : null; }
    get audioContent(): AudioLessonContent | null { return this.isAudioContent ? this.lessonContent as AudioLessonContent : null; }
    get articleContent(): ArticleLessonContent | null { return this.isArticleContent ? this.lessonContent as ArticleLessonContent : null; }

    get audioPlaybackRateLabel(): string {
        if (Number.isInteger(this.audioPlaybackRate)) {
            return `${this.audioPlaybackRate.toFixed(0)}x`;
        }

        return `${this.audioPlaybackRate}x`;
    }

    get documentEmbedUrl(): SafeResourceUrl | null {
        if (!this.isDocumentContent) {
            return null;
        }

        const rawUrl = this.articleContent?.documentUrl?.trim() ?? '';
        if (!rawUrl) {
            return null;
        }

        return this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl);
    }

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

    setActiveTab(tab: LessonPlayerTab): void {
        this.activeTab = tab;
        this.activeNoteMenuId = null;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        if (!this.activeNoteMenuId) {
            return;
        }

        const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
        const clickedInsideMenu = path.some((target) =>
            target instanceof HTMLElement
            && (
                target.classList.contains('note-actions')
                || target.classList.contains('note-menu')
                || target.classList.contains('btn-more')
            ),
        );

        if (!clickedInsideMenu) {
            this.activeNoteMenuId = null;
            this.cdr.detectChanges();
        }
    }

    closeNoteMenu(): void {
        if (!this.activeNoteMenuId) {
            return;
        }

        this.activeNoteMenuId = null;
    }

    toggleNoteMenu(event: MouseEvent, noteId: string): void {
        event.stopPropagation();
        this.activeNoteMenuId = this.activeNoteMenuId === noteId ? null : noteId;
    }

    goToTimestamp(note: LessonNoteItem): void {
        this.closeNoteMenu();
        this.scrollToMediaSection();
        this.seekPlaybackTo(note.progressSeconds);
    }

    editNote(note: LessonNoteItem, event?: Event): void {
        event?.stopPropagation();
        this.activeNoteMenuId = null;
        this.editingNote = note;
        this.noteText = note.text;
        this.cdr.detectChanges();
    }

    cancelNoteEdit(): void {
        if (!this.editingNote) {
            return;
        }

        this.editingNote = null;
        this.noteText = '';
        this.cdr.detectChanges();
    }

    goToNextLesson(): void {
        const nextId = this.nextAcademyLesson?.id || this.nextLesson?.id;
        if (nextId) {
            this.academyProgressService
                .markLessonCompleted(this.lessonId, this.courseId, this.currentLesson?.type)
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
        return this.hasCourseQuiz && this.isLastContentLesson;
    }

    get shouldShowCompletedButton(): boolean {
        return !this.hasCourseQuiz && this.isLastContentLesson;
    }

    get shouldHighlightReadyDividerBeforeQuiz(): boolean {
        return this.shouldShowStartQuizButton;
    }

    onStartQuizClick(): void {
        if (!this.hasCourseQuiz) {
            return;
        }

        const navigateToQuiz = () => {
            if (this.courseQuizLessonId) {
                void this.router.navigate(['/academy/course', this.courseId, 'quiz', this.courseQuizLessonId]);
                return;
            }

            void this.router.navigate(['/academy/course', this.courseId, 'quiz']);
        };

        this.markCurrentLessonCompletedByAction(navigateToQuiz);
    }

    onCompleteLessonClick(): void {
        this.markCurrentLessonCompletedByAction();
    }

    onSave(): void {
        if (this.lessonId) {
            this.lessonContentService.saveLessonProgress(this.lessonId).subscribe();
        }
    }

    onShare(): void {
        const window = this.document.defaultView;
        if (!this.isBrowser || !this.lessonContent || !window) {
            return;
        }

        if (window.navigator.share) {
            window.navigator.share({
                title: this.lessonContent.title,
                text: this.lessonContent.description,
                url: window.location.href
            }).catch(() => void 0);
            return;
        }

        window.navigator.clipboard?.writeText(window.location.href).then(() => void 0);
    }

    async onDownload(): Promise<void> {
        if (!this.isBrowser || !this.lessonContent) {
            return;
        }

        const titleText = this.lessonContent.title || 'Lesson Content';
        const contentHtml = this.buildLessonHtmlForPdf();
        const richTextStyles = this.getPdfRichTextStyles();
        let exportContainer: HTMLDivElement | undefined;

        try {
            const jsPDF = (await import('jspdf')).jsPDF;
            const html2canvas = (await import('html2canvas')).default;
            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            exportContainer = this.document.createElement('div');
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

            this.document.body.appendChild(exportContainer);
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
        const editingNote = this.editingNote;
        const timestampSeconds = editingNote?.progressSeconds ?? this.resolveCurrentLessonTimestampSeconds();

        if (editingNote) {
            this.lessonContentService
                .updateLessonNote(editingNote.id, trimmedNote, timestampSeconds)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (updated) => {
                        if (!updated) {
                            return;
                        }

                        this.previousNotes = this.previousNotes.map((note) =>
                            note.id === editingNote.id
                                ? { ...note, text: trimmedNote }
                                : note,
                        );
                        this.editingNote = null;
                        this.noteText = '';
                        this.activeNoteMenuId = null;
                        this.cdr.detectChanges();
                    },
                    error: () => void 0,
                });
            return;
        }

        this.lessonContentService
            .addLessonNote(this.lessonId, trimmedNote, timestampSeconds)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (createdNote) => {
                    this.previousNotes = [createdNote, ...this.previousNotes];
                    this.noteText = '';
                    this.activeNoteMenuId = null;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.cdr.detectChanges();
                },
            });
    }

    onLessonNoteClick(note: LessonNoteItem): void {
        this.goToTimestamp(note);
    }

    deleteNote(noteId: string): void {
        this.activeNoteMenuId = null;

        this.lessonContentService
            .deleteLessonNote(noteId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (deleted) => {
                    if (deleted) {
                        this.previousNotes = this.previousNotes.filter((note) => note.id !== noteId);
                        if (this.editingNote?.id === noteId) {
                            this.cancelNoteEdit();
                        }
                        if (this.activeNoteMenuId === noteId) {
                            this.activeNoteMenuId = null;
                        }
                        this.cdr.detectChanges();
                    }
                },
            });
    }

    setRating(stars: number): void {
        this.lessonRating = stars;
        this.feedbackSubmissionMessage = null;
        this.feedbackSubmissionStatus = null;
    }

    submitFeedback(): void {
        const trimmedFeedback = this.feedbackText.trim();
        const hasFeedbackPayload = this.lessonRating > 0 || trimmedFeedback.length > 0;

        if (!this.lessonId || this.isSubmittingFeedback || !hasFeedbackPayload) {
            return;
        }

        this.feedbackSubmissionMessage = null;
        this.feedbackSubmissionStatus = null;
        this.isSubmittingFeedback = true;

        this.lessonContentService
            .submitLessonFeedback(this.lessonId, this.lessonRating, trimmedFeedback.length > 0 ? trimmedFeedback : undefined)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (submitted) => {
                    this.isSubmittingFeedback = false;

                    if (submitted) {
                        this.lessonRating = 0;
                        this.feedbackText = '';
                        this.feedbackSubmissionMessage = 'Thank you for your feedback!';
                        this.feedbackSubmissionStatus = 'success';
                    } else {
                        this.feedbackSubmissionMessage = 'Unable to submit feedback right now. Please try again.';
                        this.feedbackSubmissionStatus = 'error';
                    }

                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isSubmittingFeedback = false;
                    this.feedbackSubmissionMessage = 'Unable to submit feedback right now. Please try again.';
                    this.feedbackSubmissionStatus = 'error';
                    this.cdr.detectChanges();
                },
            });
    }

    get breadcrumbItems(): string[] {
        const courseTitle = this.currentCourse?.title || 'Course';
        const lessonTitle = this.lessonContent?.title || this.currentLesson?.title || 'Loading...';
        return ['Academy', courseTitle, lessonTitle];
    }

    get courseInfo(): { stage: number; code: string; title: string; stats: string } {
        const stage = this.currentCourse?.stageId || 0;
        const title = this.currentCourse?.title || '';
        const currentOrder = this.currentLessonDisplayOrder ?? 0;
        return {
            stage,
            code: '',
            title,
            stats: `Lesson: ${currentOrder}/${this.totalCourseLessonCount ?? this.courseLessons.length}`
        };
    }

    get currentLessonDisplayOrder(): number | null {
        const orderedContentLessons = this.getOrderedContentLessons();
        if (orderedContentLessons.length === 0) {
            return null;
        }

        const currentLessonIndex = orderedContentLessons.findIndex((lesson) => lesson.id === this.lessonId);
        if (currentLessonIndex >= 0) {
            return currentLessonIndex + 1;
        }

        const metadataOrder = this.lessonData?.metadata?.order;
        if (typeof metadataOrder === 'number' && Number.isFinite(metadataOrder) && metadataOrder > 0) {
            return metadataOrder;
        }

        return null;
    }

    get totalCourseLessonCount(): number | null {
        const orderedContentLessons = this.getOrderedContentLessons();
        if (orderedContentLessons.length > 0) {
            return orderedContentLessons.length;
        }

        return this.courseLessons.length > 0 ? this.courseLessons.length : null;
    }

    get filteredNotes(): LessonNoteItem[] {
        const query = this.appliedNotesSearchQuery.trim().toLowerCase();
        const notesForLesson = [...this.previousNotes].sort(
            (a, b) => this.toTimestampMillis(b.createdAt) - this.toTimestampMillis(a.createdAt),
        );

        if (!query) {
            return notesForLesson;
        }

        return notesForLesson.filter(note => note.text.toLowerCase().includes(query));
    }

    applyNotesSearch(): void {
        this.appliedNotesSearchQuery = this.notesSearchQuery.trim();
        this.cdr.detectChanges();
    }

    clearNotesSearch(): void {
        if (!this.notesSearchQuery && !this.appliedNotesSearchQuery) {
            return;
        }

        this.notesSearchQuery = '';
        this.appliedNotesSearchQuery = '';
        this.cdr.detectChanges();
    }

    private isQuizCompleted(quizId: string): boolean {
        if (!this.isBrowser) return false;
        const key = `quiz_${this.courseId}_${quizId}`;
        const data = this.document.defaultView?.localStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                return !!parsed?.completed && !!parsed?.passed;
            } catch {
                return false;
            }
        }
        return false;
    }

    get sidebarLessons(): AcademySidebarLessonItem[] {
        const lastContentLessonId = this.getLastContentLessonId();

        const mappedLessons = this.courseLessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.type === 'quiz' ? this.courseQuizTitle : lesson.title,
            duration: lesson.type === 'quiz' ? 'Assessment' : lesson.duration,
            type: lesson.type,
            quizLessonId: lesson.type === 'quiz' ? lesson.id : undefined,
            isCompleted: this.isLessonCompleted(lesson),
            isCurrent: this.isLessonCurrent(lesson),
            isLastCourseLesson: false,
            isLocked: this.isLessonPending(lesson),
        }));

        const nonQuiz = mappedLessons.filter((l) => l.type !== 'quiz');

        if (nonQuiz.length > 0) {
            nonQuiz.forEach(l => l.isLastCourseLesson = false);
            nonQuiz[nonQuiz.length - 1].isLastCourseLesson = true;
        }

        const courseQuizItems = this.courseQuizzes.map((q, idx) => ({
            id: `${LessonPlayerComponent.syntheticQuizSidebarIdPrefix}${q.id || this.courseId}`,
            quizLessonId: q.id ?? undefined,
            title: q.title || `Quiz ${idx + 1}`,
            duration: 'Assessment',
            type: 'quiz',
            isCompleted: this.isQuizCompleted(q.id || ''),
            isCurrent: false,
            isLastCourseLesson: false,
            isLocked: false,
        }));

        if (courseQuizItems.length === 0 && this.hasCourseQuiz) {
            courseQuizItems.push({
                id: `${LessonPlayerComponent.syntheticQuizSidebarIdPrefix}${this.courseId}`,
                quizLessonId: this.courseQuizLessonId ?? undefined,
                title: this.courseQuizTitle,
                duration: 'Assessment',
                type: 'quiz',
                isCompleted: false,
                isCurrent: false,
                isLastCourseLesson: false,
                isLocked: false,
            });
        }

        return [...nonQuiz, ...courseQuizItems];
    }

    private getLastContentLessonId(): string | null {
        const nonQuizLessons = this.getOrderedContentLessons();

        const lastLesson = nonQuizLessons.at(-1);
        return lastLesson?.id ?? null;
    }

    private getOrderedContentLessons(): Array<AcademyLesson & { progress: LessonProgress }> {
        return [...this.courseLessons]
            .filter((lesson) => lesson.type !== 'quiz')
            .sort((a, b) => a.order - b.order);
    }

    private get isLastContentLesson(): boolean {
        const lastContentLessonId = this.getLastContentLessonId();
        return !!lastContentLessonId && this.lessonId === lastContentLessonId;
    }

    private requiresExplicitCompletionAction(): boolean {
        return this.isLastContentLesson;
    }

    private markCurrentLessonCompletedByAction(onAfterCompletion?: () => void): void {
        const finalizeCompletion = () => {
            this.markCurrentLessonAsCompletedInUi();
            onAfterCompletion?.();
        };

        if (!this.courseId || !this.lessonId) {
            onAfterCompletion?.();
            return;
        }

        if (this.hasSyncedCompletion) {
            this.academyProgressService
                .markLessonCompleted(this.lessonId, this.courseId, this.currentLesson?.type)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: () => {
                        finalizeCompletion();
                    },
                    error: () => {
                        finalizeCompletion();
                    },
                });
            return;
        }

        this.hasSyncedCompletion = true;
        this.videoProgressService.markLessonCompleted(this.lessonId);

        this.academyProgressService
            .markLessonCompleted(this.lessonId, this.courseId, this.currentLesson?.type)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    finalizeCompletion();
                },
                error: () => {
                    finalizeCompletion();
                },
            });
    }

    private markCurrentLessonAsCompletedInUi(): void {
        this.courseLessons = this.courseLessons.map((lesson) => {
            if (lesson.id !== this.lessonId) {
                return lesson;
            }

            return {
                ...lesson,
                progress: {
                    ...lesson.progress,
                    status: 'completed',
                    isCompleted: true,
                    completedAt: lesson.progress.completedAt ?? new Date().toISOString(),
                },
            };
        });
        this.cdr.detectChanges();
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

        setTimeout(() => {
            const hostElement = this.document.getElementById(this.youtubePlayerHostElementId);
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

                    this.document.defaultView?.addEventListener('beforeunload', this.flushProgressOnUnload);
                    this.cdr.detectChanges();
                })
                .catch(() => {
                    this.teardownYouTubeIntegration(false);
                });
        }, 0);
    }

    private onYouTubePlayerStateChange(state: YouTubePlayerState): void {
        if (state === YOUTUBE_PLAYER_STATE.PAUSED) {
            this.flushVideoProgress();
            return;
        }

        if (state === YOUTUBE_PLAYER_STATE.ENDED) {
            const payload = this.buildVideoProgressPayload();
            if (payload) {
                this.videoProgressService.syncCompletion({
                    ...payload,
                    progressPercentage: 100,
                });
            }
            this.syncLessonCompletionState();
            this.flushVideoProgress();
        }
    }

    private startYouTubeProgressTracking(): void {
        this.stopYouTubeProgressTracking();
        this.updateVideoProgressLabel();

        this.youtubeProgressIntervalId = setInterval(() => {
            this.updateVideoProgressLabel();
            this.trackVideoProgress();
        }, 1000);
    }

    private stopYouTubeProgressTracking(): void {
        if (this.youtubeProgressIntervalId) {
            clearInterval(this.youtubeProgressIntervalId);
            this.youtubeProgressIntervalId = null;
        }
    }

    private updateVideoProgressLabel(): void {
        const duration = this.safelyGetYouTubeDuration();
        const currentTime = this.safelyGetYouTubeCurrentTime();

        this.lessonProgressLabel = `${this.formatPlaybackClock(currentTime)} / ${this.formatPlaybackClock(duration)}`;
        const playbackProgress = duration > 0
            ? Math.max(0, Math.min(100, (currentTime / duration) * 100))
            : 0;
        this.captureRecentLessonSnapshot({
            currentTimeSeconds: currentTime,
            totalTimeSeconds: duration,
            progressPercentage: playbackProgress,
        });
    }

    onVideoLoadedMetadata(player: HTMLVideoElement): void {
        if (!this.isVideoContent || this.isYouTubeVideo || !this.courseId || !this.lessonId) {
            return;
        }

        this.restoreNativeVideoProgress(player);
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
    }

    private restoreNativeVideoProgress(player: HTMLVideoElement): void {
        this.restoreMediaProgress(player);
    }

    onAudioLoadedMetadata(player: HTMLAudioElement): void {
        if (!this.isAudioContent || !this.courseId || !this.lessonId) {
            return;
        }

        this.restoreAudioProgress(player);
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
    }

    onAudioRateChange(player: HTMLAudioElement): void {
        this.audioPlaybackRate = Number.isFinite(player.playbackRate)
            ? Math.max(0.25, player.playbackRate)
            : 1;
    }

    onAudioVolumeChange(player: HTMLAudioElement): void {
        this.audioVolume = Number.isFinite(player.volume)
            ? Math.max(0, Math.min(1, player.volume))
            : 1;
        this.audioIsMuted = player.muted || this.audioVolume <= 0;
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
    }

    private restoreAudioProgress(player: HTMLAudioElement): void {
        this.restoreMediaProgress(player);
    }

    private getAudioElement(): HTMLAudioElement | null {
        return this.audioElementRef()?.nativeElement ?? null;
    }

    private restoreMediaProgress(player: HTMLMediaElement): void {
        const savedProgressPercentage = this.videoProgressService.getSavedProgressPercentage(this.lessonId);
        if (savedProgressPercentage <= 0) {
            return;
        }

        const duration = Number.isFinite(player.duration) ? Math.max(0, player.duration) : 0;
        if (duration <= 0) {
            return;
        }

        const restoredPositionSeconds = (savedProgressPercentage / 100) * duration;
        player.currentTime = Math.max(0, Math.min(duration, restoredPositionSeconds));
    }

    private buildMediaProgressPayload(progressPercentage: number): {
        courseId: string;
        lessonId: string;
        progressPercentage: number;
    } | null {
        if (!this.courseId || !this.lessonId) {
            return null;
        }

        return {
            courseId: this.courseId,
            lessonId: this.lessonId,
            progressPercentage,
        };
    }

    private trackVideoProgress(): void {
        const payload = this.buildVideoProgressPayload();
        if (!payload) {
            return;
        }

        this.videoProgressService.recordProgress(payload);

        if (
            payload.progressPercentage >= LessonPlayerComponent.completionThresholdPercentage
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
        if (savedProgressPercentage <= 0) {
            return;
        }

        const duration = this.safelyGetYouTubeDuration();
        if (duration <= 0) {
            return;
        }

        const savedPositionSeconds = (savedProgressPercentage / 100) * duration;
        const seekPosition = Math.max(0, Math.min(duration, savedPositionSeconds));

        if (seekPosition > 0) {
            this.youtubePlayer.seekTo(seekPosition, true);
        }
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

        const htmlVideo = this.document.querySelector('video.video-player');
        if (htmlVideo instanceof HTMLVideoElement) {
            this.syncNativeVideoProgress(htmlVideo, true, false);
        }
    }

    private syncLessonCompletionState(): void {
        if (this.hasSyncedCompletion) {
            return;
        }

        if (this.requiresExplicitCompletionAction()) {
            return;
        }

        this.hasSyncedCompletion = true;
        this.videoProgressService.markLessonCompleted(this.lessonId);

        this.academyProgressService
            .markLessonCompleted(this.lessonId, this.courseId, this.currentLesson?.type)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.markCurrentLessonAsCompletedInUi();
                },
                error: () => void 0,
            });
    }

    private buildVideoProgressPayload(): {
        courseId: string;
        lessonId: string;
        progressPercentage: number;
    } | null {
        if (!this.courseId || !this.lessonId) {
            return null;
        }

        const duration = this.safelyGetYouTubeDuration();
        if (duration <= 0) {
            return null;
        }

        const currentTime = this.safelyGetYouTubeCurrentTime();
        const rawProgress = (currentTime / duration) * 100;
        const progressPercentage = Number.isFinite(rawProgress)
            ? Math.max(0, Math.min(100, rawProgress))
            : 0;

        return {
            courseId: this.courseId,
            lessonId: this.lessonId,
            progressPercentage,
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
                const htmlVideo = this.document.querySelector('video.video-player');
                if (htmlVideo instanceof HTMLVideoElement && Number.isFinite(htmlVideo.currentTime)) {
                    return Math.max(0, Math.floor(htmlVideo.currentTime));
                }
            }

            return 0;
        }

        if (this.isAudioContent && this.isBrowser) {
            const audioElement = this.document.querySelector('.audio-player');
            if (audioElement instanceof HTMLAudioElement && Number.isFinite(audioElement.currentTime)) {
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
            const audioElement = this.document.querySelector('.audio-player');
            if (audioElement instanceof HTMLAudioElement) {
                audioElement.currentTime = safeTarget;
                this.syncAudioProgress(audioElement, false, false);
                return true;
            }

            return false;
        }

        if (!this.isBrowser || !this.isVideoContent) {
            return false;
        }

        const htmlVideo = this.document.querySelector('video.video-player');
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
            currentTimeSeconds: snapshot?.currentTimeSeconds,
            totalTimeSeconds: snapshot?.totalTimeSeconds,
            progressPercentage: snapshot?.progressPercentage,
        });
    }

    private buildInitialLessonProgressRequest(): UpdateLessonProgressRequest | null {
        if (!this.courseId || !this.lessonId) {
            return null;
        }

        const lessonType = this.currentLesson?.type;
        const isReadLesson = lessonType === 'article' || lessonType === 'document';

        return {
            courseId: this.courseId,
            lessonId: this.lessonId,
            lessonType,
            ...(isReadLesson ? { markAsRead: true } : {}),
        };
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
        const orderedQuizLessons = [...lessons]
            .filter((lesson) => lesson.type === 'quiz')
            .sort((a, b) => a.order - b.order);

        const courseQuiz = quizzes.find(
            (quiz) => !quiz.lessonId || (typeof quiz.lessonId === 'string' && quiz.lessonId.trim().length === 0),
        );

        if (typeof courseQuiz?.title === 'string' && courseQuiz.title.trim().length > 0) {
            return courseQuiz.title.trim();
        }

        const explicitQuizLesson = orderedQuizLessons[0];
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
        const orderedQuizLessons = [...lessons]
            .filter((lesson) => lesson.type === 'quiz')
            .sort((a, b) => a.order - b.order);

        // First, look for a course quiz (quiz without a specific lessonId)
        const courseQuiz = quizzes.find(
            (quiz) => !quiz.lessonId || (typeof quiz.lessonId === 'string' && quiz.lessonId.trim().length === 0),
        );

        if (courseQuiz) {
            // If there's an explicit quiz lesson, return it to potentially link with that
            const quizLesson = orderedQuizLessons[0];
            if (quizLesson) {
                return quizLesson.id;
            }
            // Otherwise, no lesson ID means use default quiz route
            return null;
        }

        // Fall back to lesson quiz
        const explicitQuizLesson = orderedQuizLessons[0];
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
            isPublished: lesson.isPublished,
            title: lesson.title,
            duration: lesson.duration,
            videoUrl: lesson.videoUrl,
            audioUrl: lesson.audioUrl,
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
