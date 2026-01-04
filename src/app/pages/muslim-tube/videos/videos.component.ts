import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Video {
  id: number;
  image: string;
  duration: string;
  title: string;
  channelLogo: string;
  channelTitle: string;
  date: string;
  likes: number;
}

@Component({
  standalone: true,
  selector: 'app-mt-videos',
  imports: [CommonModule],
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss'],
})
export class VideosComponent {
  constructor(private readonly router: Router) {}

  videos: Video[] = [
    {
      id: 1,
      image: '/images/video1.png',
      duration: '12:45',
      title: 'Islamic Knowledge Hub',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Scholars',
      date: '2026-01-02',
      likes: 15200,
    },
    {
      id: 2,
      image: '/images/video2.png',
      duration: '08:30',
      title: 'Quran Recitation',
      channelLogo: '/images/channel2.png',
      channelTitle: 'Quran Academy',
      date: '2026-01-01',
      likes: 22500,
    },
    {
      id: 3,
      image: '/images/video3.png',
      duration: '05:15',
      title: 'Daily Reminders',
      channelLogo: '/images/channel3.png',
      channelTitle: 'Faith Reminders',
      date: '2025-12-30',
      likes: 18700,
    },
    {
      id: 4,
      image: '/images/video1.png',
      duration: '18:20',
      title: 'Fiqh Essentials',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Jurisprudence',
      date: '2025-12-28',
      likes: 9800,
    },
    {
      id: 5,
      image: '/images/video2.png',
      duration: '15:40',
      title: 'Prophetic Stories',
      channelLogo: '/images/channel2.png',
      channelTitle: 'Stories of Faith',
      date: '2025-12-25',
      likes: 31400,
    },
    {
      id: 6,
      image: '/images/video3.png',
      duration: '22:10',
      title: 'Islamic History',
      channelLogo: '/images/channel3.png',
      channelTitle: 'History Channel',
      date: '2025-12-22',
      likes: 12300,
    },
    {
      id: 7,
      image: '/images/video1.png',
      duration: '10:25',
      title: 'Family & Parenting',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Family Values',
      date: '2025-12-20',
      likes: 8900,
    },
    {
      id: 8,
      image: '/images/video2.png',
      duration: '14:55',
      title: 'Science & Islam',
      channelLogo: '/images/channel2.png',
      channelTitle: 'Science & Faith',
      date: '2025-12-18',
      likes: 19600,
    },
    {
      id: 9,
      image: '/images/video3.png',
      duration: '11:30',
      title: 'Islamic Art & Culture',
      channelLogo: '/images/channel3.png',
      channelTitle: 'Art & Heritage',
      date: '2025-12-15',
      likes: 14100,
    },
  ];

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
