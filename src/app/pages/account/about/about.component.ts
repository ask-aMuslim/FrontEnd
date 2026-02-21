import { Component } from '@angular/core';

import { Router } from '@angular/router';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
import { EditMainInformationComponent } from './edit-main-information/edit-main-information.component';
import { EditPersonalInformationComponent } from './edit-personal-information/edit-personal-information.component';
import { EditContactInformationComponent } from './edit-contact-information/edit-contact-information.component';
import { AuthService } from '../../../core/services/auth.service';

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
export class AboutComponent {
  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
  ) { }

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

  editMainInfo() {
    this.isEditingMain = true;
  }

  editPersonalInfo() {
    this.isEditingPersonal = true;
  }

  editContactInfo() {
    this.isEditingContact = true;
  }

  saveMainInfo(data: { religion: string; reasonOfReligion: string; bio: string }) {
    this.about.religion = data.religion;
    this.about.reasonOfReligion = data.reasonOfReligion;
    this.about.bio = data.bio;
    this.isEditingMain = false;
  }

  savePersonalInfo(data: {
    name: string;
    gender: string;
    dateOfBirth: string;
    languagesSpeaks: string;
  }) {
    this.about.name = data.name;
    this.about.gender = data.gender;
    this.about.dateOfBirth = data.dateOfBirth;
    this.about.languagesSpeaks = data.languagesSpeaks;
    this.isEditingPersonal = false;
  }

  saveContactInfo(data: { city: string; phoneNumber: string; email: string }) {
    this.about.city = data.city;
    this.about.phoneNumber = data.phoneNumber;
    this.about.email = data.email;
    this.isEditingContact = false;
  }

  cancelMainEdit() {
    this.isEditingMain = false;
  }

  cancelPersonalEdit() {
    this.isEditingPersonal = false;
  }

  cancelContactEdit() {
    this.isEditingContact = false;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => void 0,
      error: () => {
        void this.router.navigate(['/login']);
      },
    });
  }
}
