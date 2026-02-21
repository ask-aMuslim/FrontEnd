import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { InlineSvgDirective } from '../../shared/directives/inline-svg.directive';
import { MyLearningComponent } from './my-learning/my-learning.component';
import { SavedAnswersComponent } from './saved-answers/saved-answers.component';
import { ChatListComponent } from './chat-list/chat-list.component';
import { AboutComponent } from './about/about.component';
import { AcademyProgressService } from '../../core/services/academy-progress.service';
import { StudentFacade } from '../../api/facades/student.facade';
import { EventsService } from '../../core/services/events.service';
import { asRecord, extractArray, getValue, toStringValue } from '../../core/helpers/api-response.helper';

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
export class AccountComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly academyProgressService = inject(AcademyProgressService);
  private readonly studentFacade = inject(StudentFacade);
  private readonly eventsService = inject(EventsService);
  private readonly destroy$ = new Subject<void>();
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

  ngOnInit(): void {
    this.loadProfile();
    this.loadUpcomingEvent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTab(index: number): void {
    this.activeTabIndex = index;
  }

  continueLearnig(): void {
    this.academyProgressService
      .getRecentLesson()
      .pipe(take(1))
      .subscribe((recentLesson) => {
        if (recentLesson) {
          void this.router.navigate([
            '/academy/course',
            recentLesson.courseId,
            'lesson',
            recentLesson.lessonId,
          ]);
          return;
        }

        void this.router.navigate(['/academy']);
      });
  }

  viewEventDetails(): void {
    this.router.navigate(['/events']);
  }

  toggleEventRegistration(): void {
    this.upcomingEvent.isRegistered = !this.upcomingEvent.isRegistered;
  }

  private loadProfile(): void {
    this.studentFacade.me().pipe(takeUntil(this.destroy$)).subscribe({
      next: (profile) => {
        const fullName = this.buildDisplayName(profile?.firstName, profile?.lastName);
        const email = toStringValue(profile?.email);

        this.userProfile = {
          ...this.userProfile,
          name: fullName ?? this.userProfile.name,
          bio: email ? `Email: ${email}` : this.userProfile.bio,
        };
      },
      error: () => void 0,
    });
  }

  private loadUpcomingEvent(): void {
    this.eventsService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        const records = extractArray(response);
        const firstRecord = records.length > 0 ? asRecord(records[0]) : null;
        if (!firstRecord) {
          return;
        }

        const title = toStringValue(getValue(firstRecord, 'title', 'Title'));
        const speaker = toStringValue(getValue(firstRecord, 'speakerName', 'SpeakerName'));
        const startDate = toStringValue(getValue(firstRecord, 'startDateTime', 'StartDateTime'));

        this.upcomingEvent = {
          ...this.upcomingEvent,
          title: title ?? this.upcomingEvent.title,
          speaker: speaker ?? this.upcomingEvent.speaker,
          date: this.formatDate(startDate) ?? this.upcomingEvent.date,
        };
      },
      error: () => void 0,
    });
  }

  private buildDisplayName(firstName?: string, lastName?: string): string | null {
    const first = toStringValue(firstName ?? null);
    const last = toStringValue(lastName ?? null);
    const parts = [first, last].filter((part): part is string => !!part);
    return parts.length > 0 ? parts.join(' ') : null;
  }

  private formatDate(dateInput: string | null): string | null {
    if (!dateInput) {
      return null;
    }

    const parsed = new Date(dateInput);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }
}
