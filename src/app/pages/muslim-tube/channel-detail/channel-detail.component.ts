import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MuslimTubeFacade } from '../../../api/facades/muslim-tube.facade';
import { Short } from '../short-card/short-card.component';
import { VideoCardComponent } from '../video-card/video-card.component';

type Tab = 'home' | 'playlists' | 'videos' | 'shorts' | 'live';

interface ChannelSummary {
  id: string;
  title: string;
  description: string;
  logo: string;
  followers: number;
  videosCount: number;
  since: string;
  location: string;
}

interface Video {
  id: string;
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
export class ChannelDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly muslimTubeFacade: MuslimTubeFacade,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) { }

  readonly tabs: Tab[] = ['home', 'videos', 'shorts', 'live', 'playlists'];
  selectedTab = signal<Tab>('home');
  searchDraft = signal('');
  searchTerm = signal('');

  channel = signal<ChannelSummary>({
    id: '',
    title: '',
    description: '',
    logo: '/images/channel1.png',
    followers: 0,
    videosCount: 0,
    since: '',
    location: 'Global',
  });

  videos: Video[] = [];

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

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const channelId = params.get('id');
        if (!channelId) {
          return;
        }

        this.loadChannel(channelId);
        this.loadChannelVideos(channelId);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onVideoClick(videoId: string | number): void {
    this.router.navigate(['/muslim-tube/video', String(videoId)]);
  }

  private loadChannel(channelId: string): void {
    this.muslimTubeFacade.getChannels({ pageSize: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: channels => {
          const channel = channels.find(item => item.id === channelId);
          if (!channel) {
            return;
          }
          this.channel.set({
            id: channel.id,
            title: channel.title,
            description: channel.description,
            logo: channel.imageUrl,
            followers: channel.followers,
            videosCount: channel.videosCount,
            since: 'Active',
            location: 'Global',
          });
        },
        error: () => {
          this.channel.set({
            id: channelId,
            title: '',
            description: '',
            logo: '/images/channel1.png',
            followers: 0,
            videosCount: 0,
            since: '',
            location: 'Global',
          });
        }
      });
  }

  private loadChannelVideos(channelId: string): void {
    this.muslimTubeFacade.getVideosByChannel(channelId, { pageSize: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: videos => {
          this.videos = videos.map(video => ({
            id: video.id,
            image: video.image,
            duration: video.duration,
            title: video.title,
            channelLogo: video.channelLogo,
            channelTitle: video.channelTitle,
            date: video.date,
            likes: video.likes,
          }));
        },
        error: () => {
          this.videos = [];
        }
      });
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
