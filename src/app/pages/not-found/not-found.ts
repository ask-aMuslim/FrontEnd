import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

interface QuickLink {
  readonly label: string;
  readonly path: string;
  readonly icon: string;
}

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {
  protected readonly quickLinks: readonly QuickLink[] = [
    {
      label: 'Home',
      path: '/home',
      icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    },
    {
      label: 'Q&A',
      path: '/ask-and-contact',
      icon: 'M21 6.5c0 1.93-1.57 3.5-3.5 3.5-.34 0-.67-.05-.98-.14l-2.78 2.78c.09.31.14.64.14.98 0 1.93-1.57 3.5-3.5 3.5S6.88 15.55 6.88 13.62c0-.34.05-.67.14-.98L4.24 9.86c-.31.09-.64.14-.98.14C1.33 10 0 8.67 0 6.74S1.33 3.48 3.26 3.48c.34 0 .67.05.98.14l2.78-2.78C6.93 .53 6.88.2 6.88 0 6.88-1.93 8.45-3.5 10.38-3.5s3.5 1.57 3.5 3.5c0 .34-.05.67-.14.98l2.78 2.78c.31-.09.64-.14.98-.14C19.43 3.62 21 5.19 21 6.5z',
    },
    {
      label: 'Academy',
      path: '/academy',
      icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    },
    {
      label: 'Events',
      path: '/events',
      icon: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z',
    },
  ] as const;

  protected trackByPath(_index: number, link: QuickLink): string {
    return link.path;
  }
}
