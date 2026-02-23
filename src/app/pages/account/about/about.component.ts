import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
import { EditMainInformationComponent } from './edit-main-information/edit-main-information.component';
import { EditPersonalInformationComponent } from './edit-personal-information/edit-personal-information.component';
import { EditContactInformationComponent } from './edit-contact-information/edit-contact-information.component';
import { AuthService } from '../../../core/services/auth.service';
import { StudentFacade } from '../../../api/facades/student.facade';

@Component({
  selector: 'app-about',
  imports: [
    InlineSvgDirective,
    EditMainInformationComponent,
    EditPersonalInformationComponent,
    EditContactInformationComponent
  ],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly studentFacade = inject(StudentFacade);
  private readonly destroy$ = new Subject<void>();

  about = {
    religion: 'Islam',
    reasonOfReligion: 'Spiritual fulfillment and community connection.',
    bio: 'A passionate learner dedicated to understanding Islamic teachings and principles.',
    name: 'John Doe',
    gender: 'Male',
    dateOfBirth: '1990-01-01',
    age: 34,
    languagesSpeaks: 'English, Arabic',
    city: 'New York, USA',
    phoneNumber: '+1 234 567 890',
    email: 'example@email.com',
  };

  isEditingMain = false;
  isEditingPersonal = false;
  isEditingContact = false;
  isLoading = false;
  error: string | null = null;

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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          if (profile) {
            this.about = {
              ...this.about,
              name: profile.firstName && profile.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : this.about.name,
              bio: profile.bio ?? this.about.bio,
              gender: profile.gender ?? this.about.gender,
              dateOfBirth: profile.dateOfBirth ?? this.about.dateOfBirth,
              phoneNumber: profile.phoneNumber ?? this.about.phoneNumber,
              city: profile.address ?? this.about.city,
              email: profile.email ?? this.about.email,
            };
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load profile:', err);
          this.error = 'Failed to load profile information';
          this.isLoading = false;
        },
      });
  }
  editMainInfo(): void {
    this.isEditingMain = true;
  }

  editPersonalInfo(): void {
    this.isEditingPersonal = true;
  }

  editContactInfo(): void {
    this.isEditingContact = true;
  }

  saveMainInfo(data: { religion: string; reasonOfReligion: string; bio: string }): void {
    this.about.religion = data.religion;
    this.about.reasonOfReligion = data.reasonOfReligion;
    this.about.bio = data.bio;

    // Update via API
    this.isLoading = true;
    const [firstName, lastName] = this.about.name.split(' ');
    this.studentFacade
      .updateProfile({
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        bio: data.bio,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isEditingMain = false;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to save main info:', err);
          this.error = 'Failed to save main information';
          this.isLoading = false;
        },
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

    // Update via API
    this.isLoading = true;
    const [firstName, lastName] = data.name.split(' ');
    this.studentFacade
      .updateProfile({
        firstName: firstName ?? undefined,
        lastName: lastName ?? undefined,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isEditingPersonal = false;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to save personal info:', err);
          this.error = 'Failed to save personal information';
          this.isLoading = false;
        },
      });
  }

  saveContactInfo(data: { city: string; phoneNumber: string; email: string }): void {
    this.about.city = data.city;
    this.about.phoneNumber = data.phoneNumber;
    this.about.email = data.email;

    // Update via API
    this.isLoading = true;
    this.studentFacade
      .updateProfile({
        address: data.city,
        phoneNumber: data.phoneNumber,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isEditingContact = false;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to save contact info:', err);
          this.error = 'Failed to save contact information';
          this.isLoading = false;
        },
      });
  }

  cancelMainEdit(): void {
    this.isEditingMain = false;
  }

  cancelPersonalEdit(): void {
    this.isEditingPersonal = false;
  }

  cancelContactEdit(): void {
    this.isEditingContact = false;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => void 0,
      error: () => {
        void this.router.navigate(['/login']);
      },
    });
  }
}