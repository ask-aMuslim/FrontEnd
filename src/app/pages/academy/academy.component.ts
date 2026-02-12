import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AcademyProgressService } from '../../core/services/academy-progress.service';
import { ACADEMY_STAGES, getStageCoursesGrouped } from '../../core/services/academy-data';
import {
    RecentLessonInfo,
    StageProgress,
    CourseProgress,
    CourseStatus,
} from '../../core/models/interfaces/academy-progress.model';

/**
 * Course interface for template binding
 */
interface Course {
    id: string;
    title: string;
    category: string;
    lessons: number;
    duration: string;
    progress: number;
    status: CourseStatus;
}

/**
 * Stage interface for template binding
 */
interface Stage {
    number: number;
    title: string;
    description: string;
    isLocked: boolean;
    courses: {
        mainBelieves: Course[];
        modelsStories: Course[];
        socialTopics: Course[];
    };
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
    imports: [],
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
    ) { }

    readonly fallbackImage = '/ask-a-muslim-logo.png';
    recentLesson: RecentLesson | null = null;
    hasRecentLesson = false;
    importantNote = 'The Academy consists of three stages. Each stage includes a list of courses covering the meaning of belief, true Islamic values from the prophet Mohamed (peace be upon him) and his companions, and important topics we face every day. Each course consists of lessons that will guide you step by step. You can take notes while learning and share them with your scholar. This Academy for new Muslims was created by 40+ scholars from the Islamic Center of America and is endorsed by the International Union of Muslim Scholars.';
    showFullNote = false;
    stages: Stage[] = [];
    isLoading = true;

    ngOnInit(): void {
        this.loadProgressData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private loadProgressData(): void {
        this.academyProgressService
            .getStudentProgress()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (progress) => {
                    if (progress.recentLesson) {
                        this.recentLesson = this.mapRecentLesson(progress.recentLesson);
                        this.hasRecentLesson = true;
                    }
                    this.stages = this.buildStagesWithProgress(progress.stageProgress, progress.courseProgress);
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Error loading progress:', err);
                    this.isLoading = false;
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
            thumbnailUrl: info.thumbnailUrl || '/images/recent-lesson-thumbnail.jpg',
            progress: info.progress,
            currentTime: info.currentTime,
            totalTime: info.totalTime,
            completedLessons: info.completedLessons,
            totalLessons: info.totalLessons,
        };
    }

    private buildStagesWithProgress(
        stageProgress: StageProgress[],
        courseProgress: CourseProgress[]
    ): Stage[] {
        return ACADEMY_STAGES.map((stageData) => {
            const stageProg = stageProgress.find((sp) => sp.stageNumber === stageData.number);
            const isLocked = !stageProg?.isUnlocked;
            const groupedCourses = getStageCoursesGrouped(stageData.number);

            return {
                number: stageData.number,
                title: stageData.title,
                description: stageData.description,
                isLocked,
                courses: {
                    mainBelieves: groupedCourses.mainBelieves.map((course) =>
                        this.mapCourseWithProgress(course, courseProgress, isLocked)
                    ),
                    modelsStories: groupedCourses.modelsStories.map((course) =>
                        this.mapCourseWithProgress(course, courseProgress, isLocked)
                    ),
                    socialTopics: groupedCourses.socialTopics.map((course) =>
                        this.mapCourseWithProgress(course, courseProgress, isLocked)
                    ),
                },
            };
        });
    }

    private mapCourseWithProgress(
        course: any,
        courseProgress: CourseProgress[],
        stageLocked: boolean
    ): Course {
        const progress = courseProgress.find((cp) => cp.courseId === course.id);
        return {
            id: course.id,
            title: course.title,
            category: course.categoryLabel,
            lessons: course.lessons,
            duration: course.duration,
            progress: progress?.progress ?? 0,
            status: stageLocked ? 'locked' : (progress?.status ?? 'available'),
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

    onCourseClick(course: Course): void {
        if (course.status !== 'locked') {
            this.router.navigate(['course', course.id], { relativeTo: this.route });
        }
    }

    trackByStageNumber(index: number, stage: Stage): number {
        return stage.number;
    }

    trackByCourseId(index: number, course: Course): string {
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
