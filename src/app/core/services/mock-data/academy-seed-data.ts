/**
 * Academy Seed Data
 *
 * Comprehensive mock data for all academy pages including:
 * - Stages with descriptions
 * - Courses with detailed content
 * - Lessons with various content types (video, article, audio, intro, quiz)
 * - Quiz questions with options
 * - Student progress state
 *
 * This data simulates a real API response and can be used for:
 * - Development without backend
 * - Unit testing
 * - Demo/presentation purposes
 *
 * When API is ready, this data structure will be replaced by real API calls
 */

import {
    AcademyCourse,
    AcademyLesson,
    CourseStatus,
    LessonStatus,
    StudentProgress,
} from '../../models/interfaces/academy-progress.model';
import { ArticleSection } from '../../models/interfaces/lesson-content.model';

// ============================================================================
// STAGE DEFINITIONS
// ============================================================================

export interface AcademyStage {
    number: number;
    title: string;
    description: string;
    isUnlocked: boolean;
}

export const ACADEMY_STAGES: AcademyStage[] = [
    {
        number: 1,
        title: 'Stage 1: Foundation of Faith',
        description:
            "Begin your journey by building a strong and informed faith. This stage starts with the core of Islam—its compelling doctrine and logical view of life and the hereafter. You will then translate belief into practice by learning the purity of ablution and the serenity of prayer. Finally, you'll tackle vital contemporary topics, gaining an Islamic perspective on equality, the true role of women, and the timeless guidance from the life of Prophet Muhammad (peace be upon him).",
        isUnlocked: true,
    },
    {
        number: 2,
        title: 'Stage 2: Deepening Understanding',
        description:
            "After mastering the basics, this stage deepens your understanding. Explore the profound stories of prophets and companions. Learn the spiritual practice of fasting and its significance. Understand family values and community service through an Islamic lens.",
        isUnlocked: false,
    },
    {
        number: 3,
        title: 'Stage 3: Advanced Knowledge',
        description:
            "Advance your knowledge with more complex topics. This stage covers advanced Islamic teachings, jurisprudence, and contemporary issues facing Muslims today. Study Zakat, Islamic finance, and environmental ethics.",
        isUnlocked: false,
    },
    {
        number: 4,
        title: 'Stage 4: Historical Context',
        description:
            "Explore the rich history of Islam. This stage covers Islamic history, Hajj pilgrimage, interfaith dialogue, and media representation of Islam.",
        isUnlocked: false,
    },
    {
        number: 5,
        title: 'Stage 5: Spiritual Growth',
        description:
            "Focus on spiritual development. Learn about scholar stories, Dua & Dhikr, youth in Islam, and mental health from an Islamic perspective.",
        isUnlocked: false,
    },
    {
        number: 6,
        title: 'Stage 6: Community Leadership',
        description:
            "Prepare for leadership in your community. Study modern Muslim leaders, advanced prayers, Dawah methods, and Islamic art.",
        isUnlocked: false,
    },
    {
        number: 7,
        title: 'Stage 7: Completion & Certification',
        description:
            "Complete your academy journey with comprehensive review and assessment. This final stage certifies your completion of the program.",
        isUnlocked: false,
    },
];

// ============================================================================
// COURSE DEFINITIONS
// ============================================================================

export interface SeedCourse extends AcademyCourse {
    objectives: string[];
    prerequisites?: string[];
    instructorName?: string;
    thumbnailUrl: string;
}

export const ACADEMY_COURSES: SeedCourse[] = [
    // ==================== STAGE 1 COURSES ====================
    {
        id: 's1-mb-1',
        stageId: 1,
        title: 'Prayer (Salah)',
        category: 'main-believes',
        categoryLabel: 'A: Main Believes',
        lessons: 7,
        duration: '4h 10m',
        description:
            'Master the fundamentals of Islamic prayer. Learn the proper way to perform Wudu (ablution), understand the five daily prayers, and discover the spiritual significance of Salah in connecting with Allah.',
        objectives: [
            'Understand the importance of prayer in Islam',
            'Learn to perform Wudu correctly',
            'Master the movements and recitations of Salah',
            'Understand the times and conditions for prayer',
            'Learn about different types of prayers (Fard, Sunnah, Nafl)',
        ],
        instructorName: 'Sheikh Ahmad Al-Rashid',
        thumbnailUrl: '/academy/courses/prayer-salah.jpg',
    },
    {
        id: 's1-ms-1',
        stageId: 1,
        title: 'The Life of Prophet Muhammad (PBUH)',
        category: 'models-stories',
        categoryLabel: 'B: Models & Stories',
        lessons: 8,
        duration: '5h 30m',
        description:
            'A comprehensive journey through the life of the final Messenger (PBUH). From his noble birth and character before prophethood to the revelation in Cave Hira, the struggles in Makkah, and the foundation of a model community in Madinah.',
        objectives: [
            'Understand the character of the Prophet before revelation',
            'Learn about the key events of the Makkan period',
            'Explore the significance of the Hijrah (Migration)',
            'Understand the model society established in Madinah',
            'Apply lessons from his Sunnah to modern challenges',
        ],
        instructorName: 'Dr. Yasir Qadhi',
        thumbnailUrl: '/academy/courses/seerah.jpg',
    },
    {
        id: 's1-st-1',
        stageId: 1,
        title: 'Equality & Social Justice',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 6,
        duration: '3h 15m',
        description:
            'Understand the Islamic concept of human equality and the pursuit of social justice. Explore how Islam abolished racial and tribal hierarchies and established a system of universal human rights.',
        objectives: [
            'Understand the spiritual equality of all humans in Islam',
            'Learn how Islam addresses racial and social discrimination',
            'Explore the concept of justice (Adl) in the Quran',
            'Understand the rights of the poor and marginalized',
            'Apply Islamic principles of justice to current social issues',
        ],
        instructorName: 'Ustadh Nouman Ali Khan',
        thumbnailUrl: '/academy/courses/equality-justice.jpg',
    },
    {
        id: 's1-st-2',
        stageId: 1,
        title: 'Women in Islam',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 00m',
        description:
            'Discover the true status of women in Islam. Learn about the rights, roles, and honored position of women as taught by the Quran and Prophet Muhammad (PBUH).',
        objectives: [
            'Understand women\'s rights in Islam',
            'Learn about prominent Muslim women in history',
            'Address common misconceptions',
            'Explore family dynamics and roles',
            'Understand spiritual equality in Islam',
        ],
        instructorName: 'Dr. Aisha Malik',
        thumbnailUrl: '/academy/courses/women-islam.jpg',
    },

    // ==================== STAGE 2 COURSES ====================
    {
        id: 's2-mb-1',
        stageId: 2,
        title: 'Fasting (Sawm)',
        category: 'main-believes',
        categoryLabel: 'A: Main Believes',
        lessons: 7,
        duration: '3h 45m',
        description:
            'Learn about the spiritual practice of fasting during Ramadan and throughout the year. Understand its benefits, rules, and how to maximize its rewards.',
        objectives: [
            'Understand the obligation of fasting',
            'Learn the rules of fasting',
            'Discover voluntary fasting',
            'Understand exemptions',
            'Maximize spiritual benefits',
        ],
        instructorName: 'Sheikh Muhammad Ali',
        thumbnailUrl: '/academy/courses/fasting.jpg',
    },
    {
        id: 's2-ms-1',
        stageId: 2,
        title: 'Stories of the Prophets',
        category: 'models-stories',
        categoryLabel: 'B: Models & Stories',
        lessons: 7,
        duration: '5h 00m',
        description:
            'Journey through the inspiring stories of prophets from Adam to Muhammad (PBUH). Learn valuable lessons from their lives and missions.',
        objectives: [
            'Learn the stories of major prophets',
            'Extract lessons from their experiences',
            'Understand prophetic missions',
            'Connect stories to modern life',
            'Strengthen faith through narratives',
        ],
        instructorName: 'Dr. Ibrahim Yusuf',
        thumbnailUrl: '/academy/courses/prophets.jpg',
    },
    {
        id: 's2-st-1',
        stageId: 2,
        title: 'Family Life in Islam',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 15m',
        description:
            'Learn about Islamic family values, marriage, parenting, and maintaining healthy family relationships.',
        objectives: [
            'Understand marriage in Islam',
            'Learn parenting principles',
            'Build strong family bonds',
            'Handle family challenges',
            'Create an Islamic home environment',
        ],
        instructorName: 'Dr. Khadija Rahman',
        thumbnailUrl: '/academy/courses/family.jpg',
    },
    {
        id: 's2-st-2',
        stageId: 2,
        title: 'Community Service',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '3h 30m',
        description:
            'Discover the importance of serving others in Islam. Learn practical ways to contribute to your community and society.',
        objectives: [
            'Understand Islamic concept of service',
            'Learn about charitable giving',
            'Volunteer effectively',
            'Build community connections',
            'Make lasting positive impact',
        ],
        instructorName: 'Sheikh Hassan Ibrahim',
        thumbnailUrl: '/academy/courses/community.jpg',
    },

    // ==================== STAGE 3-7 COURSES (Condensed) ====================
    // Stage 3
    {
        id: 's3-mb-1',
        stageId: 3,
        title: 'Zakat (Charity)',
        category: 'main-believes',
        categoryLabel: 'A: Main Believes',
        lessons: 7,
        duration: '4h 00m',
        description: 'Understand the obligation and calculation of Zakat, the third pillar of Islam.',
        objectives: ['Learn Zakat rules', 'Calculate Zakat', 'Understand recipients', 'Practice giving'],
        thumbnailUrl: '/academy/courses/zakat.jpg',
    },
    {
        id: 's3-ms-1',
        stageId: 3,
        title: 'Stories of the Companions',
        category: 'models-stories',
        categoryLabel: 'B: Models & Stories',
        lessons: 7,
        duration: '4h 30m',
        description: 'Learn from the inspiring lives of the Prophet\'s companions.',
        objectives: ['Study companion biographies', 'Extract lessons', 'Apply teachings'],
        thumbnailUrl: '/academy/courses/companions.jpg',
    },
    {
        id: 's3-st-1',
        stageId: 3,
        title: 'Islamic Finance',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 00m',
        description: 'Learn about ethical finance and economics in Islam.',
        objectives: ['Understand halal finance', 'Avoid riba', 'Make ethical investments'],
        thumbnailUrl: '/academy/courses/finance.jpg',
    },
    {
        id: 's3-st-2',
        stageId: 3,
        title: 'Environmental Ethics',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '3h 30m',
        description: 'Understand Islamic teachings on environmental stewardship.',
        objectives: ['Learn Islamic environmental ethics', 'Practice sustainability'],
        thumbnailUrl: '/academy/courses/environment.jpg',
    },

    // Stage 4
    {
        id: 's4-mb-1',
        stageId: 4,
        title: 'Hajj (Pilgrimage)',
        category: 'main-believes',
        categoryLabel: 'A: Main Believes',
        lessons: 7,
        duration: '4h 30m',
        description: 'Complete guide to the pilgrimage to Mecca.',
        objectives: ['Understand Hajj rituals', 'Prepare spiritually', 'Learn practical aspects'],
        thumbnailUrl: '/academy/courses/hajj.jpg',
    },
    {
        id: 's4-ms-1',
        stageId: 4,
        title: 'Islamic History',
        category: 'models-stories',
        categoryLabel: 'B: Models & Stories',
        lessons: 7,
        duration: '5h 00m',
        description: 'Journey through 1400 years of Islamic civilization.',
        objectives: ['Learn major historical events', 'Understand Islamic empires'],
        thumbnailUrl: '/academy/courses/history.jpg',
    },
    {
        id: 's4-st-1',
        stageId: 4,
        title: 'Interfaith Dialogue',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '3h 45m',
        description: 'Learn how to engage respectfully with people of other faiths.',
        objectives: ['Build bridges', 'Address misconceptions', 'Practice dialogue'],
        thumbnailUrl: '/academy/courses/interfaith.jpg',
    },
    {
        id: 's4-st-2',
        stageId: 4,
        title: 'Media & Islam',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '3h 30m',
        description: 'Navigate media representation of Islam.',
        objectives: ['Analyze media portrayal', 'Counter stereotypes', 'Use media positively'],
        thumbnailUrl: '/academy/courses/media.jpg',
    },

    // Stage 5
    {
        id: 's5-mb-1',
        stageId: 5,
        title: 'Dua & Dhikr',
        category: 'main-believes',
        categoryLabel: 'A: Main Believes',
        lessons: 7,
        duration: '3h 30m',
        description: 'Master the art of supplication and remembrance of Allah.',
        objectives: ['Learn important duas', 'Practice daily dhikr', 'Connect with Allah'],
        thumbnailUrl: '/academy/courses/dua.jpg',
    },
    {
        id: 's5-ms-1',
        stageId: 5,
        title: 'Stories of Scholars',
        category: 'models-stories',
        categoryLabel: 'B: Models & Stories',
        lessons: 7,
        duration: '4h 15m',
        description: 'Learn from the great scholars of Islamic history.',
        objectives: ['Study scholar biographies', 'Learn their methodologies'],
        thumbnailUrl: '/academy/courses/scholars.jpg',
    },

    {
        id: 's5-st-1',
        stageId: 5,
        title: 'Youth in Islam',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '3h 45m',
        description: 'Address challenges facing Muslim youth today.',
        objectives: ['Navigate modern challenges', 'Build strong identity'],
        thumbnailUrl: '/academy/courses/youth.jpg',
    },
    {
        id: 's5-st-2',
        stageId: 5,
        title: 'Mental Health & Islam',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 00m',
        description: 'Islamic perspective on mental health and wellbeing.',
        objectives: ['Understand Islamic view of mental health', 'Seek help appropriately'],
        thumbnailUrl: '/academy/courses/mental-health.jpg',
    },

    // Stage 6
    {
        id: 's6-mb-1',
        stageId: 6,
        title: 'Tahajjud & Night Prayers',
        category: 'main-believes',
        categoryLabel: 'A: Main Believes',
        lessons: 7,
        duration: '3h 15m',
        description: 'Master voluntary prayers that bring you closer to Allah.',
        objectives: ['Learn night prayer', 'Build consistent practice'],
        thumbnailUrl: '/academy/courses/tahajjud.jpg',
    },
    {
        id: 's6-ms-1',
        stageId: 6,
        title: 'Modern Muslim Leaders',
        category: 'models-stories',
        categoryLabel: 'B: Models & Stories',
        lessons: 7,
        duration: '4h 00m',
        description: 'Learn from contemporary Muslim leaders and scholars.',
        objectives: ['Study modern leaders', 'Apply their lessons'],
        thumbnailUrl: '/academy/courses/modern-leaders.jpg',
    },
    {
        id: 's6-st-1',
        stageId: 6,
        title: 'Dawah Methods',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 30m',
        description: 'Learn effective methods to share Islam with others.',
        objectives: ['Understand dawah principles', 'Practice effective communication'],
        thumbnailUrl: '/academy/courses/dawah.jpg',
    },
    {
        id: 's6-st-2',
        stageId: 6,
        title: 'Islamic Art & Architecture',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '3h 45m',
        description: 'Explore the rich artistic heritage of Islamic civilization.',
        objectives: ['Appreciate Islamic art', 'Understand symbolism'],
        thumbnailUrl: '/academy/courses/art.jpg',
    },

    // Stage 7
    {
        id: 's7-mb-1',
        stageId: 7,
        title: 'Complete Review',
        category: 'main-believes',
        categoryLabel: 'A: Main Believes',
        lessons: 7,
        duration: '5h 00m',
        description: 'Comprehensive review of all core Islamic teachings.',
        objectives: ['Review all pillars', 'Solidify knowledge', 'Prepare for assessment'],
        thumbnailUrl: '/academy/courses/review.jpg',
    },
    {
        id: 's7-ms-1',
        stageId: 7,
        title: 'Legacy Building',
        category: 'models-stories',
        categoryLabel: 'B: Models & Stories',
        lessons: 7,
        duration: '4h 00m',
        description: 'Learn how to leave a lasting positive legacy.',
        objectives: ['Plan your contribution', 'Build lasting impact'],
        thumbnailUrl: '/academy/courses/legacy.jpg',
    },
    {
        id: 's7-st-1',
        stageId: 7,
        title: 'Islamic Leadership',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '4h 30m',
        description: 'Develop leadership skills grounded in Islamic principles.',
        objectives: ['Learn Islamic leadership', 'Apply in community'],
        thumbnailUrl: '/academy/courses/leadership.jpg',
    },
    {
        id: 's7-st-2',
        stageId: 7,
        title: 'Final Assessment',
        category: 'social-topics',
        categoryLabel: 'C: Social Topics',
        lessons: 7,
        duration: '2h 00m',
        description: 'Complete your academy journey with final assessment and certification.',
        objectives: ['Demonstrate knowledge', 'Earn certification'],
        thumbnailUrl: '/academy/courses/assessment.jpg',
    },
];

// ============================================================================
// LESSON DEFINITIONS
// ============================================================================

export interface SeedLesson extends AcademyLesson {
    content: SeedLessonContent;
}

export type SeedLessonContent =
    | SeedIntroContent
    | SeedVideoContent
    | SeedAudioContent
    | SeedArticleContent
    | SeedQuizContent;

interface SeedIntroContent {
    type: 'intro';
    courseOverview: string;
    objectives: string[];
    prerequisites?: string[];
    instructorMessage?: string;
}

interface SeedVideoContent {
    type: 'video';
    videoUrl: string;
    thumbnailUrl?: string;
    transcript?: string;
    keyPoints?: string[];
}

interface SeedAudioContent {
    type: 'audio';
    audioUrl: string;
    transcript?: string;
    language?: 'English' | 'Arabic';
    subtitles?: string;
}

interface SeedArticleContent {
    type: 'article';
    sections: ArticleSection[];
    references?: string[];
}

interface SeedQuizContent {
    type: 'quiz';
    description: string;
    totalQuestions: number;
    passingScore: number;
    timeLimit?: number; // in minutes
}

/**
 * Generate all lessons for all courses
 */
function generateAllLessons(): SeedLesson[] {
    const lessons: SeedLesson[] = [];

    ACADEMY_COURSES.forEach((course) => {
        // Generate a set of lessons for each course
        // First 4 courses in Stage 1 have detailed content
        if (course.id === 's1-mb-1') {
            lessons.push(...generatePrayerLessons(course.id, course.description || ''));
        } else if (course.id === 's1-ms-1') {
            lessons.push(...generateSeerahLessons(course.id, course.description || ''));
        } else if (course.id === 's1-st-1') {
            lessons.push(...generateEqualityLessons(course.id, course.description || ''));
        } else if (course.id === 's1-st-2') {
            lessons.push(...generateWomenLessons(course.id, course.description || ''));
        } else {
            // Generic lessons for other courses
            lessons.push(...generateGenericLessons(course));
        }
    });

    return lessons;
}

function generatePrayerLessons(courseId: string, courseDescription: string): SeedLesson[] {
    return [
        {
            id: `${courseId}-lesson-1`,
            courseId,
            title: 'Introduction to Prayer',
            duration: '05:00',
            type: 'intro',
            order: 1,
            description: 'Understanding why we pray and the significance of Salah in a Muslim\'s life.',
            content: {
                type: 'intro',
                courseOverview: courseDescription,
                objectives: [
                    'Understand the spiritual importance of prayer',
                    'Learn the five daily prayers',
                    'Prepare for practical learning',
                ],
                instructorMessage: 'Welcome to this foundational course on prayer. We will start with the spiritual aspects before moving to the practical steps.',
            },
        },
        {
            id: `${courseId}-lesson-2`,
            courseId,
            title: 'Wudu: The Key to Prayer',
            duration: '15:00',
            type: 'video',
            order: 2,
            description: 'A step-by-step guide to performing ritual purification (ablution).',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/wudu-tutorial.mp4',
                thumbnailUrl: '/academy/lessons/wudu-thumb.jpg',
                transcript: 'In this video, we will learn how to perform wudu correctly...',
                keyPoints: ['Washing hands', 'Rinsing mouth', 'Washing face', 'Washing arms', 'Wiping head', 'Washing feet'],
            },
        },
        {
            id: `${courseId}-lesson-3`,
            courseId,
            title: 'The Five Daily Prayers',
            duration: '20:00',
            type: 'video',
            order: 3,
            description: 'Times, names, and number of units (Rak\'ahs) for each of the five prayers.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/daily-prayers.mp4',
                thumbnailUrl: '/academy/lessons/prayers-thumb.jpg',
                keyPoints: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
            },
        },
        {
            id: `${courseId}-lesson-4`,
            courseId,
            title: 'The Spiritual Essence of Salah',
            duration: '10:00',
            type: 'article',
            order: 4,
            description: 'Reflections on achieving Khushu (tranquility and focus) in your prayer.',
            content: {
                type: 'article',
                sections: [
                    {
                        header: 'Introduction',
                        content: 'Prayer is the spiritual lifeline of a Muslim. It is a direct meeting with the Creator...',
                    },
                    {
                        header: 'The Concept of Khushu',
                        content: 'Khushu is often translated as humility or submission. In prayer, it means being present...',
                    },
                ],
            },
        },
        {
            id: `${courseId}-lesson-5`,
            courseId,
            title: 'Common Mistakes in Prayer',
            duration: '12:00',
            type: 'video',
            order: 5,
            description: 'Identifying and correcting common errors in movement and recitation.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/prayer-mistakes.mp4',
            },
        },
        {
            id: `${courseId}-lesson-6`,
            courseId,
            title: 'Recitations in Salah',
            duration: '08:00',
            type: 'audio',
            order: 6,
            description: 'Listen and practice the mandatory and optional recitations in prayer.',
            content: {
                type: 'audio',
                audioUrl: 'https://example.com/audio/salah-recitations.mp3',
                language: 'Arabic',
                transcript: 'Recitation of Surah Al-Fatihah and other chapters...',
            },
        },
        {
            id: `${courseId}-lesson-7`,
            courseId,
            title: 'Foundation Assessment',
            duration: '10:00',
            type: 'quiz',
            order: 7,
            description: 'Test your knowledge of the essentials of prayer and purification.',
            content: {
                type: 'quiz',
                description: 'This quiz covers what you have learned in the Prayer course.',
                totalQuestions: 10,
                passingScore: 7,
            },
        },
    ];
}

function generateSeerahLessons(courseId: string, courseDescription: string): SeedLesson[] {
    return [
        {
            id: `${courseId}-lesson-1`,
            courseId,
            title: 'Pre-Islamic Arabia',
            duration: '15:00',
            type: 'video',
            order: 1,
            description: 'Understanding the context into which the Prophet (PBUH) was born.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/jahiliyyah.mp4',
            },
        },
        {
            id: `${courseId}-lesson-2`,
            courseId,
            title: 'Early Life and Character',
            duration: '15:00',
            type: 'video',
            order: 2,
            description: 'The Prophet\'s upbringing and his reputation as Al-Amin (the Trustworthy).',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/early-life.mp4',
            },
        },
        {
            id: `${courseId}-lesson-3`,
            courseId,
            title: 'The First Revelation',
            duration: '15:00',
            type: 'article',
            order: 3,
            description: 'The profound events in Cave Hira and the start of Prophethood.',
            content: {
                type: 'article',
                sections: [
                    {
                        header: 'Cave Hira',
                        content: 'The Prophet often retreated to Cave Hira for contemplation...',
                    },
                ],
            },
        },
        {
            id: `${courseId}-lesson-4`,
            courseId,
            title: 'Persecution in Makkah',
            duration: '15:00',
            type: 'video',
            order: 4,
            description: 'The struggles faced by early Muslims and the Prophet\'s perseverance.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/makkan-period.mp4',
            },
        },
        {
            id: `${courseId}-lesson-5`,
            courseId,
            title: 'The Hijrah to Madinah',
            duration: '15:00',
            type: 'video',
            order: 5,
            description: 'The strategic migration and the establishment of a new community.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/hijrah.mp4',
            },
        },
        {
            id: `${courseId}-lesson-6`,
            courseId,
            title: 'Foundation of a Civilization',
            duration: '15:00',
            type: 'video',
            order: 6,
            description: 'The social and legal systems established in the model state of Madinah.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/madinah-period.mp4',
            },
        },
        {
            id: `${courseId}-lesson-7`,
            courseId,
            title: 'The Farewell Pilgrimage',
            duration: '15:00',
            type: 'video',
            order: 7,
            description: 'The Prophet\'s final advice to the Ummah regarding human rights and faith.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/final-sermon.mp4',
            },
        },
        {
            id: `${courseId}-lesson-8`,
            courseId,
            title: 'Seerah Final Quiz',
            duration: '15:00',
            type: 'quiz',
            order: 8,
            description: 'Comprehensive quiz covering the life and mission of the Prophet (PBUH).',
            content: {
                type: 'quiz',
                description: 'Final assessment for the Seerah course.',
                totalQuestions: 15,
                passingScore: 11,
            },
        },
    ];
}

function generateEqualityLessons(courseId: string, courseDescription: string): SeedLesson[] {
    return [
        {
            id: `${courseId}-lesson-1`,
            courseId,
            title: 'Spiritual Equality in the Quran',
            duration: '12:00',
            type: 'article',
            order: 1,
            description: 'Exploring verses that declare the equal spiritual worth of all souls.',
            content: {
                type: 'article',
                sections: [
                    {
                        header: 'Quranic Principles',
                        content: 'The Quran addresses believers as "O humanity" and "O you who believe" regardless of their background...',
                    },
                ],
            },
        },
        {
            id: `${courseId}-lesson-2`,
            courseId,
            title: 'The Abolition of Racism',
            duration: '15:00',
            type: 'video',
            order: 2,
            description: 'How Islam challenged the racial hierarchies of the ancient world.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/islam-racism.mp4',
            },
        },
        {
            id: `${courseId}-lesson-3`,
            courseId,
            title: 'Social Justice and the Poor',
            duration: '15:00',
            type: 'video',
            order: 3,
            description: 'The obligatory rights of the marginalized and the system of Zakat.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/social-justice.mp4',
            },
        },
        {
            id: `${courseId}-lesson-4`,
            courseId,
            title: 'Case Studies in Islamic Justice',
            duration: '10:00',
            type: 'video',
            order: 4,
            description: 'Examples of justice from the lives of the Rightly Guided Caliphs.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/justice-cases.mp4',
            },
        },
        {
            id: `${courseId}-lesson-5`,
            courseId,
            title: 'Justice in the Modern World',
            duration: '12:00',
            type: 'article',
            order: 5,
            description: 'Applying Islamic principles of justice to contemporary global challenges.',
            content: {
                type: 'article',
                sections: [
                    {
                        header: 'Modern Challenges',
                        content: 'Islamic principles offer timeless guidance for addressing systemic inequality...',
                    },
                ],
            },
        },
        {
            id: `${courseId}-lesson-6`,
            courseId,
            title: 'Equality Concepts Quiz',
            duration: '10:00',
            type: 'quiz',
            order: 6,
            description: 'Test your understanding of Islamic principles of equality and justice.',
            content: {
                type: 'quiz',
                description: 'Assessment on Equality and Justice concepts.',
                totalQuestions: 10,
                passingScore: 7,
            },
        },
    ];
}

function generateWomenLessons(courseId: string, courseDescription: string): SeedLesson[] {
    return [
        {
            id: `${courseId}-lesson-1`,
            courseId,
            title: 'Status of Women in Islam',
            duration: '15:00',
            type: 'video',
            order: 1,
            description: 'Overview of the honored position of women in Islamic paradigm.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/women-status.mp4',
            },
        },
        {
            id: `${courseId}-lesson-2`,
            courseId,
            title: 'Women in the Quran',
            duration: '15:00',
            type: 'article',
            order: 2,
            description: 'Exploring stories and roles of female figures mentioned in the Quran.',
            content: {
                type: 'article',
                sections: [
                    {
                        header: 'Female Figures',
                        content: 'The Quran honors several women, most notably Maryam (RA)...',
                    },
                ],
            },
        },
        {
            id: `${courseId}-lesson-3`,
            courseId,
            title: 'Economic and Legal Rights',
            duration: '15:00',
            type: 'video',
            order: 3,
            description: 'Detailed look at property, inheritance, and contractual rights.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/women-rights.mp4',
            },
        },
        {
            id: `${courseId}-lesson-4`,
            courseId,
            title: 'Motherhood in Islam',
            duration: '12:00',
            type: 'article',
            order: 4,
            description: 'The high status and spiritual reward associated with motherhood.',
            content: {
                type: 'article',
                sections: [
                    {
                        header: 'Maternal Status',
                        content: 'The Prophet (PBUH) emphasized that Paradise is at the feet of mothers...',
                    },
                ],
            },
        },
        {
            id: `${courseId}-lesson-5`,
            courseId,
            title: 'Great Muslim Women of History',
            duration: '15:00',
            type: 'video',
            order: 5,
            description: 'Stories of Khadijah, Aisha, Nusaybah, and other scholars and leaders.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/famous-muslim-women.mp4',
            },
        },
        {
            id: `${courseId}-lesson-6`,
            courseId,
            title: 'Common Misconceptions',
            duration: '15:00',
            type: 'video',
            order: 6,
            description: 'Addressing cultural practices often confused with Islamic rulings.',
            content: {
                type: 'video',
                videoUrl: 'https://example.com/videos/women-misconceptions.mp4',
            },
        },
        {
            id: `${courseId}-lesson-7`,
            courseId,
            title: 'Women in Islam Quiz',
            duration: '10:00',
            type: 'quiz',
            order: 7,
            description: 'Assessment on the rights and roles of women in Islam.',
            content: {
                type: 'quiz',
                description: 'Final assessment for Women in Islam course.',
                totalQuestions: 10,
                passingScore: 7,
            },
        },
    ];
}

function generateGenericLessons(course: SeedCourse): SeedLesson[] {
    const { id, title, lessons: lessonCount, description } = course;
    return Array.from({ length: lessonCount }, (_, i) => {
        const order = i + 1;
        const isLast = order === lessonCount;
        const type = order === 1 ? 'intro' : (isLast ? 'quiz' : 'video');

        return {
            id: `${id}-lesson-${order}`,
            courseId: id,
            title: `${title} - ${type === 'quiz' ? 'Quiz' : 'Lesson ' + order}`,
            duration: '15:00',
            type: type as any, // Cast to avoid complex union matching
            order,
            description: `Learning materials for ${title}, part ${order}.`,
            content: (type === 'intro' ? {
                type: 'intro',
                courseOverview: description || `Welcome to ${title}`,
                objectives: ['Learn fundamental concepts', 'Apply to daily life'],
            } : (type === 'quiz' ? {
                type: 'quiz',
                description: `Quiz for ${title}`,
                totalQuestions: 10,
                passingScore: 7,
            } : {
                type: 'video',
                videoUrl: `https://example.com/videos/${id}-${order}.mp4`,
            })) as any,
        };
    });
}

/**
 * All lessons in the academy
 */
export const ACADEMY_LESSONS: SeedLesson[] = generateAllLessons();

// ============================================================================
// QUIZ QUESTION DEFINITIONS
// ============================================================================

export interface SeedQuizOption {
    id: string;
    label: string; // A, B, C, D
    text: string;
}

export interface SeedQuizQuestion {
    id: string;
    quizId: string;
    courseId: string;
    questionNumber: number;
    questionText: string;
    options: SeedQuizOption[];
    correctOptionId: string;
    hint?: string;
    evidenceSource?: string;
    explanation?: string;
}

export interface SeedLessonNote {
    id: string;
    lessonId: string;
    timestamp: string;
    text: string;
    createdAt: string;
}

export interface SeedStudentProgress extends StudentProgress {
    notes: SeedLessonNote[];
}

/**
 * Generate quiz questions for a course
 */
function generateCourseQuizQuestions(courseId: string, courseTitle: string): SeedQuizQuestion[] {
    const quizId = `quiz-${courseId}`;

    // Course-specific questions based on course ID
    const questionSets: Record<string, SeedQuizQuestion[]> = {
        's1-mb-1': generatePrayerQuizQuestions(courseId, quizId),
        's1-ms-1': generateFaithQuizQuestions(courseId, quizId),
        's1-st-1': generateEthicsQuizQuestions(courseId, quizId),
        's1-st-2': generateWomenQuizQuestions(courseId, quizId),
    };

    // Return specific questions if available, otherwise generate generic ones
    return questionSets[courseId] || generateGenericQuizQuestions(courseId, quizId, courseTitle);
}

function generatePrayerQuizQuestions(courseId: string, quizId: string): SeedQuizQuestion[] {
    return [
        {
            id: `${quizId}-q1`,
            quizId,
            courseId,
            questionNumber: 1,
            questionText: 'How many obligatory (Fard) prayers must a Muslim perform daily?',
            options: [
                { id: 'a', label: 'A', text: 'Three' },
                { id: 'b', label: 'B', text: 'Five' },
                { id: 'c', label: 'C', text: 'Seven' },
                { id: 'd', label: 'D', text: 'Two' },
            ],
            correctOptionId: 'b',
            hint: 'Think about the prayers: Fajr, Dhuhr, Asr, Maghrib, and Isha.',
            evidenceSource: 'Sahih Bukhari, Book of Prayer',
            explanation: 'Muslims are obligated to perform five daily prayers: Fajr (dawn), Dhuhr (noon), Asr (afternoon), Maghrib (sunset), and Isha (night).',
        },
        {
            id: `${quizId}-q2`,
            quizId,
            courseId,
            questionNumber: 2,
            questionText: 'What is the ritual purification performed before prayer called?',
            options: [
                { id: 'a', label: 'A', text: 'Tayammum' },
                { id: 'b', label: 'B', text: 'Ghusl' },
                { id: 'c', label: 'C', text: 'Wudu (Ablution)' },
                { id: 'd', label: 'D', text: 'Salah' },
            ],
            correctOptionId: 'c',
            hint: 'It involves washing specific body parts with water.',
            evidenceSource: 'Quran 5:6',
            explanation: 'Wudu (ablution) is the ritual washing of hands, face, arms, and feet before prayer. It is mentioned in Surah Al-Ma\'idah (5:6).',
        },
        {
            id: `${quizId}-q3`,
            quizId,
            courseId,
            questionNumber: 3,
            questionText: 'Which direction must Muslims face when praying?',
            options: [
                { id: 'a', label: 'A', text: 'East' },
                { id: 'b', label: 'B', text: 'Toward the Kaaba in Mecca (Qibla)' },
                { id: 'c', label: 'C', text: 'Any direction' },
                { id: 'd', label: 'D', text: 'North' },
            ],
            correctOptionId: 'b',
            hint: 'The direction is toward a specific holy site in Saudi Arabia.',
            evidenceSource: 'Quran 2:144',
            explanation: 'Muslims face the Kaaba in Mecca, known as the Qibla. This was commanded by Allah in Quran 2:144.',
        },
        {
            id: `${quizId}-q4`,
            quizId,
            courseId,
            questionNumber: 4,
            questionText: 'What is the first prayer of the day called?',
            options: [
                { id: 'a', label: 'A', text: 'Dhuhr' },
                { id: 'b', label: 'B', text: 'Isha' },
                { id: 'c', label: 'C', text: 'Fajr' },
                { id: 'd', label: 'D', text: 'Maghrib' },
            ],
            correctOptionId: 'c',
            hint: 'It is performed at dawn, before sunrise.',
            evidenceSource: 'Islamic Prayer Times',
            explanation: 'Fajr is the dawn prayer, performed before sunrise. It is the first of the five daily prayers.',
        },
        {
            id: `${quizId}-q5`,
            quizId,
            courseId,
            questionNumber: 5,
            questionText: 'What do Muslims recite in every unit (Rak\'ah) of prayer?',
            options: [
                { id: 'a', label: 'A', text: 'Surah Al-Baqarah' },
                { id: 'b', label: 'B', text: 'Surah Al-Fatihah' },
                { id: 'c', label: 'C', text: 'Surah Ya-Sin' },
                { id: 'd', label: 'D', text: 'Any Surah' },
            ],
            correctOptionId: 'b',
            hint: 'It is the opening chapter of the Quran.',
            evidenceSource: 'Sahih Bukhari',
            explanation: 'Surah Al-Fatihah is recited in every Rak\'ah of prayer. The Prophet (PBUH) said there is no prayer without it.',
        },
        {
            id: `${quizId}-q6`,
            quizId,
            courseId,
            questionNumber: 6,
            questionText: 'What is the prostration position in prayer called?',
            options: [
                { id: 'a', label: 'A', text: 'Qiyam' },
                { id: 'b', label: 'B', text: 'Ruku' },
                { id: 'c', label: 'C', text: 'Sujood' },
                { id: 'd', label: 'D', text: 'Tashahhud' },
            ],
            correctOptionId: 'c',
            hint: 'The position where forehead touches the ground.',
            evidenceSource: 'Islamic Prayer Positions',
            explanation: 'Sujood (prostration) is when the forehead, nose, hands, knees, and toes touch the ground. It is the position of greatest humility before Allah.',
        },
        {
            id: `${quizId}-q7`,
            quizId,
            courseId,
            questionNumber: 7,
            questionText: 'What breaks the state of Wudu?',
            options: [
                { id: 'a', label: 'A', text: 'Speaking' },
                { id: 'b', label: 'B', text: 'Passing gas or using the bathroom' },
                { id: 'c', label: 'C', text: 'Walking' },
                { id: 'd', label: 'D', text: 'Eating' },
            ],
            correctOptionId: 'b',
            hint: 'Think about actions that involve bodily functions.',
            evidenceSource: 'Fiqh of Purification',
            explanation: 'Wudu is broken by natural discharges (using bathroom, passing gas), sleep, and loss of consciousness.',
        },
        {
            id: `${quizId}-q8`,
            quizId,
            courseId,
            questionNumber: 8,
            questionText: 'How many Rak\'ahs are in the Fajr prayer?',
            options: [
                { id: 'a', label: 'A', text: '2 Rak\'ahs' },
                { id: 'b', label: 'B', text: '3 Rak\'ahs' },
                { id: 'c', label: 'C', text: '4 Rak\'ahs' },
                { id: 'd', label: 'D', text: '1 Rak\'ah' },
            ],
            correctOptionId: 'a',
            hint: 'Fajr is the shortest obligatory prayer.',
            evidenceSource: 'Prayer Structure',
            explanation: 'Fajr prayer consists of 2 Rak\'ahs. It is the shortest of the five daily prayers.',
        },
        {
            id: `${quizId}-q9`,
            quizId,
            courseId,
            questionNumber: 9,
            questionText: 'What phrase begins the call to prayer (Adhan)?',
            options: [
                { id: 'a', label: 'A', text: 'Bismillah' },
                { id: 'b', label: 'B', text: 'Allahu Akbar' },
                { id: 'c', label: 'C', text: 'Subhanallah' },
                { id: 'd', label: 'D', text: 'Alhamdulillah' },
            ],
            correctOptionId: 'b',
            hint: 'It means "God is the Greatest".',
            evidenceSource: 'Adhan Text',
            explanation: 'The Adhan begins with "Allahu Akbar" (God is the Greatest), repeated four times.',
        },
        {
            id: `${quizId}-q10`,
            quizId,
            courseId,
            questionNumber: 10,
            questionText: 'What is the congregational Friday prayer called?',
            options: [
                { id: 'a', label: 'A', text: 'Eid Prayer' },
                { id: 'b', label: 'B', text: 'Tahajjud' },
                { id: 'c', label: 'C', text: 'Jumu\'ah' },
                { id: 'd', label: 'D', text: 'Taraweeh' },
            ],
            correctOptionId: 'c',
            hint: 'It is performed on Friday and includes a sermon.',
            evidenceSource: 'Quran 62:9',
            explanation: 'Jumu\'ah is the Friday congregational prayer, which is obligatory for Muslim men. It is mentioned in Surah Al-Jumu\'ah (62:9).',
        },
    ];
}

function generateFaithQuizQuestions(courseId: string, quizId: string): SeedQuizQuestion[] {
    return [
        {
            id: `${quizId}-q1`,
            quizId,
            courseId,
            questionNumber: 1,
            questionText: 'The term "Tawhid" is a fundamental concept in Islam. What does it mean?',
            options: [
                { id: 'a', label: 'A', text: 'The belief in multiple gods' },
                { id: 'b', label: 'B', text: 'The oneness of Allah (God)' },
                { id: 'c', label: 'C', text: 'The practice of fasting' },
                { id: 'd', label: 'D', text: 'The pilgrimage to Mecca' },
            ],
            correctOptionId: 'b',
            hint: 'Tawhid comes from the Arabic root "wahada" which means to make one.',
            evidenceSource: 'Quran 112:1-4',
            explanation: 'Tawhid is the concept of monotheism in Islam, declaring the absolute oneness of Allah. It is the foundation of Islamic belief.',
        },
        {
            id: `${quizId}-q2`,
            quizId,
            courseId,
            questionNumber: 2,
            questionText: 'How many pillars of Iman (Faith) are there in Islam?',
            options: [
                { id: 'a', label: 'A', text: 'Four' },
                { id: 'b', label: 'B', text: 'Five' },
                { id: 'c', label: 'C', text: 'Six' },
                { id: 'd', label: 'D', text: 'Seven' },
            ],
            correctOptionId: 'c',
            hint: 'They include belief in Allah, His angels, His books, His messengers, the Last Day, and divine decree.',
            evidenceSource: 'Hadith of Jibreel',
            explanation: 'The six pillars of Iman are: belief in Allah, His angels, His books, His messengers, the Day of Judgment, and divine decree (Qadr).',
        },
        {
            id: `${quizId}-q3`,
            quizId,
            courseId,
            questionNumber: 3,
            questionText: 'What is the Islamic declaration of faith called?',
            options: [
                { id: 'a', label: 'A', text: 'Salah' },
                { id: 'b', label: 'B', text: 'Shahada' },
                { id: 'c', label: 'C', text: 'Zakat' },
                { id: 'd', label: 'D', text: 'Sawm' },
            ],
            correctOptionId: 'b',
            hint: 'It is the first pillar of Islam and testimony of faith.',
            evidenceSource: 'Hadith about Five Pillars',
            explanation: 'The Shahada is "La ilaha illallah, Muhammadur Rasulullah" - There is no god but Allah, and Muhammad is the Messenger of Allah.',
        },
        {
            id: `${quizId}-q4`,
            quizId,
            courseId,
            questionNumber: 4,
            questionText: 'Which angel is responsible for delivering revelations to the prophets?',
            options: [
                { id: 'a', label: 'A', text: 'Mikail' },
                { id: 'b', label: 'B', text: 'Israfil' },
                { id: 'c', label: 'C', text: 'Jibreel (Gabriel)' },
                { id: 'd', label: 'D', text: 'Azrael' },
            ],
            correctOptionId: 'c',
            hint: 'This angel delivered the Quran to Prophet Muhammad (PBUH).',
            evidenceSource: 'Quran 2:97',
            explanation: 'Jibreel (Gabriel) is the angel of revelation who delivered Allah\'s message to all the prophets, including the Quran to Muhammad (PBUH).',
        },
        {
            id: `${quizId}-q5`,
            quizId,
            courseId,
            questionNumber: 5,
            questionText: 'What does "Qadr" refer to in Islamic belief?',
            options: [
                { id: 'a', label: 'A', text: 'Prayer' },
                { id: 'b', label: 'B', text: 'Charity' },
                { id: 'c', label: 'C', text: 'Divine decree and predestination' },
                { id: 'd', label: 'D', text: 'Fasting' },
            ],
            correctOptionId: 'c',
            hint: 'It relates to Allah\'s knowledge and will over all things.',
            evidenceSource: 'Quran 54:49',
            explanation: 'Qadr is belief in divine predestination - that Allah has knowledge of everything and has decreed all that will happen.',
        },
        {
            id: `${quizId}-q6`,
            quizId,
            courseId,
            questionNumber: 6,
            questionText: 'How many prophets are mentioned by name in the Quran?',
            options: [
                { id: 'a', label: 'A', text: '10' },
                { id: 'b', label: 'B', text: '15' },
                { id: 'c', label: 'C', text: '25' },
                { id: 'd', label: 'D', text: '50' },
            ],
            correctOptionId: 'c',
            hint: 'They include prophets from Adam to Muhammad (PBUH).',
            evidenceSource: 'Quranic mentions',
            explanation: '25 prophets are mentioned by name in the Quran, though the total number of prophets sent throughout history is much larger.',
        },
        {
            id: `${quizId}-q7`,
            quizId,
            courseId,
            questionNumber: 7,
            questionText: 'What is the Day of Judgment called in Arabic?',
            options: [
                { id: 'a', label: 'A', text: 'Yawm al-Qiyamah' },
                { id: 'b', label: 'B', text: 'Laylat al-Qadr' },
                { id: 'c', label: 'C', text: 'Eid al-Fitr' },
                { id: 'd', label: 'D', text: 'Hajj' },
            ],
            correctOptionId: 'a',
            hint: 'It literally means "Day of Resurrection."',
            evidenceSource: 'Quran 75:1',
            explanation: 'Yawm al-Qiyamah (Day of Resurrection/Judgment) is when all humans will be resurrected and held accountable for their deeds.',
        },
        {
            id: `${quizId}-q8`,
            quizId,
            courseId,
            questionNumber: 8,
            questionText: 'Which holy book was revealed to Prophet Isa (Jesus)?',
            options: [
                { id: 'a', label: 'A', text: 'Torah' },
                { id: 'b', label: 'B', text: 'Zabur' },
                { id: 'c', label: 'C', text: 'Injeel (Gospel)' },
                { id: 'd', label: 'D', text: 'Quran' },
            ],
            correctOptionId: 'c',
            hint: 'It is the book given to Jesus in Arabic name.',
            evidenceSource: 'Quran 5:46',
            explanation: 'The Injeel (Gospel) was the revelation given to Prophet Isa (Jesus). Muslims believe in all divine books in their original form.',
        },
        {
            id: `${quizId}-q9`,
            quizId,
            courseId,
            questionNumber: 9,
            questionText: 'What are the attributes of Allah that Muslims believe in?',
            options: [
                { id: 'a', label: 'A', text: 'Only power and strength' },
                { id: 'b', label: 'B', text: '99 beautiful names describing His attributes' },
                { id: 'c', label: 'C', text: 'Only mercy' },
                { id: 'd', label: 'D', text: 'No specific attributes' },
            ],
            correctOptionId: 'b',
            hint: 'These include Al-Rahman, Al-Rahim, Al-Malik, and more.',
            evidenceSource: 'Hadith about 99 Names',
            explanation: 'Allah has 99 beautiful names (Asma ul-Husna) that describe His attributes, such as The Most Merciful, The All-Knowing, The All-Powerful.',
        },
        {
            id: `${quizId}-q10`,
            quizId,
            courseId,
            questionNumber: 10,
            questionText: 'Who is considered the final prophet in Islam?',
            options: [
                { id: 'a', label: 'A', text: 'Prophet Isa (Jesus)' },
                { id: 'b', label: 'B', text: 'Prophet Musa (Moses)' },
                { id: 'c', label: 'C', text: 'Prophet Ibrahim (Abraham)' },
                { id: 'd', label: 'D', text: 'Prophet Muhammad (PBUH)' },
            ],
            correctOptionId: 'd',
            hint: 'He is known as the "Seal of the Prophets."',
            evidenceSource: 'Quran 33:40',
            explanation: 'Prophet Muhammad (PBUH) is the final prophet - Khatam an-Nabiyyin (Seal of the Prophets) as mentioned in Quran 33:40.',
        },
    ];
}

function generateEthicsQuizQuestions(courseId: string, quizId: string): SeedQuizQuestion[] {
    return [
        {
            id: `${quizId}-q1`,
            quizId,
            courseId,
            questionNumber: 1,
            questionText: 'What is the Arabic term for good character and ethics in Islam?',
            options: [
                { id: 'a', label: 'A', text: 'Fiqh' },
                { id: 'b', label: 'B', text: 'Akhlaq' },
                { id: 'c', label: 'C', text: 'Aqeedah' },
                { id: 'd', label: 'D', text: 'Shariah' },
            ],
            correctOptionId: 'b',
            hint: 'It refers to moral excellence and character.',
            evidenceSource: 'Islamic Ethics',
            explanation: 'Akhlaq refers to ethics, morality, and good character in Islam. The Prophet (PBUH) said he was sent to perfect good character.',
        },
        {
            id: `${quizId}-q2`,
            quizId,
            courseId,
            questionNumber: 2,
            questionText: 'According to a famous hadith, what did the Prophet (PBUH) say he was sent to perfect?',
            options: [
                { id: 'a', label: 'A', text: 'Prayer rituals' },
                { id: 'b', label: 'B', text: 'Good character/morals' },
                { id: 'c', label: 'C', text: 'Arabic language' },
                { id: 'd', label: 'D', text: 'Business practices' },
            ],
            correctOptionId: 'b',
            hint: 'The hadith mentions perfecting moral qualities.',
            evidenceSource: 'Muwatta Malik',
            explanation: 'The Prophet (PBUH) said: "I was sent to perfect good character (morals)." This shows the central importance of ethics in Islam.',
        },
        {
            id: `${quizId}-q3`,
            quizId,
            courseId,
            questionNumber: 3,
            questionText: 'What is the Islamic principle of being conscious of Allah in all actions?',
            options: [
                { id: 'a', label: 'A', text: 'Sabr' },
                { id: 'b', label: 'B', text: 'Shukr' },
                { id: 'c', label: 'C', text: 'Taqwa' },
                { id: 'd', label: 'D', text: 'Tawakkul' },
            ],
            correctOptionId: 'c',
            hint: 'It is often translated as God-consciousness or piety.',
            evidenceSource: 'Quran 2:197',
            explanation: 'Taqwa is God-consciousness - being aware that Allah sees all our actions and striving to please Him in everything we do.',
        },
        {
            id: `${quizId}-q4`,
            quizId,
            courseId,
            questionNumber: 4,
            questionText: 'What does Islam teach about honesty in business dealings?',
            options: [
                { id: 'a', label: 'A', text: 'It is optional' },
                { id: 'b', label: 'B', text: 'It is mandatory and a sign of faith' },
                { id: 'c', label: 'C', text: 'It depends on the situation' },
                { id: 'd', label: 'D', text: 'It is only for scholars' },
            ],
            correctOptionId: 'b',
            hint: 'The Prophet was known as "Al-Amin" (The Trustworthy).',
            evidenceSource: 'Hadith on honesty in trade',
            explanation: 'Honesty is mandatory in all dealings. The Prophet (PBUH) cursed those who cheat and praised honest merchants.',
        },
        {
            id: `${quizId}-q5`,
            quizId,
            courseId,
            questionNumber: 5,
            questionText: 'What virtue does Islam emphasize regarding treatment of parents?',
            options: [
                { id: 'a', label: 'A', text: 'Respect only when convenient' },
                { id: 'b', label: 'B', text: 'Birr al-Walidayn (kindness to parents)' },
                { id: 'c', label: 'C', text: 'Independence from parents' },
                { id: 'd', label: 'D', text: 'Equal treatment as friends' },
            ],
            correctOptionId: 'b',
            hint: 'It is mentioned right after the command to worship Allah alone.',
            evidenceSource: 'Quran 17:23-24',
            explanation: 'Birr al-Walidayn (kindness to parents) is emphasized in the Quran immediately after worship of Allah, showing its great importance.',
        },
        {
            id: `${quizId}-q6`,
            quizId,
            courseId,
            questionNumber: 6,
            questionText: 'What is the Islamic teaching about backbiting (Gheebah)?',
            options: [
                { id: 'a', label: 'A', text: 'It is permissible among friends' },
                { id: 'b', label: 'B', text: 'It is a major sin compared to eating dead flesh' },
                { id: 'c', label: 'C', text: 'It is only wrong if the person finds out' },
                { id: 'd', label: 'D', text: 'It is a minor matter' },
            ],
            correctOptionId: 'b',
            hint: 'The Quran compares it to eating dead flesh of your brother.',
            evidenceSource: 'Quran 49:12',
            explanation: 'Backbiting is severely condemned in Islam. The Quran asks: "Would one of you like to eat the flesh of his dead brother?"',
        },
        {
            id: `${quizId}-q7`,
            quizId,
            courseId,
            questionNumber: 7,
            questionText: 'What does "Sabr" mean in Islamic ethics?',
            options: [
                { id: 'a', label: 'A', text: 'Anger' },
                { id: 'b', label: 'B', text: 'Patience and perseverance' },
                { id: 'c', label: 'C', text: 'Speed' },
                { id: 'd', label: 'D', text: 'Revenge' },
            ],
            correctOptionId: 'b',
            hint: 'It is mentioned over 90 times in the Quran.',
            evidenceSource: 'Quran 2:153',
            explanation: 'Sabr means patience, perseverance, and steadfastness in the face of difficulties. Allah is with those who are patient.',
        },
        {
            id: `${quizId}-q8`,
            quizId,
            courseId,
            questionNumber: 8,
            questionText: 'How does Islam view the concept of justice?',
            options: [
                { id: 'a', label: 'A', text: 'Justice for Muslims only' },
                { id: 'b', label: 'B', text: 'Justice for all, even against oneself' },
                { id: 'c', label: 'C', text: 'Justice based on wealth' },
                { id: 'd', label: 'D', text: 'Justice for family only' },
            ],
            correctOptionId: 'b',
            hint: 'The Quran commands standing up for justice even against relatives.',
            evidenceSource: 'Quran 4:135',
            explanation: 'Islam commands absolute justice: "Be maintainers of justice, witnesses for Allah, even if against yourselves or your parents." (4:135)',
        },
        {
            id: `${quizId}-q9`,
            quizId,
            courseId,
            questionNumber: 9,
            questionText: 'What is "Shukr" in Islamic ethics?',
            options: [
                { id: 'a', label: 'A', text: 'Complaint' },
                { id: 'b', label: 'B', text: 'Gratitude and thankfulness' },
                { id: 'c', label: 'C', text: 'Pride' },
                { id: 'd', label: 'D', text: 'Ignorance' },
            ],
            correctOptionId: 'b',
            hint: 'Allah promises to increase blessings for those who practice this.',
            evidenceSource: 'Quran 14:7',
            explanation: 'Shukr is gratitude. Allah says: "If you are grateful, I will surely increase you [in favor]." (14:7)',
        },
        {
            id: `${quizId}-q10`,
            quizId,
            courseId,
            questionNumber: 10,
            questionText: 'What is the Islamic view on fulfilling promises?',
            options: [
                { id: 'a', label: 'A', text: 'Optional if inconvenient' },
                { id: 'b', label: 'B', text: 'Obligatory - breaking promises is a sign of hypocrisy' },
                { id: 'c', label: 'C', text: 'Only important for written contracts' },
                { id: 'd', label: 'D', text: 'Only for religious matters' },
            ],
            correctOptionId: 'b',
            hint: 'Breaking promises is mentioned as a characteristic of hypocrites.',
            evidenceSource: 'Sahih Bukhari',
            explanation: 'The Prophet (PBUH) said breaking promises is one of the signs of a hypocrite. Fulfilling promises is obligatory.',
        },
    ];
}

function generateWomenQuizQuestions(courseId: string, quizId: string): SeedQuizQuestion[] {
    return [
        {
            id: `${quizId}-q1`,
            quizId,
            courseId,
            questionNumber: 1,
            questionText: 'What did the Prophet Muhammad (PBUH) say about women regarding Paradise?',
            options: [
                { id: 'a', label: 'A', text: 'Paradise is at the feet of mothers' },
                { id: 'b', label: 'B', text: 'Women cannot enter Paradise' },
                { id: 'c', label: 'C', text: 'Paradise is only for men' },
                { id: 'd', label: 'D', text: 'Women enter Paradise last' },
            ],
            correctOptionId: 'a',
            hint: 'It emphasizes the status of mothers.',
            evidenceSource: 'Sunan an-Nasai',
            explanation: 'The Prophet (PBUH) said "Paradise lies at the feet of your mother," showing the extremely high status of mothers in Islam.',
        },
        {
            id: `${quizId}-q2`,
            quizId,
            courseId,
            questionNumber: 2,
            questionText: 'Who was the first person to accept Islam?',
            options: [
                { id: 'a', label: 'A', text: 'Abu Bakr' },
                { id: 'b', label: 'B', text: 'Khadijah bint Khuwaylid' },
                { id: 'c', label: 'C', text: 'Umar ibn al-Khattab' },
                { id: 'd', label: 'D', text: 'Ali ibn Abi Talib' },
            ],
            correctOptionId: 'b',
            hint: 'She was the Prophet\'s first wife.',
            evidenceSource: 'Islamic History',
            explanation: 'Khadijah (RA) was the first person to accept Islam. She supported the Prophet and is one of the greatest women in Islamic history.',
        },
        {
            id: `${quizId}-q3`,
            quizId,
            courseId,
            questionNumber: 3,
            questionText: 'In Islam, do women have the right to own property?',
            options: [
                { id: 'a', label: 'A', text: 'No, property belongs to men' },
                { id: 'b', label: 'B', text: 'Yes, independent financial rights' },
                { id: 'c', label: 'C', text: 'Only with husband\'s permission' },
                { id: 'd', label: 'D', text: 'Only inherited property' },
            ],
            correctOptionId: 'b',
            hint: 'Islam gave women property rights 1400 years ago.',
            evidenceSource: 'Quran 4:7',
            explanation: 'Islam grants women full financial independence and property rights. Women can own, earn, buy, sell, and manage wealth independently.',
        },
        {
            id: `${quizId}-q4`,
            quizId,
            courseId,
            questionNumber: 4,
            questionText: 'What does Islam say about a woman\'s right to education?',
            options: [
                { id: 'a', label: 'A', text: 'Education is forbidden for women' },
                { id: 'b', label: 'B', text: 'Limited education only' },
                { id: 'c', label: 'C', text: 'Seeking knowledge is obligatory for all Muslims' },
                { id: 'd', label: 'D', text: 'Education is optional' },
            ],
            correctOptionId: 'c',
            hint: 'The Prophet said seeking knowledge is obligatory for every Muslim.',
            evidenceSource: 'Ibn Majah',
            explanation: 'The Prophet (PBUH) said "Seeking knowledge is obligatory for every Muslim" - this includes both men and women.',
        },
        {
            id: `${quizId}-q5`,
            quizId,
            courseId,
            questionNumber: 5,
            questionText: 'Which woman is mentioned by name in the Quran?',
            options: [
                { id: 'a', label: 'A', text: 'Khadijah' },
                { id: 'b', label: 'B', text: 'Maryam (Mary)' },
                { id: 'c', label: 'C', text: 'Aisha' },
                { id: 'd', label: 'D', text: 'Fatimah' },
            ],
            correctOptionId: 'b',
            hint: 'An entire chapter (Surah) is named after her.',
            evidenceSource: 'Quran, Surah Maryam',
            explanation: 'Maryam (Mary) is the only woman mentioned by name in the Quran. Surah 19 is named after her.',
        },
        {
            id: `${quizId}-q6`,
            quizId,
            courseId,
            questionNumber: 6,
            questionText: 'What does Islam say about the spiritual equality of men and women?',
            options: [
                { id: 'a', label: 'A', text: 'Men are spiritually superior' },
                { id: 'b', label: 'B', text: 'Women are spiritually superior' },
                { id: 'c', label: 'C', text: 'Both are spiritually equal before Allah' },
                { id: 'd', label: 'D', text: 'Only scholars are spiritually equal' },
            ],
            correctOptionId: 'c',
            hint: 'The Quran addresses believing men and women equally.',
            evidenceSource: 'Quran 33:35',
            explanation: 'The Quran states that believing men and women will receive equal reward. Spiritual rank depends on faith and deeds, not gender.',
        },
        {
            id: `${quizId}-q7`,
            quizId,
            courseId,
            questionNumber: 7,
            questionText: 'What does "Mahr" refer to in Islamic marriage?',
            options: [
                { id: 'a', label: 'A', text: 'A gift from bride\'s family' },
                { id: 'b', label: 'B', text: 'A mandatory gift from groom to bride' },
                { id: 'c', label: 'C', text: 'Wedding celebration costs' },
                { id: 'd', label: 'D', text: 'Marriage counseling' },
            ],
            correctOptionId: 'b',
            hint: 'It is a woman\'s right in marriage.',
            evidenceSource: 'Quran 4:4',
            explanation: 'Mahr is a mandatory gift from the groom to the bride. It is her exclusive right and property.',
        },
        {
            id: `${quizId}-q8`,
            quizId,
            courseId,
            questionNumber: 8,
            questionText: 'Can a Muslim woman choose her spouse in Islam?',
            options: [
                { id: 'a', label: 'A', text: 'No, only her father can choose' },
                { id: 'b', label: 'B', text: 'Yes, her consent is required for marriage' },
                { id: 'c', label: 'C', text: 'Only if she is wealthy' },
                { id: 'd', label: 'D', text: 'Only after age 30' },
            ],
            correctOptionId: 'b',
            hint: 'The Prophet annulled marriages where women were forced.',
            evidenceSource: 'Sahih Bukhari',
            explanation: 'A woman\'s consent is required for marriage. The Prophet (PBUH) said a woman cannot be married without her permission.',
        },
        {
            id: `${quizId}-q9`,
            quizId,
            courseId,
            questionNumber: 9,
            questionText: 'Who was the scholar who narrated the most hadith from the Prophet?',
            options: [
                { id: 'a', label: 'A', text: 'Abu Hurairah' },
                { id: 'b', label: 'B', text: 'Aisha bint Abu Bakr' },
                { id: 'c', label: 'C', text: 'Ibn Abbas' },
                { id: 'd', label: 'D', text: 'Anas ibn Malik' },
            ],
            correctOptionId: 'b',
            hint: 'Among the top narrators, one was the Prophet\'s wife and a major scholar.',
            evidenceSource: 'Hadith Sciences',
            explanation: 'Aisha (RA) is among the top hadith narrators and one of the greatest scholars. Companions sought her knowledge on many matters.',
        },
        {
            id: `${quizId}-q10`,
            quizId,
            courseId,
            questionNumber: 10,
            questionText: 'What is the Islamic view on daughters?',
            options: [
                { id: 'a', label: 'A', text: 'Daughters are a burden' },
                { id: 'b', label: 'B', text: 'Raising daughters leads to Paradise' },
                { id: 'c', label: 'C', text: 'Sons are preferred' },
                { id: 'd', label: 'D', text: 'Daughters are equal only if educated' },
            ],
            correctOptionId: 'b',
            hint: 'The Prophet promised a great reward for raising daughters well.',
            evidenceSource: 'Sahih Bukhari',
            explanation: 'The Prophet (PBUH) said whoever raises two daughters well will be with him in Paradise like two fingers together.',
        },
    ];
}

function generateGenericQuizQuestions(courseId: string, quizId: string, courseTitle: string): SeedQuizQuestion[] {
    return Array.from({ length: 10 }, (_, i) => ({
        id: `${quizId}-q${i + 1}`,
        quizId,
        courseId,
        questionNumber: i + 1,
        questionText: `Question ${i + 1} about ${courseTitle}: What is a key concept covered in this lesson?`,
        options: [
            { id: 'a', label: 'A', text: 'Option A - Incorrect answer' },
            { id: 'b', label: 'B', text: 'Option B - Correct answer' },
            { id: 'c', label: 'C', text: 'Option C - Incorrect answer' },
            { id: 'd', label: 'D', text: 'Option D - Incorrect answer' },
        ],
        correctOptionId: 'b',
        hint: `Review the ${courseTitle} lesson materials for this answer.`,
        evidenceSource: 'Course Materials',
        explanation: `This is a key concept from the ${courseTitle} course.`,
    }));
}

// Generate all quiz questions
export const ACADEMY_QUIZ_QUESTIONS: SeedQuizQuestion[] = ACADEMY_COURSES.flatMap(course =>
    generateCourseQuizQuestions(course.id, course.title)
);

// ============================================================================
// STUDENT PROGRESS DEFINITIONS
// ============================================================================

/**
 * Generate seed student progress data
 */
function generateSeedStudentProgress(): SeedStudentProgress {
    return {
        studentId: 'user-1',
        currentStage: 1,
        recentLesson: {
            stageNumber: 1,
            courseId: 's1-mb-1',
            courseName: 'The Art of Prayer',
            lessonId: 's1-mb-1-lesson-2',
            lessonNumber: 2,
            lessonTitle: 'Wudu: The Key to Prayer',
            thumbnailUrl: '/academy/lessons/wudu-thumb.jpg',
            progress: 45,
            currentTime: '06:45',
            totalTime: '15:00',
            completedLessons: 1,
            totalLessons: 7,
        },
        stageProgress: ACADEMY_STAGES.map(stage => ({
            stageNumber: stage.number,
            isUnlocked: stage.number === 1,
            quizPassed: false,
            completedCourses: stage.number === 1 ? 1 : 0,
            totalCourses: 4,
        })),
        courseProgress: ACADEMY_COURSES.map(course => {
            let status: CourseStatus = 'locked';
            let progress = 0;
            let completedLessons = 0;
            let quizPassed = false;

            if (course.stageId === 1) {
                if (course.id === 's1-ms-1') {
                    // First course - completed
                    status = 'completed';
                    progress = 100;
                    completedLessons = 8;
                    quizPassed = true;
                } else if (course.id === 's1-mb-1') {
                    // Second course - in progress
                    status = 'in-progress';
                    progress = 25;
                    completedLessons = 1;
                } else {
                    // Other stage 1 courses - available
                    status = 'available';
                }
            }

            return {
                courseId: course.id,
                status,
                progress,
                completedLessons,
                totalLessons: 7,
                quizPassed,
            };
        }),
        lessonProgress: ACADEMY_LESSONS.map(lesson => {
            const course = ACADEMY_COURSES.find(c => c.id === lesson.courseId);
            const stageId = course?.stageId ?? 0;

            let status: LessonStatus = 'locked';
            let isCompleted = false;

            if (stageId === 1) {
                if (lesson.courseId === 's1-ms-1') {
                    // First course - all completed
                    status = 'completed';
                    isCompleted = true;
                } else if (lesson.courseId === 's1-mb-1') {
                    // Second course - partial progress
                    if (lesson.order === 1) {
                        status = 'completed';
                        isCompleted = true;
                    } else if (lesson.order === 2) {
                        status = 'current';
                    } else {
                        status = 'available';
                    }
                } else if (lesson.order === 1) {
                    // Other stage 1 courses - first lesson available
                    status = 'available';
                }
            }

            return {
                lessonId: lesson.id,
                courseId: lesson.courseId,
                status,
                isCompleted,
                completedAt: isCompleted ? '2024-01-15T10:30:00Z' : undefined,
            };
        }),
        notes: [
            {
                id: 'note-1',
                lessonId: 's1-mb-1-lesson-1',
                timestamp: '02:30',
                text: 'The Prophet (PBUH) called prayer the "Coolness of my eyes."',
                createdAt: '2024-01-14T09:15:00Z',
            },
            {
                id: 'note-2',
                lessonId: 's1-mb-1-lesson-2',
                timestamp: '04:45',
                text: 'Wudu is not just physical cleaning, it is spiritual preparation.',
                createdAt: '2024-01-15T10:20:00Z',
            },
        ],
    };
}

// Export the initial progress
export const SEED_STUDENT_PROGRESS: SeedStudentProgress = generateSeedStudentProgress();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a course by ID
 */
export function getSeedCourse(courseId: string): SeedCourse | undefined {
    return ACADEMY_COURSES.find(c => c.id === courseId);
}

/**
 * Get courses by stage
 */
export function getSeedCoursesByStage(stageId: number): SeedCourse[] {
    return ACADEMY_COURSES.filter(c => c.stageId === stageId);
}

/**
 * Get lessons by course
 */
export function getSeedLessonsByCourse(courseId: string): SeedLesson[] {
    return ACADEMY_LESSONS.filter(l => l.courseId === courseId);
}

/**
 * Get a lesson by ID
 */
export function getSeedLesson(lessonId: string): SeedLesson | undefined {
    return ACADEMY_LESSONS.find(l => l.id === lessonId);
}

/**
 * Get quiz questions for a course
 */
export function getSeedQuizQuestions(courseId: string): SeedQuizQuestion[] {
    return ACADEMY_QUIZ_QUESTIONS.filter(q => q.courseId === courseId);
}

/**
 * Get stage by number
 */
export function getSeedStage(stageNumber: number): AcademyStage | undefined {
    return ACADEMY_STAGES.find(s => s.number === stageNumber);
}

// ============================================================================
// EXPORT ALL DATA
// ============================================================================

export const ALL_ACADEMY_DATA = {
    stages: ACADEMY_STAGES,
    courses: ACADEMY_COURSES,
    lessons: ACADEMY_LESSONS,
    quizzes: ACADEMY_QUIZ_QUESTIONS,
    progress: SEED_STUDENT_PROGRESS,
};
