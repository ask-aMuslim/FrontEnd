import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Short } from '../short-card/short-card.component';
import { VideoCardComponent } from '../video-card/video-card.component';

type Tab = 'home' | 'playlists' | 'videos' | 'shorts' | 'live';

interface ChannelSummary {
  id: number;
  title: string;
  description: string;
  logo: string;
  followers: number;
  videosCount: number;
  since: string;
  location: string;
}

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
  selector: 'app-channel-detail',
  imports: [CommonModule, VideoCardComponent],
  templateUrl: './channel-detail.component.html',
  styleUrls: ['./channel-detail.component.scss'],
})
export class ChannelDetailComponent {
  constructor(private readonly router: Router) {}

  readonly tabs: Tab[] = ['home', 'videos', 'shorts', 'live', 'playlists'];
  selectedTab = signal<Tab>('home');
  searchDraft = signal('');
  searchTerm = signal('');

  channel = signal<ChannelSummary>({
    id: 1,
    title: 'Islamic Knowledge Hub',
    description: 'Comprehensive Islamic teachings and lectures from renowned scholars.',
    logo: '/images/channel1.png',
    followers: 125000,
    videosCount: 342,
    since: 'Joined Jan 2022',
    location: 'Worldwide',
  });

  videos: Video[] = [
    {
      id: 1,
      image: '/images/video1.png',
      duration: '12:45',
      title: 'Understanding Tawheed in Daily Life',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2026-01-02',
      likes: 15200,
    },
    {
      id: 2,
      image: '/images/video2.png',
      duration: '08:30',
      title: 'Foundations of Quran Recitation',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2026-01-01',
      likes: 22500,
    },
    {
      id: 3,
      image: '/images/video3.png',
      duration: '05:15',
      title: 'Morning Duas to Start Strong',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2025-12-30',
      likes: 18700,
    },
    {
      id: 4,
      image: '/images/video1.png',
      duration: '18:20',
      title: 'Applying Fiqh to Modern Work',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2025-12-28',
      likes: 9800,
    },
    {
      id: 5,
      image: '/images/video2.png',
      duration: '15:40',
      title: 'Stories from the Seerah for Today',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2025-12-25',
      likes: 31400,
    },
    {
      id: 6,
      image: '/images/video3.png',
      duration: '09:55',
      title: 'How to Build a Consistent Salah Habit',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2025-12-20',
      likes: 14200,
    },
  ];

  shorts: Short[] = [
    {
      id: 1,
      image: '/images/video1.png',
      duration: '01:05',
      title: 'Daily Quran Reminder',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2025-12-18',
      likes: 8900,
    },
    {
      id: 2,
      image: '/images/video2.png',
      duration: '00:45',
      title: 'One Sunnah for Today',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2025-12-15',
      likes: 16400,
    },
    {
      id: 3,
      image: '/images/video3.png',
      duration: '00:52',
      title: 'Dhikr Break',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2025-12-12',
      likes: 10300,
    },
    {
      id: 4,
      image: '/images/video1.png',
      duration: '00:59',
      title: 'Gratitude in Islam',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2025-12-10',
      likes: 12750,
    },
    {
      id: 5,
      image: '/images/video2.png',
      duration: '01:10',
      title: 'Friday Reminder',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Knowledge Hub',
      date: '2025-12-08',
      likes: 21500,
    },
  ];

  filteredVideos = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.videos;
    }

    return this.videos.filter((video) =>
      [video.title, video.channelTitle].some((field) => field.toLowerCase().includes(query)),
    );
  });

  filteredShorts = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      return this.shorts;
    }

    return this.shorts.filter((shortItem) =>
      [shortItem.title, shortItem.channelTitle].some((field) =>
        field.toLowerCase().includes(query),
      ),
    );
  });

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchDraft.set(input.value);
  }

  onFind(): void {
    this.searchTerm.set(this.searchDraft());
  }

  selectTab(tab: Tab): void {
    this.selectedTab.set(tab);
  }

  onVideoClick(videoId: number): void {
    this.router.navigate(['/muslim-tube/video', videoId]);
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
