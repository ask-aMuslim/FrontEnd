import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MeetingInquiryTopic, Language } from '../../../../core/models/interfaces/enums.model';
import { MEETING_DURATION_MINUTES, formatSlotTime, timeZoneLabel } from '../meeting-schedule';

interface TopicOption {
  value: MeetingInquiryTopic;
  label: string;
}

interface LanguageOption {
  value: Language;
  label: string;
}

@Component({
  selector: 'app-review-step',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-step.component.html',
  styleUrls: ['./review-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewStepComponent {
  form = input.required<FormGroup>();
  topics = input.required<TopicOption[]>();
  selectedLanguages = input.required<LanguageOption[]>();
  isSubmitting = input.required<boolean>();
  submitError = input<string | null>(null);

  back = output<void>();
  submit = output<void>();
  leftArrowIcon = '/icons/icons-24/arrow-left.svg';

  readonly durationMinutes = MEETING_DURATION_MINUTES;
  readonly timeZone = timeZoneLabel();

  formatTime(value: string | null): string {
    return value ? formatSlotTime(value) : '';
  }

  getTopicLabel(value: MeetingInquiryTopic | null): string {
    if (!value) return 'Subject';
    return this.topics().find((t) => t.value === value)?.label || 'Subject';
  }

  onBack(): void {
    this.back.emit();
  }

  onSubmit(): void {
    this.submit.emit();
  }
}
