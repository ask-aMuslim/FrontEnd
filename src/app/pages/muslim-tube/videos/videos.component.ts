import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { VideoCardComponent } from '../video-card/video-card.component';
import { MUSLIM_TUBE_SEED_DATA } from '../../../core/services/mock-data/muslim-tube-seed-data';

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
  imports: [VideoCardComponent],
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss'],
})
export class VideosComponent {
  constructor(private readonly router: Router) { }

  onVideoClick(videoId: number): void {
    this.router.navigate(['/muslim-tube/video', videoId]);
  }

  videos: Video[] = MUSLIM_TUBE_SEED_DATA;

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
