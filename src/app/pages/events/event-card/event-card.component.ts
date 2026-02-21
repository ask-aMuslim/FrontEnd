import { Component, Input } from '@angular/core';

import { Router } from '@angular/router';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
import { EventService } from '../event.service';

export interface EventCard {
  id: number | string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  speakerName: string;
  speakerImage: string;
  speakerRole: string;
  date: string;
  timeRange?: string;
  tags: string[];
  isRecorded?: boolean;
}

@Component({
  selector: 'app-event-card',
  imports: [InlineSvgDirective],
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent {
  private static readonly fallbackEventImage = '/images/events-picture.png';
  private static readonly fallbackSpeakerImage = '/images/profile-picture-navbar.png';

  @Input() event!: EventCard;

  constructor(
    private readonly router: Router,
    private readonly eventService: EventService,
  ) { }

  onCardClick(): void {
    this.eventService.setSelectedEvent(this.event);
    void this.router.navigate(['/events', this.event.id]);
  }

  onEventImageError(event: Event): void {
    this.setFallbackImage(event, EventCardComponent.fallbackEventImage);
  }

  onSpeakerImageError(event: Event): void {
    this.setFallbackImage(event, EventCardComponent.fallbackSpeakerImage);
  }

  private setFallbackImage(event: Event, fallbackSrc: string): void {
    const target = event.target;
    if (!(target instanceof HTMLImageElement) || target.src.endsWith(fallbackSrc)) {
      return;
    }

    target.src = fallbackSrc;
  }
}
