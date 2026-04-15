import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';
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
    selector: 'app-academy-course-sidebar',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './academy-course-sidebar.component.html',
    styleUrls: ['./academy-course-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcademyCourseSidebarComponent {
    @Input() ariaLabel = 'Course lessons';
    @Input({ required: true }) stageLabel = '';
    @Input({ required: true }) title = '';
    @Input() stats: readonly string[] = [];
    @Input() lessons: readonly AcademySidebarLessonItem[] = [];

    @Input() showReadyDividerBeforeQuiz = false;
    @Input() highlightReadyDividerBeforeQuiz = false;
    @Input() allowLessonSelection = true;
    @Input() disableLockedLessonClick = true;
    @Input() scrollThreshold = 6;

    @Input() overviewLink: AcademySidebarLink | null = null;
    @Input() overviewLinkLabel = 'Overview page';

    @Output() lessonSelect = new EventEmitter<AcademySidebarLessonItem>();

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
            return '/academy/checked.svg';
        }

        switch (lesson.type) {
            case 'article':
                return '/academy/article-lesson.svg';
            case 'audio':
                return '/academy/audio-lesson.svg';
            case 'document':
                return '/academy/document-lesson.svg';
            case 'quiz':
                return '/academy/quiz.svg';
            case 'video':
                return '/academy/video-lesson.svg';
            default:
                return '/academy/video-lesson.svg';
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
