import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  isCollapsed = false;

  toggleCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  menuItems = [
    {
      key: 'ask-qa',
      label: 'Ask "Q&A"',
      href: '/ask-and-contact/ask-qa',
      icon: '/icons/icons%2024/select=found.svg',
    },
    {
      key: 'ask-assistant',
      label: 'Ask Assistant',
      href: '/ask-and-contact/ask-assistant',
      icon: '/icons/icons%2024/select=ai%20talk.svg',
    },
    {
      key: 'meet-scholar',
      label: 'Meet Scholar',
      href: '/ask-and-contact/meet-scholar',
      icon: '/icons/icons%2024/select=scholar%20talk.svg',
    },
    {
      key: 'send-inquiry',
      label: 'Send Inquiry',
      href: '/ask-and-contact/send-inquiry',
      icon: '/icons/icons%2024/select=send%20email.svg',
    },
  ];
}
