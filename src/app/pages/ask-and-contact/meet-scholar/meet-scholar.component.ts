import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-meet-scholar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meet-scholar.component.html',
  styleUrl: './meet-scholar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetScholarComponent {}
