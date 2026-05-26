import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, of, Observable, forkJoin, from } from 'rxjs';
import { takeUntil, catchError, map, take, switchMap } from 'rxjs/operators';
import { AcademyProgressService, CourseEnrollmentState } from '../../../core/services/academy-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { CourseReadByIdDto } from '../../../api/facades/course.facade';
import { QuizFacade, QuizReadDto } from '../../../api/facades/quiz.facade';
import {
    AcademyPageShellComponent,
    AcademyBreadcrumbItem,
} from '../shared/academy-page-shell/academy-page-shell.component';
import {
    AcademySidebarLessonItem,
    AcademySidebarHostComponent,
} from '../shared/academy-sidebar-host/academy-sidebar-host.component';
import { CourseResolvedData } from './course.resolver';
import { SeoService } from '../../../core/services/seo.service';

/**
 * Quiz interface for template binding
 */
interface Quiz {
    id: string;
    title: string;
    lessonId?: string;
}

/**
 * Lesson interface for template binding — built from the lessons[] array
 * embedded in GET /api/Courses/:id response.
 */
interface Lesson {
    id: string;
    title: string;
    duration: string;
    type: 'intro' | 'video' | 'article' | 'document' | 'quiz' | 'audio';
    isLocked: boolean;
    isCompleted: boolean;
    isCurrent: boolean;
    isPublished?: boolean;
    lessonHasQuiz?: boolean;
    isLessonQuizPassed?: boolean;
    isLessonCompleted?: boolean;
    lessonQuizName?: string;
    quizLessonId?: string;
    isLastCourseLesson?: boolean;
    hasNotification?: boolean;
}

/**
 * Course details interface for template binding
 */
interface CourseDetails {
    id: string;
    levelName: string;
    stageNumber: number;
    stageLabel: string;
    duration: string;
    title: string;
    intro: string;
    lessons: string[];       // lesson titles for the details section
    answers: string[];
    totalLessons: number;
    completedLessons: number;
    isLocked: boolean;
    hasUnmetPrerequisites: boolean;
    unmetPrerequisiteNames: string[];
    isEnrolled: boolean;
    isEnrollmentCompleted: boolean;
    lessonsList: Lesson[];
    quizzesList: Quiz[];     // Quizzes for this course
    prerequisitesList: { id: string; title: string; isCompleted: boolean }[];
}

@Component({
    selector: 'app-course',
    standalone: true,
    imports: [RouterLink, AcademyPageShellComponent, AcademySidebarHostComponent],
    templateUrl: './course.component.html',
    styleUrls: ['./course.component.scss'],
})
export class CourseComponent implements OnInit, OnDestroy {
    private static readonly syntheticQuizLessonPrefix = 'synthetic-quiz-';

    private readonly destroy$ = new Subject<void>();
    private courseId: string = '';

    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly academyProgressService = inject(AcademyProgressService);
    private readonly authService = inject(AuthService);
    private readonly quizFacade = inject(QuizFacade);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly seoService = inject(SeoService);

    course: CourseDetails | null = null;

    isLoading = true;
    error: string | null = null;
    showSignInPrompt = false;
    isEnrolling = false;

    backgroundImageUrl = '/backgrounds/course-background.png';

    get hasPlayableLesson(): boolean {
        return !!this.course?.lessonsList.some(
            (lesson) => lesson.type !== 'quiz',
        );
    }

    get hasPublishedLessons(): boolean {
        return !!this.course?.lessonsList.length;
    }

    get contentLessonsOnly(): Lesson[] {
        return this.course?.lessonsList.filter((lesson) => lesson.type !== 'quiz') ?? [];
    }

    get hasQuizLesson(): boolean {
        return !!this.course?.lessonsList.some(
            (lesson) => !lesson.isLocked && lesson.type === 'quiz',
        );
    }

    /**
     * Format lesson type for display
     */
    getLessonTypeDisplay(type: Lesson['type']): string {
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    get hasCourseEnrollment(): boolean {
        return !!this.course && (this.course.isEnrolled || this.course.isEnrollmentCompleted);
    }

    get canTakeQuiz(): boolean {
        return this.hasQuizLesson && this.hasCourseEnrollment;
    }

    get primaryActionLabel(): string {
        return this.hasCourseEnrollment ? 'Continue' : 'Enroll';
    }

    get isBeginDisabled(): boolean {
        if (!this.course) return true;
        return !this.hasPublishedLessons || !this.hasPlayableLesson;
    }

    private getUnlockedQuizLessonId(): string | null {
        const quizLesson = this.course?.lessonsList.find(
            (lesson) => !lesson.isLocked && lesson.type === 'quiz',
        );
        if (!quizLesson) return null;
        if (quizLesson.quizLessonId) return quizLesson.quizLessonId;
        if (quizLesson.id.startsWith(CourseComponent.syntheticQuizLessonPrefix)) return null;
        return quizLesson.id;
    }

    get isUserAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    get breadcrumbs(): readonly AcademyBreadcrumbItem[] {
        const list: AcademyBreadcrumbItem[] = [
            { label: 'Academy', link: ['/academy'] },
        ];
        if (this.course?.levelName) {
            list.push({ label: this.course.levelName, link: ['/academy'] });
        }
        return list;
    }

    ngOnInit(): void {
        this.route.data
            .pipe(takeUntil(this.destroy$))
            .subscribe((data) => {
                const resolved = data['resolvedData'] as CourseResolvedData | null;
                if (resolved?.courseData) {
                    this.buildFromRawCourse(resolved.courseData);
                    return;
                }

                // Fallback: fetch directly on the client when resolver returned null
                if (this.isBrowser) {
                    const courseId = this.route.snapshot.paramMap.get('id') || '';
                    if (courseId) {
                        this.buildFromRawCourseDirect(courseId);
                        return;
                    }
                }

                this.error = 'This course is unavailable right now.';
                this.isLoading = false;
                this.cdr.detectChanges();
            });
    }

    /**
     * Fetch course data directly when resolver fails
     */
    private buildFromRawCourseDirect(courseId: string): void {
        this.isLoading = true;
        this.error = null;

        this.academyProgressService.getCourseByIdDirect(courseId).pipe(
            takeUntil(this.destroy$),
            catchError(() => of(null)),
        ).subscribe((course) => {
            if (!course) {
                this.error = 'This course is unavailable right now.';
                this.isLoading = false;
                this.cdr.detectChanges();
                return;
            }

            this.courseId = course.id ?? '';

            forkJoin({
                quizzes: this.fetchCourseQuizzes(this.courseId).pipe(take(1)),
                courseProgress: of(undefined as any),
                enrollment: this.academyProgressService.getCurrentStudentCourseEnrollment(this.courseId).pipe(take(1), catchError(() => of({ enrollmentId: null, status: null, isEnrolled: false, isCompleted: false } as CourseEnrollmentState))),
                prerequisites: this.academyProgressService.getTargetedPrerequisiteDetails((course.prerequisites ?? []).map((p: any) => p.id ?? p)).pipe(take(1), catchError(() => of([]))),
                fullLessons: this.academyProgressService.getAcademyLessons(this.courseId).pipe(take(1), catchError(() => of([]))),
            }).pipe(
                takeUntil(this.destroy$),
                switchMap((results) => {
                    const lessonsList = this.extractLessonsFromRawCourse(course);
                    return this.hydrateLessonsWithYouTube(lessonsList, results.fullLessons).pipe(
                        map((hydratedLessons) => ({ ...results, hydratedLessons }))
                    );
                })
            ).subscribe(({ quizzes, courseProgress, enrollment, prerequisites, hydratedLessons }) => {
                const rawLessonsList = hydratedLessons;

                const stageNumberMatch = course.level ? course.level.match(/\d+/) : null;
                const stageNumber = stageNumberMatch ? parseInt(stageNumberMatch[0], 10) : 1;

                const prerequisitesList = prerequisites;

                const unmetPrerequisiteNames = prerequisitesList
                    .filter(p => !p.isCompleted)
                    .map(p => p.title);

                const hasUnmetPrerequisites = unmetPrerequisiteNames.length > 0;
                const isLocked = hasUnmetPrerequisites;

                const isEnrolled = enrollment.isEnrolled || enrollment.isCompleted || (courseProgress !== undefined && courseProgress !== null);

                const enrichedLessonsList = rawLessonsList.map((lesson) => {
                    return {
                        ...lesson,
                        isCompleted: lesson.isCompleted || false,
                        isLocked: false,
                        isCurrent: false,
                    };
                });

                const hasCurrent = enrichedLessonsList.some((l) => l.isCurrent);
                if (!hasCurrent) {
                    const firstPending = enrichedLessonsList.findIndex((l) => !l.isCompleted && l.type !== 'quiz');
                    if (firstPending >= 0) {
                        enrichedLessonsList[firstPending] = { ...enrichedLessonsList[firstPending], isCurrent: true };
                    }
                }

                const processedLessons = this.prepareSidebarLessons(enrichedLessonsList, quizzes, isLocked || hasUnmetPrerequisites, isEnrolled);

                this.course = {
                    id: course.id ?? '',
                    levelName: (course['levelName'] as string) ?? (course.level as string) ?? '',
                    stageNumber: stageNumber,
                    stageLabel: (course['levelName'] as string) ?? (course.level as string) ?? 'Course',
                    duration: this.calculateCourseDuration(enrichedLessonsList),
                    title: course.title ?? '',
                    intro: course.description ?? '',
                    lessons: enrichedLessonsList
                        .filter((l) => l.type !== 'quiz' && l.type !== 'intro')
                        .map((l) => l.title),
                    answers: this.extractOutcomes(course.description),
                    totalLessons: processedLessons.length,
                    completedLessons: processedLessons.filter((l) => l.isCompleted).length,
                    isLocked: isLocked,
                    hasUnmetPrerequisites: hasUnmetPrerequisites,
                    unmetPrerequisiteNames: unmetPrerequisiteNames,
                    isEnrolled: isEnrolled,
                    isEnrollmentCompleted: enrollment.isCompleted,
                    lessonsList: processedLessons,
                    quizzesList: quizzes,
                    prerequisitesList: prerequisitesList,
                };

                if (this.course) {
                    this.seoService.setMetaTags({
                        title: `${this.course.title} - Academy Course`,
                        description: this.course.intro || `Learn ${this.course.title} step-by-step on the AskAMuslim Academy. Free structured online lessons and quizzes.`,
                        keywords: [this.course.title, 'islamic course', 'academy', 'learn islam', 'AskAMuslim'],
                        schemas: [this.seoService.generateCourseSchema(this.course)]
                    });
                }

                this.error = null;
                this.isLoading = false;
                this.cdr.detectChanges();
            });
        });
    }

    /**
     * Build CourseDetails from the raw /api/Courses/:id response.
     * All required data (lessons, level name) comes from this single response.
     */
    private buildFromRawCourse(raw: CourseReadByIdDto): void {
        this.courseId = raw.id ?? '';

        forkJoin({
            quizzes: this.fetchCourseQuizzes(this.courseId).pipe(take(1)),
            courseProgress: of(undefined as any),
            enrollment: this.academyProgressService.getCurrentStudentCourseEnrollment(this.courseId).pipe(take(1), catchError(() => of({ enrollmentId: null, status: null, isEnrolled: false, isCompleted: false } as CourseEnrollmentState))),
            prerequisites: this.academyProgressService.getTargetedPrerequisiteDetails((raw.prerequisites ?? []).map((p: any) => p.id ?? p)).pipe(take(1), catchError(() => of([]))),
            fullLessons: this.academyProgressService.getAcademyLessons(this.courseId).pipe(take(1), catchError(() => of([]))),
        }).pipe(
            takeUntil(this.destroy$),
            switchMap((results) => {
                const lessonsList = this.extractLessonsFromRawCourse(raw);
                return this.hydrateLessonsWithYouTube(lessonsList, results.fullLessons).pipe(
                    map((hydratedLessons) => ({ ...results, hydratedLessons }))
                );
            })
        ).subscribe(({ quizzes, courseProgress, enrollment, prerequisites, hydratedLessons }) => {
            let lessonsList = hydratedLessons;

            const stageNumberMatch = raw.level ? raw.level.match(/\d+/) : null;
            const stageNumber = stageNumberMatch ? parseInt(stageNumberMatch[0], 10) : 1;

            const prerequisitesList = prerequisites;

            const unmetPrerequisiteNames = prerequisitesList
                .filter(p => !p.isCompleted)
                .map(p => p.title);

            const hasUnmetPrerequisites = unmetPrerequisiteNames.length > 0;
            const isLocked = hasUnmetPrerequisites;

            const isEnrolled = enrollment.isEnrolled || enrollment.isCompleted || (courseProgress !== undefined && courseProgress !== null);

            const enrichedLessonsList = lessonsList.map((lesson) => {
                return {
                    ...lesson,
                    isCompleted: lesson.isCompleted || false,
                    isLocked: false,
                    isCurrent: false,
                };
            });

            const hasCurrent = enrichedLessonsList.some((l) => l.isCurrent);
            if (!hasCurrent) {
                const firstPending = enrichedLessonsList.findIndex((l) => !l.isCompleted && l.type !== 'quiz');
                if (firstPending >= 0) {
                    enrichedLessonsList[firstPending] = { ...enrichedLessonsList[firstPending], isCurrent: true };
                }
            }

            const processedLessons = this.prepareSidebarLessons(enrichedLessonsList, quizzes, isLocked || hasUnmetPrerequisites, isEnrolled);

            this.course = {
                id: raw.id ?? '',
                levelName: (raw['levelName'] as string) ?? (raw.level as string) ?? '',
                stageNumber: stageNumber,
                stageLabel: (raw['levelName'] as string) ?? (raw.level as string) ?? 'Course',
                duration: this.calculateCourseDuration(enrichedLessonsList),
                title: raw.title ?? '',
                intro: raw.description ?? '',
                lessons: enrichedLessonsList
                    .filter((l) => l.type !== 'quiz' && l.type !== 'intro')
                    .map((l) => l.title),
                answers: this.extractOutcomes(raw.description),
                totalLessons: processedLessons.length,
                completedLessons: processedLessons.filter((l) => l.isCompleted).length,
                isLocked: isLocked,
                hasUnmetPrerequisites: hasUnmetPrerequisites,
                unmetPrerequisiteNames: unmetPrerequisiteNames,
                isEnrolled: isEnrolled,
                isEnrollmentCompleted: enrollment.isCompleted,
                lessonsList: processedLessons,
                quizzesList: quizzes,
                prerequisitesList: prerequisitesList,
            };

            if (this.course) {
                this.seoService.setMetaTags({
                    title: `${this.course.title} - Academy Course`,
                    description: this.course.intro || `Learn ${this.course.title} step-by-step on the AskAMuslim Academy. Free structured online lessons and quizzes.`,
                    keywords: [this.course.title, 'islamic course', 'academy', 'learn islam', 'AskAMuslim'],
                    schemas: [this.seoService.generateCourseSchema(this.course)]
                });
            }

            this.error = null;
            this.isLoading = false;
            this.cdr.detectChanges();
        });
    }

    private fetchCourseQuizzes(courseId: string): Observable<Quiz[]> {
        if (!courseId) {
            return of([]);
        }
        return this.academyProgressService.getCourseQuizzesDirect(courseId).pipe(
            map((quizzes: QuizReadDto[]) => quizzes.map((quiz: QuizReadDto) => ({
                id: quiz.id ?? '',
                title: quiz.title ?? 'Quiz',
                lessonId: quiz.lessonId
            }))),
            catchError(() => of([]))
        );
    }

    private isQuizCompleted(quizId: string): boolean {
        if (!this.isBrowser) return false;
        const key = `quiz_${this.courseId}_${quizId}`;
        const data = localStorage.getItem(key);
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

    private prepareSidebarLessons(lessons: Lesson[], quizzes: Quiz[], isLocked: boolean, isEnrolled: boolean): Lesson[] {
        const nonQuiz = lessons.filter(l => l.type !== 'quiz');
        const isCourseLockedOrNotEnrolled = isLocked;

        if (nonQuiz.length > 0) {
            nonQuiz.forEach(l => {
                l.isLastCourseLesson = false;
                l.isLocked = isCourseLockedOrNotEnrolled;
            });
            nonQuiz[nonQuiz.length - 1].isLastCourseLesson = true;
        }

        const mappedQuizzes = quizzes.map((q, idx) => ({
            id: `${CourseComponent.syntheticQuizLessonPrefix}${q.id || this.courseId}`,
            title: q.title || `Quiz ${idx + 1}`,
            duration: 'Assessment',
            type: 'quiz' as const,
            isLocked: isCourseLockedOrNotEnrolled,
            isCompleted: this.isQuizCompleted(q.id || this.courseId),
            isCurrent: false,
            quizLessonId: q.id || undefined,
        } as Lesson));

        return [...nonQuiz, ...mappedQuizzes];
    }

    private extractOutcomes(description: string | undefined): string[] {
        if (!description) return [];
        return description
            .split(/[\n•]+/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .slice(0, 3);
    }

    /**
     * Extract lessons array from raw course data
     */
    private extractLessonsFromRawCourse(raw: CourseReadByIdDto): Lesson[] {
        const rawLessons: any[] = Array.isArray((raw as any).lessons)
            ? (raw as any).lessons
            : [];

        return rawLessons
            .filter((l: any) => l.isPublished !== false)
            .map((l: any) => {
                const type = this.mapLessonType(l);
                
                // Extract duration from various possible API fields
                let duration = l.duration ?? l.lessonDuration ?? l.courseDuration ?? l.totalDuration;
                
                return {
                    id: l.lessonId ?? l.id ?? '',
                    title: l.lessonName ?? l.title ?? '',
                    duration: this.academyProgressService.resolveLessonDurationFromDto({ ...l, duration }, type),
                    type,
                    isLocked: false,
                    isCompleted: l.isLessonCompleted ?? l.isCompleted ?? false,
                    isCurrent: false,
                    isPublished: l.isPublished ?? true,
                    lessonHasQuiz: l.lessonHasQuiz ?? false,
                    isLessonQuizPassed: l.isLessonQuizPassed ?? false,
                    isLessonCompleted: l.isLessonCompleted ?? false,
                    lessonQuizName: l.quizName ?? l.lessonQuizName ?? undefined,
                } as Lesson;
            });
    }

    /**
     * Map a numeric lesson type to a string type label
     */
    private mapLessonType(l: any): Lesson['type'] {
        const raw = l.lessonType ?? l.type;
        // API may return numeric or string type
        const str = String(raw ?? '').toLowerCase();
        if (str === '1' || str === 'video') return 'video';
        if (str === '2' || str === 'article') return 'article';
        if (str === '3' || str === 'document') return 'document';
        if (str === '4' || str === 'audio') return 'audio';
        if (str === '5' || str === 'quiz') return 'quiz';

        // Smart fallback check for video URL presence
        const videoUrl = l.externalVideoUrl ?? l.videoUrl ?? l.contentUrl;
        if (videoUrl) {
            return 'video';
        }

        return 'intro';
    }

    private calculateCourseDuration(lessons: Lesson[]): string {
        return this.academyProgressService.calculateCourseVideoDuration(lessons, '0m');
    }


    /**
     * Handle quiz click - navigate to quiz page
     */
    onQuizClick(quiz: Quiz): void {
        if (!this.authService.isAuthenticated()) {
            this.showSignInPrompt = true;
            return;
        }

        if (quiz.lessonId) {
            this.router.navigate(['quiz', quiz.lessonId], { relativeTo: this.route });
        } else {
            this.router.navigate(['quiz'], { relativeTo: this.route });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    onBeginClick(): void {
        if (!this.authService.isAuthenticated()) {
            this.showSignInPrompt = true;
            return;
        }

        if (!this.course || this.course.isLocked || this.isBeginDisabled) return;
        if (!this.hasPlayableLesson || this.isEnrolling) return;

        // Navigate immediately to the first playable lesson
        this.navigateToPrimaryActionLesson(false);

        // Enroll in the background
        this.isEnrolling = true;
        this.academyProgressService
            .enrollCurrentStudentInCourse(this.course.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (isEnrolled) => {
                    this.isEnrolling = false;
                    if (isEnrolled) {
                        if (this.course) {
                            this.course = {
                                ...this.course,
                                isEnrolled: true,
                            };
                        }
                    }
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.isEnrolling = false;
                    this.cdr.detectChanges();
                },
            });
    }

    private navigateToPrimaryActionLesson(preferNextUncompleted: boolean): void {
        if (!this.course) return;

        const unlockedNonQuizLessons = this.course.lessonsList.filter(
            (lesson) => !lesson.isLocked && lesson.type !== 'quiz',
        );

        if (unlockedNonQuizLessons.length === 0) return;

        const nextUncompletedLesson = unlockedNonQuizLessons.find((lesson) => !lesson.isCompleted);
        const targetLesson = preferNextUncompleted
            ? (nextUncompletedLesson ?? unlockedNonQuizLessons[0])
            : unlockedNonQuizLessons[0];

        this.router.navigate(['lesson', targetLesson.id], { relativeTo: this.route });
        this.cdr.detectChanges();
    }



    onTakeQuizClick(): void {
        if (!this.authService.isAuthenticated()) {
            this.showSignInPrompt = true;
            return;
        }

        if (this.course && !this.course.isLocked) {
            if (!this.hasQuizLesson) return;

            const quizLessonId = this.getUnlockedQuizLessonId();
            if (quizLessonId) {
                this.router.navigate(['quiz', quizLessonId], { relativeTo: this.route });
                return;
            }

            this.router.navigate(['quiz'], { relativeTo: this.route });
        }
    }

    onLessonClick(lesson: AcademySidebarLessonItem): void {
        if (!this.authService.isAuthenticated()) {
            this.showSignInPrompt = true;
            return;
        }

        if (!lesson.isLocked) {
            if (lesson.type === 'quiz') {
                const quizLessonId = lesson.quizLessonId
                    ?? (lesson.id.startsWith(CourseComponent.syntheticQuizLessonPrefix) ? null : lesson.id);

                if (quizLessonId) {
                    this.router.navigate(['quiz', quizLessonId], { relativeTo: this.route });
                } else {
                    this.router.navigate(['quiz'], { relativeTo: this.route });
                }
            } else {
                this.router.navigate(['lesson', lesson.id], { relativeTo: this.route });
            }
        }
    }

    closeSignInPrompt(): void {
        this.showSignInPrompt = false;
    }

    continueToSignIn(): void {
        this.showSignInPrompt = false;
        void this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url },
        });
    }

    private hydrateLessonsWithYouTube(lessonsList: Lesson[], rawLessons: any[]): Observable<Lesson[]> {
        const durationRequests = lessonsList.map((lesson) => {
            const rawLesson = (rawLessons || []).find((rl: any) => (rl.lessonId ?? rl.id) === lesson.id);
            const durationStr = String(lesson.duration || '').trim().toLowerCase();
            const isNullOrFallback = !durationStr ||
                durationStr === '0:00' ||
                durationStr === '0m' ||
                durationStr === '5 min' ||
                durationStr === '5 mins' ||
                durationStr === '~5min' ||
                durationStr.includes('5 min') ||
                (rawLesson && (rawLesson.lessonDuration === null || rawLesson.lessonDuration === undefined || rawLesson.lessonDuration === 'null' || rawLesson.duration === null || rawLesson.duration === undefined));

            if (lesson.type === 'video' && isNullOrFallback) {
                if (rawLesson) {
                    const videoUrl = rawLesson.externalVideoUrl ?? rawLesson.videoUrl ?? rawLesson.contentUrl;
                    if (videoUrl) {
                        const videoId = this.academyProgressService.extractVideoId(videoUrl);
                        if (videoId) {
                            return from(this.academyProgressService.fetchVideoDuration(videoId)).pipe(
                                map((isoDuration) => {
                                    const formatted = this.academyProgressService.renderDuration(
                                        this.academyProgressService.formatDuration(isoDuration)
                                    );
                                    return { ...lesson, duration: formatted };
                                }),
                                catchError(() => of(lesson))
                            );
                        }
                    }
                }
            }
            return of(lesson);
        });

        return forkJoin(durationRequests);
    }
}