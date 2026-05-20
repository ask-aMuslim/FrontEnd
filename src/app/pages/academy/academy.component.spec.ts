import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademyComponent } from './academy.component';
import { AcademyCourse, CourseProgress, RecentLessonInfo } from '../../core/models/interfaces/academy-progress.model';

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
            ) => {
                completedLessons: number;
                totalLessons: number;
                completedQuizzes: number;
                totalQuizzes: number;
                progress: number;
            } | null;
        };

        const recentLesson = academyComponent.mapRecentLesson({
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
        );

        expect(recentLesson).not.toBeNull();
        expect(recentLesson?.completedLessons).toBe(2);
        expect({
            totalLessons: recentLesson?.totalLessons,
            completedQuizzes: recentLesson?.completedQuizzes,
            totalQuizzes: recentLesson?.totalQuizzes,
        }).toEqual({
            totalLessons: 3,
            completedQuizzes: 0,
            totalQuizzes: 0,
        });
        expect(recentLesson?.progress).toBe(67);
    });

    it('should use recent lesson progress totals when course lesson feed is unavailable', () => {
        const academyComponent = component as unknown as {
            mapRecentLesson: (
                info: RecentLessonInfo,
                courses: AcademyCourse[],
            ) => {
                completedLessons: number;
                totalLessons: number;
                completedQuizzes: number;
                totalQuizzes: number;
                progress: number;
            } | null;
        };

        const recentLesson = academyComponent.mapRecentLesson({
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
        );

        expect(recentLesson).not.toBeNull();
        expect(recentLesson?.completedLessons).toBe(6);
        expect({
            totalLessons: recentLesson?.totalLessons,
            completedQuizzes: recentLesson?.completedQuizzes,
            totalQuizzes: recentLesson?.totalQuizzes,
        }).toEqual({
            totalLessons: 6,
            completedQuizzes: 0,
            totalQuizzes: 0,
        });
        expect(recentLesson?.progress).toBe(86);
    });

    it('should keep quiz-inclusive progress when recent lesson feed omits standalone quiz items', () => {
        const academyComponent = component as unknown as {
            mapRecentLesson: (
                info: RecentLessonInfo,
                courses: AcademyCourse[],
            ) => {
                completedLessons: number;
                totalLessons: number;
                completedQuizzes: number;
                totalQuizzes: number;
                progress: number;
            } | null;
        };

        const recentLesson = academyComponent.mapRecentLesson({
            stageNumber: 1,
            courseId: 'course-1',
            courseName: 'Course title',
            lessonId: 'lesson-6',
            lessonType: 'video',
            lessonNumber: 6,
            lessonTitle: 'Lesson 6',
            thumbnailUrl: '',
            progress: 0,
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
        );

        expect(recentLesson).not.toBeNull();
        expect(recentLesson?.completedLessons).toBe(6);
        expect({
            totalLessons: recentLesson?.totalLessons,
            completedQuizzes: recentLesson?.completedQuizzes,
            totalQuizzes: recentLesson?.totalQuizzes,
        }).toEqual({
            totalLessons: 6,
            completedQuizzes: 0,
            totalQuizzes: 0,
        });
        expect(recentLesson?.progress).toBe(86);
    });

    it('should keep quiz lessons out of the course-card lesson count while preserving quiz progress', () => {
        const academyComponent = component as unknown as {
            mapCourseWithProgress: (
                course: AcademyCourse,
                courseProgress: CourseProgress[],
            ) => {
                lessons: number;
                completedLessonsCount: number;
                totalLessonsCount: number;
                completedQuizzesCount: number;
                totalQuizzesCount: number;
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
        expect(mappedCourse.completedLessonsCount).toBe(6);
        expect(mappedCourse.totalLessonsCount).toBe(6);
        expect(mappedCourse.completedQuizzesCount).toBe(1);
        expect(mappedCourse.totalQuizzesCount).toBe(1);
        expect(mappedCourse.progress).toBe(100);
        expect(mappedCourse.status).toBe('completed');
    });

    it('should map lesson and quiz progress separately while computing total course progress', () => {
        const academyComponent = component as unknown as {
            mapCourseWithProgress: (
                course: AcademyCourse,
                courseProgress: CourseProgress[],
            ) => {
                completedLessonsCount: number;
                totalLessonsCount: number;
                completedQuizzesCount: number;
                totalQuizzesCount: number;
                progress: number;
            };
        };

        const mappedCourse = academyComponent.mapCourseWithProgress(
            {
                id: 'test-course',
                stageId: 1,
                title: 'Test Course',
                category: 'main-believes',
                categoryLabel: 'Belief',
                lessons: 6,
                duration: '59m',
                isPublished: true,
                prerequisites: [],
            },
            [{
                courseId: 'test-course',
                status: 'in-progress',
                progress: 0,
                completedLessons: 6,
                totalLessons: 7,
                quizPassed: false,
            }],
        );

        expect(mappedCourse.completedLessonsCount).toBe(6);
        expect(mappedCourse.totalLessonsCount).toBe(6);
        expect(mappedCourse.completedQuizzesCount).toBe(0);
        expect(mappedCourse.totalQuizzesCount).toBe(1);
        expect(mappedCourse.progress).toBe(86);
    });
});
