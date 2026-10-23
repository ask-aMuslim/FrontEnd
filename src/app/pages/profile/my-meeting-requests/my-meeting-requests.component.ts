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
import { parseMeetingRequests, type MeetingRequestItem } from '../../../core/helpers/meeting-request.helper';
import { MeetingRequestsService } from '../../../core/services/meeting-requests.service';
import { MeetingRequestListComponent } from '../../../shared/reusable-components/meeting-request-list/meeting-request-list.component';

/** Profile "My Meetings" tab: the signed-in user's meeting requests with their status and the team's response. */
@Component({
    selector: 'app-my-meeting-requests',
    standalone: true,
    imports: [RouterLink, MeetingRequestListComponent],
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
                    this.error.set('Unable to load your meeting requests right now.');
                    this.isLoading.set(false);
                },
            });
    }
}
