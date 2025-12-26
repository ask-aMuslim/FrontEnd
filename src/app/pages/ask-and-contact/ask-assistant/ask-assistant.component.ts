import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-ask-assistant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ask-assistant.component.html',
  styleUrl: './ask-assistant.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskAssistantComponent {}
