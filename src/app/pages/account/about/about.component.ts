import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
import { EditMainInformationComponent } from './edit-main-information/edit-main-information.component';
import { EditPersonalInformationComponent } from './edit-personal-information/edit-personal-information.component';
import { EditContactInformationComponent } from './edit-contact-information/edit-contact-information.component';
import { AuthService } from '../../../core/services/auth.service';
import { StudentFacade } from '../../../api/facades/student.facade';
import type { StudentProfile, UpdateStudentProfileRequest } from '../../../api/facades/student.facade';
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
  bio: string;
  name: string;
  gender: string;
  dateOfBirth: string;
  age: number;
  languagesSpeaks: string;
  city: string;
  country: string;
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
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly studentFacade = inject(StudentFacade);
  private readonly destroy$ = new Subject<void>();

  about: AboutModel = {
    religion: '',
    reasonOfReligion: '',
    bio: '',
    name: '',
    gender: '',
    dateOfBirth: '',
    age: 0,
    languagesSpeaks: '',
    city: '',
    country: '',
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

  private currentProfile: StudentProfile | null = null;

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
      .me()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: (profile) => {
          this.currentProfile = profile;
          if (profile) {
            this.mapProfileToModel(profile);
          }
        },
        error: (err: ProfileError) => {
          console.error('Failed to load profile:', err);
          this.error = this.getErrorMessage(err);
        },
      });
  }

  /**
   * Map API profile data to the local view model
   * All data comes from the API - no static fallbacks
   */
  private mapProfileToModel(profile: StudentProfile): void {
    // Calculate age from date of birth
    const age = this.calculateAge(profile.dateOfBirth);

    // Build full name from API data
    const name = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(' ');

    this.about = {
      religion: profile.oldReligion ?? '',
      reasonOfReligion: profile.reasonForConversion ?? '',
      bio: profile.bio ?? '',
      name: name,
      gender: profile.gender ?? '',
      dateOfBirth: profile.dateOfBirth ?? '',
      age: age ?? 0,
      languagesSpeaks: '', // Not provided by API yet
      city: profile.address ?? '',
      country: profile.country ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      email: profile.email ?? '',
      profileImage: profile.imageUrl ?? '',
    };
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth?: string): number | null {
    if (!dateOfBirth) return null;

    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    return age;
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

  saveMainInfo(data: { religion: string; reasonOfReligion: string; bio: string }): void {
    this.about.religion = data.religion;
    this.about.reasonOfReligion = data.reasonOfReligion;
    this.about.bio = data.bio;

    this.isLoading = true;
    this.clearMessages();

    const [firstName, lastName] = this.about.name.split(' ');
    const payload: UpdateStudentProfileRequest = {
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      bio: data.bio,
      oldReligion: data.religion,
      reasonForConversion: data.reasonOfReligion,
    };

    this.executeProfileSave(payload, () => {
      this.isEditingMain = false;
    });
  }

  savePersonalInfo(data: {
    name: string;
    gender: string;
    dateOfBirth: string;
    languagesSpeaks: string;
  }): void {
    this.about.name = data.name;
    this.about.gender = data.gender;
    this.about.dateOfBirth = data.dateOfBirth;
    this.about.languagesSpeaks = data.languagesSpeaks;

    this.isLoading = true;
    this.clearMessages();

    const [firstName, lastName] = data.name.split(' ');
    const payload: UpdateStudentProfileRequest = {
      firstName: firstName ?? undefined,
      lastName: lastName ?? undefined,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
    };

    this.executeProfileSave(payload, () => {
      this.isEditingPersonal = false;
    });
  }

  saveContactInfo(data: { city: string; country?: string; phoneNumber: string; email: string }): void {
    this.about.city = data.city;
    this.about.country = data.country || '';
    this.about.phoneNumber = data.phoneNumber;
    this.about.email = data.email;

    this.isLoading = true;
    this.clearMessages();

    const payload: UpdateStudentProfileRequest = {
      address: data.city,
      country: data.country,
      phoneNumber: data.phoneNumber,
    };

    this.executeProfileSave(payload, () => {
      this.isEditingContact = false;
    });
  }

  /**
   * Execute profile save operation with proper error handling
   */
  private executeProfileSave(
    payload: UpdateStudentProfileRequest,
    onSuccess: () => void
  ): void {
    const op$ = this.currentProfile
      ? this.studentFacade.updateProfile(payload)
      : this.studentFacade.createProfile(payload);

    op$.pipe(
      takeUntil(this.destroy$),
      finalize(() => (this.isLoading = false))
    ).subscribe({
      next: (profile) => {
        if (profile) {
          this.currentProfile = profile;
          this.mapProfileToModel(profile);
        } else {
          // Server returns void, mark that a profile now exists
          this.currentProfile = this.currentProfile ?? {} as StudentProfile;
        }
        onSuccess();
        this.successMessage = 'Profile updated successfully!';
        this.autoClearSuccessMessage();
      },
      error: (err: ProfileError) => {
        console.error('Failed to save profile:', err);
        this.error = this.getErrorMessage(err);
      },
    });
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
    setTimeout(() => {
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

  logout(): void {
    this.studentFacade.clearCache();
    this.authService.logout().subscribe({
      next: () => void 0,
      error: () => {
        void this.router.navigate(['/login']);
      },
    });
  }
}
