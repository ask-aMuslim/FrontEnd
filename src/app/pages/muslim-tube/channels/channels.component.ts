import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MuslimTubeFacade } from '../../../api/facades/muslim-tube.facade';

interface Channel {
  id: string;
  image: string;
  title: string;
  description: string;
  followers: number;
  videosCount: number;
}

@Component({
  standalone: true,
  selector: 'app-mt-channels',
  imports: [],
  templateUrl: './channels.component.html',
  styleUrls: ['./channels.component.scss'],
})
export class ChannelsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly muslimTubeFacade: MuslimTubeFacade,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) { }

  channels: Channel[] = [];

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.muslimTubeFacade.getChannels({ pageSize: 100 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: channels => {
          this.channels = channels.map(channel => ({
            id: channel.id,
            image: channel.imageUrl,
            title: channel.title,
            description: channel.description,
            followers: channel.followers,
            videosCount: channel.videosCount,
          }));
        },
        error: () => {
          this.channels = [];
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  goToChannel(channelId: string): void {
    this.router.navigate(['/muslim-tube/channel', channelId]);
  }
}
