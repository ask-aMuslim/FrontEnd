import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Subscription, timer } from 'rxjs';
import { TokenService } from '../../core/auth/token.service';
import { AuthService } from '../../core/services/auth.service';
import { ScrollService } from '../../core/services/scroll.service';
import { FormsFacade } from '../../api/facades/forms.facade';
import { SeoService } from '../../core/services/seo.service';
import { SupportMailsFacade } from '../../api/facades/support-mails.facade';
import {
  FALLBACK_SUPPORT_MAIL_TOPICS,
  SUPPORT_MAIL_LIMITS,
  type SupportMailEligibility,
  type SupportMailError,
  type SupportMailTopic,
} from '../../api/facades/support-mails.models';
import { SupportMailUnreadService } from '../../core/services/support-mail-unread.service';
import { formatSupportMailTime } from './mails/support-mail-format';

interface ContactQuickLink {
  id: string;
  title: string;
}

interface SubmittedContact {
  id: string;
  topicLabel: string;
  subject: string;
  explanation: string;
}

interface ContactDraft {
  topic: number | null;
  subject: string;
  explanation: string;
}

type ContactField = 'topic' | 'subject' | 'explanation';

const DRAFT_STORAGE_KEY = 'aam.contact.supportMailDraft';
const COOLDOWN_ERROR_PREFIX = 'you can send a new inquiry after';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent implements OnInit {
  private static readonly quickLinksPageSize = 6;
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  private readonly formsFacade = inject(FormsFacade);
  private readonly seoService = inject(SeoService);
  private readonly supportMails = inject(SupportMailsFacade);
  private readonly unreadService = inject(SupportMailUnreadService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly googleFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfYgoGSOqGLsuUdBvKRmr1mpFMlJXrkxicoFDDl-949o49oGQ/viewform?usp=header';

  readonly quickLinks = signal<readonly ContactQuickLink[]>([]);

  isExternalForm(link: ContactQuickLink): boolean {
    if (this.quickLinks().length === 1) {
      return true;
    }
    const title = (link.title || '').toLowerCase();
    return title.includes('join') || title.includes('ask a muslim') || title.includes('askamuslim');
  }

  formatTitle(title: string): string {
    return (title || '').replace(/AskAMuslim/gi, 'Ask A Muslim');
  }

  readonly limits = SUPPORT_MAIL_LIMITS;
  readonly topicOptions = signal<readonly SupportMailTopic[]>(FALLBACK_SUPPORT_MAIL_TOPICS);

  readonly contactForm = this.fb.group({
    topic: this.fb.control<number | null>(null, [Validators.required]),
    subject: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.maxLength(SUPPORT_MAIL_LIMITS.subject),
    ]),
    explanation: this.fb.nonNullable.control('', [Validators.maxLength(SUPPORT_MAIL_LIMITS.explanation)]),
  });

  private readonly explanationValue = toSignal(this.contactForm.controls.explanation.valueChanges, {
    initialValue: '',
  });
  readonly explanationLength = computed(() => this.explanationValue().length);

  readonly isAuthenticated = this.tokenService.isAuthenticated;
  readonly unreadCount = this.unreadService.unreadCount;

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly serverFieldErrors = signal<Partial<Record<ContactField, string>>>({});
  readonly submittedContact = signal<SubmittedContact | null>(null);
  readonly eligibility = signal<SupportMailEligibility>({ canCreate: true, nextAllowedAt: null });

  readonly cooldownMessage = computed(() => {
    const { canCreate, nextAllowedAt } = this.eligibility();
    if (canCreate) {
      return null;
    }
    const at = formatSupportMailTime(nextAllowedAt);
    return at
      ? `You can send a new inquiry after one hour, at ${at}.`
      : 'You can send a new inquiry after one hour.';
  });

  readonly greetingName = computed(() => {
    const profileName = this.authService.currentUser()?.name?.trim();
    if (profileName) {
      return profileName;
    }

    const email = this.tokenService.userEmail()?.trim();
    if (!email) {
      return 'Guest';
    }

    const localPart = email.split('@')[0] ?? '';
    return localPart
      .split(/[._-]+/g)
      .filter((part) => part.length > 0)
      .map((part) => `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`)
      .join(' ');
  });

  private readonly scrollService = inject(ScrollService);
  private cooldownTimer: Subscription | null = null;

  ngOnInit(): void {
    this.loadQuickLinks();
    this.destroyRef.onDestroy(() => this.cooldownTimer?.unsubscribe());

    if (this.isBrowser && this.isAuthenticated()) {
      this.restoreDraft();
      this.loadTopics();
      this.loadEligibility();
    }

    this.seoService.setMetaTags({
      title: 'Contact Us & Ask Questions',
      description: 'Get in touch with Ask A Muslim. Ask questions directly to scholars, request studies in Quran, Hadith, or Comparative Religion, and send general inquiries.',
      keywords: ['contact scholars', 'ask a scholar', 'Islamic advice', 'Quran studies support', 'conversion guidance']
    });
  }

  onSubmit(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const topic = this.contactForm.controls.topic.value;
    if (topic === null) {
      this.contactForm.controls.topic.markAsTouched();
      return;
    }

    if (!this.isAuthenticated()) {
      this.saveDraft();
      this.submitError.set('Please sign in before sending your message.');
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/contact' },
      });
      return;
    }

    if (!this.eligibility().canCreate) {
      return;
    }

    this.submitError.set(null);
    this.serverFieldErrors.set({});
    this.isSubmitting.set(true);

    const subject = this.contactForm.controls.subject.value.trim();
    const explanation = this.contactForm.controls.explanation.value.trim();

    this.supportMails
      .create({ topic, subject, explanation: explanation || null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (id) => {
          this.isSubmitting.set(false);
          this.submittedContact.set({
            id,
            topicLabel: this.getTopicLabel(topic),
            subject,
            explanation,
          });
          this.contactForm.reset({ topic: null, subject: '', explanation: '' });
          this.clearDraft();
          this.loadEligibility();
          this.scrollService.scrollToTop('smooth');
        },
        error: (error: SupportMailError) => {
          this.isSubmitting.set(false);
          this.handleSubmitError(error);
        },
      });
  }

  onSendAnotherMessage(): void {
    this.submittedContact.set(null);
    this.submitError.set(null);
    this.serverFieldErrors.set({});
    this.contactForm.reset({ topic: null, subject: '', explanation: '' });
    this.loadEligibility();
  }

  viewSubmittedMail(): void {
    const submitted = this.submittedContact();
    void this.router.navigate(submitted?.id ? ['/contact', 'mails', submitted.id] : ['/contact', 'mails']);
  }

  isFieldInvalid(field: ContactField): boolean {
    const control = this.contactForm.get(field);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private loadQuickLinks(): void {
    this.formsFacade
      .getForms({
        pageNumber: 1,
        pageSize: ContactComponent.quickLinksPageSize,
        isPublished: true,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (forms) => {
          this.quickLinks.set(
            (forms ?? [])
              .filter((form) => {
                const title = (form.title || '').toLowerCase();
                return (
                  !title.includes('join') &&
                  !title.includes('ask a muslim') &&
                  !title.includes('askamuslim') &&
                  !title.includes('workshop') &&
                  !title.includes('table') &&
                  !title.includes('revert') &&
                  !title.includes('companion') &&
                  !title.includes('buddy') &&
                  !title.includes('new muslim')
                );
              })
              .map((form) => ({
                id: form.id,
                title: form.title,
              }))
          );
        },
        error: () => {
          this.quickLinks.set([]);
        },
      });
  }

  private loadTopics(): void {
    this.supportMails
      .getTopics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (topics) => {
          if (topics.length > 0) {
            this.topicOptions.set(topics);
          }
        },
        error: () => {
          // Keep the local fallback list.
        },
      });
  }

  private loadEligibility(): void {
    if (!this.isBrowser || !this.isAuthenticated()) {
      return;
    }

    this.supportMails
      .getEligibility()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (eligibility) => {
          this.eligibility.set(eligibility);
          this.scheduleCooldownEnd(eligibility);
        },
        error: () => {
          // The server still enforces the limit; don't block Send on a failed check.
          this.eligibility.set({ canCreate: true, nextAllowedAt: null });
        },
      });
  }

  private scheduleCooldownEnd(eligibility: SupportMailEligibility): void {
    this.cooldownTimer?.unsubscribe();
    this.cooldownTimer = null;

    if (eligibility.canCreate || !eligibility.nextAllowedAt) {
      return;
    }

    const waitMs = new Date(eligibility.nextAllowedAt).getTime() - Date.now();
    if (!Number.isFinite(waitMs)) {
      return;
    }

    this.cooldownTimer = timer(Math.max(waitMs, 0) + 1000).subscribe(() => this.loadEligibility());
  }

  private handleSubmitError(error: SupportMailError): void {
    const firstMessage = error.messages[0] ?? '';

    if (error.status === 400 && firstMessage.toLowerCase().startsWith(COOLDOWN_ERROR_PREFIX)) {
      this.submitError.set(null);
      this.eligibility.set({ canCreate: false, nextAllowedAt: null });
      this.loadEligibility();
      return;
    }

    if (error.status === 401) {
      this.saveDraft();
      this.submitError.set('Please sign in before sending your message.');
      return;
    }

    const fieldErrors: Partial<Record<ContactField, string>> = {};
    for (const field of ['topic', 'subject', 'explanation'] as const) {
      const messages = error.fieldErrors[field];
      if (messages?.length) {
        fieldErrors[field] = messages[0];
      }
    }
    this.serverFieldErrors.set(fieldErrors);

    if (Object.keys(fieldErrors).length > 0) {
      this.submitError.set('Please review the highlighted fields and try again.');
      return;
    }

    if (error.status === 400 && firstMessage) {
      this.submitError.set(firstMessage);
      return;
    }

    this.submitError.set('Unable to send your message right now. Please try again shortly.');
  }

  private getTopicLabel(topic: number): string {
    return this.topicOptions().find((item) => item.value === topic)?.name ?? 'General Inquiry';
  }

  private saveDraft(): void {
    if (!this.isBrowser) {
      return;
    }
    const draft: ContactDraft = {
      topic: this.contactForm.controls.topic.value,
      subject: this.contactForm.controls.subject.value,
      explanation: this.contactForm.controls.explanation.value,
    };
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage unavailable (private mode, blocked); the draft is a convenience only.
    }
  }

  private restoreDraft(): void {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    } catch {
      return;
    }
    if (!raw) {
      return;
    }

    try {
      const draft = JSON.parse(raw) as Partial<ContactDraft>;
      this.contactForm.patchValue({
        topic: typeof draft.topic === 'number' ? draft.topic : null,
        subject: typeof draft.subject === 'string' ? draft.subject : '',
        explanation: typeof draft.explanation === 'string' ? draft.explanation : '',
      });
    } catch {
      // Ignore a corrupt draft.
    }
    this.clearDraft();
  }

  private clearDraft(): void {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }
}
