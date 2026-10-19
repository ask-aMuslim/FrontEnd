import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupportMailsFacade } from '../../../api/facades/support-mails.facade';
import {
    SUPPORT_MAIL_STATUS_LABELS,
    type SupportMailListItem,
    type SupportMailStatus,
} from '../../../api/facades/support-mails.models';
import { formatSupportMailTime, supportMailStatusClass } from '../../contact/mails/support-mail-format';

/** Profile "My Mails" tab: the latest Support Mails, linking to /contact/mails. */
@Component({
    selector: 'app-my-inquiries',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './my-inquiries.component.html',
    styleUrls: ['./my-inquiries.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyInquiriesComponent implements OnInit {
    private static readonly pageSize = 5;
    private readonly facade = inject(SupportMailsFacade);
    private readonly destroyRef = inject(DestroyRef);

    readonly mails = signal<readonly SupportMailListItem[]>([]);
    readonly totalCount = signal(0);
    readonly isLoading = signal(false);
    readonly error = signal<string | null>(null);

    ngOnInit(): void {
        this.loadMails();
    }

    retry(): void {
        this.loadMails();
    }

    statusLabel(status: SupportMailStatus): string {
        return SUPPORT_MAIL_STATUS_LABELS[status] ?? 'Unknown';
    }

    statusClass(status: SupportMailStatus): string {
        return supportMailStatusClass(status);
    }

    formatTime(value: string): string {
        return formatSupportMailTime(value);
    }

    private loadMails(): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.facade
            .getMine({ pageNumber: 1, pageSize: MyInquiriesComponent.pageSize })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (page) => {
                    this.mails.set(page.items);
                    this.totalCount.set(page.totalCount);
                    this.isLoading.set(false);
                },
                error: () => {
                    this.error.set('Unable to load your mails right now.');
                    this.isLoading.set(false);
                },
            });
    }
}
