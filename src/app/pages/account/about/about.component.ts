import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
import { EditMainInformationComponent } from './edit-main-information/edit-main-information.component';
import { EditPersonalInformationComponent } from './edit-personal-information/edit-personal-information.component';
import { EditContactInformationComponent } from './edit-contact-information/edit-contact-information.component';
import { StudentFacade } from '../../../api/facades/student.facade';
import type { StudentProfile, UpdateStudentProfileRequest, LanguageDetail } from '../../../api/facades/student.facade';
import { languageLabels, religiousStatusLabels } from '../../../core/helpers/enum-labels.helper';
import { Language, ReligiousStatus } from '../../../core/models/interfaces/enums.model';
import { ProfileError } from '../../../core/services/student-profile.service';

/**
 * Local view-model for the profile screen.
 * Values are merged with whatever the server returns.
 * Fields not yet covered by the API are left in the client-side object
 * so the UI can still function.
 */
export interface AboutModel {
  religion: string;
  reasonOfReligion: string;
  reasonForConversion: string;
  oldReligion: string;
  bio: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  dateOfIslamConversion: string;
  age: number;
  languages: LanguageDetail[];
  languagesSpeaks: string;
  city: string;
  country: string;
  countryCode: string;
  phoneNumber: string;
  email: string;
  profileImage: string;
}

@Component({
  selector: 'app-about',
  imports: [
    InlineSvgDirective,
    EditMainInformationComponent,
    EditPersonalInformationComponent,
    EditContactInformationComponent,
  ],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit, OnDestroy {
  private readonly studentFacade = inject(StudentFacade);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly destroy$ = new Subject<void>();

  about: AboutModel = {
    religion: '',
    reasonOfReligion: '',
    reasonForConversion: '',
    oldReligion: '',
    bio: '',
    name: '',
    gender: '',
    dateOfBirth: '',
    dateOfIslamConversion: '',
    age: 0,
    languages: [],
    languagesSpeaks: '',
    city: '',
    country: '',
    countryCode: '',
    phoneNumber: '',
    email: '',
    profileImage: '',
  };

  isEditingMain = false;
  isEditingPersonal = false;
  isEditingContact = false;
  isLoading = false;
  error: string | null = null;
  successMessage: string | null = null;
  private lastSentLanguageIds: Language[] = [];

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.error = null;

    this.studentFacade
      .getMyProfileFromApi()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (profile) => {
          if (profile) {
            this.mapProfileToModel(profile);
          }
        },
        error: (err: ProfileError) => {
          this.error = this.getErrorMessage(err);
        },
      });
  }

  /**
   * Map API profile data to the local view model
   * Preserves local language state if API response doesn't include languages
   */
  private mapProfileToModel(profile: StudentProfile): void {
    // Calculate age from date of birth
    const age = this.calculateAge(profile.dateOfBirth);

    // Build full name from API data
    const profileName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(' ');
    const name = profileName || this.about.name;

    const religionLabel =
      profile.religiousStatus !== undefined
        ? this.getReligionLabel(profile.religiousStatus)
        : this.about.religion;

    // Handle languages from partial or inconsistent API responses.
    let languages = profile.languages ?? [];
    let languagesSpeaks = this.about.languagesSpeaks;

    if (languages.length > 0 && this.isLanguageDetailArray(languages)) {
      // Response has full language details
      languagesSpeaks = this.formatLanguages(languages);
    } else if (languages.length > 0) {
      // Response has language IDs only
      const languageIds = languages as unknown as Language[];
      languages = languageIds.map((id) => ({
        id,
        name: languageLabels[id],
        code: '',
      }));
      languagesSpeaks = this.formatLanguages(languageIds);
    } else if (languages.length === 0) {
      // API response is empty - use fallbacks in order of preference
      if (this.about.languages.length > 0) {
        // First try: preserve existing local data
        languages = this.about.languages;
        languagesSpeaks = this.about.languagesSpeaks;
      } else if (this.lastSentLanguageIds.length > 0) {
        // Second try: reconstruct from the IDs we just sent, using enum labels
        languages = this.lastSentLanguageIds.map((id) => ({
          id,
          name: languageLabels[id],
          code: '',
        }));
        languagesSpeaks = this.lastSentLanguageIds.map((id) => languageLabels[id]).join(', ');
      }
    }

    const nextProfileImage = this.preferNonEmptyString(profile.imageUrl, this.about.profileImage);

    this.about = {
      religion: religionLabel,
      reasonOfReligion: profile.reasonOfReligion ?? profile.reasonForConversion ?? this.about.reasonOfReligion,
      reasonForConversion: profile.reasonForConversion ?? this.about.reasonForConversion,
      oldReligion: profile.oldReligion ?? this.about.oldReligion,
      bio: profile.bio ?? this.about.bio,
      name: name,
      gender: profile.gender ?? this.about.gender,
      dateOfBirth: profile.dateOfBirth ?? this.about.dateOfBirth,
      dateOfIslamConversion: profile.dateOfIslamConversion ?? this.about.dateOfIslamConversion,
      age: age ?? this.about.age,
      languages: languages,
      languagesSpeaks: languagesSpeaks,
      city: profile.address ?? this.about.city,
      country: profile.country ?? this.about.country,
      countryCode: profile.countryCode ?? this.about.countryCode,
      phoneNumber: profile.phoneNumber ?? this.about.phoneNumber,
      email: profile.email ?? this.about.email,
      profileImage: nextProfileImage,
    };
  }

  private preferNonEmptyString(value: string | undefined, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  /**
   * Check if an array is LanguageDetail[] (has name property)
   */
  private isLanguageDetailArray(arr: unknown[]): boolean {
    return arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && 'name' in arr[0];
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth?: string): number | null {
    if (!dateOfBirth) return null;

    const dob = new Date(dateOfBirth);
    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
  }

  private getReligionLabel(religiousStatus?: number): string {
    switch (religiousStatus) {
      case ReligiousStatus.NonMuslim:
        return religiousStatusLabels[ReligiousStatus.NonMuslim];
      case ReligiousStatus.BornMuslim:
        return religiousStatusLabels[ReligiousStatus.BornMuslim];
      case ReligiousStatus.RevertedMuslim:
        return religiousStatusLabels[ReligiousStatus.RevertedMuslim];
      default:
        return '';
    }
  }

  editMainInfo(): void {
    this.isEditingMain = true;
    this.clearMessages();
  }

  editPersonalInfo(): void {
    this.isEditingPersonal = true;
    this.clearMessages();
  }

  editContactInfo(): void {
    this.isEditingContact = true;
    this.clearMessages();
  }

  saveMainInfo(data: {
    religion: string;
    reasonOfReligion?: string;
    reasonForConversion?: string;
    oldReligion?: string;
    dateOfIslamConversion?: string;
    bio: string;
  }): void {
    this.about.religion = data.religion;
    this.about.reasonOfReligion = data.reasonOfReligion ?? '';
    this.about.reasonForConversion = data.reasonForConversion ?? '';
    this.about.oldReligion = data.oldReligion ?? '';
    this.about.dateOfIslamConversion = data.dateOfIslamConversion ?? '';
    this.about.bio = data.bio;

    this.isLoading = true;
    this.clearMessages();

    const religionStatus = this.getReligionStatusValue(data.religion);

    const payload: UpdateStudentProfileRequest = {
      bio: data.bio,
      religionStatus,
      oldReligion: data.oldReligion,
      reasonOfReligion: data.reasonOfReligion,
      reasonForConversion: data.reasonForConversion,
      dateOfIslamConversion: data.dateOfIslamConversion,
    };

    this.executeProfileSave(payload, () => {
      this.isEditingMain = false;
    });
  }

  private getReligionStatusValue(religion: string): ReligiousStatus | undefined {
    switch (religion) {
      case religiousStatusLabels[ReligiousStatus.NonMuslim]:
        return ReligiousStatus.NonMuslim;
      case religiousStatusLabels[ReligiousStatus.BornMuslim]:
        return ReligiousStatus.BornMuslim;
      case religiousStatusLabels[ReligiousStatus.RevertedMuslim]:
        return ReligiousStatus.RevertedMuslim;
      default:
        return undefined;
    }
  }

  savePersonalInfo(data: {
    name: string;
    gender: string;
    dateOfBirth: string;
    languages: Language[];
  }): void {
    this.about.name = data.name;
    this.about.gender = data.gender;
    this.about.dateOfBirth = data.dateOfBirth;
    // Store the language IDs in case the API response doesn't include them
    this.lastSentLanguageIds = data.languages;
    // Update display with language names from enum labels (will be replaced by API response)
    this.about.languagesSpeaks = data.languages.map((langId) => languageLabels[langId]).join(', ');

    this.isLoading = true;
    this.clearMessages();

    const [firstName, ...lastNameParts] = data.name.trim().split(/\s+/).filter(Boolean);
    const lastName = lastNameParts.join(' ');

    const payload: UpdateStudentProfileRequest = {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      languages: data.languages,
    };

    this.executeProfileSave(payload, () => {
      this.isEditingPersonal = false;
    });
  }

  saveContactInfo(data: { city: string; country?: string; countryCode?: string; phoneNumber: string; email: string }): void {
    const providedCountryCode = data.countryCode?.trim() ?? '';
    const normalizedCountryCode = this.normalizeCountryCode(data.countryCode);
    const normalizedDialCode = this.normalizeDialCode(data.countryCode);
    const normalizedPhoneNumber = this.normalizePhoneNumber(data.phoneNumber, normalizedDialCode);

    this.clearMessages();

    if (providedCountryCode.length > 0 && !normalizedCountryCode && !normalizedDialCode) {
      this.error = 'Country code must be 2-3 letters (EG/USA) or a dial code like +20.';
      return;
    }

    this.about.city = data.city;
    this.about.country = data.country || '';
    this.about.countryCode = normalizedDialCode || normalizedCountryCode || '';
    this.about.phoneNumber = normalizedPhoneNumber;
    this.about.email = data.email;

    this.isLoading = true;

    const payload: UpdateStudentProfileRequest = {
      address: data.city,
      country: data.country,
      countryCode: normalizedDialCode || normalizedCountryCode,
      phoneNumber: normalizedPhoneNumber,
    };

    this.executeProfileSave(payload, () => {
      this.isEditingContact = false;
    });
  }

  private normalizeCountryCode(countryCode?: string): string | undefined {
    if (!countryCode) {
      return undefined;
    }

    const normalized = countryCode.trim().toUpperCase();
    return /^[A-Z]{2,3}$/.test(normalized) ? normalized : undefined;
  }

  private normalizeDialCode(countryCode?: string): string | undefined {
    if (!countryCode) {
      return undefined;
    }

    const normalized = countryCode.trim();
    return /^\+[0-9]{1,4}$/.test(normalized) ? normalized : undefined;
  }

  private normalizePhoneNumber(phoneNumber: string, dialCode?: string): string {
    const trimmedPhoneNumber = phoneNumber.trim();
    if (!dialCode || trimmedPhoneNumber.startsWith('+')) {
      return trimmedPhoneNumber;
    }

    return `${dialCode} ${trimmedPhoneNumber}`;
  }

  /**
   * Execute profile save operation with proper error handling
   */
  private executeProfileSave(
    payload: UpdateStudentProfileRequest,
    onSuccess: () => void
  ): void {
    this.studentFacade.updateProfile(payload).pipe(
      takeUntil(this.destroy$),
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: (profile) => {
        if (profile) {
          this.mapProfileToModel(profile);
        }
        onSuccess();
        this.successMessage = 'Profile updated successfully!';
        this.autoClearSuccessMessage();
      },
      error: (err: ProfileError) => {
        this.error = this.getErrorMessage(err);
      },
    });
  }

  private formatLanguages(languages?: LanguageDetail[] | unknown[]): string {
    if (!languages || languages.length === 0) {
      return '';
    }
    // Handle both LanguageDetail objects and raw IDs
    return languages
      .map((lang) => {
        if (typeof lang === 'object' && lang !== null && 'name' in lang) {
          return (lang as LanguageDetail).name;
        }
        // Fallback: treat as ID and look up in enum labels
        return languageLabels[lang as Language] || '';
      })
      .filter((name) => name.length > 0)
      .join(', ');
  }

  cancelMainEdit(): void {
    this.isEditingMain = false;
    this.clearMessages();
  }

  cancelPersonalEdit(): void {
    this.isEditingPersonal = false;
    this.clearMessages();
  }

  cancelContactEdit(): void {
    this.isEditingContact = false;
    this.clearMessages();
  }

  /**
   * Clear error and success messages
   */
  clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }

  /**
   * Auto-clear success message after 3 seconds
   */
  private autoClearSuccessMessage(): void {
    if (!this.isBrowser) {
      return;
    }

    globalThis.setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  /**
   * Get user-friendly error message based on error type
   */
  private getErrorMessage(error: ProfileError): string {
    switch (error.type) {
      case 'validation':
        if (error.details) {
          const detailMessages = Object.entries(error.details)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');
          return `Validation failed: ${detailMessages}`;
        }
        return error.message || 'Please check your input and try again.';

      case 'unauthorized':
        return 'Your session has expired. Please log in again.';

      case 'not_found':
        return 'Profile not found. Please create your profile.';

      case 'rate_limit':
        return 'Too many requests. Please wait a moment and try again.';

      case 'server':
        return 'Server error. Please try again later.';

      case 'network':
        return 'Network error. Please check your connection and try again.';

      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

}
