
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  MEETING_DURATION_MINUTES,
  MIN_NOTICE_HOURS,
  type DateOption,
  type TimeOption,
} from '../meeting-schedule';

@Component({
  selector: 'app-datetime-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './datetime-step.component.html',
  styleUrl: './datetime-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeStepComponent {
  form = input.required<FormGroup>();
  availableDates = input.required<DateOption[]>();
  availableTimes = input.required<TimeOption[]>();
  /** The viewer's timezone name, shown next to the times so nobody has to guess. */
  timeZone = input('');
  nextDisabled = input(false);

  next = output<void>();
  back = output<void>();
  selectDate = output<DateOption>();
  selectTime = output<TimeOption>();

  readonly durationMinutes = MEETING_DURATION_MINUTES;
  readonly minNoticeHours = MIN_NOTICE_HOURS;
  readonly selectionError = signal(false);

  leftArrowIcon = '/icons/icons-24/arrow-left.svg';

  onSelectDate(date: DateOption): void {
    this.selectDate.emit(date);
  }

  onSelectTime(time: TimeOption): void {
    this.selectTime.emit(time);
  }

  onNext(): void {
    if (this.nextDisabled()) {
      return;
    }

    const form = this.form();
    if (!form.get('scheduledDate')?.value || !form.get('scheduledTime')?.value) {
      this.selectionError.set(true);
      return;
    }

    this.selectionError.set(false);
    this.next.emit();
  }

  onBack(): void {
    this.back.emit();
  }
}
