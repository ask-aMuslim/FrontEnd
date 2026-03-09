import { ChangeDetectorRef, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AcademyProgressService } from '../../core/services/academy-progress.service';
import {
    AcademyCourse,
    AcademyStageApi,
    RecentLessonInfo,
    StageProgress,
    CourseProgress,
    CourseStatus,
    AcademyCourse,
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
    lessonId: string;
    lessonNumber: number;
    thumbnailUrl: string;
    progress: number;
    currentTime: string;
    totalTime: string;
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

    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly academyProgressService: AcademyProgressService,
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
        this.loadAcademyData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadAcademyData(): void {
        combineLatest([
            this.academyProgressService.getAcademyStages(),
            this.academyProgressService.getAcademyCourses(),
            this.academyProgressService.getStudentProgress(),
        ])
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ([apiStages, courses, progress]) => {
                    if (progress.recentLesson) {
                        this.recentLesson = this.mapRecentLesson(progress.recentLesson);
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

    private mapRecentLesson(info: RecentLessonInfo): RecentLesson {
        return {
            stageNumber: info.stageNumber,
            courseId: info.courseId,
            courseName: info.courseName,
            lessonId: info.lessonId,
            lessonNumber: info.lessonNumber,
            thumbnailUrl: toApiMediaUrl(info.thumbnailUrl ?? null) || '/images/recent-lesson-thumbnail.jpg',
            progress: info.progress,
            currentTime: info.currentTime,
            totalTime: info.totalTime,
            completedLessons: info.completedLessons,
            totalLessons: info.totalLessons,
        };
    }

    private buildStagesFromApi(
        apiStages: AcademyStageApi[],
        stageProgress: StageProgress[],
        courseProgress: CourseProgress[],
        courses: AcademyCourse[]
    ): Stage[] {
        return apiStages.map((stageData) => {
            const stageProg = stageProgress.find((sp) => sp.stageNumber === stageData.number);
            const isLocked = stageData.number > 1 && !stageProg?.isUnlocked;

            // Match courses to this stage using stageId (which equals stage.number)
            const stageCourses = courses.filter(course =>
                course.stageId === stageData.number || course.levelId === stageData.id
            );
            const stageCourseIds = new Set(stageCourses.map((course) => course.id));

            const sortedStageCourses = [...stageCourses];
            sortedStageCourses.sort((a: AcademyCourse, b: AcademyCourse) => (a.order ?? 0) - (b.order ?? 0));
            let allCourses = sortedStageCourses
                .map((course: AcademyCourse) => this.mapCourseWithProgress(course, courseProgress, isLocked, stageCourseIds));

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
        stageLocked: boolean,
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

        const isCurrentlyLocked = stageLocked || hasUnfinishedPrereqs;

        return {
            id: course.id,
            title: course.title,
            category: course.category,
            categoryLabel: course.categoryLabel,
            lessons: course.lessons,
            duration: course.duration,
            progress: progress?.progress ?? 0,
            status: isCurrentlyLocked ? 'locked' : (progress?.status ?? 'available'),
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
        if (course.status !== 'locked' && course.status !== 'unknown') {
            this.router.navigate(['course', course.id], { relativeTo: this.route });
        }
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
