import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import type { EventDetail } from './event-detail/event-detail.component';
import { EventsService } from '../../core/services/events.service';
import type { EventCard } from './event-card/event-card.component';
import {
  extractRecord,
  getValue,
  toBooleanValue,
  toNumberValue,
  toStringArray,
  toStringValue,
} from '../../core/helpers/api-response.helper';
import { formatEventDateDisplay, formatEventTimeRangeDisplay } from '../../core/helpers/event-display.helper';
import { toApiMediaUrl } from '../../core/helpers/media-url.helper';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private selectedEvent: EventCard | null = null;

  constructor(private readonly eventsService: EventsService) { }

  setSelectedEvent(event: EventCard): void {
    this.selectedEvent = event;
  }

  getSelectedEventById(id: string): EventDetail | null {
    if (!this.selectedEvent || String(this.selectedEvent.id) !== id) {
      return null;
    }

    return {
      id: this.selectedEvent.id,
      title: this.selectedEvent.title,
      description: this.selectedEvent.description,
      fullDescription: this.selectedEvent.description,
      imageUrl: this.selectedEvent.imageUrl,
      imageAlt: this.selectedEvent.imageAlt,
      speakerName: this.selectedEvent.speakerName,
      speakerImage: this.selectedEvent.speakerImage,
      speakerRole: this.selectedEvent.speakerRole,
      speakerBio: '',
      date: this.selectedEvent.date,
      time: '',
      location: '',
      tags: this.selectedEvent.tags,
      isRecorded: this.selectedEvent.isRecorded === true,
      agenda: [],
      outcomes: [],
    };
  }

  getEventById(id: string): Observable<EventDetail | null> {
    return this.eventsService.getById(id).pipe(
      map((response) => this.mapEventDetail(response))
    );
  }

  private mapEventDetail(response: unknown): EventDetail | null {
    const record = extractRecord(response);
    if (!record) {
      return null;
    }

    const title = toStringValue(getValue(record, 'title', 'Title')) ?? '';
    const description = toStringValue(getValue(record, 'description', 'Description')) ?? '';
    const tags = toStringArray(getValue(record, 'tags', 'Tags', 'categories', 'Categories'));
    const startDateValue = toStringValue(
      getValue(record, 'startDateTime', 'StartDateTime', 'date', 'Date', 'startDate', 'StartDate', 'eventDate', 'EventDate'),
    );
    const endDateValue = toStringValue(getValue(record, 'endDateTime', 'EndDateTime'));

    return {
      id: toStringValue(getValue(record, 'id', 'Id')) ?? 'event',
      title,
      description,
      fullDescription:
        toStringValue(getValue(record, 'fullDescription', 'FullDescription')) ??
        description,
      imageUrl:
        toApiMediaUrl(
          toStringValue(getValue(record, 'imageUrl', 'ImageUrl', 'coverImageUrl', 'CoverImageUrl')),
        ) ??
        '/images/events-image-placeholder.jpg',
      imageAlt: toStringValue(getValue(record, 'imageAlt', 'ImageAlt')) ?? title,
      speakerName: toStringValue(getValue(record, 'speakerName', 'SpeakerName')) ?? '',
      speakerImage:
        toApiMediaUrl(toStringValue(getValue(record, 'speakerImage', 'SpeakerImage'))) ??
        '/images/profile-picture-navbar.png',
      speakerRole: toStringValue(getValue(record, 'speakerRole', 'SpeakerRole')) ?? '',
      speakerBio:
        toStringValue(getValue(record, 'speakerBio', 'SpeakerBio')) ??
        '',
      date: formatEventDateDisplay(startDateValue),
      time:
        toStringValue(getValue(record, 'time', 'Time', 'startTime', 'StartTime')) ??
        formatEventTimeRangeDisplay(startDateValue, endDateValue),
      location: toStringValue(getValue(record, 'location', 'Location')) ?? '',
      tags,
      isRecorded: toBooleanValue(getValue(record, 'isRecorded', 'IsRecorded')),
      registrationDeadline: toStringValue(
        getValue(record, 'registrationDeadline', 'RegistrationDeadline'),
      ) ?? undefined,
      maxAttendees: toNumberValue(getValue(record, 'maxAttendees', 'MaxAttendees')) ?? undefined,
      currentAttendees:
        toNumberValue(getValue(record, 'currentAttendees', 'CurrentAttendees')) ?? undefined,
      agenda: toStringArray(getValue(record, 'agenda', 'Agenda')),
      outcomes: toStringArray(getValue(record, 'outcomes', 'Outcomes')),
    };
  }
}
