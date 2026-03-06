import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VideoCardComponent } from '../video-card/video-card.component';
import { MuslimTubeFacade } from '../../../api/facades/muslim-tube.facade';

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
  selector: 'app-mt-videos',
  imports: [VideoCardComponent],
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss'],
})
export class VideosComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly muslimTubeFacade: MuslimTubeFacade,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.muslimTubeFacade.getHomeVideos({ pageSize: 100, randomize: false })
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onVideoClick(videoId: string | number): void {
    this.router.navigate(['/muslim-tube/video', String(videoId)]);
  }

  videos: Video[] = [];

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
