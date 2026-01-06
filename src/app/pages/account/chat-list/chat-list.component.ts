import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';

interface Chat {
  id: string;
  name: string;
  timestamp: string;
}

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, InlineSvgDirective],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss',
})
export class ChatListComponent {
  chats: Chat[] = [
    {
      id: '1',
      name: 'Sheikh Ahmad',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      name: 'Study Group - Islamic Studies',
      timestamp: '5 hours ago',
    },
    {
      id: '3',
      name: 'Instructor Support',
      timestamp: '1 day ago',
    },
    {
      id: '4',
      name: 'Fatima',
      timestamp: '3 days ago',
    },
  ];

  selectChat(chat: Chat): void {
    console.log('Selected chat:', chat);
  }
}
