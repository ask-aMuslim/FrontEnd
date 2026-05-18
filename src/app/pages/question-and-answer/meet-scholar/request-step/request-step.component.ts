
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ChipsMultiselectComponent } from '../../../../shared/reusable-components/chips-multiselect/chips-multiselect.component';
import { SelectDropdownComponent } from '../../../../shared/reusable-components/select-dropdown/select-dropdown.component';
import { Language, MeetingInquiryTopic } from '../../../../core/models/interfaces/enums.model';

interface TopicOption {
  value: MeetingInquiryTopic;
  label: string;
}

interface LanguageOption {
  value: Language;
  label: string;
}

@Component({
  selector: 'app-request-step',
  standalone: true,
  imports: [ReactiveFormsModule, SelectDropdownComponent, ChipsMultiselectComponent],
  templateUrl: './request-step.component.html',
  styleUrl: './request-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequestStepComponent {
  form = input.required<FormGroup>();
  topics = input.required<TopicOption[]>();
  languages = input.required<LanguageOption[]>();
  availableLanguages = input.required<LanguageOption[]>();
  selectedLanguages = input.required<LanguageOption[]>();
  nextDisabled = input(false);

  next = output<void>();
  addLanguage = output<LanguageOption>();
  removeLanguage = output<LanguageOption>();

  languagesValidated = signal(false);

  onNext(): void {
    if (this.nextDisabled()) {
      return;
    }

    const form = this.form();
    this.languagesValidated.set(true);
    const controlsToValidate = ['name', 'email', 'topic', 'message'];
    const hasInvalidControl = controlsToValidate.some((ctrl) => form.get(ctrl)?.invalid);

    if (hasInvalidControl || this.selectedLanguages().length === 0) {
      controlsToValidate.forEach((ctrl) => form.get(ctrl)?.markAsTouched());
      form.get('languages')?.markAsTouched();
      return;
    }
    this.next.emit();
  }

  onSelectTopic(value: MeetingInquiryTopic): void {
    this.form().get('topic')?.setValue(value);
    this.form().get('topic')?.markAsTouched();
  }

  onAddLanguage(option: LanguageOption): void {
    this.addLanguage.emit(option);
  }

  onRemoveLanguage(language: LanguageOption): void {
    this.removeLanguage.emit(language);
  }
}
