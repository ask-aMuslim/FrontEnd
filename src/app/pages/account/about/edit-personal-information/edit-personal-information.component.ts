import { Component, Input, Output, EventEmitter } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { InlineSvgDirective } from '../../../../shared/directives/inline-svg.directive';
import {
  SelectDropdownComponent,
  SelectOption,
} from '../../../../shared/reusable-components/select-dropdown/select-dropdown.component';
import {
  ChipsMultiselectComponent,
  ChipOption,
} from '../../../../shared/reusable-components/chips-multiselect/chips-multiselect.component';

@Component({
  selector: 'app-edit-personal-information',
  standalone: true,
  imports: [
    FormsModule,
    InlineSvgDirective,
    SelectDropdownComponent,
    ChipsMultiselectComponent
],
  templateUrl: './edit-personal-information.component.html',
  styleUrls: ['./edit-personal-information.component.scss'],
})
export class EditPersonalInformationComponent {
  @Input() name: string = '';
  @Input() gender: string = '';
  @Input() dateOfBirth: string = '';
  @Input() languagesSpeaks: string = '';
  @Output() save = new EventEmitter<{
    name: string;
    gender: string;
    dateOfBirth: string;
    languagesSpeaks: string;
  }>();
  @Output() cancel = new EventEmitter<void>();

  genderOptions: SelectOption<string>[] = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
  ];

  languageOptions: ChipOption<string>[] = [
    { value: 'English', label: 'English' },
    { value: 'Arabic', label: 'Arabic' },
    { value: 'French', label: 'French' },
    { value: 'Spanish', label: 'Spanish' },
    { value: 'German', label: 'German' },
    { value: 'Urdu', label: 'Urdu' },
    { value: 'Turkish', label: 'Turkish' },
    { value: 'Indonesian', label: 'Indonesian' },
  ];

  selectedLanguages: ChipOption<string>[] = [];

  ngOnInit() {
    // Parse languagesSpeaks string into selectedLanguages array
    if (this.languagesSpeaks) {
      const languages = this.languagesSpeaks.split(',').map((lang) => lang.trim());
      this.selectedLanguages = languages.map((lang) => ({
        value: lang,
        label: lang,
      }));
    }
  }

  onGenderSelect(value: string) {
    this.gender = value;
  }

  onLanguageAdd(option: ChipOption<string>) {
    if (!this.selectedLanguages.find((lang) => lang.value === option.value)) {
      this.selectedLanguages = [...this.selectedLanguages, option];
    }
  }

  onLanguageRemove(option: ChipOption<string>) {
    this.selectedLanguages = this.selectedLanguages.filter((lang) => lang.value !== option.value);
  }

  onSave() {
    this.save.emit({
      name: this.name,
      gender: this.gender,
      dateOfBirth: this.dateOfBirth,
      languagesSpeaks: this.selectedLanguages.map((lang) => lang.label).join(', '),
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}
