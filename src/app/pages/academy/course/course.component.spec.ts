/* eslint-disable no-undef */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of } from 'rxjs';

import { CourseComponent } from './course.component';
import { AcademyProgressService } from '../../../core/services/academy-progress.service';
import { QuizzesService } from '../../../core/services/quizzes.service';
import { AuthService } from '../../../core/services/auth.service';

describe('CourseComponent', () => {
    let component: CourseComponent;
    let fixture: ComponentFixture<CourseComponent>;
    let routerSpy: jasmine.SpyObj<Router>;
    let academyProgressServiceSpy: { enrollCurrentStudentInCourse: jasmine.Spy };
    const activatedRouteStub = {
        snapshot: { paramMap: convertToParamMap({ id: 'course-1' }) },
    };

    const createCourse = (
        lessonsList: NonNullable<CourseComponent['course']>['lessonsList'],
        lessons: string[],
    ): NonNullable<CourseComponent['course']> => ({
        id: 'course-1',
        stageNumber: 1,
        stageLabel: 'Stage 1',
        levelName: 'Level 1',
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
        isEnrolled: false,
        isEnrollmentCompleted: false,
        lessonsList,
        prerequisitesList: [],
        quizzesList: [],
    });

    beforeEach(async () => {
        spyOn(CourseComponent.prototype, 'ngOnInit').and.stub();

        const routerEvents$ = new Subject<void>();
        routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
        Object.defineProperty(routerSpy, 'events', { value: routerEvents$.asObservable() });
        routerSpy.createUrlTree.and.returnValue({} as never);
        routerSpy.serializeUrl.and.returnValue('/');
        academyProgressServiceSpy = {
            enrollCurrentStudentInCourse: jasmine.createSpy().and.returnValue(of(true)),
        };

        await TestBed.configureTestingModule({
            imports: [CourseComponent],
            providers: [
                {
                    provide: Router,
                    useValue: routerSpy,
                },
                {
                    provide: ActivatedRoute,
                    useValue: activatedRouteStub,
                },
                { provide: AcademyProgressService, useValue: academyProgressServiceSpy },
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

    it('should show Continue and skip enrollment when the course enrollment is completed', () => {
        component.isLoading = false;
        component.course = {
            ...createCourse(
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
            ),
            isEnrolled: false,
            isEnrollmentCompleted: true,
        };

        fixture.detectChanges();

        const actionLabel = fixture.nativeElement.querySelector('button.btn-primary span') as HTMLSpanElement | null;
        expect(actionLabel?.textContent?.trim()).toBe('Continue');

        component.onBeginClick();

        expect(academyProgressServiceSpy.enrollCurrentStudentInCourse).not.toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['lesson', 'lesson-1'], {
            relativeTo: activatedRouteStub as ActivatedRoute,
        });
    });

    it('should show Continue and skip enrollment when the course is already enrolled', () => {
        component.isLoading = false;
        component.course = {
            ...createCourse(
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
            ),
            isEnrolled: true,
            isEnrollmentCompleted: false,
        };

        fixture.detectChanges();

        const actionLabel = fixture.nativeElement.querySelector('button.btn-primary span') as HTMLSpanElement | null;
        expect(actionLabel?.textContent?.trim()).toBe('Continue');

        component.onBeginClick();

        expect(academyProgressServiceSpy.enrollCurrentStudentInCourse).not.toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['lesson', 'lesson-1'], {
            relativeTo: activatedRouteStub as ActivatedRoute,
        });
    });

    it('should send enrolled users to the next uncompleted lesson', () => {
        component.isLoading = false;
        component.course = {
            ...createCourse(
                [
                    {
                        id: 'lesson-1',
                        title: 'Lesson 1',
                        duration: '15m',
                        type: 'video',
                        isLocked: false,
                        isCompleted: true,
                        isCurrent: false,
                    },
                    {
                        id: 'lesson-2',
                        title: 'Lesson 2',
                        duration: '10m',
                        type: 'article',
                        isLocked: false,
                        isCompleted: false,
                        isCurrent: false,
                    },
                ],
                ['Lesson 1', 'Lesson 2'],
            ),
            isEnrolled: true,
            isEnrollmentCompleted: false,
        };

        fixture.detectChanges();
        component.onBeginClick();

        expect(academyProgressServiceSpy.enrollCurrentStudentInCourse).not.toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['lesson', 'lesson-2'], {
            relativeTo: activatedRouteStub as ActivatedRoute,
        });
    });

    it('should open the first lesson by default when course is not enrolled', () => {
        component.isLoading = false;
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
                {
                    id: 'lesson-2',
                    title: 'Lesson 2',
                    duration: '10m',
                    type: 'article',
                    isLocked: false,
                    isCompleted: false,
                    isCurrent: false,
                },
            ],
            ['Lesson 1', 'Lesson 2'],
        );

        fixture.detectChanges();

        const actionLabel = fixture.nativeElement.querySelector('button.btn-primary span') as HTMLSpanElement | null;
        expect(actionLabel?.textContent?.trim()).toBe('Enroll');

        component.onBeginClick();

        expect(routerSpy.navigate).toHaveBeenCalledWith(['lesson', 'lesson-1'], {
            relativeTo: activatedRouteStub as ActivatedRoute,
        });
        expect(academyProgressServiceSpy.enrollCurrentStudentInCourse).toHaveBeenCalledWith('course-1');
    });
});
