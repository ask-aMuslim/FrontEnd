import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

export type AcademySidebarLink = string | Array<string | number>;

export interface AcademySidebarLessonItem {
    id: string;
    quizLessonId?: string;
    title: string;
    duration: string;
    type?: string;
    isCompleted?: boolean;
    isCurrent?: boolean;
    isLastCourseLesson?: boolean;
    isLocked?: boolean;
    isPending?: boolean;
    hasNotification?: boolean;
}

@Component({
    selector: 'app-academy-sidebar-host',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './academy-sidebar-host.component.html',
    styleUrls: ['./academy-sidebar-host.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademySidebarHostComponent {
    @Input() ariaLabel = 'Course lessons';
    @Input() stageNumber: number | null = null;
    @Input() stageLabelOverride = '';
    @Input({ required: true }) title = '';
    @Input() lessons: readonly AcademySidebarLessonItem[] = [];

    @Input() currentLessonNumber: number | null = null;
    @Input() totalLessons: number | null = null;
    @Input() duration = '';

    @Input() overviewLink: AcademySidebarLink | null = null;
    @Input() overviewLinkLabel = 'Course overview';

    @Input() showReadyDividerBeforeQuiz = false;
    @Input() highlightReadyDividerBeforeQuiz = false;
    @Input() allowLessonSelection = true;
    @Input() disableLockedLessonClick = true;
    @Input() scrollThreshold = 6;

    @Output() lessonSelect = new EventEmitter<AcademySidebarLessonItem>();

    get stageLabel(): string {
        const customStageLabel = this.stageLabelOverride.trim();
        if (customStageLabel.length > 0) {
            return customStageLabel;
        }

        if (this.stageNumber === null || Number.isNaN(this.stageNumber)) {
            return 'Stage';
        }

        return `Stage ${this.stageNumber}`;
    }

    get stats(): readonly string[] {
        const stats: string[] = [];

        if (
            this.currentLessonNumber !== null
            && this.currentLessonNumber > 0
            && this.totalLessons !== null
            && this.totalLessons > 0
        ) {
            stats.push(`Lesson: ${this.currentLessonNumber}/${this.totalLessons}`);
        } else if (this.totalLessons !== null && this.totalLessons > 0) {
            stats.push(`Lessons: ${this.totalLessons}`);
        }

        const durationValue = this.duration.trim();
        if (durationValue.length > 0 && !this.isZeroDuration(durationValue)) {
            stats.push(`Duration: ${durationValue}`);
        }

        return stats;
    }

    private isZeroDuration(duration: string): boolean {
        const normalized = duration.trim().toLowerCase();
        return normalized === '0m'
            || normalized === '0:00'
            || normalized === '00:00'
            || normalized === '0h 0m'
            || normalized === '0h 00m';
    }

    get shouldEnableScroll(): boolean {
        return this.lessons.length > this.scrollThreshold;
    }

    trackByLessonId(_index: number, lesson: AcademySidebarLessonItem): string {
        return lesson.id;
    }

    isLessonDisabled(lesson: AcademySidebarLessonItem): boolean {
        if (!this.allowLessonSelection) {
            return true;
        }

        const isLocked = lesson.isLocked || lesson.isPending;
        return !!isLocked && this.disableLockedLessonClick;
    }

    onLessonClick(lesson: AcademySidebarLessonItem): void {
        if (this.isLessonDisabled(lesson)) {
            return;
        }

        this.lessonSelect.emit(lesson);
    }

    shouldShowDuration(lesson: AcademySidebarLessonItem): boolean {
        if (lesson.type === 'quiz') {
            return false;
        }

        return lesson.duration.trim().length > 0;
    }

    getLessonIconPath(lesson: AcademySidebarLessonItem): string {
        if (lesson.isCompleted) {
            return '/academy-assets/checked.svg';
        }

        switch (lesson.type) {
            case 'article':
                return '/academy-assets/article-lesson.svg';
            case 'audio':
                return '/academy-assets/audio-lesson.svg';
            case 'document':
                return '/academy-assets/document-lesson.svg';
            case 'quiz':
                return '/academy-assets/quiz.svg';
            case 'video':
                return '/academy-assets/video-lesson.svg';
            default:
                return '/academy-assets/video-lesson.svg';
        }
    }

    getLessonIconAlt(lesson: AcademySidebarLessonItem): string {
        if (lesson.isCompleted) {
            return 'Completed lesson';
        }

        switch (lesson.type) {
            case 'article':
                return 'Article lesson';
            case 'audio':
                return 'Audio lesson';
            case 'document':
                return 'Document lesson';
            case 'quiz':
                return 'Quiz';
            case 'video':
                return 'Video lesson';
            default:
                return 'Lesson';
        }
    }
}
