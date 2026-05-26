import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { ACADEMY_COURSES } from '../../../core/services/academy-data';
import {
    AcademyBreadcrumbItem,
    AcademyPageShellComponent,
} from '../shared/academy-page-shell/academy-page-shell.component';
import { CongratulationsResolvedData } from './congratulations.resolver';

@Component({
    selector: 'app-congratulations',
    standalone: true,
    imports: [AcademyPageShellComponent],
    templateUrl: './congratulations.component.html',
    styleUrls: ['./congratulations.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CongratulationsComponent implements OnInit, OnDestroy {
    private readonly destroy$ = new Subject<void>();

    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly academyProgressService = inject(AcademyProgressService);

    courseId = '';
    private nextCourseId: string | null = null;

    readonly bannerImageUrl = '/backgrounds/course-background.png';

    readonly courseTitle = signal<string>('Prayer (Salah)');
    readonly nextCourseName = signal<string>('');
    readonly levelName = signal<string>('');

    readonly breadcrumbsBase: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];

    readonly breadcrumbs = computed<readonly AcademyBreadcrumbItem[]>(() => {
        const title = this.courseTitle().trim();
        const list: AcademyBreadcrumbItem[] = [...this.breadcrumbsBase];
        if (this.levelName()) {
            list.push({
                label: this.levelName(),
                link: ['/academy'],
            });
        }
        if (title) {
            list.push({
                label: title,
                link: ['/academy/course', this.courseId],
            });
        }
        return list;
    });

    constructor() { }

    get currentBreadcrumb(): string {
        return 'Quiz';
    }

    ngOnInit(): void {
        combineLatest([this.route.paramMap, this.route.queryParamMap])
            .pipe(takeUntil(this.destroy$))
            .subscribe(([params]) => {
                this.courseId = params.get('courseId') ?? '';
                this.nextCourseId = null;
                this.nextCourseName.set('');
            });

        this.route.data
            .pipe(takeUntil(this.destroy$))
            .subscribe((data) => {
                const resolved = data['resolvedCongratulationsData'] as CongratulationsResolvedData | null;
                if (resolved) {
                    this.handleResolvedData(resolved);
                }
            });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    goToNextCourse(): void {
        if (this.nextCourseId) {
            void this.router.navigate(['/academy/course', this.nextCourseId]);
            return;
        }

        void this.router.navigate(['/academy']);
    }

    private handleResolvedData(data: CongratulationsResolvedData): void {
        const normalizedTitle = data.course.title?.trim() ?? '';
        if (normalizedTitle && normalizedTitle.toLowerCase() !== 'unknown course') {
            this.courseTitle.set(normalizedTitle);
        }

        const levelTitle = (data.course as any).levelName || 'Course';
        this.levelName.set(levelTitle);

        if (data.nextCourse) {
            this.nextCourseId = data.nextCourse.id ?? null;
            this.nextCourseName.set(data.nextCourse.title?.trim() ?? '');
        } else {
            this.nextCourseId = null;
            this.nextCourseName.set('');
        }
    }
}
