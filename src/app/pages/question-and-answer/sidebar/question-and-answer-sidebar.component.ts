import { ChangeDetectionStrategy, Component } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MenuItem } from '../models';

@Component({
  selector: 'app-question-and-answer-sidebar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './question-and-answer-sidebar.component.html',
  styleUrls: ['./question-and-answer-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionAndAnswerSidebarComponent {
  isCollapsed = false;

  readonly menuItems: MenuItem[] = [
    {
      key: 'topics',
      label: 'Topics',
      href: '/question-and-answer/topics',
      icon: '/icons/icons-24/found.svg',
    },
    {
      key: 'ask-assistant',
      label: 'Ask AI Assistant',
      href: '/question-and-answer/ask-assistant',
      icon: '/icons/icons-24/ai-talk.svg',
    },
    {
      key: 'meet-scholar',
      label: 'Meet Scholar',
      href: '/question-and-answer/meet-scholar',
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
