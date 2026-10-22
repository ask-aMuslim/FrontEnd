import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { asRecord, extractArray, getValue } from '../../../core/helpers/api-response.helper';
import {
    meetingInquiryRequestStatusLabels,
    meetingInquiryTopicLabels,
} from '../../../core/helpers/enum-labels.helper';
import {
    MeetingInquiryRequestStatus,
    MeetingInquiryTopic,
} from '../../../core/models/interfaces/enums.model';
import { MeetingRequestsService } from '../../../core/services/meeting-requests.service';
import { formatSupportMailTime } from '../../contact/mails/support-mail-format';

export interface MeetingRequestItem {
    readonly id: string;
    readonly topic: MeetingInquiryTopic;
    readonly status: MeetingInquiryRequestStatus;
    readonly message: string;
    readonly response: string | null;
    readonly moderatorName: string | null;
    readonly scheduledAt: string;
    readonly createdAt: string;
}

/** Profile "My Meetings" tab: the signed-in user's meeting requests with their status and the team's response. */
@Component({
    selector: 'app-my-meeting-requests',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './my-meeting-requests.component.html',
    styleUrls: ['./my-meeting-requests.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyMeetingRequestsComponent {
    private readonly meetingRequests = inject(MeetingRequestsService);
    private readonly destroyRef = inject(DestroyRef);

    /** The signed-in user's id; loading starts once it is known. */
    readonly userId = input('');

    readonly requests = signal<readonly MeetingRequestItem[]>([]);
    readonly isLoading = signal(false);
    readonly error = signal<string | null>(null);

    constructor() {
        effect(() => {
            const id = this.userId();
            if (id) {
                this.load(id);
            }
        });
    }

    retry(): void {
        const id = this.userId();
        if (id) {
            this.load(id);
        }
    }

    statusLabel(status: MeetingInquiryRequestStatus): string {
        return meetingInquiryRequestStatusLabels[status] ?? 'Unknown';
    }

    topicLabel(topic: MeetingInquiryTopic): string {
        return meetingInquiryTopicLabels[topic] ?? 'Meeting';
    }

    statusClass(status: MeetingInquiryRequestStatus): string {
        switch (status) {
            case MeetingInquiryRequestStatus.Pending:
                return 'meeting-status--pending';
            case MeetingInquiryRequestStatus.Accepted:
            case MeetingInquiryRequestStatus.Completed:
                return 'meeting-status--positive';
            case MeetingInquiryRequestStatus.Rejected:
                return 'meeting-status--negative';
            default:
                return 'meeting-status--neutral';
        }
    }

    formatTime(value: string): string {
        return formatSupportMailTime(value);
    }

    private load(userId: string): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.meetingRequests
            .getByRequester(userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (response) => {
                    const items = extractArray(response)
                        .map(toMeetingRequestItem)
                        .filter((item): item is MeetingRequestItem => item !== null)
                        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
                    this.requests.set(items);
                    this.isLoading.set(false);
                },
                error: () => {
                    this.error.set('Unable to load your meeting requests right now.');
                    this.isLoading.set(false);
                },
            });
    }
}

function toMeetingRequestItem(raw: unknown): MeetingRequestItem | null {
    const record = asRecord(raw);
    const id = getValue(record, 'id');
    if (typeof id !== 'string') {
        return null;
    }

    return {
        id,
        topic: Number(getValue(record, 'topic')) as MeetingInquiryTopic,
        status: Number(getValue(record, 'status')) as MeetingInquiryRequestStatus,
        message: String(getValue(record, 'message') ?? ''),
        response: stringOrNull(getValue(record, 'response')),
        moderatorName: stringOrNull(getValue(record, 'moderatorName')),
        scheduledAt: String(getValue(record, 'scheduledAt') ?? ''),
        createdAt: String(getValue(record, 'createdAt') ?? ''),
    };
}

function stringOrNull(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
