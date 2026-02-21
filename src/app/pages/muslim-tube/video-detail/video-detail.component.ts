import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';
import { VideoCardComponent } from '../video-card/video-card.component';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
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
  description?: string;
  channelId?: string;
}

@Component({
  standalone: true,
  selector: 'app-video-detail',
  imports: [VideoCardComponent, InlineSvgDirective],
  templateUrl: './video-detail.component.html',
  styleUrls: ['./video-detail.component.scss'],
})
export class VideoDetailComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  video: Video | null = null;
  relatedVideos: Video[] = [];
  isLiked = false;
  isSaved = false;
  userActionMessage: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly muslimTubeFacade: MuslimTubeFacade,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) { }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const videoId = String(params['id'] ?? '');
      this.loadVideo(videoId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVideo(id: string): void {
    this.muslimTubeFacade.getVideoById(id)
      .pipe(
        switchMap(video => {
          if (!video) {
            this.router.navigate(['/muslim-tube/videos']);
            return of(null);
          }

          this.video = {
            id: video.id,
            image: video.image,
            duration: video.duration,
            title: video.title,
            channelLogo: video.channelLogo,
            channelTitle: video.channelTitle,
            date: video.date,
            likes: video.likes,
            description: video.description,
            channelId: video.channelId,
          };

          if (!video.channelId) {
            return of([] as Video[]);
          }

          return this.muslimTubeFacade.getVideosByChannel(video.channelId, { pageSize: 12 }).pipe(
            catchError(() => of([]))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(related => {
        if (!related) {
          this.relatedVideos = [];
          return;
        }
        this.relatedVideos = related
          .filter(item => item.id !== id)
          .map(item => ({
            id: item.id,
            image: item.image,
            duration: item.duration,
            title: item.title,
            channelLogo: item.channelLogo,
            channelTitle: item.channelTitle,
            date: item.date,
            likes: item.likes,
            description: item.description,
            channelId: item.channelId,
          }));
      });
  }

  toggleLike(): void {
    this.userActionMessage = null;
    this.isLiked = !this.isLiked;
    if (this.video) {
      this.video.likes += this.isLiked ? 1 : -1;
    }
  }

  toggleSave(): void {
    this.userActionMessage = null;
    this.isSaved = !this.isSaved;
    this.userActionMessage = this.isSaved
      ? 'Video saved to your list.'
      : 'Video removed from your saved list.';
  }

  share(): void {
    if (!this.video) {
      this.userActionMessage = 'Unable to share this video right now.';
      return;
    }

    this.userActionMessage = null;

    if (navigator.share) {
      navigator
        .share({
          title: this.video.title,
          text: `Check out this video: ${this.video.title}`,
          url: globalThis.location.href,
        })
        .then(() => {
          this.userActionMessage = 'Video link shared successfully.';
        })
        .catch(() => {
          this.userActionMessage = 'Unable to share right now. Please try again.';
        });
      return;
    }

    navigator.clipboard
      .writeText(globalThis.location.href)
      .then(() => {
        this.userActionMessage = 'Video link copied to clipboard.';
      })
      .catch(() => {
        this.userActionMessage = 'Unable to copy the video link.';
      });
  }

  download(): void {
    if (!this.video) {
      this.userActionMessage = 'Unable to download this video right now.';
      return;
    }

    const fileName = `${this.video.title || 'video-details'}.txt`;
    const fileContent = [this.video.title, '', this.video.description ?? '', '', globalThis.location.href]
      .join('\n')
      .trim();

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);

    this.userActionMessage = 'Video details downloaded.';
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  onVideoClick(videoId: string | number): void {
    this.router.navigate(['/muslim-tube/video', String(videoId)]);
  }
}
