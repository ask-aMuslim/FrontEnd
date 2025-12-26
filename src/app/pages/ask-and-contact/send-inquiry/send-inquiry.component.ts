import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-send-inquiry',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './send-inquiry.component.html',
  styleUrl: './send-inquiry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendInquiryComponent {}
