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
            this.quizzesService.getAll({ pageSize: 200 }),
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ([course, lessonsWithProgress, quizzes]) => {
                    const currentLesson = lessonsWithProgress.find((lesson) => lesson.id === this.lessonId);
                    const courseLessonIds = new Set(lessonsWithProgress.map((lesson) => lesson.id));
                    const courseQuizzes = quizzes.filter(
                        (quiz) => typeof quiz.lessonId === 'string' && courseLessonIds.has(quiz.lessonId),
                    );

                    if (!currentLesson) {
                        this.error = 'Lesson not found';
                        this.isLoading = false;
                        this.isContentLoading = false;
                        this.cdr.detectChanges();
                        return;
                    }

                    this.currentCourse = course;
                    this.hasCourseQuiz = courseQuizzes.length > 0 || lessonsWithProgress.some((lesson) => lesson.type === 'quiz');
                    this.courseQuizLessonId = this.resolveQuizLessonId(lessonsWithProgress, courseQuizzes);
                    this.courseQuizTitle = courseQuizzes.find(
                        (quiz) => typeof quiz.title === 'string' && quiz.title.trim().length > 0,
                    )?.title?.trim() ?? 'Quiz';
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
                    this.lessonData = data;
                    this.lessonContent = data.content;
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
              <h1 style="font-size:28px;line-height:1.3;margin:0 0 16px;color:#111827;">${this.escapeHtml(titleText)}</h1>
              <div style="font-size:16px;line-height:1.75;">${contentHtml}</div>
            `;

            globalThis.document.body.appendChild(exportContainer);
            await this.inlineContainerImages(exportContainer);
            await this.waitForImages(exportContainer);

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
        const mappedLessons = this.courseLessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.type === 'quiz' ? this.courseQuizTitle : lesson.title,
            duration: lesson.type === 'quiz' ? 'Assessment' : lesson.duration,
            type: lesson.type,
            quizLessonId: lesson.type === 'quiz' ? lesson.id : undefined,
            isCompleted: this.isLessonCompleted(lesson),
            isCurrent: this.isLessonCurrent(lesson),
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

    private async inlineContainerImages(container: HTMLElement): Promise<void> {
        const images = Array.from(container.querySelectorAll('img'));
        if (images.length === 0) {
            return;
        }

        await Promise.all(
            images.map(async (image) => {
                const source = (image.getAttribute('src') ?? '').trim();
                if (!source || this.isInlineImageSource(source)) {
                    return;
                }

                image.setAttribute('crossorigin', 'anonymous');

                try {
                    const response = await globalThis.fetch(source, {
                        mode: 'cors',
                        cache: 'force-cache',
                    });

                    if (!response.ok) {
                        image.setAttribute('src', source);
                        return;
                    }

                    const blob = await response.blob();
                    const dataUrl = await this.convertBlobToDataUrl(blob);
                    image.setAttribute('src', dataUrl);
                } catch {
                    image.setAttribute('src', source);
                }
            }),
        );
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
            const id = url.pathname.split('/').find(Boolean) ?? null;
            return id && id.length >= 11 ? id.slice(0, 11) : null;
        }

        const isYouTubeHost = host === 'youtube.com'
            || host === 'm.youtube.com'
            || host === 'youtube-nocookie.com';
        if (!isYouTubeHost) {
            return null;
        }

        if (url.pathname.startsWith('/embed/')) {
            const id = url.pathname.split('/embed/')[1]?.split('/')[0];
            return id && id.length >= 11 ? id.slice(0, 11) : null;
        }

        const fromQuery = url.searchParams.get('v');
        if (fromQuery && fromQuery.length >= 11) {
            return fromQuery.slice(0, 11);
        }

        return null;
    }

    private escapeHtml(value: string): string {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    private resolveQuizLessonId(
        lessons: Array<AcademyLesson & { progress: LessonProgress }>,
        quizzes: QuizReadDto[],
    ): string | null {
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
