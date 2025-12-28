import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Language, MeetingInquiryTopic } from '../../../core/models/enums.model';
import { CreateMeetingRequest } from '../../../core/models/meeting-request.model';
import { MeetingRequestsService } from '../../../core/services';
import { StepperComponent, Step } from './stepper/stepper.component';
import { RequestStepComponent } from './request-step/request-step.component';
import { DatetimeStepComponent } from './datetime-step/datetime-step.component';
import { ReviewStepComponent } from './review-step/review-step.component';

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
    CommonModule,
    ReactiveFormsModule,
    StepperComponent,
    RequestStepComponent,
    DatetimeStepComponent,
    ReviewStepComponent,
  ],
  templateUrl: './meet-scholar.component.html',
  styleUrl: './meet-scholar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetScholarComponent {
  currentStep = signal(1);
  meetingForm: FormGroup;
  isSubmitting = signal(false);

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
  ];

  availableLanguages = signal<LanguageOption[]>(this.languages);
  selectedLanguages = signal<LanguageOption[]>([]);

  availableDates: DateOption[] = [];
  availableTimes: TimeOption[] = [];

  constructor(
    private fb: FormBuilder,
    private meetingRequestsService: MeetingRequestsService,
    private router: Router,
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

      // Disable some dates for demonstration (e.g., third and sixth dates)
      const disabled = i === 2 || i === 5 || i >= 6;

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

    timeSlots.forEach((slot, index) => {
      // Disable some time slots for demonstration
      const disabled = index >= 5;
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
    let [hours, minutes] = time.split(':');

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

    if (hasInvalidRequired || selectedLanguagesEmpty || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.meetingForm.value;
    let scheduledAt: string | undefined;
    let scheduledDateTime: Date | undefined;

    if (formValue.scheduledDate && formValue.scheduledTime) {
      const date = new Date(formValue.scheduledDate);
      const [hours, minutes] = formValue.scheduledTime.split(':');
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      scheduledAt = date.toISOString();
      scheduledDateTime = date;
    }

    const payload: CreateMeetingRequest = {
      name: formValue.name,
      email: formValue.email,
      topic: formValue.topic,
      message: formValue.message,
      languages: formValue.languages,
      durationMinutes: formValue.durationMinutes,
      scheduledAt,
    };

    // TODO: Remove this temporary bypass when API is ready
    // For now, simulate successful submission and navigate to success page
    console.log('Meeting request payload:', payload);

    // Temporary: Skip API call and go directly to success
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.router.navigate(['/ask-and-contact/meet-scholar/success'], {
        state: {
          scheduledDateTime: scheduledDateTime ?? scheduledAt,
          scheduledTime: formValue.scheduledTime,
          durationMinutes: formValue.durationMinutes,
          confirmationEmail: formValue.email,
        },
      });
    }, 500);

    // Uncomment when API endpoint is ready:
    /*
    this.meetingRequestsService.create(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/ask-and-contact/meet-scholar/success'], {
          state: {
            scheduledDateTime: scheduledDateTime ?? scheduledAt,
            scheduledTime: formValue.scheduledTime,
            durationMinutes: formValue.durationMinutes,
            confirmationEmail: formValue.email,
          },
        });
      },
      error: (error) => {
        this.isSubmitting.set(false);
        console.error('Error submitting meeting request:', error);
        alert('Failed to submit meeting request. Please try again.');
      },
    });
    */
  }

  getTopicLabel(value: MeetingInquiryTopic | null): string {
    if (!value) return 'Subject';
    return this.topics.find((t) => t.value === value)?.label || 'Subject';
  }
}
