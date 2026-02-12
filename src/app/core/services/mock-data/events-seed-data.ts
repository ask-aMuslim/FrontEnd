export interface EventCard {
    id: number;
    title: string;
    description: string;
    imageUrl: string;
    imageAlt: string;
    speakerName: string;
    speakerImage: string;
    speakerRole: string;
    date: string;
    tags: string[];
    isRecorded: boolean;
}

export const EVENTS_SEED_DATA: EventCard[] = [
    {
        id: 1,
        title: 'Understanding Prayer: A Practical Guide',
        description:
            'Learn the fundamentals of Islamic prayer with step-by-step guidance from experienced instructors. This course covers everything from Wudu to the spiritual significance of each movement.',
        imageUrl: '/images/events-picture.png',
        imageAlt: 'Prayer Guide',
        speakerName: 'Sheikh Uthman Farooq',
        speakerImage: '/images/profile-picture-navbar.png',
        speakerRole: 'Islamic Scholar & Educator',
        date: '12 Dec, 2025',
        tags: ['#Prayer', '#Foundation', '#Practical', '#Beginner'],
        isRecorded: true,
    },
    {
        id: 2,
        title: 'Islamic Ethics in Modern Society',
        description:
            'Explore ethical principles in Islam and their application in contemporary times. How do we navigate modern challenges while staying true to our values?',
        imageUrl: '/images/events-picture.png',
        imageAlt: 'Islamic Ethics',
        speakerName: 'Dr. Fatima Hassan',
        speakerImage: '/images/profile-picture-navbar.png',
        speakerRole: 'Islamic Ethicist & Researcher',
        date: '15 Dec, 2025',
        tags: ['#Ethics', '#Modernity', '#Islam', '#Society'],
        isRecorded: false,
    },
    {
        id: 3,
        title: 'Quranic Interpretations: The Wisdom of Tafsir',
        description: 'Deep dive into understanding the Quran and its profound meanings through the lens of classical and modern Tafsir.',
        imageUrl: '/images/events-picture.png',
        imageAlt: 'Quranic Studies',
        speakerName: 'Sheikh Muhammad Ali',
        speakerImage: '/images/profile-picture-navbar.png',
        speakerRole: 'Senior Quran Expert',
        date: '18 Dec, 2025',
        tags: ['#Quran', '#Tafsir', '#Wisdom', '#Knowledge'],
        isRecorded: true,
    },
    {
        id: 4,
        title: 'Islamic History: Golden Age to Present',
        description: 'Comprehensive overview of Islamic history, focusing on the contributions to science, philosophy, and global culture.',
        imageUrl: '/images/events-picture.png',
        imageAlt: 'Islamic History',
        speakerName: 'Prof. Ahmed Ibrahim',
        speakerImage: '/images/profile-picture-navbar.png',
        speakerRole: 'Distinguished Historian',
        date: '20 Dec, 2025',
        tags: ['#History', '#Heritage', '#Civilization', '#Education'],
        isRecorded: false,
    },
    {
        id: 5,
        title: 'Spirituality & Mental Well-being',
        description: 'Understanding the deep connection between Islamic spirituality and modern psychological well-being. Practical tips for mental resilience.',
        imageUrl: '/images/events-picture.png',
        imageAlt: 'Mental Health',
        speakerName: 'Dr. Aisha Khan',
        speakerImage: '/images/profile-picture-navbar.png',
        speakerRole: 'Clinical Psychologist',
        date: '22 Dec, 2025',
        tags: ['#MentalHealth', '#Spirituality', '#Resilience', '#Islamic'],
        isRecorded: false,
    },
    {
        id: 6,
        title: 'Family Dynamics: The Prophetic Model',
        description: 'Discover Islamic principles for building strong, loving, and harmonious families based on the life of the Prophet (PBUH).',
        imageUrl: '/images/events-picture.png',
        imageAlt: 'Family Values',
        speakerName: 'Sheikh Yousef Abbas',
        speakerImage: '/images/profile-picture-navbar.png',
        speakerRole: 'Family Counselor',
        date: '25 Dec, 2025',
        tags: ['#Family', '#PropheticWay', '#Values', '#Growth'],
        isRecorded: true,
    },
];
