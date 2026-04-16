import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademyComponent } from './academy.component';
import { AcademyCourse, AcademyLesson, CourseProgress, RecentLessonInfo } from '../../core/models/interfaces/academy-progress.model';

describe('AcademyComponent', () => {
    let component: AcademyComponent;
    let fixture: ComponentFixture<AcademyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademyComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(AcademyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should derive recent lesson progress from completed lessons', () => {
        const academyComponent = component as unknown as {
            mapRecentLesson: (
                info: RecentLessonInfo,
                courses: AcademyCourse[],
                courseLessons: AcademyLesson[],
            ) => {
                completedLessons: number;
                totalLessons: number;
                progress: number;
            } | null;
        };

        const recentLesson = academyComponent.mapRecentLesson(
            {
                stageNumber: 1,
                courseId: 'course-1',
                courseName: 'Course title',
                lessonId: 'lesson-2',
                lessonType: 'video',
                lessonNumber: 2,
                lessonTitle: 'Lesson 2',
                thumbnailUrl: '',
                progress: 95,
                currentTime: '0:00',
                totalTime: '10:00',
                completedLessons: 2,
                totalLessons: 3,
            },
            [{
                id: 'course-1',
                stageId: 1,
                title: 'Course title',
                category: 'main-believes',
                categoryLabel: 'Belief',
                lessons: 3,
                duration: '30m',
                isPublished: true,
                prerequisites: [],
            }],
            [
                {
                    id: 'lesson-1',
                    courseId: 'course-1',
                    title: 'Lesson 1',
                    duration: '10m',
                    type: 'video',
                    order: 1,
                },
                {
                    id: 'lesson-2',
                    courseId: 'course-1',
                    title: 'Lesson 2',
                    duration: '10m',
                    type: 'video',
                    order: 2,
                },
                {
                    id: 'lesson-3',
                    courseId: 'course-1',
                    title: 'Lesson 3',
                    duration: '10m',
                    type: 'video',
                    order: 3,
                },
            ],
        );

        expect(recentLesson).not.toBeNull();
        expect(recentLesson?.completedLessons).toBe(2);
        expect(recentLesson?.totalLessons).toBe(3);
        expect(recentLesson?.progress).toBe(67);
    });

    it('should use recent lesson progress totals when course lesson feed is unavailable', () => {
        const academyComponent = component as unknown as {
            mapRecentLesson: (
                info: RecentLessonInfo,
                courses: AcademyCourse[],
                courseLessons: AcademyLesson[],
            ) => {
                completedLessons: number;
                totalLessons: number;
                progress: number;
            } | null;
        };

        const recentLesson = academyComponent.mapRecentLesson(
            {
                stageNumber: 1,
                courseId: 'course-1',
                courseName: 'Course title',
                lessonId: 'lesson-6',
                lessonType: 'video',
                lessonNumber: 6,
                lessonTitle: 'Lesson 6',
                thumbnailUrl: '',
                progress: 86,
                currentTime: '0:00',
                totalTime: '10:00',
                completedLessons: 6,
                totalLessons: 7,
            },
            [{
                id: 'course-1',
                stageId: 1,
                title: 'Course title',
                category: 'main-believes',
                categoryLabel: 'Belief',
                lessons: 6,
                duration: '30m',
                isPublished: true,
                prerequisites: [],
            }],
            [],
        );

        expect(recentLesson).not.toBeNull();
        expect(recentLesson?.completedLessons).toBe(6);
        expect(recentLesson?.totalLessons).toBe(7);
        expect(recentLesson?.progress).toBe(86);
    });

    it('should keep quiz lessons out of the course-card lesson count while preserving quiz progress', () => {
        const academyComponent = component as unknown as {
            mapCourseWithProgress: (
                course: AcademyCourse,
                courseProgress: CourseProgress[],
            ) => {
                lessons: number;
                progress: number;
                status: string;
            };
        };

        const mappedCourse = academyComponent.mapCourseWithProgress(
            {
                id: 'course-1',
                stageId: 1,
                title: 'Course title',
                category: 'main-believes',
                categoryLabel: 'Belief',
                lessons: 6,
                duration: '30m',
                isPublished: true,
                prerequisites: [],
            },
            [{
                courseId: 'course-1',
                status: 'completed',
                progress: 100,
                completedLessons: 7,
                totalLessons: 7,
                quizPassed: true,
            }],
        );

        expect(mappedCourse.lessons).toBe(6);
        expect(mappedCourse.progress).toBe(100);
        expect(mappedCourse.status).toBe('completed');
    });
});
