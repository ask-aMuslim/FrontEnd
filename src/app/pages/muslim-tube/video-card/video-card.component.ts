import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  selector: 'app-video-card',
  imports: [CommonModule],
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.scss'],
})
export class VideoCardComponent {
  @Input() video!: Video;
  @Output() videoClicked = new EventEmitter<number>();

  onCardClick(): void {
    this.videoClicked.emit(this.video.id);
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
