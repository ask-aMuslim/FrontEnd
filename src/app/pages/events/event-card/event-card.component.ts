import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService } from '../event.service';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';

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
  tags: string[];
  isRecorded?: boolean;
}

@Component({
  selector: 'app-event-card',
  imports: [CommonModule, InlineSvgDirective],
  templateUrl: './event-card.component.html',
  styleUrl: './event-card.component.scss',
})
export class EventCardComponent {
  @Input() event!: EventCard;

  constructor(private router: Router, private eventService: EventService) {}

  onCardClick(): void {
    this.eventService.setSelectedEvent(this.event);
    this.router.navigate(['/events', this.event.id]);
  }
}
