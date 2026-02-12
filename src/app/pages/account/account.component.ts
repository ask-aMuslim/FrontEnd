import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
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
  religion: string;
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
    InlineSvgDirective,
    MyLearningComponent,
    SavedAnswersComponent,
    ChatListComponent,
    AboutComponent,
  ],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit {
  private readonly router = inject(Router);
  tabs = ['My Learning', 'Saved Answers', 'Chat List', 'About'];
  activeTabIndex = 0;

  userProfile: UserProfile = {
    name: 'Maher Zain',
    bio: 'Bio',
    profileImage: '/images/profile-picture-navbar.png',
    gender: 'Male',
    religion: 'Muslim',
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

  ngOnInit(): void { }

  selectTab(index: number): void {
    this.activeTabIndex = index;
  }

  continueLearnig(): void {
    this.router.navigate(['/academy/course', 'course-a', 'lesson', 'lesson-1']);
  }

  viewEventDetails(): void {
    this.router.navigate(['/events']);
  }

  toggleEventRegistration(): void {
    this.upcomingEvent.isRegistered = !this.upcomingEvent.isRegistered;
  }
}
