import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import type { AcademyResolvedData } from './academy.resolver';

interface Course extends TreeCourse {
    id: string;
    title: string;
    category: string;
    categoryLabel: string;
    lessons: number;
    completedLessonsCount: number;
    totalLessonsCount: number;
    completedQuizzesCount: number;
    totalQuizzesCount: number;
    duration: string;
    progress: number;
    status: CourseStatus;
    hasUnmetPrerequisites: boolean;
    thumbnailUrl?: string;
}

interface Stage {
    id: string;
    number: number;
    title: string;
    description: string;
    isLocked: boolean;
    treeCourses: Course[];
}

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
    completedQuizzes: number;
    totalQuizzes: number;
}

@Component({
    selector: 'app-academy',
    standalone: true,
    imports: [CourseTreeComponent, AsyncPipe],
    templateUrl: './academy.component.html',
    styleUrls: ['./academy.component.scss'],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AcademyComponent implements OnInit {
    private readonly academyProgressService = inject(AcademyProgressService);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly authService = inject(AuthService);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly fallbackImage = '/ask-a-muslim-logo.png';
    recentLesson: RecentLesson | null = null;
    hasRecentLesson = false;
    importantNote = 'The Academy consists of multiple stages. Each stage includes a list of courses covering the meaning of belief, true Islamic values from the prophet Mohamed (peace be upon him) and his companions, and important topics we face every day. Each course consists of lessons that will guide you step by step. You can take notes while learning and share them with your scholar. This Academy for new Muslims was created by 40+ scholars from the Islamic Center of America and is endorsed by the International Union of Muslim Scholars.';
    showFullNote = false;
    stages: Stage[] = [];
    error: string | null = null;

    get isRefreshingProgress$() {
        return this.academyProgressService.isRefreshingProgress$;
    }

    ngOnInit(): void {
        if (this.isGuestUser) {
            this.error = null;
            return;
        }

        const resolved = this.route.snapshot.data['academyData'] as AcademyResolvedData | null;
        if (!resolved) {
            this.error = 'Unable to load academy content right now. Please try again.';
            return;
        }

        this.applyResolvedData(resolved);
    }

    private applyResolvedData(resolved: AcademyResolvedData): void {
        const { stages, courses, progress, recentCourseLessons } = resolved;

        if (progress.recentLesson) {
            this.recentLesson = this.mapRecentLesson(progress.recentLesson, courses, recentCourseLessons);
            this.hasRecentLesson = true;
        } else {
            this.recentLesson = null;
            this.hasRecentLesson = false;
        }

        this.stages = this.buildStagesFromApi(
            stages,
            progress.stageProgress,
            progress.courseProgress,
            courses,
        );
        this.error = null;
        this.cdr.detectChanges();
    }

    private mapRecentLesson(
        info: RecentLessonInfo,
        courses: AcademyCourse[],
        courseLessons: AcademyLesson[],
    ): RecentLesson {
        const matchedCourse = courses.find((course) => course.id === info.courseId);
        const matchedLesson = courseLessons.find((lesson) => lesson.id === info.lessonId);
        const lessonsFromCourseFeed = courseLessons.filter((lesson) => lesson.type !== 'quiz').length;
        const totalLessons = Math.max(0, lessonsFromCourseFeed, matchedCourse?.lessons ?? 0);
        const totalCourseItems = Math.max(0, info.totalLessons, courseLessons.length, totalLessons);
        const completedCourseItems = Math.min(totalCourseItems, Math.max(0, info.completedLessons));
        const completedLessons = Math.min(totalLessons, completedCourseItems);
        const totalQuizzes = Math.max(0, totalCourseItems - totalLessons);
        const completedQuizzes = Math.max(
            0,
            Math.min(totalQuizzes, completedCourseItems - completedLessons),
        );
        const computedProgress = this.calculateCourseCompletionProgress(completedCourseItems, totalCourseItems);
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
            completedQuizzes,
            totalQuizzes,
        };
    }

    private calculateCourseCompletionProgress(completedLessons: number, totalLessons: number): number {
        if (totalLessons <= 0) return 0;
        return Math.round((Math.min(totalLessons, Math.max(0, completedLessons)) / totalLessons) * 100);
    }

    private buildStagesFromApi(
        apiStages: AcademyStageApi[],
        _stageProgress: StageProgress[],
        courseProgress: CourseProgress[],
        courses: AcademyCourse[],
    ): Stage[] {
        return apiStages.map((stageData) => {
            const isLocked = false;
            const stageCourses = courses.filter(course =>
                course.stageId === stageData.number || course.levelId === stageData.id,
            );
            const sortedStageCourses = [...stageCourses];
            sortedStageCourses.sort((a: AcademyCourse, b: AcademyCourse) => (a.order ?? 0) - (b.order ?? 0));
            let allCourses = sortedStageCourses
                .map((course: AcademyCourse) => this.mapCourseWithProgress(course, courseProgress));

            if (!isLocked && allCourses.length > 0 && allCourses.every((course) => course.status === 'locked')) {
                const [firstCourse, ...rest] = allCourses;
                allCourses = [{ ...firstCourse, status: 'available' as CourseStatus }, ...rest];
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
    ): Course {
        const progress = courseProgress.find((cp) => cp.courseId === course.id);

        const effectivePrerequisites = (course.prerequisites ?? []).filter(
            (prereqId) => prereqId !== course.id,
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

        const totalLessonsOnly = Math.max(0, course.lessons);
        const totalCourseItems = Math.max(0, progress?.totalLessons ?? totalLessonsOnly);
        const completedCourseItems = Math.max(0, Math.min(totalCourseItems, progress?.completedLessons ?? 0));
        const totalQuizzes = Math.max(0, totalCourseItems - totalLessonsOnly);
        const completedLessons = Math.max(0, Math.min(totalLessonsOnly, completedCourseItems));
        const completedQuizzesByOverflow = Math.max(
            0,
            Math.min(totalQuizzes, completedCourseItems - completedLessons),
        );
        let completedQuizzes = 0;
        if (totalQuizzes > 0) {
            completedQuizzes = progress?.quizPassed
                ? totalQuizzes
                : completedQuizzesByOverflow;
        }

        const normalizedProgress = status === 'completed'
            ? 100
            : this.calculateCourseCompletionProgress(completedCourseItems, totalCourseItems);

        return {
            id: course.id,
            title: course.title,
            category: course.category,
            categoryLabel: course.categoryLabel,
            lessons: totalLessonsOnly,
            completedLessonsCount: completedLessons,
            totalLessonsCount: totalLessonsOnly,
            completedQuizzesCount: completedQuizzes,
            totalQuizzesCount: totalQuizzes,
            duration: course.duration,
            progress: normalizedProgress,
            status,
            hasUnmetPrerequisites: hasUnfinishedPrereqs,
            thumbnailUrl: course.thumbnailUrl,
            prerequisites: course.prerequisites ?? [],
        };
    }

    toggleNote(): void {
        this.showFullNote = !this.showFullNote;
    }

    continueLearning(): void {
        if (this.recentLesson) {
            this.router.navigate(
                ['course', this.recentLesson.courseId, 'lesson', this.recentLesson.lessonId],
                { relativeTo: this.route },
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
        return `${course.title}, ${course.completedLessonsCount} out of ${course.totalLessonsCount} lessons, ${course.completedQuizzesCount} out of ${course.totalQuizzesCount} quizzes, ${course.duration}, ${status}, ${course.progress}% complete`;
    }
}
