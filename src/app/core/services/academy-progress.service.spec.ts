/* eslint-disable no-undef */
import { AcademyProgressService } from './academy-progress.service';
import { AcademyCourse, StudentProgress } from '../models/interfaces/academy-progress.model';
import { EnrollmentReadDto } from '../../api/facades/enrollment.facade';
import { ProgressReadDto } from '../../api/facades/progress.facade';
import { of, throwError } from 'rxjs';

describe('AcademyProgressService progress mapping', () => {
    const buildStudentProgress = (AcademyProgressService.prototype as unknown as {
        buildStudentProgress(
            studentId: string,
            courses: AcademyCourse[],
            enrollmentRecordsByCourseId: Map<string, EnrollmentReadDto>,
            recentLesson: null,
            progressRecords: ProgressReadDto[],
        ): StudentProgress;
    }).buildStudentProgress;

    const createServiceStub = () => {
        return {
            normalizeProgressPercentage: (value: number) => Math.max(0, Math.min(100, Math.round(value))),
            normalizeProgressRecords: () => new Map<string, ProgressReadDto>(),
            getLocallyCompletedLessonIds: () => new Set<string>(),
            isCourseQuizPassedLocally: () => false,
            courseHasAnyQuiz: () => false,
            resolveCourseItemCount: () => 0,
            parseEnrollmentStatus: () => null,
            isEnrollmentConsideredEnrolled: () => false,
        } as const;
    };

    it('keeps empty courses at 0% progress instead of auto-completing them', () => {
        const serviceStub = createServiceStub();
        const course: AcademyCourse = {
            id: 'course-empty',
            stageId: 1,
            title: 'Empty course',
            category: 'social-topics',
            categoryLabel: 'Social Topics',
            lessons: 0,
            duration: '0m',
        };

        const progress = buildStudentProgress.call(
            serviceStub,
            'student-1',
            [course],
            new Map<string, EnrollmentReadDto>(),
            null,
            [],
        );

        expect(progress.courseProgress.length).toBe(1);
        expect(progress.courseProgress[0].progress).toBe(0);
        expect(progress.courseProgress[0].completedLessons).toBe(0);
        expect(progress.courseProgress[0].totalLessons).toBe(0);
        expect(progress.courseProgress[0].status).toBe('available');
    });

    it('counts a passed quiz toward course progress completion', () => {
        const baseCourse: AcademyCourse = {
            id: 'course-quiz',
            stageId: 1,
            title: 'Quiz course',
            category: 'social-topics',
            categoryLabel: 'Social Topics',
            lessons: 6,
            duration: '30m',
        };

        const lessonIds = ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4', 'lesson-5', 'lesson-6'];
        const incompleteStub = {
            normalizeProgressPercentage: (value: number) => Math.max(0, Math.min(100, Math.round(value))),
            normalizeProgressRecords: () => new Map<string, ProgressReadDto>(),
            getLocallyCompletedLessonIds: () => new Set<string>(lessonIds),
            getStandaloneQuizCount: () => 0,
            isCourseQuizPassedLocally: () => false,
            courseHasAnyQuiz: () => true,
            resolveCourseItemCount: () => 7,
            parseEnrollmentStatus: () => null,
            isEnrollmentConsideredEnrolled: () => false,
        } as const;
        const completeStub = {
            normalizeProgressPercentage: (value: number) => Math.max(0, Math.min(100, Math.round(value))),
            normalizeProgressRecords: () => new Map<string, ProgressReadDto>(),
            getLocallyCompletedLessonIds: () => new Set<string>([...lessonIds, 'quiz-1']),
            getStandaloneQuizCount: () => 0,
            isCourseQuizPassedLocally: () => true,
            courseHasAnyQuiz: () => true,
            resolveCourseItemCount: () => 7,
            parseEnrollmentStatus: () => null,
            isEnrollmentConsideredEnrolled: () => false,
        } as const;

        const incompleteProgress = buildStudentProgress.call(
            incompleteStub,
            'student-1',
            [baseCourse],
            new Map<string, EnrollmentReadDto>(),
            null,
            [],
        );

        const completeProgress = buildStudentProgress.call(
            completeStub,
            'student-1',
            [baseCourse],
            new Map<string, EnrollmentReadDto>(),
            null,
            [],
        );

        expect(incompleteProgress.courseProgress[0].progress).toBeLessThan(completeProgress.courseProgress[0].progress);
        expect(completeProgress.courseProgress[0].progress).toBe(100);
        expect(completeProgress.courseProgress[0].status).toBe('completed');
    });

    it('keeps quiz-required courses below 100% until quiz is passed', () => {
        const baseCourse: AcademyCourse = {
            id: 'course-quiz',
            stageId: 1,
            title: 'Quiz course',
            category: 'social-topics',
            categoryLabel: 'Social Topics',
            lessons: 6,
            duration: '30m',
        };

        const progressRecord: ProgressReadDto = {
            courseId: 'course-quiz',
            lessonCompletionRate: 100,
            totalLessonsCompleted: 6,
            isCompleted: false,
            completedProgress: false,
        };

        const serviceStub = {
            normalizeProgressPercentage: (value: number) => Math.max(0, Math.min(100, Math.round(value))),
            normalizeProgressRecords: () => new Map<string, ProgressReadDto>([['course-quiz', progressRecord]]),
            getLocallyCompletedLessonIds: () => new Set<string>([
                'lesson-1',
                'lesson-2',
                'lesson-3',
                'lesson-4',
                'lesson-5',
                'lesson-6',
            ]),
            getStandaloneQuizCount: () => 1,
            isCourseQuizPassedLocally: () => false,
            courseHasAnyQuiz: () => true,
            resolveCourseItemCount: () => 7,
            parseEnrollmentStatus: () => null,
            isEnrollmentConsideredEnrolled: () => false,
        } as const;

        const progress = buildStudentProgress.call(
            serviceStub,
            'student-1',
            [baseCourse],
            new Map<string, EnrollmentReadDto>(),
            null,
            [progressRecord],
        );

        expect(progress.courseProgress[0].progress).toBe(86);
        expect(progress.courseProgress[0].status).toBe('in-progress');
        expect(progress.courseProgress[0].totalLessons).toBe(7);
    });

    it('adds standalone quiz completion on top of completed lessons', () => {
        const baseCourse: AcademyCourse = {
            id: 'course-standalone-quiz',
            stageId: 1,
            title: 'Standalone quiz course',
            category: 'social-topics',
            categoryLabel: 'Social Topics',
            lessons: 3,
            duration: '30m',
        };

        const progressRecord: ProgressReadDto = {
            courseId: 'course-standalone-quiz',
            lessonCompletionRate: 100,
            totalLessonsCompleted: 3,
            isCompleted: false,
            completedProgress: false,
        };

        const serviceStub = {
            normalizeProgressPercentage: (value: number) => Math.max(0, Math.min(100, Math.round(value))),
            normalizeProgressRecords: () => new Map<string, ProgressReadDto>([['course-standalone-quiz', progressRecord]]),
            getLocallyCompletedLessonIds: () => new Set<string>(),
            getStandaloneQuizCount: () => 1,
            isCourseQuizPassedLocally: () => true,
            courseHasAnyQuiz: () => true,
            resolveCourseItemCount: () => 4,
            parseEnrollmentStatus: () => null,
            isEnrollmentConsideredEnrolled: () => false,
        } as const;

        const progress = buildStudentProgress.call(
            serviceStub,
            'student-1',
            [baseCourse],
            new Map<string, EnrollmentReadDto>(),
            null,
            [progressRecord],
        );

        expect(progress.courseProgress[0].completedLessons).toBe(4);
        expect(progress.courseProgress[0].totalLessons).toBe(4);
        expect(progress.courseProgress[0].progress).toBe(100);
        expect(progress.courseProgress[0].status).toBe('completed');
    });
});

describe('AcademyProgressService enrollment resolution', () => {
    const getEnrollmentRecordForStudentCourse = (AcademyProgressService.prototype as unknown as {
        getEnrollmentRecordForStudentCourse: (
            studentId: string,
            courseId: string,
        ) => import('rxjs').Observable<EnrollmentReadDto | undefined>;
    }).getEnrollmentRecordForStudentCourse;

    const selectEnrollmentForStudent = (AcademyProgressService.prototype as unknown as {
        selectEnrollmentForStudent: (
            enrollments: EnrollmentReadDto[],
            studentId: string,
        ) => EnrollmentReadDto | undefined;
    }).selectEnrollmentForStudent;

    it('uses course-scoped enrollment lookup first', (done: DoneFn) => {
        const courseScopedEnrollment: EnrollmentReadDto = {
            id: 'enr-course',
            studentId: 'student-1',
            courseId: 'course-1',
            status: 'active',
        };

        const fallbackByStudentEnrollment: EnrollmentReadDto = {
            id: 'enr-fallback',
            studentId: 'student-1',
            courseId: 'course-1',
            status: 'active',
        };

        const getEnrollmentRecordsByCourseIdSpy = jasmine
            .createSpy('getEnrollmentRecordsByCourseId')
            .and.returnValue(of(new Map<string, EnrollmentReadDto>([['course-1', fallbackByStudentEnrollment]])));

        const serviceStub = {
            enrollmentFacade: {
                getStudentsEnrolledInCourse: jasmine
                    .createSpy('getStudentsEnrolledInCourse')
                    .and.returnValue(of([courseScopedEnrollment])),
            },
            selectEnrollmentForStudent: (enrollments: EnrollmentReadDto[], studentId: string) =>
                enrollments.find((enrollment) => enrollment.studentId === studentId),
            getEnrollmentRecordsByCourseId: getEnrollmentRecordsByCourseIdSpy,
        };

        getEnrollmentRecordForStudentCourse.call(serviceStub, 'student-1', 'course-1').subscribe((enrollment) => {
            expect(serviceStub.enrollmentFacade.getStudentsEnrolledInCourse).toHaveBeenCalledWith('course-1');
            expect(enrollment?.id).toBe('enr-course');
            expect(getEnrollmentRecordsByCourseIdSpy).not.toHaveBeenCalled();
            done();
        });
    });

    it('falls back to by-student enrollment lookup when course-scoped lookup fails', (done: DoneFn) => {
        const fallbackEnrollment: EnrollmentReadDto = {
            id: 'enr-fallback',
            studentId: 'student-1',
            courseId: 'course-1',
            status: 'completed',
        };

        const getEnrollmentRecordsByCourseIdSpy = jasmine
            .createSpy('getEnrollmentRecordsByCourseId')
            .and.returnValue(of(new Map<string, EnrollmentReadDto>([['course-1', fallbackEnrollment]])));

        const serviceStub = {
            enrollmentFacade: {
                getStudentsEnrolledInCourse: jasmine
                    .createSpy('getStudentsEnrolledInCourse')
                    .and.returnValue(throwError(() => new Error('lookup failed'))),
            },
            selectEnrollmentForStudent: () => undefined,
            getEnrollmentRecordsByCourseId: getEnrollmentRecordsByCourseIdSpy,
        };

        getEnrollmentRecordForStudentCourse.call(serviceStub, 'student-1', 'course-1').subscribe((enrollment) => {
            expect(serviceStub.enrollmentFacade.getStudentsEnrolledInCourse).toHaveBeenCalledWith('course-1');
            expect(getEnrollmentRecordsByCourseIdSpy).toHaveBeenCalledWith('student-1');
            expect(enrollment?.id).toBe('enr-fallback');
            done();
        });
    });

    it('selects the highest-priority enrollment for the current student', () => {
        const serviceStub = {
            getEnrollmentStatusPriority: (status: unknown) => {
                if (status === 'completed') {
                    return 4;
                }
                if (status === 'active') {
                    return 3;
                }
                if (status === 'paused') {
                    return 2;
                }
                if (status === 'cancelled') {
                    return 1;
                }
                return 0;
            },
        };

        const selected = selectEnrollmentForStudent.call(serviceStub, [
            { id: 'enr-paused', studentId: 'student-1', status: 'paused' },
            { id: 'enr-completed', studentId: 'student-1', status: 'completed' },
            { id: 'enr-other', studentId: 'student-2', status: 'active' },
            { id: 'enr-active', studentId: 'student-1', status: 'active' },
        ], 'student-1');

        expect(selected?.id).toBe('enr-completed');
    });
});
