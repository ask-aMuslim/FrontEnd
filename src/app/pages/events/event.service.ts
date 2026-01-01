import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { EventCard } from './event-card/event-card.component';
import type { EventDetail } from './event-detail/event-detail.component';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private selectedEventSubject = new BehaviorSubject<EventCard | null>(null);
  selectedEvent$ = this.selectedEventSubject.asObservable();

  constructor() {}

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
}
