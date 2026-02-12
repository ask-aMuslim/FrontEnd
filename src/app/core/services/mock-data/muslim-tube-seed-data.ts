export interface Video {
    id: number;
    image: string;
    duration: string;
    title: string;
    channelLogo: string;
    channelTitle: string;
    date: string;
    likes: number;
}

export const MUSLIM_TUBE_SEED_DATA: Video[] = [
    {
        id: 1,
        image: '/academy/muslim-tube/video-1.jpg',
        duration: '12:45',
        title: 'The Beauty of Daily Dhikr',
        channelLogo: '/academy/channels/knowledge-hub.png',
        channelTitle: 'Knowledge Hub',
        date: '2026-01-02',
        likes: 15200,
    },
    {
        id: 2,
        image: '/academy/muslim-tube/video-2.jpg',
        duration: '08:30',
        title: 'How to Perfect Your Wudu',
        channelLogo: '/academy/channels/quran-academy.png',
        channelTitle: 'Quran Academy',
        date: '2026-01-01',
        likes: 22500,
    },
    {
        id: 3,
        image: '/academy/muslim-tube/video-3.jpg',
        duration: '05:15',
        title: 'Overcoming Procrastination (Islamic Perspective)',
        channelLogo: '/academy/channels/faith-reminders.png',
        channelTitle: 'Faith Reminders',
        date: '2025-12-30',
        likes: 18700,
    },
    {
        id: 4,
        image: '/academy/muslim-tube/video-4.jpg',
        duration: '18:20',
        title: 'Fiqh for Daily Living: Simplified',
        channelLogo: '/academy/channels/jurisprudence.png',
        channelTitle: 'Islamic Jurisprudence',
        date: '2025-12-28',
        likes: 9800,
    },
    {
        id: 5,
        image: '/academy/muslim-tube/video-5.jpg',
        duration: '15:40',
        title: 'Lessons from the Life of Khalid bin Walid',
        channelLogo: '/academy/channels/stories-faith.png',
        channelTitle: 'Stories of Faith',
        date: '2025-12-25',
        likes: 31400,
    },
    {
        id: 6,
        image: '/academy/muslim-tube/video-6.jpg',
        duration: '22:10',
        title: 'Muslim Contributions to Astronomy',
        channelLogo: '/academy/channels/history.png',
        channelTitle: 'History Channel',
        date: '2025-12-22',
        likes: 12300,
    }
];
