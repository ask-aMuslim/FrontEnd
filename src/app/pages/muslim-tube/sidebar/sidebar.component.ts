import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import type { MenuItem } from '../models/sidebar.model';

@Component({
  selector: 'app-mt-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MuslimTubeSidebarComponent {
  isCollapsed = false;

  readonly menuItems: MenuItem[] = [
    {
      key: 'channel',
      label: 'Channel',
      href: '/muslim-tube/channels',
      icon: '/icons/icons-24/channel.svg',
    },
    {
      key: 'videos',
      label: 'Videos',
      href: '/muslim-tube/videos',
      icon: '/icons/icons-24/video.svg',
    },
    {
      key: 'shorts',
      label: 'Shorts',
      href: '/muslim-tube/shorts',
      icon: '/icons/icons-24/short.svg',
    },
    {
      key: 'divider-1',
      label: '',
      isDivider: true,
    },
    {
      key: 'saved',
      label: 'Saved',
      href: '/muslim-tube/saved',
      icon: '/icons/icons-24/save.svg',
    },
    {
      key: 'history',
      label: 'History',
      href: '/muslim-tube/history',
      icon: '/icons/icons-24/time.svg',
    },
    {
      key: 'liked',
      label: 'Liked',
      href: '/muslim-tube/liked',
      icon: '/icons/icons-24/liked.svg',
    },
  ];

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  trackByKey(index: number, item: MenuItem): string {
    return item.key;
  }
}
