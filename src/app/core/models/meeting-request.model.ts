import { Id, ISODate } from './base.model';

export interface MeetingRequestDto {
  id: Id;
  requesterId?: Id;
  scholarId?: Id;
  topic?: number;
  message?: string | null;
  languages?: number[];
  scheduledAt?: ISODate | null;
  status?: number;
  response?: string | null;
}

export interface CreateMeetingRequest {
  topic: number;
  message: string;
  languages: number[];
  scheduledAt?: ISODate | null;
}

export interface UpdateMeetingStatusRequest {
  id: Id;
  status: number;
}

export interface UpdateMeetingResponseRequest {
  id: Id;
  response: string;
}

export default MeetingRequestDto;
