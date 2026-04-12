import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { InlineSvgDirective } from '../../shared/directives/inline-svg.directive';
import { MyLearningComponent } from './my-learning/my-learning.component';
import { AboutComponent } from './about/about.component';
import { MyInquiriesComponent } from './my-inquiries/my-inquiries.component';
import { AcademyProgressService } from '../../core/services/academy-progress.service';
import { StudentFacade } from '../../api/facades/student.facade';
import { AuthService } from '../../core/services/auth.service';
import type { StudentProfile } from '../../api/facades/student.facade';
import { EventsService } from '../../core/services/events.service';
import { asRecord, extractArray, getValue, toStringValue } from '../../core/helpers/api-response.helper';
import { toApiMediaUrl } from '../../core/helpers/media-url.helper';

interface UserProfile {
  name: string;
  bio: string;
  imageUrl: string;
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
    AboutComponent,
    MyInquiriesComponent,
  ],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
})
export class AccountComponent implements OnInit, OnDestroy {
  @ViewChild('avatarFileInput') avatarFileInput?: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly academyProgressService = inject(AcademyProgressService);
  private readonly studentFacade = inject(StudentFacade);
  private readonly eventsService = inject(EventsService);
  private readonly destroy$ = new Subject<void>();

  // Only show tabs that have backend API support
  // 'Saved Answers' and 'Chat List' hidden until backend implementation
  tabs = ['My Learning', 'About', 'My Inquiries'];
  activeTabIndex = 0;

  userProfile: UserProfile = {
    name: '',
    bio: '',
    imageUrl: '',
    gender: '',
    religion: '',
  };

  currentVerse: Verse = {
    text: '',
    textEnglish: '',
    sura: '',
    aya: '',
  };

  upcomingEvent: UpcomingEvent | null = null;
  isUploadingAvatar = false;

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
    if (this.upcomingEvent) {
      this.upcomingEvent.isRegistered = !this.upcomingEvent.isRegistered;
    }
  }

  openAvatarFilePicker(): void {
    if (this.isUploadingAvatar) {
      return;
    }

    this.avatarFileInput?.nativeElement.click();
  }

  onAvatarFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const file = target?.files?.[0];

    if (!file) {
      return;
    }

    this.isUploadingAvatar = true;

    this.studentFacade.updateProfilePicture(file).pipe(take(1)).subscribe({
      next: (result) => {
        if (result?.imageUrl) {
          this.userProfile = {
            ...this.userProfile,
            imageUrl: this.normalizeImageUrl(result.imageUrl, true),
          };
        }
      },
      error: () => {
        this.isUploadingAvatar = false;
        if (target) {
          target.value = '';
        }
      },
      complete: () => {
        this.isUploadingAvatar = false;

        if (target) {
          target.value = '';
        }
      },
    });
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

  private loadProfile(): void {
    this.studentFacade.me().pipe(takeUntil(this.destroy$)).subscribe({
      next: (profile) => {
        if (profile) {
          this.updateUserProfile(profile);
        }
      },
      error: () => void 0,
    });
  }

  /**
   * Update user profile from API response - all data comes from API
   */
  private updateUserProfile(profile: StudentProfile): void {
    const fullName = this.buildDisplayName(profile.firstName, profile.lastName);

    this.userProfile = {
      name: fullName ?? '',
      bio: profile.bio ?? '',
      imageUrl: this.normalizeImageUrl(profile.imageUrl),
      gender: profile.gender ?? '',
      religion: profile.oldReligion ?? '',
    };
  }

  private normalizeImageUrl(imageUrl?: string | null, appendCacheBuster = false): string {
    const normalized = toApiMediaUrl(toStringValue(imageUrl ?? null));
    if (!normalized) {
      return '';
    }

    if (!appendCacheBuster) {
      return normalized;
    }

    const separator = normalized.includes('?') ? '&' : '?';
    return `${normalized}${separator}t=${Date.now()}`;
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
        const speakerImage = toApiMediaUrl(toStringValue(getValue(firstRecord, 'speakerImage', 'SpeakerImage'))) ?? '/images/profile-picture-navbar.png';
        const speakerRole = toStringValue(getValue(firstRecord, 'speakerRole', 'SpeakerRole')) ?? 'Guest Speaker';

        // Only create event if we have valid data from API
        if (title || speaker || startDate) {
          this.upcomingEvent = {
            title: title ?? '',
            speaker: speaker ?? '',
            date: this.formatDate(startDate) ?? '',
            time: '', // Not provided by API
            speakerRole: speakerRole,
            speakerImage: speakerImage,
            isRegistered: false, // Default state
          };
        }
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
