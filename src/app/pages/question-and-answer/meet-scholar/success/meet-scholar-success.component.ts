import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-meet-scholar-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './meet-scholar-success.clean.component.html',
  styleUrl: './meet-scholar-success.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetScholarSuccessComponent {
  scheduledDateTime?: Date;
  scheduledTime?: string;
  durationMinutes?: number = 30;
  confirmationEmail?: string;
  doneIcon = '/icons/icons-24/done.svg';
  calendarIcon = '/icons/icons-24/calendar.svg';
  timeIcon = '/icons/icons-24/time.svg';
  mailIcon = '/icons/icons-24/mail.svg';
  cautionIcon = '/icons/icons-24/caution.svg';
  constructor(private router: Router) {
    const nav = this.router.currentNavigation();
    const state = (nav?.extras?.state ?? {}) as {
      scheduledDateTime?: string | Date;
      scheduledTime?: string;
      durationMinutes?: number;
      confirmationEmail?: string;
    };

    // Redirect if accessed directly without form submission
    if (!state.scheduledDateTime && !state.confirmationEmail) {
      this.router.navigate(['/question-and-answer/meet-scholar']);
      return;
    }

    if (state.scheduledDateTime) {
      this.scheduledDateTime =
        typeof state.scheduledDateTime === 'string'
          ? new Date(state.scheduledDateTime)
          : state.scheduledDateTime;
    }
    this.scheduledTime = state.scheduledTime ?? this.scheduledTime;
    this.durationMinutes = state.durationMinutes ?? this.durationMinutes;
    this.confirmationEmail = state.confirmationEmail ?? this.confirmationEmail;
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToAskAndContact(): void {
    this.router.navigate(['/question-and-answer/topics']);
  }
}
