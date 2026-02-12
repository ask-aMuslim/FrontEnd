/**
 * Static Academy Data
 *
 * This file contains the static course, lesson, and stage data for the academy.
 * The data structure mirrors the future API response format for easy migration.
 *
 * When API is ready:
 * - Replace ACADEMY_STAGES with API call to GET /api/stages
 * - Replace ACADEMY_COURSES with API call to GET /api/courses
 * - Replace ACADEMY_LESSONS with API call to GET /api/lessons
 */

import {
    AcademyCourse,
    AcademyLesson,
    CourseCategory,
} from '../models/interfaces/academy-progress.model';

/**
 * Stage definitions for the academy
 */
export interface AcademyStage {
    number: number;
    title: string;
    description: string;
}

export const ACADEMY_STAGES: AcademyStage[] = [
    {
        number: 1,
        title: 'Stage 1',
        description:
            "Begin your journey by building a strong and informed faith. This stage starts with the core of Islam—its compelling doctrine and logical view of life and the hereafter. You will then translate belief into practice by learning the purity of ablution and the serenity of prayer. Finally, you'll tackle vital contemporary topics, gaining an Islamic perspective on equality, the true role of women, and the timeless guidance from the life of Prophet Muhammad (peace be upon him)."
    },
    {
        number: 2,
        title: 'Stage 2',
        description:
            "After you have learned the basics, this stage deepens your understanding. This stage starts with the core of Islam—its compelling doctrine and logical view of life and the hereafter. You will then translate belief into practice by learning the purity of ablution and the serenity of prayer. Finally, you'll tackle vital contemporary topics.",
    },
    {
        number: 3,
        title: 'Stage 3',
        description:
            "Advance your knowledge with more complex topics. This stage covers advanced Islamic teachings, jurisprudence, and contemporary issues facing Muslims today.",
    },
    {
        number: 4,
        title: 'Stage 4',
        description:
            "Continue your learning journey with intermediate topics. This stage focuses on deeper understanding of Islamic history, ethics, and community life.",
    },
    {
        number: 5,
        title: 'Stage 5',
        description:
            "Explore specialized topics in Islamic studies. This stage covers family life, financial ethics, and social responsibilities in Islam.",
    },
    {
        number: 6,
        title: 'Stage 6',
        description:
            "Master advanced concepts in Islamic theology and practice. This stage prepares you for leadership roles in your community.",
    },
    {
        number: 7,
        title: 'Stage 7',
        description:
            "Complete your academy journey with comprehensive review and advanced applications. This final stage certifies your completion of the program.",
    },
];

/**
 * Course definitions for all stages
 */
export const ACADEMY_COURSES: AcademyCourse[] = [
    // Stage 1 Courses
    {
        id: 's1-ms-1',
        stageId: 1,
        title: 'Faith & Belief',
        category: 'models-stories',
        categoryLabel: 'B: Models & Stories',
        lessons: 7,
        duration: '4h 10m',
        description: 'Learn about the core beliefs of Islam and the stories of prophets.',
    },
    {
        id: 's1-mb-1',
        stageId: 1,
        title: 'Prayer (Salah)',
        category: 'main-believes',
        categoryLabel: 'A: Main Believes',
        lessons: 7,
        duration: '4h 10m',
        description: 'Master the fundamentals of Islamic prayer and worship.',
    },
    {
        id: 's1-st-1',
        stageId: 1,
        title: 'Islamic Ethics',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 10m',
        description: 'Understand Islamic ethics and social responsibilities.',
    },
    {
        id: 's1-st-2',
        stageId: 1,
        title: 'Women in Islam',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 10m',
        description: 'Learn about the role and rights of women in Islam.',
    },

    // Stage 2 Courses
    {
        id: 's2-ms-1',
        stageId: 2,
        title: 'Prophet Stories',
        category: 'models-stories',
        categoryLabel: 'B: Models & Stories',
        lessons: 7,
        duration: '4h 10m',
        description: 'Dive deeper into the stories of the prophets.',
    },
    {
        id: 's2-mb-1',
        stageId: 2,
        title: 'Fasting (Sawm)',
        category: 'main-believes',
        categoryLabel: 'A: Main Believes',
        lessons: 7,
        duration: '4h 10m',
        description: 'Learn about the practice and significance of fasting.',
    },
    {
        id: 's2-st-1',
        stageId: 2,
        title: 'Family Life',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 10m',
        description: 'Understand family values and relationships in Islam.',
    },
    {
        id: 's2-st-2',
        stageId: 2,
        title: 'Community Service',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 10m',
        description: 'Learn about serving the community in Islam.',
    },

    // Stage 3 Courses
    {
        id: 's3-ms-1',
        stageId: 3,
        title: 'Companions Stories',
        category: 'models-stories',
        categoryLabel: 'B: Models & Stories',
        lessons: 7,
        duration: '4h 10m',
        description: 'Learn from the stories of the Prophet\'s companions.',
    },
    {
        id: 's3-mb-1',
        stageId: 3,
        title: 'Zakat (Charity)',
        category: 'main-believes',
        categoryLabel: 'A: Main Believes',
        lessons: 7,
        duration: '4h 10m',
        description: 'Understand the obligation and calculation of Zakat.',
    },
    {
        id: 's3-st-1',
        stageId: 3,
        title: 'Islamic Finance',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 10m',
        description: 'Learn about ethical finance and economics in Islam.',
    },
    {
        id: 's3-st-2',
        stageId: 3,
        title: 'Environmental Ethics',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 10m',
        description: 'Understand Islamic teachings on environmental stewardship.',
    },

    // Stage 4-7 Courses (similar structure)
    ...generateStageCoursesFrom4To7(),
];

/**
 * Helper function to generate courses for stages 4-7
 */
function generateStageCoursesFrom4To7(): AcademyCourse[] {
    const courses: AcademyCourse[] = [];
    const stageTopics = [
        { stage: 4, ms: 'Islamic History', mb: 'Hajj (Pilgrimage)', st1: 'Interfaith Dialogue', st2: 'Media & Islam' },
        { stage: 5, ms: 'Scholar Stories', mb: 'Dua & Dhikr', st1: 'Youth in Islam', st2: 'Mental Health' },
        { stage: 6, ms: 'Modern Leaders', mb: 'Tahajjud & Night Prayers', st1: 'Dawah Methods', st2: 'Islamic Art' },
        { stage: 7, ms: 'Legacy Building', mb: 'Complete Review', st1: 'Leadership', st2: 'Final Assessment' },
    ];

    stageTopics.forEach((topic) => {
        courses.push(
            {
                id: `s${topic.stage}-ms-1`,
                stageId: topic.stage,
                title: topic.ms,
                category: 'models-stories',
                categoryLabel: 'B: Models & Stories',
                lessons: 7,
                duration: '4h 10m',
            },
            {
                id: `s${topic.stage}-mb-1`,
                stageId: topic.stage,
                title: topic.mb,
                category: 'main-believes',
                categoryLabel: 'A: Main Believes',
                lessons: 7,
                duration: '4h 10m',
            },
            {
                id: `s${topic.stage}-st-1`,
                stageId: topic.stage,
                title: topic.st1,
                category: 'social-topics',
                categoryLabel: 'C: Social Topics',
                lessons: 7,
                duration: '4h 10m',
            },
            {
                id: `s${topic.stage}-st-2`,
                stageId: topic.stage,
                title: topic.st2,
                category: 'social-topics',
                categoryLabel: 'C: Social Topics',
                lessons: 7,
                duration: '4h 10m',
            }
        );
    });

    return courses;
}

/**
 * Lesson definitions for all courses
 */
export const ACADEMY_LESSONS: AcademyLesson[] = generateAllLessons();

/**
 * Helper function to generate lessons for all courses
 */
function generateAllLessons(): AcademyLesson[] {
    const lessons: AcademyLesson[] = [];

    ACADEMY_COURSES.forEach((course) => {
        // Generate 7 lessons per course: 1 intro, 5 content lessons, 1 quiz
        lessons.push(
            {
                id: `${course.id}-lesson-1`,
                courseId: course.id,
                title: 'Introduction',
                duration: '5 min',
                type: 'intro',
                order: 1,
                description: `Introduction to ${course.title}`,
            },
            {
                id: `${course.id}-lesson-2`,
                courseId: course.id,
                title: `${course.title} - Part 1`,
                duration: '15 min',
                type: 'video',
                order: 2,
                description: `First part of ${course.title} course`,
            },
            {
                id: `${course.id}-lesson-3`,
                courseId: course.id,
                title: `${course.title} - Part 2`,
                duration: '15 min',
                type: 'video',
                order: 3,
                description: `Second part of ${course.title} course`,
            },
            {
                id: `${course.id}-lesson-4`,
                courseId: course.id,
                title: `${course.title} - Part 3`,
                duration: '15 min',
                type: 'video',
                order: 4,
                description: `Third part of ${course.title} course`,
            },
            {
                id: `${course.id}-lesson-5`,
                courseId: course.id,
                title: `${course.title} - Part 4`,
                duration: '15 min',
                type: 'article',
                order: 5,
                description: `Fourth part of ${course.title} course`,
            },
            {
                id: `${course.id}-lesson-6`,
                courseId: course.id,
                title: `${course.title} - Part 5`,
                duration: '15 min',
                type: 'video',
                order: 6,
                description: `Fifth part of ${course.title} course`,
            },
            {
                id: `${course.id}-lesson-7`,
                courseId: course.id,
                title: 'Quiz',
                duration: '10 min',
                type: 'quiz',
                order: 7,
                description: `Quiz for ${course.title} course`,
            }
        );
    });

    return lessons;
}

/**
 * Get course category display order
 */
export function getCategoryOrder(category: CourseCategory): number {
    switch (category) {
        case 'main-believes':
            return 1;
        case 'models-stories':
            return 2;
        case 'social-topics':
            return 3;
        default:
            return 4;
    }
}

/**
 * Get courses for a stage grouped by category
 */
export function getStageCoursesGrouped(stageNumber: number): {
    mainBelieves: AcademyCourse[];
    modelsStories: AcademyCourse[];
    socialTopics: AcademyCourse[];
} {
    const stageCourses = ACADEMY_COURSES.filter((c) => c.stageId === stageNumber);

    return {
        mainBelieves: stageCourses.filter((c) => c.category === 'main-believes'),
        modelsStories: stageCourses.filter((c) => c.category === 'models-stories'),
        socialTopics: stageCourses.filter((c) => c.category === 'social-topics'),
    };
}
