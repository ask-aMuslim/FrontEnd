import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Short {
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
  selector: 'app-short-card',
  imports: [CommonModule],
  templateUrl: './short-card.component.html',
  styleUrls: ['./short-card.component.scss'],
})
export class ShortCardComponent {
  @Input() short!: Short;

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
