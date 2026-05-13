import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

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
import { Language } from '../../../../core/models/interfaces/enums.model';

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
export class EditPersonalInformationComponent implements OnInit {
  @Input() name: string = '';
  @Input() gender: string = '';
  @Input() dateOfBirth: string = '';
  @Input() languagesSpeaks: string = '';
  @Output() save = new EventEmitter<{
    name: string;
    gender: string;
    dateOfBirth: string;
    languages: Language[];
  }>();
  @Output() cancelEdit = new EventEmitter<void>();

  genderOptions: SelectOption<string>[] = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
  ];

  languageOptions: ChipOption<Language>[] = [
    { value: Language.English, label: 'English' },
    { value: Language.Arabic, label: 'Arabic' },
    { value: Language.French, label: 'French' },
    { value: Language.Spanish, label: 'Spanish' },
    { value: Language.German, label: 'German' },
    { value: Language.Portuguese, label: 'Portuguese' },
  ];

  selectedLanguages: ChipOption<Language>[] = [];

  private readonly languageLookup: Record<string, Language> = {
    English: Language.English,
    Arabic: Language.Arabic,
    French: Language.French,
    Spanish: Language.Spanish,
    German: Language.German,
    Portuguese: Language.Portuguese,
  };

  ngOnInit() {
    this.selectedLanguages = this.parseLanguages(this.languagesSpeaks);
  }

  onGenderSelect(value: string) {
    this.gender = value;
  }

  onLanguageAdd(option: ChipOption<Language>) {
    if (!this.selectedLanguages.find((lang) => lang.value === option.value)) {
      this.selectedLanguages = [...this.selectedLanguages, option];
    }
  }

  onLanguageRemove(option: ChipOption<Language>) {
    this.selectedLanguages = this.selectedLanguages.filter((lang) => lang.value !== option.value);
  }

  onSave() {
    this.save.emit({
      name: this.name,
      gender: this.gender,
      dateOfBirth: this.dateOfBirth,
      languages: this.selectedLanguages.map((lang) => lang.value),
    });
  }

  onCancel() {
    this.cancelEdit.emit();
  }

  private parseLanguages(languagesSpeaks: string): ChipOption<Language>[] {
    if (!languagesSpeaks) {
      return [];
    }

    return languagesSpeaks
      .split(',')
      .map((language) => language.trim())
      .map((language) => {
        const value = this.languageLookup[language];
        return value ? { value, label: language } : null;
      })
      .filter((language): language is ChipOption<Language> => language !== null);
  }
}
