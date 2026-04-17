import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
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
import { asRecord, getValue, toBooleanValue, toStringValue } from '../../core/helpers/api-response.helper';
import { toApiMediaUrl } from '../../core/helpers/media-url.helper';
import { religiousStatusLabels } from '../../core/helpers/enum-labels.helper';
import { ReligiousStatus } from '../../core/models/interfaces/enums.model';
import type { AboutProfileHeaderUpdate } from './about/about.component';

interface UserProfile {
  name: string;
  bio: string;
  imageUrl: string;
  gender: string;
  religion: string;
}

interface UpcomingEvent {
  id: string;
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly academyProgressService = inject(AcademyProgressService);
  private readonly studentFacade = inject(StudentFacade);
  private readonly eventsService = inject(EventsService);
  private readonly destroy$ = new Subject<void>();

  // Only show tabs that have backend API support
  // 'Saved Answers' and 'Chat List' hidden until backend implementation
  tabs = ['About', 'My Learning', 'My Inquiries'];
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
  isAvatarOptionsOpen = false;
  isAvatarPreviewOpen = false;

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

  onAboutProfileUpdated(update: AboutProfileHeaderUpdate): void {
    const nextName = this.toNonEmptyString(update.name) ?? this.userProfile.name;
    const nextBio = this.toNonEmptyString(update.bio) ?? this.userProfile.bio;
    const nextGender = this.toNonEmptyString(update.gender) ?? this.userProfile.gender;
    const nextReligion = this.toNonEmptyString(update.religion) ?? this.userProfile.religion;
    const normalizedUpdatedImageUrl = this.normalizeImageUrl(update.imageUrl);
    const nextImageUrl = normalizedUpdatedImageUrl || this.userProfile.imageUrl;

    this.userProfile = {
      ...this.userProfile,
      name: nextName,
      bio: nextBio,
      gender: nextGender,
      religion: nextReligion,
      imageUrl: nextImageUrl,
    };

    this.authService.updateCurrentUserImageUrl(nextImageUrl);
    this.cdr.detectChanges();
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
    if (!this.upcomingEvent?.id) {
      void this.router.navigate(['/events']);
      return;
    }

    void this.router.navigate(['/events', this.upcomingEvent.id]);
  }

  handleRegisterNowClick(): void {
    if (!this.upcomingEvent || this.upcomingEvent.isRegistered) {
      return;
    }

    this.viewEventDetails();
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

  openAvatarOptionsModal(): void {
    if (this.isUploadingAvatar) {
      return;
    }

    this.isAvatarPreviewOpen = false;
    this.isAvatarOptionsOpen = true;
  }

  closeAvatarOptionsModal(): void {
    this.isAvatarOptionsOpen = false;
  }

  viewAvatarPicture(): void {
    this.isAvatarOptionsOpen = false;
    this.isAvatarPreviewOpen = true;
  }

  closeAvatarPreviewModal(): void {
    this.isAvatarPreviewOpen = false;
  }

  startAvatarUpdate(): void {
    if (this.isUploadingAvatar) {
      return;
    }

    this.isAvatarOptionsOpen = false;
    this.isAvatarPreviewOpen = false;
    this.openAvatarFilePicker();
  }

  deleteAvatarPicture(): void {
    if (this.isUploadingAvatar || !this.userProfile.imageUrl) {
      return;
    }

    this.isAvatarOptionsOpen = false;
    this.isAvatarPreviewOpen = false;
    this.isUploadingAvatar = true;

    this.studentFacade.updateProfile({ imageUrl: "" }).pipe(take(1)).subscribe({
      next: (profile) => {
        this.queueAvatarImageUpdate(profile?.imageUrl ?? null);
      },
      error: () => {
        this.finishAvatarOperation();
      },
      complete: () => {
        this.finishAvatarOperation();
      },
    });
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
        this.queueAvatarImageUpdate(result?.imageUrl ?? null, true);
      },
      error: () => {
        this.finishAvatarOperation(target);
      },
      complete: () => {
        this.finishAvatarOperation(target);
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
          globalThis.setTimeout(() => {
            if (!this.destroy$.closed) {
              this.updateUserProfile(profile);
              this.cdr.detectChanges();
            }
          }, 0);
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
    const normalizedImageUrl = this.normalizeImageUrl(profile.imageUrl);
    const nextImageUrl = normalizedImageUrl || this.userProfile.imageUrl;
    const nextReligion =
      this.getReligionLabel(profile.religiousStatus) ??
      this.toNonEmptyString(profile.oldReligion) ??
      this.userProfile.religion;
    const nextBio = this.toNonEmptyString(profile.bio) ?? this.userProfile.bio;
    const nextGender = this.toNonEmptyString(profile.gender) ?? this.userProfile.gender;

    this.userProfile = {
      name: fullName ?? this.userProfile.name,
      bio: nextBio,
      imageUrl: nextImageUrl,
      gender: nextGender,
      religion: nextReligion,
    };

    this.authService.updateCurrentUserImageUrl(nextImageUrl);
    this.cdr.detectChanges();
  }

  private toNonEmptyString(value: string | null | undefined): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private getReligionLabel(religiousStatus?: number): string | null {
    switch (religiousStatus) {
      case ReligiousStatus.NonMuslim:
        return religiousStatusLabels[ReligiousStatus.NonMuslim];
      case ReligiousStatus.BornMuslim:
        return religiousStatusLabels[ReligiousStatus.BornMuslim];
      case ReligiousStatus.RevertedMuslim:
        return religiousStatusLabels[ReligiousStatus.RevertedMuslim];
      default:
        return null;
    }
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

  private applyAvatarImage(imageUrl?: string | null, appendCacheBuster = false): void {
    const nextImageUrl = this.normalizeImageUrl(imageUrl, appendCacheBuster);

    this.userProfile = {
      ...this.userProfile,
      imageUrl: nextImageUrl,
    };

    this.authService.updateCurrentUserImageUrl(nextImageUrl);
    this.cdr.detectChanges();
  }

  private queueAvatarImageUpdate(imageUrl?: string | null, appendCacheBuster = false): void {
    globalThis.setTimeout(() => {
      if (!this.destroy$.closed) {
        this.applyAvatarImage(imageUrl, appendCacheBuster);
      }
    }, 0);
  }

  private finishAvatarOperation(target?: HTMLInputElement | null): void {
    globalThis.setTimeout(() => {
      this.isUploadingAvatar = false;

      if (target) {
        target.value = '';
      }

      this.cdr.detectChanges();
    }, 0);
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.isAvatarPreviewOpen) {
      this.closeAvatarPreviewModal();
      return;
    }

    if (this.isAvatarOptionsOpen) {
      this.closeAvatarOptionsModal();
    }
  }

  private loadUpcomingEvent(): void {
    this.upcomingEvent = null;

    this.eventsService.getNext().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        globalThis.setTimeout(() => {
          if (this.destroy$.closed) {
            return;
          }

          const responseRecord = asRecord(response);
          const dataRecord = asRecord(getValue(responseRecord, 'data', 'Data'));

          if (!dataRecord || !toBooleanValue(getValue(dataRecord, 'isPublished', 'IsPublished'))) {
            this.upcomingEvent = null;
            this.cdr.detectChanges();
            return;
          }

          const id = toStringValue(getValue(dataRecord, 'id', 'Id'));
          const title = toStringValue(getValue(dataRecord, 'title', 'Title'));
          const speaker = toStringValue(getValue(dataRecord, 'speakerName', 'SpeakerName'));
          const startDate = toStringValue(getValue(dataRecord, 'startDateTime', 'StartDateTime'));
          const speakerImage =
            toApiMediaUrl(toStringValue(getValue(dataRecord, 'imageUrl', 'ImageUrl'))) ??
            '/images/profile-picture-navbar.png';
          const isRegistered = toBooleanValue(getValue(dataRecord, 'isRegistered', 'IsRegistered'));

          // Only create event if we have valid data from API
          if (id && (title || speaker || startDate)) {
            this.upcomingEvent = {
              id,
              title: title ?? '',
              speaker: speaker ?? '',
              date: this.formatDate(startDate) ?? '',
              time: this.formatTime(startDate) ?? '',
              speakerRole: 'Guest Speaker',
              speakerImage: speakerImage,
              isRegistered,
            };
          } else {
            this.upcomingEvent = null;
          }

          this.cdr.detectChanges();
        }, 0);
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

  private formatTime(dateInput: string | null): string | null {
    if (!dateInput) {
      return null;
    }

    const parsed = new Date(dateInput);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}
