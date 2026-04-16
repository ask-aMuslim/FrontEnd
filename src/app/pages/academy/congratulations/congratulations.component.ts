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

    readonly breadcrumbsBase: readonly AcademyBreadcrumbItem[] = [
        { label: 'Academy', link: ['/academy'] },
    ];

    readonly breadcrumbs = computed<readonly AcademyBreadcrumbItem[]>(() => {
        const title = this.courseTitle().trim();

        if (!title) {
            return [...this.breadcrumbsBase];
        }

        return [
            ...this.breadcrumbsBase,
            {
                label: title,
                link: ['/academy/course', this.courseId],
            },
        ];
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

                this.loadCourseTitle();
                this.resolveNextCourse();
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

    private loadCourseTitle(): void {
        if (!this.courseId) {
            return;
        }

        const cachedCourse = this.academyProgressService.getCourseById(this.courseId);
        if (cachedCourse?.title?.trim()) {
            this.courseTitle.set(cachedCourse.title);
        }

        const staticCourse = ACADEMY_COURSES.find((course) => course.id === this.courseId);
        if (staticCourse?.title?.trim()) {
            this.courseTitle.set(staticCourse.title);
        }

        this.academyProgressService
            .getAcademyCourseById(this.courseId)
            .pipe(
                takeUntil(this.destroy$),
                catchError(() => of(null)),
            )
            .subscribe((course) => {
                const normalizedTitle = course?.title?.trim() ?? '';
                if (!normalizedTitle || normalizedTitle.toLowerCase() === 'unknown course') {
                    return;
                }

                this.courseTitle.set(normalizedTitle);
            });
    }

    private resolveNextCourse(): void {
        if (!this.courseId) {
            return;
        }

        this.academyProgressService
            .getAcademyCourses()
            .pipe(
                takeUntil(this.destroy$),
                catchError(() => of([])),
            )
            .subscribe((courses) => {
                const orderedCourses = [...courses].sort((left, right) => {
                    const stageDifference = (left.stageId ?? 0) - (right.stageId ?? 0);
                    if (stageDifference !== 0) {
                        return stageDifference;
                    }

                    const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
                    const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;
                    if (leftOrder !== rightOrder) {
                        return leftOrder - rightOrder;
                    }

                    return left.title.localeCompare(right.title);
                });

                const currentIndex = orderedCourses.findIndex((course) => course.id === this.courseId);
                const nextCourse = currentIndex >= 0 ? orderedCourses[currentIndex + 1] : undefined;

                this.nextCourseId = nextCourse?.id ?? null;
                this.nextCourseName.set(nextCourse?.title?.trim() ?? '');
            });
    }
}
