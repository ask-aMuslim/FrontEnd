import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../event.service';
import { EventStatus } from '../event-status.enum';
import { getEventStatusBadgeState } from '../event-status.helper';
import { ProfilePopupComponent } from './profile-popup/profile-popup.component';
import { SharePopupComponent } from './share-popup/share-popup.component';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
import { StudentFacade } from '../../../api/facades/student.facade';
import {
  EventRegistrationsService,
  EventRegistrationMyStatusData,
  EventRegistrationStatus,
} from '../../../core/services/event-registrations.service';
import { take, filter } from 'rxjs';
import { SeoService } from '../../../core/services/seo.service';

export interface EventDetail {
  id: number | string;
  title: string;
  description: string;
  fullDescription: string;
  imageUrl: string;
  imageAlt: string;
  speakerName: string;
  speakerImage: string;
  speakerRole: string;
  speakerBio: string;
  date: string;
  time: string;
  location: string;
  tags: string[];
  status?: EventStatus;
  isRecorded: boolean;
  isPublished?: boolean;
  registrationDeadline?: string;
  maxAttendees?: number;
  currentAttendees?: number;
  meetingLink?: string | null;
  agenda?: string[];
  outcomes?: string[];
}

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfilePopupComponent, SharePopupComponent, InlineSvgDirective],
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit {
  event: EventDetail | null = null;
  eventId: string | null = null;
  showProfilePopup = false;
  showSharePopup = false;
  questionText = '';
  existingQuestionText = '';
  isRegistered = false;
  eventRegistrationId: string | null = null;
  registrationStatus: EventRegistrationStatus | null = null;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly document = inject(DOCUMENT);
  private readonly studentFacade = inject(StudentFacade);
  private readonly eventRegistrationsService = inject(EventRegistrationsService);
  private readonly seoService = inject(SeoService);

  get statusVariant(): 'upcoming' | 'live' | 'finished' {
    return getEventStatusBadgeState(
      'detail',
      this.event?.status,
      this.event?.isRecorded === true,
    ).variant;
  }

  get isFinished(): boolean {
    return getEventStatusBadgeState(
      'detail',
      this.event?.status,
      this.event?.isRecorded === true,
    ).isFinished;
  }

  get isLive(): boolean {
    return getEventStatusBadgeState(
      'detail',
      this.event?.status,
      this.event?.isRecorded === true,
    ).isLive;
  }

  get statusBadgeText(): string {
    return getEventStatusBadgeState(
      'detail',
      this.event?.status,
      this.event?.isRecorded === true,
    ).text;
  }

  get registrationButtonLabel(): string {
    if (this.isRegistered) {
      return 'You Are Already Registered';
    }

    return this.isLive ? 'Join Live Event' : 'Register Now';
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.loadEventData();

    if (this.eventId) {
      this.loadMyRegistrationStatus(this.eventId);
    }
  }

  loadEventData(): void {
    if (!this.eventId) {
      void this.router.navigate(['/events']);
      return;
    }

    const fallbackEvent = this.eventService.getSelectedEventById(this.eventId);
    if (fallbackEvent) {
      this.event = fallbackEvent;
      this.updateSeoTags(fallbackEvent);
      this.cdr.detectChanges();
    }

    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        if (event) {
          this.event = event;
          this.updateSeoTags(event);
          this.cdr.detectChanges();
          return;
        }

        if (!fallbackEvent) {
          void this.router.navigate(['/events']);
        }
      },
      error: () => {
        if (!fallbackEvent) {
          void this.router.navigate(['/events']);
        }
      },
    });
  }

  private updateSeoTags(event: EventDetail): void {
    this.seoService.setMetaTags({
      title: event.title,
      description: event.description || event.fullDescription,
      keywords: ['Islamic Event', event.title, event.speakerName, 'Lecture', 'Seminar'],
      ogImage: event.imageUrl,
    });
  }

  goBack(): void {
    void this.router.navigate(['/events']);
  }

  isSeparatorVisible(event: EventDetail | null): boolean {
    return !!(event?.agenda && event.agenda.length > 0);
  }

  registerForEvent(): void {
    if (!this.eventId) {
      return;
    }

    if (this.isRegistered) {
      return;
    }

    this.studentFacade
      .getMyProfile()
      .pipe(
        filter((profile) => profile !== null),
        take(1)
      )
      .subscribe({
        next: (profile) => {
          // If the email is already added in the profile, bypass the profile completion modal and register directly
          if (profile?.email && profile.email.trim()) {
            this.createEventRegistration(this.eventId as string);
            return;
          }

          if (profile?.isProfileCompleted === false) {
            this.showProfilePopup = true;
            return;
          }

          this.createEventRegistration(this.eventId as string);
        },
        error: () => {
          this.showProfilePopup = true;
        },
      });
  }

  joinLiveEvent(): void {
    const meetingLink = this.event?.meetingLink?.trim();
    if (!meetingLink || !this.isRegistered) {
      return;
    }

    this.document.defaultView?.open(meetingLink, '_blank', 'noopener,noreferrer');
  }

  private createEventRegistration(eventId: string): void {
    this.eventRegistrationsService
      .create({ eventId })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.loadMyRegistrationStatus(eventId);
          this.cdr.detectChanges();
        },
        error: () => {
          this.cdr.detectChanges();
        },
      });
  }

  private loadMyRegistrationStatus(eventId: string): void {
    this.eventRegistrationsService
      .getMyStatus(eventId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.isRegistered = response.data?.isRegistered === true;
          this.registrationStatus = response.data?.eventRegistrationStatus ?? null;
          this.existingQuestionText = response.data?.questionText?.trim() ?? '';
          this.questionText = '';
          this.eventRegistrationId = this.resolveEventRegistrationId(response.data);
          this.cdr.detectChanges();
        },
        error: () => {
          this.isRegistered = false;
          this.eventRegistrationId = null;
          this.registrationStatus = null;
          this.existingQuestionText = '';
          this.questionText = '';
          this.cdr.detectChanges();
        },
      });
  }

  shareEvent(): void {
    this.showSharePopup = true;
  }

  openSharePopup(): void {
    this.shareEvent();
  }

  submitQuestion(): void {
    const trimmed = this.questionText.trim();
    if (!this.isRegistered || !trimmed || !this.eventRegistrationId) {
      return;
    }

    this.eventRegistrationsService
      .parkQuestion({
        eventRegistrationId: this.eventRegistrationId,
        questionText: trimmed,
      })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.existingQuestionText = trimmed;
          this.questionText = '';
          this.cdr.detectChanges();
        },
        error: () => {
          this.cdr.detectChanges();
        },
      });
  }

  private resolveEventRegistrationId(data: EventRegistrationMyStatusData | null): string | null {
    if (!data) {
      return null;
    }

    const candidates: unknown[] = [
      data.eventRegistrationId,
      (data as Partial<{ eventRegistrationID: unknown }>).eventRegistrationID,
      (data as Partial<{ registrationId: unknown }>).registrationId,
      (data as Partial<{ registrationID: unknown }>).registrationID,
      (data as Partial<{ eventRegistration: { id?: unknown } | null }>).eventRegistration?.id,
      (data as Partial<{ registration: { id?: unknown } | null }>).registration?.id,
      (data as Partial<{ id: unknown }>).id,
    ];

    for (const value of candidates) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }

    return null;
  }

  closeProfilePopup(): void {
    this.showProfilePopup = false;
  }

  closeSharePopup(): void {
    this.showSharePopup = false;
  }

  onShareConfirm(): void {
    this.closeSharePopup();
  }
}
