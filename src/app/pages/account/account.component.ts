import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSvgDirective } from '../../shared/directives/inline-svg.directive';
import { MyLearningComponent } from './my-learning/my-learning.component';
import { SavedAnswersComponent } from './saved-answers/saved-answers.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { AboutComponent } from './about/about.component';

interface UserProfile {
  name: string;
  bio: string;
  profileImage: string;
  gender: string;
}

interface UpcomingEvent {
  title: string;
  date: string;
  time: string;
  speaker: string;
  speakerRole: string;
  speakerImage: string;
  isRegistered: boolean;
}

interface Verse {
  text: string;
  textEnglish: string;
  sura: string;
  aya: string;
}

@Component({
  selector: 'app-account',
  imports: [
    CommonModule,
    InlineSvgDirective,
    MyLearningComponent,
    SavedAnswersComponent,
    ChatListComponent,
    AboutComponent,
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent implements OnInit {
  tabs = ['My Learning', 'Saved Answers', 'Chat List', 'About'];
  activeTabIndex = 0;

  userProfile: UserProfile = {
    name: 'Maher Zain',
    bio: 'Bio',
    profileImage: '/images/profile-picture-navbar.png',
    gender: 'Muslim',
  };

  currentVerse: Verse = {
    text: 'قُل لَّن يُصِيبَنَا إِلَّا مَا كَتَبَ اللَّهُ لَنَا هُوَ مَوْلَانَا ۚ وَعَلَى اللَّهِ فَلْيَتَوَكَّلِ الْمُؤْمِنُونَ',
    textEnglish:
      'Say, "Nothing will happen to us, except what Allah has destined for us. He is our Protector. So in Allah, let the believers trust."',
    sura: 'At-Tawba',
    aya: '51',
  };

  upcomingEvent: UpcomingEvent = {
    title: 'Islam Is A Peaceful Religion',
    date: '20 October, 2025',
    time: '2:00 pm',
    speaker: 'Sheikh Uthman Farooq',
    speakerRole: 'Islamic Scholar',
    speakerImage: '/images/profile-picture-navbar.png',
    isRegistered: true,
  };

  ngOnInit(): void {}

  selectTab(index: number): void {
    this.activeTabIndex = index;
  }

  continueLearnig(): void {
    console.log('Continue learning clicked');
  }

  viewEventDetails(): void {
    console.log('View event details:', this.upcomingEvent);
  }

  toggleEventRegistration(): void {
    this.upcomingEvent.isRegistered = !this.upcomingEvent.isRegistered;
  }
}
