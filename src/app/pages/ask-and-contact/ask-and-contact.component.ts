import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-ask-and-contact',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './ask-and-contact.component.html',
  styleUrl: './ask-and-contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskAndContactComponent {}
