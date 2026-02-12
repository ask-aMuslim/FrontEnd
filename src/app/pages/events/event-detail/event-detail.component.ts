import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../event.service';
import { ProfilePopupComponent } from './profile-popup/profile-popup.component';
import { SharePopupComponent } from './share-popup/share-popup.component';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';

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
  isRecorded: boolean;
  registrationDeadline?: string;
  maxAttendees?: number;
  currentAttendees?: number;
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.loadEventData();
  }

  loadEventData(): void {
    const selectedCard = this.eventService.getSelectedEvent();
    if (selectedCard) {
      this.event = this.eventService.convertCardToDetail(selectedCard);
    } else {
      if (!this.eventId) {
        this.router.navigate(['/events']);
        return;
      }

      this.eventService.getEventById(this.eventId).subscribe({
        next: (event) => {
          if (event) {
            this.event = event;
          } else {
            this.router.navigate(['/events']);
          }
        },
        error: () => this.router.navigate(['/events']),
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }

  registerForEvent(): void {
    this.showProfilePopup = true;
  }

  shareEvent(): void {
    this.showSharePopup = true;
  }

  openSharePopup(): void {
    this.shareEvent();
  }

  submitQuestion(): void {
    const trimmed = this.questionText.trim();
    if (!trimmed) {
      return;
    }

    // TODO: Replace with API call when backend endpoint is ready.
    this.questionText = '';
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
