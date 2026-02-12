
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

interface InquirySuccessState {
  topicLabel?: string;
  languages?: string[];
  message?: string;
  details?: string;
}

@Component({
  selector: 'app-send-inquiry-success',
  standalone: true,
  imports: [],
  templateUrl: './send-inquiry-success.component.html',
  styleUrl: './send-inquiry-success.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendInquirySuccessComponent {
  topicLabel?: string;
  languages: string[] = [];
  message?: string;
  details?: string;

  doneIcon = '/icons/icons-24/done.svg';
  topicIcon = '/icons/icons-24/found.svg';
  timeIcon = '/icons/icons-24/time.svg';
  mailIcon = '/icons/icons-24/mail.svg';

  constructor(private router: Router) {
    const nav = this.router.currentNavigation();
    const state = (nav?.extras?.state ?? {}) as InquirySuccessState;

    // Redirect if accessed directly without form submission
    if (!state.topicLabel && !state.message) {
      this.router.navigate(['/ask-and-contact/send-inquiry']);
      return;
    }

    this.topicLabel = state.topicLabel;
    this.languages = state.languages ?? [];
    this.message = state.message;
    this.details = state.details;
  }

  goToAccount(): void {
    this.router.navigate(['/account']);
  }

  createAnother(): void {
    this.router.navigate(['/ask-and-contact/send-inquiry']);
  }

  hasDetails(): boolean {
    return !!(this.message || this.details);
  }
}
