import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, of, Observable } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { CourseReadByIdDto } from '../../../api/facades/course.facade';
import { QuizFacade, QuizReadDto } from '../../../api/facades/quiz.facade';
import {
    AcademyPageShellComponent,
    AcademyBreadcrumbItem,
} from '../shared/academy-page-shell/academy-page-shell.component';
import {
    AcademySidebarLessonItem,
} from '../shared/academy-course-sidebar/academy-course-sidebar.component';
import { AcademySidebarHostComponent } from '../shared/academy-sidebar-host/academy-sidebar-host.component';
import { CourseResolvedData } from './course.resolver';

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

    course: CourseDetails | null = null;

    isLoading = true;
    error: string | null = null;
    showSignInPrompt = false;
    isEnrolling = false;

    backgroundImageUrl = '/backgrounds/course-background.png';

    get hasPlayableLesson(): boolean {
        return !!this.course?.lessonsList.some(
            (lesson) => !lesson.isLocked && lesson.type !== 'quiz',
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

            this.fetchCourseQuizzes(this.courseId).subscribe((quizzes) => {
                const rawLessonsList = this.extractLessonsFromRawCourse(course);
                const processedLessons = this.prepareSidebarLessons(rawLessonsList, quizzes);

                this.course = {
                    id: course.id ?? '',
                    levelName: course.level ?? '',
                    stageNumber: 1, // TODO: Determine actual stage number from levelId if mapping available
                    stageLabel: course.level ? course.level : 'Course',
                    duration: this.calculateCourseDuration(rawLessonsList),
                    title: course.title ?? '',
                    intro: course.description ?? '',
                    lessons: rawLessonsList
                        .filter((l) => l.type !== 'quiz' && l.type !== 'intro')
                        .map((l) => l.title),
                    answers: this.extractOutcomes(course.description),
                    totalLessons: processedLessons.length,
                    completedLessons: processedLessons.filter((l) => l.isCompleted).length,
                    isLocked: false,
                    hasUnmetPrerequisites: false,
                    unmetPrerequisiteNames: this.buildUnmetPrerequisiteNames(course.prerequisites ?? []),
                    isEnrolled: (course['courseProgress'] !== undefined && course['courseProgress'] !== null) || !!course['isCompleted'],
                    isEnrollmentCompleted: !!course['isCompleted'],
                    lessonsList: processedLessons,
                    quizzesList: quizzes,
                    prerequisitesList: this.buildPrerequisitesList(course.prerequisites ?? []),
                };

                this.academyProgressService.getLevelTitleForCourse({
                    levelId: course.levelId ?? undefined,
                    stageId: 1
                }).pipe(takeUntil(this.destroy$)).subscribe((title) => {
                    if (this.course) {
                        this.course.levelName = title;
                        this.course.stageLabel = title;
                        this.cdr.detectChanges();
                    }
                });

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

        this.fetchCourseQuizzes(this.courseId).subscribe((quizzes) => {
            const lessonsList = this.extractLessonsFromRawCourse(raw);

            // Mark first uncompleted lesson as current
            const firstPending = lessonsList.findIndex((l) => !l.isCompleted && l.type !== 'quiz');
            if (firstPending >= 0) {
                lessonsList[firstPending] = { ...lessonsList[firstPending], isCurrent: true };
            }

            const processedLessons = this.prepareSidebarLessons(lessonsList, quizzes);

            this.course = {
                id: raw.id ?? '',
                levelName: raw.level ?? '',
                stageNumber: 1, // TODO: Determine actual stage number from levelId if mapping available
                stageLabel: raw.level ? raw.level : 'Course',
                duration: this.calculateCourseDuration(lessonsList),
                title: raw.title ?? '',
                intro: raw.description ?? '',
                lessons: lessonsList
                    .filter((l) => l.type !== 'quiz' && l.type !== 'intro')
                    .map((l) => l.title),
                answers: this.extractOutcomes(raw.description),
                totalLessons: processedLessons.length,
                completedLessons: processedLessons.filter((l) => l.isCompleted).length,
                isLocked: false,
                hasUnmetPrerequisites: false,
                unmetPrerequisiteNames: this.buildUnmetPrerequisiteNames(raw.prerequisites ?? []),
                isEnrolled: (raw['courseProgress'] !== undefined && raw['courseProgress'] !== null) || !!raw['isCompleted'],
                isEnrollmentCompleted: !!raw['isCompleted'],
                lessonsList: processedLessons,
                quizzesList: quizzes,
                prerequisitesList: this.buildPrerequisitesList(raw.prerequisites ?? []),
            };

            this.academyProgressService.getLevelTitleForCourse({
                levelId: raw.levelId ?? undefined,
                stageId: 1
            }).pipe(takeUntil(this.destroy$)).subscribe((title) => {
                if (this.course) {
                    this.course.levelName = title;
                    this.course.stageLabel = title;
                    this.cdr.detectChanges();
                }
            });

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

    private prepareSidebarLessons(lessons: Lesson[], quizzes: Quiz[]): Lesson[] {
        const nonQuiz = lessons.filter(l => l.type !== 'quiz');

        if (nonQuiz.length > 0) {
            nonQuiz.forEach(l => l.isLastCourseLesson = false);
            nonQuiz[nonQuiz.length - 1].isLastCourseLesson = true;
        }

        const mappedQuizzes = quizzes.map((q, idx) => ({
            id: `${CourseComponent.syntheticQuizLessonPrefix}${q.id || this.courseId}`,
            title: q.title || `Quiz ${idx + 1}`,
            duration: 'Assessment',
            type: 'quiz' as const,
            isLocked: false,
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
                const type = this.mapLessonType(l.lessonType ?? l.type);
                return {
                    id: l.lessonId ?? l.id ?? '',
                    title: l.lessonName ?? l.title ?? '',
                    duration: this.academyProgressService.resolveLessonDurationFromDto(l, type),
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
    private mapLessonType(raw: unknown): Lesson['type'] {
        // API may return numeric or string type
        const str = String(raw ?? '').toLowerCase();
        if (str === '1' || str === 'video') return 'video';
        if (str === '2' || str === 'article') return 'article';
        if (str === '3' || str === 'document') return 'document';
        if (str === '4' || str === 'audio') return 'audio';
        if (str === '5' || str === 'quiz') return 'quiz';
        return 'intro';
    }

    private calculateCourseDuration(lessons: Lesson[]): string {
        return this.academyProgressService.calculateCourseVideoDuration(lessons, '0m');
    }

    /**
     * Build prerequisites list for display
     */
    private buildPrerequisitesList(prerequisites: any[]): { id: string; title: string; isCompleted: boolean }[] {
        if (!prerequisites || !Array.isArray(prerequisites)) {
            return [];
        }
        
        return prerequisites.map((prereq: any) => ({
            id: prereq.id ?? '',
            title: prereq.title ?? 'Unknown Course',
            isCompleted: prereq.isCompleted ?? false
        }));
    }

    /**
     * Build unmet prerequisite names array
     */
    private buildUnmetPrerequisiteNames(prerequisites: any[]): string[] {
        if (!prerequisites || !Array.isArray(prerequisites)) {
            return [];
        }
        
        return prerequisites
            .filter((prereq: any) => !(prereq.isCompleted ?? false))
            .map((prereq: any) => prereq.title ?? 'Unknown Course');
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

        if (this.hasCourseEnrollment) {
            this.navigateToPrimaryActionLesson(true);
            return;
        }

        this.navigateToPrimaryActionLesson(false);
        this.enrollCurrentStudentInBackground(this.course.id);
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

    private enrollCurrentStudentInBackground(courseId: string): void {
        this.academyProgressService
            .enrollCurrentStudentInCourse(courseId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (isEnrolled) => {
                    if (!isEnrolled || this.course?.id !== courseId) return;
                    this.course = {
                        ...this.course,
                        isEnrolled: true,
                    };
                    this.cdr.detectChanges();
                },
                error: () => void 0,
            });
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
}