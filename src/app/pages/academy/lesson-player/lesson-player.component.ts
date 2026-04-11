import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LessonContentService } from '../../../core/services/lesson-content.service';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
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

    courseId: string = '';
    lessonId: string = '';

    currentCourse: AcademyCourse | undefined;
    currentLesson: AcademyLesson | undefined;
    nextAcademyLesson: AcademyLesson | undefined;
    previousAcademyLesson: AcademyLesson | undefined;
    courseLessons: Array<AcademyLesson & { progress: LessonProgress }> = [];

    lessonData: LessonData | null = null;
    lessonContent: LessonContent | null = null;

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
    previousNotes: Array<{ timestamp: string; text: string }> = [];
    notesFilter: 'latest' | 'current-lesson' = 'latest';
    notesSearchQuery: string = '';

    lessonRating: number = 0;
    feedbackText: string = '';
    feedbackSubmissionMessage: string | null = null;

    readonly breadcrumbsBase: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];

    private readonly destroy$ = new Subject<void>();
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly tokenService = inject(TokenService);

    constructor(
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly sanitizer: DomSanitizer,
        private readonly lessonContentService: LessonContentService,
        private readonly academyProgressService: AcademyProgressService,
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
        this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
            this.courseId = params.get('courseId') || '';
            this.lessonId = params.get('lessonId') || '';

            if (this.courseId && this.lessonId) {
                this.resetViewStateForRouteChange();
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
                        this.cdr.detectChanges();
                        return;
                    }

                    const fallbackDuration = course.duration;
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
                    this.nextAcademyLesson = this.resolveNextLesson(lessonsWithProgress, this.lessonId);
                    this.previousAcademyLesson = this.resolvePreviousLesson(lessonsWithProgress, this.lessonId);
                    this.isIntroLesson = this.currentLesson.type === 'intro';

                    this.cdr.detectChanges();

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
                    this.cdr.detectChanges();
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
                    this.isLoading = false;
                    this.isContentLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.error = 'Unable to load lesson content right now. Please try again.';
                    this.isLoading = false;
                    this.isContentLoading = false;
                    this.cdr.detectChanges();
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
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.previousNotes = [];
                    this.cdr.detectChanges();
                },
            });
    }

    private resetViewStateForRouteChange(): void {
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
        this.activeTab = 'overview';
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

    setActiveTab(tab: LessonPlayerTab): void { this.activeTab = tab; }

    goToNextLesson(): void {
        const nextId = this.nextAcademyLesson?.id || this.nextLesson?.id;
        if (nextId) {
            this.router.navigate(['/academy/course', this.courseId, 'lesson', nextId]);
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

        const now = new Date();
        const timestamp = `[Lesson] ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

        this.lessonContentService
            .addLessonNote(this.lessonId, trimmedNote, timestamp)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (createdNote) => {
                    this.previousNotes = [createdNote, ...this.previousNotes];
                    this.noteText = '';
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.noteText = '';
                    this.cdr.detectChanges();
                },
            });
    }

    deleteNote(index: number): void { this.previousNotes.splice(index, 1); }

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

    get filteredNotes(): Array<{ timestamp: string; text: string }> {
        return this.previousNotes.filter(note => note.text.toLowerCase().includes(this.notesSearchQuery.toLowerCase()));
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
