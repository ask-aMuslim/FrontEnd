import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  canCancelMeetingRequest,
  meetingStatusClass,
  parseMeetingRequest,
  type MeetingRequestItem,
} from '../../../../../core/helpers/meeting-request.helper';
import {
  languageLabels,
  meetingInquiryRequestStatusLabels,
  meetingInquiryTopicLabels,
} from '../../../../../core/helpers/enum-labels.helper';
import { MeetingRequestsService } from '../../../../../core/services/meeting-requests.service';
import { formatSupportMailTime } from '../../../../contact/mails/support-mail-format';

/** One of the signed-in user's meeting requests in full, with a way to cancel it while it is still open. */
@Component({
  selector: 'app-meeting-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './meeting-details.component.html',
  styleUrls: ['../../../../contact/mails/mails.shared.scss', './meeting-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly meetingRequests = inject(MeetingRequestsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly request = signal<MeetingRequestItem | null>(null);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);
  readonly error = signal<string | null>(null);

  readonly isConfirmingCancel = signal(false);
  readonly isCancelling = signal(false);
  readonly cancelError = signal<string | null>(null);

  readonly canCancel = computed(() => {
    const request = this.request();
    return request !== null && canCancelMeetingRequest(request.status);
  });

  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  retry(): void {
    this.load();
  }

  askToCancel(): void {
    this.cancelError.set(null);
    this.isConfirmingCancel.set(true);
  }

  keepMeeting(): void {
    this.isConfirmingCancel.set(false);
  }

  confirmCancel(): void {
    if (this.isCancelling()) {
      return;
    }

    this.isCancelling.set(true);
    this.cancelError.set(null);

    this.meetingRequests
      .cancelMine(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isCancelling.set(false);
          this.isConfirmingCancel.set(false);
          this.load();
        },
        error: () => {
          this.isCancelling.set(false);
          this.cancelError.set('We could not cancel this meeting. It may have already been updated, so please refresh and try again.');
        },
      });
  }

  statusLabel(request: MeetingRequestItem): string {
    return meetingInquiryRequestStatusLabels[request.status] ?? 'Unknown';
  }

  statusClass(request: MeetingRequestItem): string {
    return meetingStatusClass(request.status);
  }

  topicLabel(request: MeetingRequestItem): string {
    return meetingInquiryTopicLabels[request.topic] ?? 'Meeting';
  }

  languagesLabel(request: MeetingRequestItem): string {
    return request.languages.map((l) => languageLabels[l]).filter(Boolean).join(', ');
  }

  formatTime(value: string): string {
    return formatSupportMailTime(value);
  }

  private load(): void {
    if (!this.id) {
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.notFound.set(false);

    this.meetingRequests
      .getMine(this.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const request = parseMeetingRequest(response);
          this.request.set(request);
          this.notFound.set(request === null);
          this.isLoading.set(false);
        },
        error: (error: { status?: number }) => {
          // The API answers 400 for a request that is missing or not theirs.
          if (error?.status === 400 || error?.status === 404) {
            this.notFound.set(true);
          } else {
            this.error.set('Unable to load this meeting right now.');
          }
          this.isLoading.set(false);
        },
      });
  }
}
