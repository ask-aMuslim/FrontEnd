import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy, Injector } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { AcademyProgressService } from '../../core/services/academy-progress.service';
import { AuthService } from '../../core/services/auth.service';
import {
    AcademyCourse,
    AcademyLesson,
    AcademyStageApi,
    RecentLessonInfo,
    StageProgress,
    CourseProgress,
    CourseStatus,
} from '../../core/models/interfaces/academy-progress.model';
import { toApiMediaUrl } from '../../core/helpers/media-url.helper';
import { CourseTreeComponent, CourseNode as TreeCourse } from './course-tree/course-tree.component';

/**
 * Course interface for template binding — extends TreeCourse so it can be
 * passed directly to the <app-course-tree> component.
 */
interface Course extends TreeCourse {
    id: string;
    title: string;
    category: string;
    categoryLabel: string;
    lessons: number;
    duration: string;
    progress: number;
    status: CourseStatus;
    hasUnmetPrerequisites: boolean;
    thumbnailUrl?: string;
}

/**
 * Stage interface for template binding
 */
interface Stage {
    id: string;
    number: number;
    title: string;
    description: string;
    isLocked: boolean;
    treeCourses: Course[];
}

/**
 * Recent lesson interface for template binding
 */
interface RecentLesson {
    stageNumber: number;
    courseId: string;
    courseName: string;
    categoryLabel: string;
    lessonId: string;
    lessonNumber: number;
    thumbnailUrl: string;
    progress: number;
    mediaType: 'video' | 'audio' | null;
    mediaProgressLabel: string | null;
    completedLessons: number;
    totalLessons: number;
}

@Component({
    selector: 'app-academy',
    standalone: true,
    imports: [CourseTreeComponent],
    templateUrl: './academy.component.html',
    styleUrls: ['./academy.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AcademyComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();
    private academyProgressServiceRef: AcademyProgressService | null = null;

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly injector: Injector,
        private readonly authService: AuthService,
        private readonly cdr: ChangeDetectorRef,
    ) { }

    readonly fallbackImage = '/ask-a-muslim-logo.png';
    recentLesson: RecentLesson | null = null;
    hasRecentLesson = false;
    importantNote = 'The Academy consists of multiple stages. Each stage includes a list of courses covering the meaning of belief, true Islamic values from the prophet Mohamed (peace be upon him) and his companions, and important topics we face every day. Each course consists of lessons that will guide you step by step. You can take notes while learning and share them with your scholar. This Academy for new Muslims was created by 40+ scholars from the Islamic Center of America and is endorsed by the International Union of Muslim Scholars.';
    showFullNote = false;
    stages: Stage[] = [];
    isLoading = true;
    error: string | null = null;

    ngOnInit(): void {
        if (this.isGuestUser) {
            this.isLoading = false;
            this.error = null;
            return;
        }

        this.loadAcademyData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadAcademyData(): void {
        const academyProgressService = this.getAcademyProgressService();

        combineLatest([
            academyProgressService.getAcademyStages(),
            academyProgressService.getAcademyCourses(),
            academyProgressService.getStudentProgress(),
        ])
            .pipe(
                switchMap(([apiStages, courses, progress]) => {
                    if (!progress.recentLesson) {
                        return of({
                            apiStages,
                            courses,
                            progress,
                            recentCourseLessons: [] as AcademyLesson[],
                        });
                    }

                    return academyProgressService
                        .getAcademyLessons(progress.recentLesson.courseId)
                        .pipe(
                            map((recentCourseLessons) => ({
                                apiStages,
                                courses,
                                progress,
                                recentCourseLessons,
                            })),
                            catchError(() =>
                                of({
                                    apiStages,
                                    courses,
                                    progress,
                                    recentCourseLessons: [] as AcademyLesson[],
                                })
                            ),
                        );
                }),
                takeUntil(this.destroy$),
            )
            .subscribe({
                next: ({ apiStages, courses, progress, recentCourseLessons }) => {
                    if (progress.recentLesson) {
                        this.recentLesson = this.mapRecentLesson(progress.recentLesson, courses, recentCourseLessons);
                        this.hasRecentLesson = true;
                    } else {
                        this.recentLesson = null;
                        this.hasRecentLesson = false;
                    }

                    this.stages = this.buildStagesFromApi(
                        apiStages,
                        progress.stageProgress,
                        progress.courseProgress,
                        courses
                    );

                    this.error = null;
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.error = 'Unable to load academy content right now. Please try again.';
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
            });
    }

    private getAcademyProgressService(): AcademyProgressService {
        this.academyProgressServiceRef ??= this.injector.get(AcademyProgressService);

        return this.academyProgressServiceRef;
    }

    private mapRecentLesson(
        info: RecentLessonInfo,
        courses: AcademyCourse[],
        courseLessons: AcademyLesson[],
    ): RecentLesson {
        const matchedCourse = courses.find((course) => course.id === info.courseId);
        const matchedLesson = courseLessons.find((lesson) => lesson.id === info.lessonId);
        const lessonsFromCourseFeed = courseLessons.length;
        const totalLessons = lessonsFromCourseFeed > 0
            ? lessonsFromCourseFeed
            : (matchedCourse?.lessons ?? info.totalLessons);
        const completedLessons = Math.min(info.completedLessons, totalLessons);
        const computedProgress = this.calculateCourseCompletionProgress(completedLessons, totalLessons);
        const normalizedProgress = Math.max(0, Math.min(100, computedProgress));
        let mediaType: 'video' | 'audio' | null = null;
        if (matchedLesson?.type === 'video' || matchedLesson?.type === 'audio') {
            mediaType = matchedLesson.type;
        } else if (info.lessonType === 'video' || info.lessonType === 'audio') {
            mediaType = info.lessonType;
        }
        const normalizedCurrentTime = typeof info.currentTime === 'string' && info.currentTime.trim().length > 0
            ? info.currentTime.trim()
            : '0:00';
        const normalizedTotalTime = typeof info.totalTime === 'string' && info.totalTime.trim().length > 0
            ? info.totalTime.trim()
            : '';
        const hasMediaProgress = !!mediaType
            && normalizedTotalTime.length > 0
            && normalizedTotalTime !== '0:00'
            && normalizedTotalTime !== '0m';

        return {
            stageNumber: info.stageNumber,
            courseId: info.courseId,
            courseName: info.courseName,
            categoryLabel: matchedCourse?.categoryLabel?.trim() ?? '',
            lessonId: info.lessonId,
            lessonNumber: info.lessonNumber,
            thumbnailUrl: toApiMediaUrl(info.thumbnailUrl ?? null) || '/images/recent-lesson-thumbnail.jpg',
            progress: normalizedProgress,
            mediaType,
            mediaProgressLabel: hasMediaProgress
                ? `${normalizedCurrentTime} / ${normalizedTotalTime}`
                : null,
            completedLessons,
            totalLessons,
        };
    }

    private calculateCourseCompletionProgress(completedLessons: number, totalLessons: number): number {
        if (totalLessons <= 0) {
            return 0;
        }

        return Math.round((Math.min(totalLessons, Math.max(0, completedLessons)) / totalLessons) * 100);
    }

    private buildStagesFromApi(
        apiStages: AcademyStageApi[],
        _stageProgress: StageProgress[],
        courseProgress: CourseProgress[],
        courses: AcademyCourse[]
    ): Stage[] {
        return apiStages.map((stageData) => {
            const isLocked = false;

            // Match courses to this stage using stageId (which equals stage.number)
            const stageCourses = courses.filter(course =>
                course.stageId === stageData.number || course.levelId === stageData.id
            );
            const stageCourseIds = new Set(stageCourses.map((course) => course.id));

            const sortedStageCourses = [...stageCourses];
            sortedStageCourses.sort((a: AcademyCourse, b: AcademyCourse) => (a.order ?? 0) - (b.order ?? 0));
            let allCourses = sortedStageCourses
                .map((course: AcademyCourse) => this.mapCourseWithProgress(course, courseProgress, stageCourseIds));

            // Safety valve: if a stage is unlocked but no course is actionable, open the first course.
            if (!isLocked && allCourses.length > 0 && allCourses.every((course) => course.status === 'locked')) {
                const [firstCourse, ...rest] = allCourses;
                allCourses = [{ ...firstCourse, status: 'available' }, ...rest];
            }

            return {
                id: stageData.id,
                number: stageData.number,
                title: stageData.title,
                description: stageData.description,
                isLocked,
                treeCourses: allCourses,
            };
        });
    }

    private mapCourseWithProgress(
        course: AcademyCourse,
        courseProgress: CourseProgress[],
        stageCourseIds: Set<string>,
    ): Course {
        const progress = courseProgress.find((cp) => cp.courseId === course.id);

        // Evaluate dynamic API prerequisites
        const effectivePrerequisites = (course.prerequisites ?? []).filter(
            (prereqId) => prereqId !== course.id && stageCourseIds.has(prereqId),
        );

        const hasUnfinishedPrereqs = effectivePrerequisites.some(prereqId => {
            const prereqProgress = courseProgress.find(cp => cp.courseId === prereqId);
            return prereqProgress?.status !== 'completed';
        });

        let status: CourseStatus = 'available';
        if (hasUnfinishedPrereqs) {
            status = 'locked';
        } else if (progress?.status === 'completed' || progress?.status === 'in-progress') {
            status = progress.status;
        }

        const totalLessons = Math.max(0, progress?.totalLessons ?? course.lessons);
        const completedLessons = Math.max(0, Math.min(totalLessons, progress?.completedLessons ?? 0));
        const normalizedProgress = status === 'completed'
            ? 100
            : this.calculateCourseCompletionProgress(completedLessons, totalLessons);

        return {
            id: course.id,
            title: course.title,
            category: course.category,
            categoryLabel: course.categoryLabel,
            lessons: totalLessons,
            duration: course.duration,
            progress: normalizedProgress,
            status,
            hasUnmetPrerequisites: hasUnfinishedPrereqs,
            thumbnailUrl: course.thumbnailUrl,
            prerequisites: course.prerequisites ?? []
        };
    }

    toggleNote(): void {
        this.showFullNote = !this.showFullNote;
    }

    continueLearning(): void {
        if (this.recentLesson) {
            this.router.navigate(
                ['course', this.recentLesson.courseId, 'lesson', this.recentLesson.lessonId],
                { relativeTo: this.route }
            );
        }
    }

    onCourseClick(course: Course | { id: string; status: string }): void {
        this.router.navigate(['course', course.id], { relativeTo: this.route });
    }

    trackByStageNumber(_index: number, stage: Stage): number {
        return stage.number;
    }

    trackByCourseId(_index: number, course: Course): string {
        return course.id;
    }

    onImageError(event: Event): void {
        const img = event.target as HTMLImageElement;
        if (!img.src.endsWith(this.fallbackImage)) {
            img.src = this.fallbackImage;
        }
    }

    get isGuestUser(): boolean {
        return !this.authService.isAuthenticated();
    }

    continueToSignIn(): void {
        void this.router.navigate(['/login'], {
            queryParams: { returnUrl: this.router.url },
        });
    }

    getCourseAriaLabel(course: Course): string {
        let status: string;
        if (course.status === 'locked') {
            status = 'Locked';
        } else if (course.status === 'completed') {
            status = 'Completed';
        } else if (course.status === 'in-progress') {
            status = 'In Progress';
        } else {
            status = 'Available';
        }
        return `${course.title}, ${course.lessons} lessons, ${course.duration}, ${status}, ${course.progress}% complete`;
    }
}
