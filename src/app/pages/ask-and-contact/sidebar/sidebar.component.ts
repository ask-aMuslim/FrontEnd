import { ChangeDetectionStrategy, Component } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MenuItem } from '../models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  isCollapsed = false;

  readonly menuItems: MenuItem[] = [
    {
      key: 'ask-qa',
      label: 'Topics',
      href: '/ask-and-contact/ask-qa',
      icon: '/icons/icons-24/found.svg',
    },
    {
      key: 'ask-assistant',
      label: 'Ask Assistant',
      href: '/ask-and-contact/ask-assistant',
      icon: '/icons/icons-24/ai-talk.svg',
    },
    {
      key: 'meet-scholar',
      label: 'Meet Scholar',
      href: '/ask-and-contact/meet-scholar',
      icon: '/icons/icons-24/scholar-talk.svg',
    },
  ];

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  trackByKey(_index: number, item: MenuItem): string {
    return item.key;
  }
}
