import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { SupportMailsFacade } from '../../../api/facades/support-mails.facade';
import {
  FALLBACK_SUPPORT_MAIL_TOPICS,
  SUPPORT_MAIL_STATUS_LABELS,
  SupportMailStatus,
  type SupportMailListItem,
} from '../../../api/facades/support-mails.models';
import { SeoService } from '../../../core/services/seo.service';
import { formatSupportMailTime, supportMailStatusClass } from './support-mail-format';

interface StatusFilter {
  label: string;
  value: SupportMailStatus | null;
}

@Component({
  selector: 'app-mail-history',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mail-history.component.html',
  styleUrls: ['./mails.shared.scss', './mail-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MailHistoryComponent implements OnInit {
  private static readonly pageSize = 10;
  private readonly facade = inject(SupportMailsFacade);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusFilters: readonly StatusFilter[] = [
    { label: 'All', value: null },
    { label: SUPPORT_MAIL_STATUS_LABELS[SupportMailStatus.AwaitingResponse], value: SupportMailStatus.AwaitingResponse },
    { label: SUPPORT_MAIL_STATUS_LABELS[SupportMailStatus.Responded], value: SupportMailStatus.Responded },
    { label: SUPPORT_MAIL_STATUS_LABELS[SupportMailStatus.Closed], value: SupportMailStatus.Closed },
  ];

  readonly mails = signal<readonly SupportMailListItem[]>([]);
  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasNextPage = signal(false);
  readonly activeStatus = signal<SupportMailStatus | null>(null);
  readonly searchTerm = signal('');

  private pageNumber = 1;
  private request: Subscription | null = null;
  private readonly search$ = new Subject<string>();

  ngOnInit(): void {
    this.seoService.setMetaTags({
      title: 'My Mails',
      description: 'Your inquiries to the Ask A Muslim support team and their replies.',
      noIndex: true,
    });

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        this.searchTerm.set(term);
        this.load();
      });

    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
    this.load();
  }

  onSearchInput(value: string): void {
    this.search$.next(value.trim());
  }

  selectStatus(status: SupportMailStatus | null): void {
    if (this.activeStatus() === status) {
      return;
    }
    this.activeStatus.set(status);
    this.load();
  }

  loadMore(): void {
    if (this.isLoadingMore() || !this.hasNextPage()) {
      return;
    }
    this.fetch(this.pageNumber + 1, true);
  }

  retry(): void {
    this.load();
  }

  statusLabel(status: SupportMailStatus): string {
    return SUPPORT_MAIL_STATUS_LABELS[status] ?? 'Unknown';
  }

  statusClass(status: SupportMailStatus): string {
    return supportMailStatusClass(status);
  }

  topicLabel(topic: number): string {
    return FALLBACK_SUPPORT_MAIL_TOPICS.find((t) => t.value === topic)?.name ?? '';
  }

  formatTime(value: string): string {
    return formatSupportMailTime(value);
  }

  private load(): void {
    this.fetch(1, false);
  }

  private fetch(pageNumber: number, append: boolean): void {
    this.request?.unsubscribe();
    this.error.set(null);
    if (append) {
      this.isLoadingMore.set(true);
    } else {
      this.isLoading.set(true);
    }

    this.request = this.facade
      .getMine({
        pageNumber,
        pageSize: MailHistoryComponent.pageSize,
        status: this.activeStatus(),
        searchTerm: this.searchTerm(),
      })
      .subscribe({
        next: (page) => {
          this.pageNumber = page.pageNumber;
          this.hasNextPage.set(page.hasNextPage);
          this.mails.set(append ? [...this.mails(), ...page.items] : page.items);
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
        error: () => {
          this.error.set('Unable to load your mails right now.');
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
      });
  }
}
