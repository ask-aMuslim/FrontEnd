import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subscription, filter, fromEvent, map } from 'rxjs';
import { SupportMailsFacade } from '../../../api/facades/support-mails.facade';
import {
  FALLBACK_SUPPORT_MAIL_TOPICS,
  SUPPORT_MAIL_LIMITS,
  SUPPORT_MAIL_STATUS_LABELS,
  SupportMailSenderType,
  SupportMailStatus,
  type SupportMailDetail,
  type SupportMailError,
  type SupportMailMessage,
} from '../../../api/facades/support-mails.models';
import { SeoService } from '../../../core/services/seo.service';
import { SupportMailUnreadService } from '../../../core/services/support-mail-unread.service';
import { formatSupportMailTime, supportMailStatusClass } from './support-mail-format';

const notBlank = Validators.pattern(/\S/);

@Component({
  selector: 'app-mail-thread',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './mail-thread.component.html',
  styleUrls: ['./mails.shared.scss', './mail-thread.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MailThreadComponent implements OnInit {
  private readonly facade = inject(SupportMailsFacade);
  private readonly unreadService = inject(SupportMailUnreadService);
  private readonly route = inject(ActivatedRoute);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly messagesEnd = viewChild<ElementRef<HTMLElement>>('messagesEnd');

  readonly limits = SUPPORT_MAIL_LIMITS;
  readonly SenderType = SupportMailSenderType;

  readonly mail = signal<SupportMailDetail | null>(null);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly isSending = signal(false);
  readonly replyError = signal<string | null>(null);

  readonly replyForm = this.fb.group({
    body: this.fb.nonNullable.control('', [
      Validators.required,
      notBlank,
      Validators.maxLength(SUPPORT_MAIL_LIMITS.reply),
    ]),
  });

  private readonly replyValue = toSignal(this.replyForm.controls.body.valueChanges, { initialValue: '' });
  readonly replyLength = computed(() => this.replyValue().length);

  readonly isClosed = computed(() => this.mail()?.status === SupportMailStatus.Closed);

  private mailId = '';
  private request: Subscription | null = null;

  ngOnInit(): void {
    this.seoService.setMetaTags({
      title: 'Mail',
      description: 'Your inquiry to the Ask A Muslim support team.',
      noIndex: true,
    });

    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => {
        this.mailId = id;
        this.mail.set(null);
        this.isLoading.set(true);
        this.load(true);
      });

    if (this.isBrowser) {
      fromEvent(document, 'visibilitychange')
        .pipe(
          filter(() => document.visibilityState === 'visible'),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => this.load(false));
    }

    this.destroyRef.onDestroy(() => this.request?.unsubscribe());
  }

  retry(): void {
    this.isLoading.set(true);
    this.load(true);
  }

  onReply(): void {
    if (this.isSending()) {
      return;
    }
    if (this.replyForm.invalid) {
      this.replyForm.markAllAsTouched();
      return;
    }

    const body = this.replyForm.controls.body.value.trim();
    this.isSending.set(true);
    this.replyError.set(null);

    this.facade
      .reply(this.mailId, { body })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSending.set(false);
          this.replyForm.reset({ body: '' });
          this.load(false, true);
          this.unreadService.refresh();
        },
        error: (error: SupportMailError) => {
          this.isSending.set(false);
          const serverMessage = error.fieldErrors['body']?.[0]
            ?? (error.status === 400 ? error.messages[0] : undefined);
          this.replyError.set(serverMessage ?? 'Unable to send your reply right now. Please try again shortly.');
        },
      });
  }

  /** Chat behaviour: Enter sends, Shift+Enter inserts a new line. */
  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.onReply();
    }
  }

  isReplyInvalid(): boolean {
    const control = this.replyForm.controls.body;
    return control.invalid && (control.touched || control.dirty) && control.value.length > 0;
  }

  isRequester(message: SupportMailMessage): boolean {
    return message.senderType === SupportMailSenderType.Requester;
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

  onAvatarError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = '/images/profile-placeholder.svg';
  }

  private load(markRead: boolean, scrollToEnd = false): void {
    if (!this.mailId) {
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }

    this.request?.unsubscribe();
    this.loadError.set(null);

    this.request = this.facade.getById(this.mailId).subscribe({
      next: (mail) => {
        this.mail.set(mail);
        this.notFound.set(false);
        this.isLoading.set(false);
        this.seoService.setMetaTags({
          title: `Mail #${mail.number}`,
          description: 'Your inquiry to the Ask A Muslim support team.',
          noIndex: true,
        });
        if (markRead) {
          this.markAsRead();
          this.scrollToNewest();
        } else if (scrollToEnd) {
          this.scrollToNewest();
        }
      },
      error: (error: SupportMailError) => {
        this.isLoading.set(false);
        const notFound = error.status === 404
          || (error.status === 400 && error.messages.some((m) => m.toLowerCase().includes('not found')));
        if (notFound) {
          this.mail.set(null);
          this.notFound.set(true);
          return;
        }
        if (!this.mail()) {
          this.loadError.set('Unable to load this mail right now.');
        }
      },
    });
  }

  private markAsRead(): void {
    this.facade
      .markAsRead(this.mailId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.unreadService.refresh(),
        error: () => {
          // Not critical; the unread flag clears on the next open.
        },
      });
  }

  private scrollToNewest(): void {
    if (!this.isBrowser) {
      return;
    }
    // Scroll only the message panel (not the whole page) to the newest message.
    setTimeout(() => {
      const end = this.messagesEnd()?.nativeElement;
      const list = end?.parentElement;
      list?.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    });
  }
}
