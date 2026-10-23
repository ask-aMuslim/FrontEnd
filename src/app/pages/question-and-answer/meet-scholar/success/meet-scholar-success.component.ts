import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { TokenService } from '../../../../core/auth/token.service';

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
  /** The signed-in account's email; the backend sends its notifications there. */
  readonly confirmationEmail = inject(TokenService).userEmail;
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
    };

    // Redirect if accessed directly without form submission
    if (!state.scheduledDateTime) {
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
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToAskAndContact(): void {
    this.router.navigate(['/question-and-answer/topics']);
  }
}
