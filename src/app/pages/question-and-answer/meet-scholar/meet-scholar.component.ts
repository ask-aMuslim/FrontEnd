
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OnInit, inject } from '@angular/core';
import { Language, MeetingInquiryTopic } from '../../../core/models/interfaces/enums.model';
import type { CreateMeetingRequestCommand } from '../../../api/models';
import { MeetingRequestsService } from '../../../core/services';
import { TokenService } from '../../../core/auth/token.service';
import { StepperComponent, Step } from './stepper/stepper.component';
import { RequestStepComponent } from './request-step/request-step.component';
import { DatetimeStepComponent } from './datetime-step/datetime-step.component';
import { ReviewStepComponent } from './review-step/review-step.component';
import { SeoService } from '../../../core/services/seo.service';

interface TopicOption {
  value: MeetingInquiryTopic;
  label: string;
}

interface LanguageOption {
  value: Language;
  label: string;
}

interface DateOption {
  value: string;
  label: string;
  disabled: boolean;
}

interface TimeOption {
  value: string;
  label: string;
  disabled: boolean;
}

@Component({
  selector: 'app-meet-scholar',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    StepperComponent,
    RequestStepComponent,
    DatetimeStepComponent,
    ReviewStepComponent
  ],
  templateUrl: './meet-scholar.component.html',
  styleUrls: ['./meet-scholar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetScholarComponent implements OnInit {
  currentStep = signal(1);
  meetingForm: FormGroup;
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.setMetaTags({
      title: 'Book a Session with a Scholar',
      description: 'Schedule a one-on-one virtual meeting with a qualified Islamic scholar to ask questions, seek advice, or discuss topics in detail.',
      keywords: ['meet scholar', 'Islamic scholars meeting', 'one-on-one scholar consultation', 'ask advice scholar']
    });
  }

  steps: Step[] = [
    { label: 'Request', index: 1 },
    { label: 'Date & Time', index: 2 },
    { label: 'Review', index: 3 },
  ];

  topics: TopicOption[] = [
    { value: MeetingInquiryTopic.GeneralInquiry, label: 'General Inquiry' },
    { value: MeetingInquiryTopic.Quran, label: 'Quran Studies' },
    { value: MeetingInquiryTopic.Hadith, label: 'Hadith Studies' },
    { value: MeetingInquiryTopic.ComparativeReligion, label: 'Comparative Religion' },
    { value: MeetingInquiryTopic.ConversionGuidance, label: 'Conversion Guidance' },
    { value: MeetingInquiryTopic.IslamicHistory, label: 'Islamic History' },
    { value: MeetingInquiryTopic.Fiqh, label: 'Fiqh (Islamic Jurisprudence)' },
    { value: MeetingInquiryTopic.Theology, label: 'Theology' },
  ];

  languages: LanguageOption[] = [
    { value: Language.English, label: 'English' },
    { value: Language.Arabic, label: 'Arabic' },
    { value: Language.French, label: 'French' },
    { value: Language.Spanish, label: 'Spanish' },
    { value: Language.German, label: 'German' },
    { value: Language.Portuguese, label: 'Portuguese' },
  ];

  availableLanguages = signal<LanguageOption[]>(this.languages);
  selectedLanguages = signal<LanguageOption[]>([]);

  availableDates: DateOption[] = [];
  availableTimes: TimeOption[] = [];

  constructor(
    private fb: FormBuilder,
    private readonly _meetingRequestsService: MeetingRequestsService,
    private router: Router,
    private readonly tokenService: TokenService,
  ) {
    this.meetingForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      topic: [null, Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
      durationMinutes: [30, [Validators.required, Validators.min(15)]],
      languages: [[], Validators.required],
      scheduledDate: [null],
      scheduledTime: [null],
    });

    this.updateAvailableLanguages();
    this.initializeDatesAndTimes();
  }

  private initializeDatesAndTimes(): void {
    // Generate dates for the next 12 days
    const today = new Date();
    const dates: DateOption[] = [];

    for (let i = 0; i < 12; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();

      const disabled = false;

      dates.push({
        value: date.toISOString().split('T')[0],
        label: `${dayName}, ${monthName} ${day}`,
        disabled,
      });
    }

    this.availableDates = dates;

    // Generate time slots
    const times: TimeOption[] = [];
    const timeSlots = [
      '8:00 AM',
      '9:00 AM',
      '10:00 AM',
      '11:00 AM',
      '12:00 PM',
      '1:00 PM',
      '2:00 PM',
      '3:00 PM',
      '4:00 PM',
      '5:00 PM',
    ];

    timeSlots.forEach((slot) => {
      const disabled = false;
      times.push({
        value: this.convertTo24Hour(slot),
        label: slot,
        disabled,
      });
    });

    this.availableTimes = times;
  }

  private convertTo24Hour(time12h: string): string {
    const [time, modifier] = time12h.split(' ');
    const timeParts = time.split(':');
    let hours = timeParts[0];
    const minutes = timeParts[1];

    if (hours === '12') {
      hours = '00';
    }

    if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }

    return `${hours.padStart(2, '0')}:${minutes}`;
  }

  selectDate(date: DateOption): void {
    if (!date.disabled) {
      this.meetingForm.patchValue({ scheduledDate: date.value });
    }
  }

  selectTime(time: TimeOption): void {
    if (!time.disabled) {
      this.meetingForm.patchValue({ scheduledTime: time.value });
    }
  }

  addLanguage(language: LanguageOption): void {
    const current = this.selectedLanguages();
    if (!current.find((l) => l.value === language.value)) {
      this.selectedLanguages.set([...current, language]);
      this.updateAvailableLanguages();
      this.updateFormLanguages();
    }
  }

  removeLanguage(language: LanguageOption): void {
    const current = this.selectedLanguages();
    if (current.length > 1) {
      this.selectedLanguages.set(current.filter((l) => l.value !== language.value));
      this.updateAvailableLanguages();
      this.updateFormLanguages();
    }
  }

  private updateAvailableLanguages(): void {
    const selected = this.selectedLanguages();
    this.availableLanguages.set(
      this.languages.filter((lang) => !selected.find((s) => s.value === lang.value)),
    );
  }

  private updateFormLanguages(): void {
    const languageValues = this.selectedLanguages().map((l) => l.value);
    this.meetingForm.patchValue({ languages: languageValues });
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  submitMeetingRequest(): void {
    // Validate only required fields
    const requiredControls = ['name', 'email', 'topic', 'message', 'durationMinutes'];
    const hasInvalidRequired = requiredControls.some((ctrl) => this.meetingForm.get(ctrl)?.invalid);
    const selectedLanguagesEmpty = this.selectedLanguages().length === 0;
    const hasSelectedDateTime =
      typeof this.meetingForm.value.scheduledDate === 'string' &&
      this.meetingForm.value.scheduledDate.length > 0 &&
      typeof this.meetingForm.value.scheduledTime === 'string' &&
      this.meetingForm.value.scheduledTime.length > 0;

    if (hasInvalidRequired || selectedLanguagesEmpty || !hasSelectedDateTime || this.isSubmitting()) {
      if (!hasSelectedDateTime) {
        this.submitError.set('Please select both a date and time before submitting your booking.');
      }
      return;
    }

    if (!this.tokenService.isAuthenticated()) {
      this.submitError.set('Please sign in before booking a meeting.');
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/question-and-answer/meet-scholar' },
      });
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const formValue = this.meetingForm.value;
    const date = new Date(formValue.scheduledDate);
    const [hours, minutes] = String(formValue.scheduledTime).split(':');
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    const scheduledAt = date.toISOString();
    const scheduledDateTime: Date = date;

    const payload: CreateMeetingRequestCommand = {
      topic: formValue.topic,
      message: formValue.message,
      languages: formValue.languages,
      scheduledAt,
    };

    this._meetingRequestsService.create(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/question-and-answer/meet-scholar/success'], {
          state: {
            scheduledDateTime,
            scheduledTime: formValue.scheduledTime,
            durationMinutes: formValue.durationMinutes,
            confirmationEmail: formValue.email,
          },
        });
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.submitError.set(this.getSubmitErrorMessage(error));

        if (this.extractErrorStatus(error) === 401) {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/question-and-answer/meet-scholar' },
          });
        }
      },
    });
  }

  get isGuestUser(): boolean {
    return !this.tokenService.isAuthenticated();
  }

  navigateToSignIn(): void {
    void this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/question-and-answer/meet-scholar' },
    });
  }

  private getSubmitErrorMessage(error: unknown): string {
    const status = this.extractErrorStatus(error);
    const message = this.extractErrorMessage(error).toLowerCase();

    if (status === 401 || message.includes('401') || message.includes('unauthorized') || message.includes('authentication')) {
      return 'Please sign in before booking a meeting.';
    }

    if (status === 400) {
      return 'Please review your booking details and try again.';
    }

    return 'Unable to submit your booking right now. Please try again shortly.';
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

  private extractErrorStatus(error: unknown): number | null {
    if (error instanceof HttpErrorResponse) {
      const nestedHttpStatus = this.parseStatusCandidate(error.error);
      return nestedHttpStatus ?? error.status;
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

  getTopicLabel(value: MeetingInquiryTopic | null): string {
    if (!value) return 'Subject';
    return this.topics.find((t) => t.value === value)?.label || 'Subject';
  }
}
