import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { VideoCardComponent } from '../video-card/video-card.component';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';

interface Video {
  id: number;
  image: string;
  duration: string;
  title: string;
  channelLogo: string;
  channelTitle: string;
  date: string;
  likes: number;
  description?: string;
  channelId?: number;
}

@Component({
  standalone: true,
  selector: 'app-video-detail',
  imports: [CommonModule, VideoCardComponent, InlineSvgDirective],
  templateUrl: './video-detail.component.html',
  styleUrls: ['./video-detail.component.scss'],
})
export class VideoDetailComponent implements OnInit {
  video: Video | null = null;
  relatedVideos: Video[] = [];
  isLiked = false;
  isSaved = false;

  // Sample video data
  allVideos: Video[] = [
    {
      id: 1,
      image: '/images/video1.png',
      duration: '12:45',
      title: 'Islamic Knowledge Hub',
      channelLogo: '/images/channel1.png',
      channelTitle: 'Islamic Scholars',
      date: '2026-01-02',
      likes: 15200,
      description:
        'Explore the depths of Islamic knowledge with our expert scholars. This video covers fundamental concepts and teachings from Islamic tradition.',
      channelId: 1,
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
      description:
        'Beautiful recitation of the Quran with proper Tajweed rules. Perfect for meditation and spiritual growth.',
      channelId: 2,
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
      description:
        'Daily reminders to strengthen your faith and keep you on the right path. Short, meaningful messages for everyday inspiration.',
      channelId: 3,
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
      description:
        'Learn the essentials of Islamic jurisprudence and practical Islamic rulings for daily life.',
      channelId: 1,
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
      description:
        'Inspiring stories from the lives of the Prophets and their lessons for our modern times.',
      channelId: 2,
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
      description:
        'Discover the rich history of Islam and the civilizations that flourished under Islamic rule.',
      channelId: 3,
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
      description:
        'Islamic perspective on family life, parenting, and building strong family bonds according to Islamic principles.',
      channelId: 1,
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
      description:
        'Exploring the harmony between modern science and Islamic teachings. How scientific discoveries align with Quranic knowledge.',
      channelId: 2,
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
      description:
        'Experience the beauty of Islamic art, architecture, and cultural heritage throughout history.',
      channelId: 3,
    },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const videoId = parseInt(params['id'], 10);
      this.loadVideo(videoId);
    });
  }

  loadVideo(id: number): void {
    this.video = this.allVideos.find((v) => v.id === id) || null;
    if (this.video) {
      this.loadRelatedVideos();
    } else {
      // Video not found, redirect to videos list
      this.router.navigate(['/muslim-tube/videos']);
    }
  }

  loadRelatedVideos(): void {
    if (this.video) {
      this.relatedVideos = this.allVideos.filter(
        (v) => v.channelId === this.video!.channelId && v.id !== this.video!.id,
      );
    }
  }

  toggleLike(): void {
    this.isLiked = !this.isLiked;
    if (this.video) {
      this.video.likes += this.isLiked ? 1 : -1;
    }
  }

  toggleSave(): void {
    this.isSaved = !this.isSaved;
  }

  share(): void {
    if (navigator.share && this.video) {
      navigator.share({
        title: this.video.title,
        text: `Check out this video: ${this.video.title}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      alert('Share functionality: Implement your own share mechanism');
    }
  }

  download(): void {
    alert('Download functionality: Implement your own download mechanism');
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  onVideoClick(videoId: number): void {
    this.router.navigate(['/muslim-tube/video', videoId]);
  }
}
