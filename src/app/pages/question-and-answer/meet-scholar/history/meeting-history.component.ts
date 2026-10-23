import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TokenService } from '../../../../core/auth/token.service';
import { parseMeetingRequests, type MeetingRequestItem } from '../../../../core/helpers/meeting-request.helper';
import { MeetingInquiryRequestStatus } from '../../../../core/models/interfaces/enums.model';
import { MeetingRequestsService } from '../../../../core/services/meeting-requests.service';
import { MeetingRequestListComponent } from '../../../../shared/reusable-components/meeting-request-list/meeting-request-list.component';

interface StatusFilter {
  readonly label: string;
  readonly value: MeetingInquiryRequestStatus | null;
}

/** Full list of the signed-in user's meeting requests, filterable by status. */
@Component({
  selector: 'app-meeting-history',
  standalone: true,
  imports: [RouterLink, MeetingRequestListComponent],
  templateUrl: './meeting-history.component.html',
  styleUrls: ['../../../contact/mails/mails.shared.scss', './meeting-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingHistoryComponent {
  private readonly tokenService = inject(TokenService);
  private readonly meetingRequests = inject(MeetingRequestsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusFilters: readonly StatusFilter[] = [
    { label: 'All', value: null },
    { label: 'Pending', value: MeetingInquiryRequestStatus.Pending },
    { label: 'Accepted', value: MeetingInquiryRequestStatus.Accepted },
    { label: 'Completed', value: MeetingInquiryRequestStatus.Completed },
    { label: 'Rejected', value: MeetingInquiryRequestStatus.Rejected },
    { label: 'Cancelled', value: MeetingInquiryRequestStatus.Cancelled },
  ];

  readonly requests = signal<readonly MeetingRequestItem[]>([]);
  readonly activeStatus = signal<MeetingInquiryRequestStatus | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly visibleRequests = computed(() => {
    const status = this.activeStatus();
    return status === null ? this.requests() : this.requests().filter((r) => r.status === status);
  });

  constructor() {
    effect(() => {
      const id = this.tokenService.userId();
      if (id) {
        this.load(id);
      }
    });
  }

  selectStatus(status: MeetingInquiryRequestStatus | null): void {
    this.activeStatus.set(status);
  }

  retry(): void {
    const id = this.tokenService.userId();
    if (id) {
      this.load(id);
    }
  }

  private load(userId: string): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.meetingRequests
      .getByRequester(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.requests.set(parseMeetingRequests(response));
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Unable to load your meetings right now.');
          this.isLoading.set(false);
        },
      });
  }
}
