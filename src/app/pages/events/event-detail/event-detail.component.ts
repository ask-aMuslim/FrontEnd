import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../event.service';
import { ProfilePopupComponent } from './profile-popup/profile-popup.component';
import { SharePopupComponent } from './share-popup/share-popup.component';
import { InlineSVGModule } from 'ng-inline-svg';

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
  imports: [CommonModule, ProfilePopupComponent, SharePopupComponent, InlineSVGModule],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss',
})
export class EventDetailComponent implements OnInit {
  event: EventDetail | null = null;
  eventId: string | null = null;
  showProfilePopup = false;
  showSharePopup = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.loadEventData();
  }

  loadEventData(): void {
    const selectedCard = this.eventService.getSelectedEvent();
    if (selectedCard) {
      this.event = this.eventService.convertCardToDetail(selectedCard);
    } else {
      // No event selected, redirect back to events list
      this.router.navigate(['/events']);
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

  closeProfilePopup(): void {
    this.showProfilePopup = false;
  }

  closeSharePopup(): void {
    this.showSharePopup = false;
  }

  onShareConfirm(): void {
    // TODO: Implement actual share functionality
    console.log('Sharing event:', this.eventId);
  }
}
