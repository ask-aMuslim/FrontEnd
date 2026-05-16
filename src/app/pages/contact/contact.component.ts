import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { CreateInquiryRequestCommand } from '../../api/models';
import { AuthService } from '../../core/services/auth.service';
import { InquiryRequestsService } from '../../core/services/inquiry-requests.service';
import { TokenService } from '../../core/auth/token.service';
import { Language, MeetingInquiryTopic } from '../../core/models/interfaces/enums.model';
import { ScrollService } from '../../core/services/scroll.service';
import { FormsFacade } from '../../api/facades/forms.facade';

interface TopicOption {
  value: MeetingInquiryTopic;
  label: string;
}

interface ContactQuickLink {
  id: string;
  title: string;
}

interface SubmittedContact {
  topicLabel: string;
  message: string;
}

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
  private readonly inquiryRequestsService = inject(InquiryRequestsService);
  private readonly tokenService = inject(TokenService);
  private readonly authService = inject(AuthService);
  private readonly formsFacade = inject(FormsFacade);

  readonly quickLinks = signal<readonly ContactQuickLink[]>([]);

  readonly topicOptions: readonly TopicOption[] = [
    { value: MeetingInquiryTopic.GeneralInquiry, label: 'Answered Question' },
    { value: MeetingInquiryTopic.Quran, label: 'Quran Studies' },
    { value: MeetingInquiryTopic.Hadith, label: 'Hadith Studies' },
    { value: MeetingInquiryTopic.ComparativeReligion, label: 'Comparative Religion' },
    { value: MeetingInquiryTopic.ConversionGuidance, label: 'Conversion Guidance' },
    { value: MeetingInquiryTopic.IslamicHistory, label: 'Islamic History' },
    { value: MeetingInquiryTopic.Fiqh, label: 'Fiqh (Islamic Jurisprudence)' },
    { value: MeetingInquiryTopic.Theology, label: 'Theology' },
  ];

  readonly contactForm = this.fb.group({
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    topic: this.fb.control<MeetingInquiryTopic | null>(null, [Validators.required]),
    message: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(10)]),
  });

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submittedContact = signal<SubmittedContact | null>(null);
  private readonly selectedTopic = signal<MeetingInquiryTopic | null>(null);
  readonly topicSelected = computed(() => this.selectedTopic() !== null);

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

  ngOnInit(): void {
    this.prefillContactDetails();
    this.loadQuickLinks();
    this.selectedTopic.set(this.contactForm.controls.topic.value);
    this.contactForm.controls.topic.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((topic) => {
        this.selectedTopic.set(topic);
      });
  }

  onTopicSelectionChange(): void {
    this.contactForm.controls.topic.markAsTouched();
    this.selectedTopic.set(this.contactForm.controls.topic.value);
    this.submitError.set(null);
  }

  onSubmit(): void {
    if (this.isSubmitting()) {
      return;
    }

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const selectedTopic = this.contactForm.controls.topic.value;
    if (selectedTopic === null) {
      this.contactForm.controls.topic.markAsTouched();
      return;
    }

    if (!this.tokenService.isAuthenticated()) {
      this.submitError.set('Please sign in before sending your message.');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/contact' },
      });
      return;
    }

    this.submitError.set(null);
    this.isSubmitting.set(true);

    const rawMessage = this.contactForm.controls.message.value.trim();
    const payload: CreateInquiryRequestCommand = {
      topic: selectedTopic,
      message: this.buildApiMessage(rawMessage),
      languages: [Language.English],
    };

    this.inquiryRequestsService.create(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submittedContact.set({
          topicLabel: this.getTopicLabel(selectedTopic),
          message: rawMessage,
        });

        this.contactForm.reset({
          name: this.contactForm.controls.name.value,
          email: this.contactForm.controls.email.value,
          topic: null,
          message: '',
        });

        this.scrollService.scrollToTop('smooth');
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.submitError.set(this.resolveSubmitError(error));

        if (this.extractErrorStatus(error) === 401) {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/contact' },
          });
        }
      },
    });
  }

  onSendAnotherMessage(): void {
    this.submittedContact.set(null);
    this.submitError.set(null);
    this.contactForm.controls.topic.setValue(null);
    this.selectedTopic.set(null);
    this.contactForm.controls.message.setValue('');
    this.contactForm.markAsPristine();
    this.contactForm.markAsUntouched();
    this.contactForm.updateValueAndValidity();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  isFieldInvalid(field: 'name' | 'email' | 'topic' | 'message'): boolean {
    const control = this.contactForm.get(field);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private prefillContactDetails(): void {
    const existingName = this.contactForm.controls.name.value.trim();
    const existingEmail = this.contactForm.controls.email.value.trim();

    const profileName = this.authService.currentUser()?.name?.trim() ?? '';
    const profileEmail = this.tokenService.userEmail()?.trim() ?? '';

    this.contactForm.patchValue(
      {
        name: existingName || profileName,
        email: existingEmail || profileEmail,
      },
      { emitEvent: false }
    );
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
            (forms ?? []).map((form) => ({
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

  private buildApiMessage(message: string): string {
    const name = this.contactForm.controls.name.value.trim();
    const email = this.contactForm.controls.email.value.trim();

    return `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
  }

  private getTopicLabel(topic: MeetingInquiryTopic): string {
    return this.topicOptions.find((item) => item.value === topic)?.label ?? 'Answered Question';
  }

  private resolveSubmitError(error: unknown): string {
    const status = this.extractErrorStatus(error);
    const message = this.extractErrorMessage(error).toLowerCase();

    if (status === 401 || message.includes('unauthorized') || message.includes('authentication')) {
      return 'Please sign in before sending your message.';
    }

    if (status === 400) {
      return 'Please review your information and try again.';
    }

    return 'Unable to send your message right now. Please try again shortly.';
  }

  private extractErrorStatus(error: unknown): number | null {
    if (error instanceof HttpErrorResponse) {
      const nested = this.parseStatusCandidate(error.error);
      return nested ?? error.status;
    }

    return this.parseStatusCandidate(error);
  }

  private parseStatusCandidate(candidate: unknown): number | null {
    if (candidate === null || candidate === undefined) {
      return null;
    }

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }

    if (typeof candidate === 'string') {
      const parsed = Number(candidate);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (typeof candidate === 'object') {
      const record = candidate as Record<string, unknown>;
      const directStatus = this.parseStatusCandidate(record['statusCode'] ?? record['status']);

      if (directStatus !== null) {
        return directStatus;
      }

      return this.parseStatusCandidate(record['originalError'] ?? record['error']);
    }

    return null;
  }

  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      const nestedMessage = this.extractErrorMessage(error.error);
      return nestedMessage.length > 0 ? nestedMessage : error.message;
    }

    if (typeof error === 'object' && error !== null) {
      const record = error as Record<string, unknown>;
      const candidates = [record['message'], record['detail'], record['error']];

      for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.length > 0) {
          return candidate;
        }
      }

      return this.extractErrorMessage(record['originalError']);
    }

    return '';
  }


}
