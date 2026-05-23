import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { AuthService } from '../../../core/services/auth.service';
import { CourseReadByIdDto } from '../../../api/facades/course.facade';
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
    prerequisitesList: { id: string; title: string; isCompleted: boolean }[];
}

/** Maps a numeric lesson type to a string type label */
function mapLessonType(raw: unknown): Lesson['type'] {
    // API may return numeric or string type
    const str = String(raw ?? '').toLowerCase();
    if (str === '1' || str === 'video') return 'video';
    if (str === '2' || str === 'article') return 'article';
    if (str === '3' || str === 'document') return 'document';
    if (str === '4' || str === 'quiz') return 'quiz';
    if (str === '5' || str === 'audio') return 'audio';
    return 'intro';
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

    get hasQuizLesson(): boolean {
        return !!this.course?.lessonsList.some(
            (lesson) => !lesson.isLocked && lesson.type === 'quiz',
        );
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
                        this.fetchCourseDirectly(courseId);
                        return;
                    }
                }

                this.error = 'This course is unavailable right now.';
                this.isLoading = false;
                this.cdr.detectChanges();
            });
    }

    private fetchCourseDirectly(courseId: string): void {
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
            this.buildFromRawCourse(course);
        });
    }

    /**
     * Build CourseDetails from the raw /api/Courses/:id response.
     * All required data (lessons, level name) comes from this single response.
     */
    private buildFromRawCourse(raw: CourseReadByIdDto): void {
        this.courseId = raw.id ?? '';

        const rawLessons: any[] = Array.isArray((raw as any).lessons)
            ? (raw as any).lessons
            : [];

        const lessonsList: Lesson[] = rawLessons
            .filter((l: any) => l.isPublished !== false)
            .map((l: any) => ({
                id: l.id ?? '',
                title: l.title ?? '',
                duration: l.duration ?? '~5min',
                type: mapLessonType(l.type),
                isLocked: false,
                isCompleted: l.isLessonCompleted ?? false,
                isCurrent: false,
                isPublished: l.isPublished ?? true,
                lessonHasQuiz: l.lessonHasQuiz ?? false,
                isLessonQuizPassed: l.isLessonQuizPassed ?? false,
                isLessonCompleted: l.isLessonCompleted ?? false,
                lessonQuizName: l.lessonQuizName ?? undefined,
            } as Lesson));

        // Mark first uncompleted lesson as current
        const firstPending = lessonsList.findIndex((l) => !l.isCompleted && l.type !== 'quiz');
        if (firstPending >= 0) {
            lessonsList[firstPending] = { ...lessonsList[firstPending], isCurrent: true };
        }

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
            totalLessons: lessonsList.length,
            completedLessons: lessonsList.filter((l) => l.isCompleted).length,
            isLocked: false,
            hasUnmetPrerequisites: false,
            unmetPrerequisiteNames: this.buildUnmetPrerequisiteNames(raw.prerequisites ?? []),
            isEnrolled: false,
            isEnrollmentCompleted: false,
            lessonsList,
            prerequisitesList: this.buildPrerequisitesList(raw.prerequisites ?? []),
        };

        this.error = null;
        this.isLoading = false;
        this.cdr.detectChanges();
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
     * Calculate total course duration from lessons
     */
    private calculateCourseDuration(lessons: Lesson[]): string {
        const totalSeconds = lessons
            .filter(lesson => lesson.type !== 'quiz')
            .reduce((total, lesson) => {
                // Parse duration string like "~5min" or "10 min" to seconds
                const match = lesson.duration.match(/(\d+)/);
                const minutes = match ? parseInt(match[1], 10) : 5; // default 5 min
                return total + (minutes * 60);
            }, 0);

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
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
