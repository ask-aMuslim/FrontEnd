import { Id, ISODate } from './base.model';

export interface EventDto {
  id: Id;
  title: string;
  description?: string | null;
  speakerName?: string | null;
  imageUrl?: string | null;
  startDateTime?: ISODate;
  endDateTime?: ISODate;
  meetingLink?: string | null;
  isPublished?: boolean;
}

export interface CreateEventRequest {
  title: string;
  description?: string | null;
  speakerName?: string | null;
  imageUrl?: string | null;
  startDateTime?: ISODate;
  endDateTime?: ISODate;
  meetingLink?: string | null;
  isPublished?: boolean;
}

export default EventDto;
