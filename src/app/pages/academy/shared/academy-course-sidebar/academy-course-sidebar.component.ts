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
    title: string;
    duration: string;
    type?: string;
    isCompleted?: boolean;
    isCurrent?: boolean;
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
    @Input() allowLessonSelection = true;
    @Input() disableLockedLessonClick = true;

    @Input() overviewLink: AcademySidebarLink | null = null;
    @Input() overviewLinkLabel = 'Overview page';

    @Output() lessonSelect = new EventEmitter<AcademySidebarLessonItem>();

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
}
