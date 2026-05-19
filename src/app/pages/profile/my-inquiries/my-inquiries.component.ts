import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subject, of, switchMap, take } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';
import { StudentFacade } from '../../../api/facades/student.facade';
import { InquiryRequestsService } from '../../../core/services/inquiry-requests.service';
import { asRecord, extractArray, getValue, toStringValue } from '../../../core/helpers/api-response.helper';

export interface Inquiry {
    id: string;
    subject: string;
    status: string;
    createdAt: string;
}

@Component({
    selector: 'app-my-inquiries',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './my-inquiries.component.html',
    styleUrls: ['./my-inquiries.component.scss']
})
export class MyInquiriesComponent implements OnInit, OnDestroy {
    inquiries: Inquiry[] = [];
    isLoading = false;
    error: string | null = null;

    private readonly destroy$ = new Subject<void>();

    constructor(
        private readonly studentFacade: StudentFacade,
        private readonly inquiryRequestsService: InquiryRequestsService,
    ) { }

    ngOnInit(): void {
        this.loadInquiries();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    retry(): void {
        this.loadInquiries();
    }

    private loadInquiries(): void {
        this.isLoading = true;
        this.error = null;

        this.studentFacade.me().pipe(
            take(1),
            switchMap((profile) => {
                const requesterId = this.resolveRequesterId(profile);
                if (!requesterId) {
                    return of([] as Inquiry[]);
                }

                return this.inquiryRequestsService.getByRequester(requesterId).pipe(
                    catchError(() => of([])),
                    switchMap((response) => of(this.mapInquiries(response))),
                );
            }),
            finalize(() => {
                this.isLoading = false;
            }),
            takeUntil(this.destroy$),
        ).subscribe({
            next: (inquiries) => {
                this.inquiries = inquiries;
            },
            error: () => {
                this.error = 'Unable to load your inquiries right now.';
            },
        });
    }

    private mapInquiries(response: unknown): Inquiry[] {
        const records = extractArray(response);

        return records
            .map((item) => {
                const record = asRecord(item);
                const id = toStringValue(getValue(record, 'id', 'Id'));
                if (!id) {
                    return null;
                }

                const topic = toStringValue(getValue(record, 'topic', 'Topic'));
                const message = toStringValue(getValue(record, 'message', 'Message'));
                const status = toStringValue(getValue(record, 'status', 'Status')) ?? 'Pending';
                const createdRaw = toStringValue(getValue(record, 'createdAt', 'CreatedAt'));

                return {
                    id,
                    subject: topic ?? message ?? 'Inquiry',
                    status,
                    createdAt: this.formatDate(createdRaw),
                } satisfies Inquiry;
            })
            .filter((inquiry): inquiry is Inquiry => inquiry !== null);
    }

    private formatDate(value: string | null): string {
        if (!value) {
            return 'Unknown date';
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return parsed.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    private resolveRequesterId(profile: { studentId?: unknown; id?: unknown; userId?: unknown } | null): string | null {
        if (!profile) {
            return null;
        }

        if (typeof profile.studentId === 'string' && profile.studentId.length > 0) {
            return profile.studentId;
        }

        if (typeof profile.id === 'string' && profile.id.length > 0) {
            return profile.id;
        }

        if (typeof profile.userId === 'string' && profile.userId.length > 0) {
            return profile.userId;
        }

        return null;
    }
}
