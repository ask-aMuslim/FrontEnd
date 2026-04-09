import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import {
    AcademyCourseSidebarComponent,
    AcademySidebarLessonItem,
    AcademySidebarLink,
} from '../academy-course-sidebar/academy-course-sidebar.component';

@Component({
    selector: 'app-academy-sidebar-host',
    standalone: true,
    imports: [AcademyCourseSidebarComponent],
    templateUrl: './academy-sidebar-host.component.html',
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
    @Input() allowLessonSelection = true;
    @Input() disableLockedLessonClick = true;

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

    onLessonSelect(lesson: AcademySidebarLessonItem): void {
        this.lessonSelect.emit(lesson);
    }
}