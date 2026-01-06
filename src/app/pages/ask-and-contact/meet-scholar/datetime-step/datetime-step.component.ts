import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

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
  selector: 'app-datetime-step',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './datetime-step.component.html',
  styleUrl: './datetime-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatetimeStepComponent {
  form = input.required<FormGroup>();
  availableDates = input.required<DateOption[]>();
  availableTimes = input.required<TimeOption[]>();

  next = output<void>();
  selectDate = output<DateOption>();
  selectTime = output<TimeOption>();

  onSelectDate(date: DateOption): void {
    this.selectDate.emit(date);
  }

  onSelectTime(time: TimeOption): void {
    this.selectTime.emit(time);
  }

  onNext(): void {
    const durationControl = this.form().get('durationMinutes');
    durationControl?.markAsTouched();
    if (durationControl?.invalid) {
      return;
    }
    this.next.emit();
  }
}
