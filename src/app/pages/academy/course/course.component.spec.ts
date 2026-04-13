/* eslint-disable no-undef */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject } from 'rxjs';

import { CourseComponent } from './course.component';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { QuizzesService } from '../../../core/services/quizzes.service';
import { AuthService } from '../../../core/services/auth.service';

describe('CourseComponent', () => {
    let component: CourseComponent;
    let fixture: ComponentFixture<CourseComponent>;

    const createCourse = (
        lessonsList: NonNullable<CourseComponent['course']>['lessonsList'],
        lessons: string[],
    ): NonNullable<CourseComponent['course']> => ({
        id: 'course-1',
        stageNumber: 1,
        stageLabel: 'Stage 1',
        title: 'Course title',
        intro: 'Course intro',
        lessons,
        answers: [],
        totalLessons: lessonsList.length,
        completedLessons: 0,
        duration: '0m',
        isLocked: false,
        hasUnmetPrerequisites: false,
        unmetPrerequisiteNames: [],
        lessonsList,
        prerequisitesList: [],
    });

    beforeEach(async () => {
        spyOn(CourseComponent.prototype, 'ngOnInit').and.stub();

        const routerEvents$ = new Subject<void>();
        const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
        Object.defineProperty(routerSpy, 'events', { value: routerEvents$.asObservable() });
        routerSpy.createUrlTree.and.returnValue({} as never);
        routerSpy.serializeUrl.and.returnValue('/');

        await TestBed.configureTestingModule({
            imports: [CourseComponent],
            providers: [
                {
                    provide: Router,
                    useValue: routerSpy,
                },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { paramMap: convertToParamMap({ id: 'course-1' }) },
                    },
                },
                { provide: AcademyProgressService, useValue: {} },
                { provide: QuizzesService, useValue: {} },
                { provide: AuthService, useValue: { isAuthenticated: () => true } },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CourseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should disable Begin when the course has no published lessons', () => {
        component.isLoading = false;
        component.course = createCourse([], []);
        fixture.detectChanges();

        expect(component.hasPublishedLessons).toBeFalse();
        expect(component.isBeginDisabled).toBeTrue();

        const beginButton = fixture.nativeElement.querySelector('button.btn-disabled') as HTMLButtonElement | null;
        expect(beginButton).toBeTruthy();
        expect(beginButton?.hasAttribute('disabled')).toBeTrue();
        expect(beginButton?.disabled).toBeTrue();
    });

    it('should enable Begin when the course has a published playable lesson', () => {
        component.course = createCourse(
            [
                {
                    id: 'lesson-1',
                    title: 'Lesson 1',
                    duration: '15m',
                    type: 'video',
                    isLocked: false,
                    isCompleted: false,
                    isCurrent: false,
                },
            ],
            ['Lesson 1'],
        );

        expect(component.hasPublishedLessons).toBeTrue();
        expect(component.isBeginDisabled).toBeFalse();
    });
});
