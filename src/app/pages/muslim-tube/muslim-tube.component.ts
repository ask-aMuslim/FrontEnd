import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MuslimTubeSidebarComponent } from './sidebar/sidebar.component';
import { RouterOutlet } from '@angular/router';
import {
  SelectDropdownComponent,
  SelectOption,
} from '../../shared/reusable-components/select-dropdown/select-dropdown.component';

@Component({
  selector: 'app-muslim-tube',
  imports: [MuslimTubeSidebarComponent, RouterOutlet, CommonModule, SelectDropdownComponent],
  templateUrl: './muslim-tube.component.html',
  styleUrls: ['./muslim-tube.component.scss'],
})
export class MuslimTubeComponent {
  searchQuery = signal('');
  selectedLanguage = signal<string>('all');
  selectedCategory = signal<number>(0);

  languageOptions: SelectOption<string>[] = [
    { value: 'all', label: 'All Languages' },
    { value: 'ar', label: 'العربية' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'ur', label: 'اردو' },
  ];

  categories: string[] = [
    'All',
    'Quran',
    'Hadith',
    'Fiqh',
    'Seerah',
    'Aqeedah',
    'Dawa',
    'Family',
    'History',
    'Science',
    'Podcasts',
    'Children',
    'Tajwid',
  ];

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onLanguageSelect(language: string): void {
    this.selectedLanguage.set(language);
  }

  onSearch(): void {
    console.log('Searching:', this.searchQuery(), 'Language:', this.selectedLanguage());
  }

  selectCategory(index: number): void {
    this.selectedCategory.set(index);
  }

  trackByIndex(_index: number): number {
    return _index;
  }
}
