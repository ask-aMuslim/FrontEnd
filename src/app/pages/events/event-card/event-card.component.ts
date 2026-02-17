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
  @Input() event!: EventCard;

  constructor(
    private readonly router: Router,
    private readonly eventService: EventService,
  ) { }

  onCardClick(): void {
    this.eventService.setSelectedEvent(this.event);
    void this.router.navigate(['/events', this.event.id]);
  }
}
