
import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  OnInit,
  SimpleChanges,
  input,
  output,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChipsMultiselectComponent } from '../../../shared/reusable-components/chips-multiselect/chips-multiselect.component';
import { SelectDropdownComponent } from '../../../shared/reusable-components/select-dropdown/select-dropdown.component';
import { Language, MeetingInquiryTopic } from '../../../core/models/interfaces/enums.model';
import type { CreateInquiryRequestCommand } from '../../../api/models';
import { Router } from '@angular/router';
import { InquiryRequestsService } from '../../../core/services';

interface TopicOption {
  value: MeetingInquiryTopic;
  label: string;
}

interface LanguageOption {
  value: Language;
  label: string;
}

@Component({
  selector: 'app-send-inquiry',
  standalone: true,
  imports: [ReactiveFormsModule, SelectDropdownComponent, ChipsMultiselectComponent],
  templateUrl: './send-inquiry.component.html',
  styleUrls: ['./send-inquiry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SendInquiryComponent implements OnInit, OnChanges {
  private readonly defaultTopics: TopicOption[] = [
    { value: MeetingInquiryTopic.GeneralInquiry, label: 'General Inquiry' },
    { value: MeetingInquiryTopic.Quran, label: 'Quran Studies' },
    { value: MeetingInquiryTopic.Hadith, label: 'Hadith Studies' },
    { value: MeetingInquiryTopic.ComparativeReligion, label: 'Comparative Religion' },
    { value: MeetingInquiryTopic.ConversionGuidance, label: 'Conversion Guidance' },
    { value: MeetingInquiryTopic.IslamicHistory, label: 'Islamic History' },
    { value: MeetingInquiryTopic.Fiqh, label: 'Fiqh (Islamic Jurisprudence)' },
    { value: MeetingInquiryTopic.Theology, label: 'Theology' },
  ];

  private readonly defaultLanguages: LanguageOption[] = [
    { value: Language.English, label: 'English' },
    { value: Language.Arabic, label: 'Arabic' },
    { value: Language.French, label: 'French' },
    { value: Language.Spanish, label: 'Spanish' },
    { value: Language.German, label: 'German' },
  ];

  form = input<FormGroup | null>(null);
  topics = input<TopicOption[]>(this.defaultTopics);
  availableLanguages = input<LanguageOption[]>(this.defaultLanguages);
  selectedLanguages = input<LanguageOption[]>([]);

  formRef = signal<FormGroup>(this.buildDefaultForm());
  selectedLanguagesRef = signal<LanguageOption[]>([]);

  next = output<void>();
  addLanguage = output<LanguageOption>();
  removeLanguage = output<LanguageOption>();

  languagesValidated = signal(false);
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  constructor(
    private readonly router: Router,
    private readonly inquiryRequestsService: InquiryRequestsService,
  ) { }

  ngOnInit(): void {
    const providedForm = this.form();
    const form = providedForm ?? this.buildDefaultForm();

    if (!form.get('details')) {
      form.addControl('details', new FormControl(''));
    }

    this.formRef.set(form);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedLanguages']) {
      const incoming = this.selectedLanguages();
      const next = incoming ? [...incoming] : [];
      this.selectedLanguagesRef.set(next);
      this.formRef().get('languages')?.setValue(next);
    }
  }

  onNext(): void {
    const form = this.formRef();
    this.languagesValidated.set(true);
    const controlsToValidate = ['topic', 'message'];
    const hasInvalidControl = controlsToValidate.some((ctrl) => form.get(ctrl)?.invalid);

    if (hasInvalidControl || this.selectedLanguagesRef().length === 0) {
      controlsToValidate.forEach((ctrl) => form.get(ctrl)?.markAsTouched());
      form.get('languages')?.markAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    const topicLabel = this.getTopicLabel(form.get('topic')?.value ?? null);
    const languages = this.selectedLanguagesRef().map((language) => language.label);
    const payload: CreateInquiryRequestCommand = {
      topic: form.get('topic')?.value,
      message: form.get('message')?.value ?? '',
      languages: this.selectedLanguagesRef().map((language) => language.value),
    };

    this.submitError.set(null);
    this.isSubmitting.set(true);

    this.inquiryRequestsService.create(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.next.emit();

        this.router.navigate(['/ask-and-contact/send-inquiry/success'], {
          state: {
            topicLabel,
            languages,
            message: form.get('message')?.value ?? '',
            details: form.get('details')?.value ?? '',
          },
        });
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.submitError.set(this.getSubmitErrorMessage(error));

        if (this.extractErrorStatus(error) === 401) {
          this.router.navigate(['/login'], {
            queryParams: { redirectUrl: '/ask-and-contact/send-inquiry' },
          });
        }
      },
    });
  }

  private getSubmitErrorMessage(error: unknown): string {
    const status = this.extractErrorStatus(error);

    if (status === 401) {
      return 'Please sign in before sending an inquiry.';
    }

    if (status === 400) {
      return 'Please review your inquiry details and try again.';
    }

    return 'Unable to send your inquiry right now. Please try again shortly.';
  }

  private extractErrorStatus(error: unknown): number | null {
    if (error instanceof HttpErrorResponse) {
      return error.status;
    }

    if (typeof error === 'object' && error !== null && 'status' in error) {
      const candidateStatus = (error as { status?: unknown }).status;
      if (typeof candidateStatus === 'number') {
        return candidateStatus;
      }
    }

    return null;
  }

  onSelectTopic(value: MeetingInquiryTopic): void {
    this.formRef().get('topic')?.setValue(value);
    this.formRef().get('topic')?.markAsTouched();
  }

  onAddLanguage(option: LanguageOption): void {
    const current = this.selectedLanguagesRef();
    if (current.some((item) => item.value === option.value)) {
      return;
    }
    const next = [...current, option];
    this.selectedLanguagesRef.set(next);
    this.formRef().get('languages')?.setValue(next);
    this.addLanguage.emit(option);
  }

  onRemoveLanguage(language: LanguageOption): void {
    const next = this.selectedLanguagesRef().filter((item) => item.value !== language.value);
    this.selectedLanguagesRef.set(next);
    this.formRef().get('languages')?.setValue(next);
    this.removeLanguage.emit(language);
  }

  private buildDefaultForm(): FormGroup {
    return new FormGroup({
      topic: new FormControl<MeetingInquiryTopic | null>(null, Validators.required),
      message: new FormControl('', [Validators.required, Validators.minLength(10)]),
      details: new FormControl(''),
      languages: new FormControl<LanguageOption[]>([], Validators.required),
    });
  }

  private getTopicLabel(topic: MeetingInquiryTopic | null): string {
    return this.topics().find((item) => item.value === topic)?.label ?? 'Subject';
  }
}
