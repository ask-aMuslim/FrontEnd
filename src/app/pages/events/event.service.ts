import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import type { EventCard } from './event-card/event-card.component';
import type { EventDetail } from './event-detail/event-detail.component';
import { EventsService } from '../../core/services/events.service';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private selectedEventSubject = new BehaviorSubject<EventCard | null>(null);
  selectedEvent$ = this.selectedEventSubject.asObservable();

  constructor(private readonly eventsService: EventsService) { }

  setSelectedEvent(event: EventCard): void {
    this.selectedEventSubject.next(event);
  }

  getSelectedEvent(): EventCard | null {
    return this.selectedEventSubject.value;
  }

  convertCardToDetail(card: EventCard): EventDetail {
    return {
      id: card.id,
      title: card.title,
      description: card.description,
      fullDescription: `${card.description}\n\nJoin us for this enlightening session. This comprehensive event will cover various aspects of Islamic teachings on this topic. All materials will be provided, and refreshments will be served.`,
      imageUrl: card.imageUrl,
      imageAlt: card.imageAlt,
      speakerName: card.speakerName,
      speakerImage: card.speakerImage,
      speakerRole: card.speakerRole,
      speakerBio: `${card.speakerName} is a renowned Islamic scholar with over 15 years of experience in teaching Islamic studies and specializes in various aspects of Islamic jurisprudence and contemporary Muslim life.`,
      date: card.date,
      time: '1:00 PM - 4:00 PM',
      location: 'Live Session',
      tags: card.tags,
      isRecorded: card.isRecorded || false,
      registrationDeadline: '1 day before event',
      maxAttendees: 500,
      currentAttendees: 342,
      agenda: [
        `Welcome and Introduction to ${card.title}`,
        'Understanding Key Concepts and Principles',
        'Interactive Discussion and Examples',
        'Q&A session with our knowledgeable instructor',
        'Practical Applications and Takeaways',
        'Closing Remarks and Next Steps',
      ],
      outcomes: [
        `Gain comprehensive understanding of ${card.title.toLowerCase()}`,
        'Learn practical applications of Islamic principles',
        'Develop better understanding through interactive discussion',
        'Build connections with like-minded attendees',
      ],
    };
  }

  getEventById(id: string): Observable<EventDetail | null> {
    return this.eventsService.getById(id).pipe(
      map((response) => this.mapEventDetail(response))
    );
  }

  private mapEventDetail(response: unknown): EventDetail | null {
    const record = this.asRecord(response);
    if (!record) {
      return null;
    }

    const title = this.asString(record['title']) ?? 'Event';
    const description = this.asString(record['description']) ?? '';
    const tags = this.asStringArray(record['tags']);

    return {
      id: this.asString(record['id']) ?? 'event',
      title,
      description,
      fullDescription:
        this.asString(record['fullDescription']) ??
        (description ? `${description}` : 'Details will be available soon.'),
      imageUrl: this.asString(record['imageUrl']) ?? '/images/events-picture.png',
      imageAlt: this.asString(record['imageAlt']) ?? title,
      speakerName: this.asString(record['speakerName']) ?? 'Ask A Muslim',
      speakerImage:
        this.asString(record['speakerImage']) ?? '/images/profile-picture-navbar.png',
      speakerRole: this.asString(record['speakerRole']) ?? 'Islamic Scholar',
      speakerBio:
        this.asString(record['speakerBio']) ??
        'A trusted scholar dedicated to guiding the community with clarity and compassion.',
      date: this.asString(record['date']) ?? 'TBD',
      time: this.asString(record['time']) ?? 'TBD',
      location: this.asString(record['location']) ?? 'TBD',
      tags: tags.length > 0 ? tags : ['#Event'],
      isRecorded: record['isRecorded'] === true,
      registrationDeadline: this.asString(record['registrationDeadline']),
      maxAttendees: this.asNumber(record['maxAttendees']),
      currentAttendees: this.asNumber(record['currentAttendees']),
      agenda: this.asStringArray(record['agenda']),
      outcomes: this.asStringArray(record['outcomes']),
    };
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  }

  private asNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }
}
