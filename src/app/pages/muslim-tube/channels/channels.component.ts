import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Channel {
  id: number;
  image: string;
  title: string;
  description: string;
  followers: number;
  videosCount: number;
}

@Component({
  standalone: true,
  selector: 'app-mt-channels',
  imports: [CommonModule],
  templateUrl: './channels.component.html',
  styleUrls: ['./channels.component.scss'],
})
export class ChannelsComponent {
  constructor(private readonly router: Router) {}

  channels: Channel[] = [
    {
      id: 1,
      image: '/images/channel1.png',
      title: 'Islamic Knowledge Hub',
      description: 'Comprehensive Islamic teachings and lectures from renowned scholars',
      followers: 125000,
      videosCount: 342,
    },
    {
      id: 2,
      image: '/images/channel2.png',
      title: 'Quran Recitation',
      description: 'Beautiful recitations of the Holy Quran with translations',
      followers: 98500,
      videosCount: 215,
    },
    {
      id: 3,
      image: '/images/channel3.png',
      title: 'Daily Reminders',
      description: 'Short daily reminders to strengthen your faith and connection with Allah',
      followers: 156000,
      videosCount: 520,
    },
    {
      id: 4,
      image: '/images/channel1.png',
      title: 'Fiqh Essentials',
      description: 'Learn Islamic jurisprudence and practical rulings for daily life',
      followers: 72300,
      videosCount: 189,
    },
    {
      id: 5,
      image: '/images/channel2.png',
      title: 'Prophetic Stories',
      description: 'Stories from the life of Prophet Muhammad (PBUH) and other prophets',
      followers: 203000,
      videosCount: 428,
    },
    {
      id: 6,
      image: '/images/channel3.png',
      title: 'Islamic History',
      description: 'Exploring the rich history of Islam and Muslim civilizations',
      followers: 89700,
      videosCount: 267,
    },
    {
      id: 7,
      image: '/images/channel1.png',
      title: 'Family & Parenting',
      description: 'Guidance on Islamic family values and parenting tips',
      followers: 54000,
      videosCount: 134,
    },
    {
      id: 8,
      image: '/images/channel2.png',
      title: 'Science & Islam',
      description: 'Discover the harmony between modern science and Islamic teachings',
      followers: 112000,
      videosCount: 301,
    },
    {
      id: 9,
      image: '/images/channel3.png',
      title: 'Islamic Art & Culture',
      description: 'Celebrating Islamic art, calligraphy, and cultural heritage',
      followers: 76000,
      videosCount: 198,
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
