import { Language, MeetingInquiryRequestStatus, MeetingInquiryTopic } from '../models/interfaces/enums.model';
import { asRecord, extractArray, extractRecord, getValue } from './api-response.helper';

export interface MeetingRequestItem {
  readonly id: string;
  readonly topic: MeetingInquiryTopic;
  readonly status: MeetingInquiryRequestStatus;
  readonly languages: readonly Language[];
  readonly message: string;
  readonly response: string | null;
  readonly moderatorName: string | null;
  readonly scheduledAt: string;
  readonly createdAt: string;
}

/** Reads the `by-requester` response into items, newest request first. Rows without an id are dropped. */
export function parseMeetingRequests(response: unknown): MeetingRequestItem[] {
  return extractArray(response)
    .map(toMeetingRequestItem)
    .filter((item): item is MeetingRequestItem => item !== null)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Reads the `my/{id}` response into one item, or null when it has no usable id. */
export function parseMeetingRequest(response: unknown): MeetingRequestItem | null {
  return toMeetingRequestItem(extractRecord(response));
}

/** Pending and accepted requests can still be cancelled by the requester. */
export function canCancelMeetingRequest(status: MeetingInquiryRequestStatus): boolean {
  return status === MeetingInquiryRequestStatus.Pending || status === MeetingInquiryRequestStatus.Accepted;
}

export function meetingStatusClass(status: MeetingInquiryRequestStatus): string {
  switch (status) {
    case MeetingInquiryRequestStatus.Pending:
      return 'meeting-status--pending';
    case MeetingInquiryRequestStatus.Accepted:
    case MeetingInquiryRequestStatus.Completed:
      return 'meeting-status--positive';
    case MeetingInquiryRequestStatus.Rejected:
      return 'meeting-status--negative';
    default:
      return 'meeting-status--neutral';
  }
}

function toMeetingRequestItem(raw: unknown): MeetingRequestItem | null {
  const record = asRecord(raw);
  const id = getValue(record, 'id');
  if (typeof id !== 'string') {
    return null;
  }

  return {
    id,
    topic: Number(getValue(record, 'topic')) as MeetingInquiryTopic,
    status: Number(getValue(record, 'status')) as MeetingInquiryRequestStatus,
    languages: toLanguages(getValue(record, 'languages')),
    message: String(getValue(record, 'message') ?? ''),
    response: stringOrNull(getValue(record, 'response')),
    moderatorName: stringOrNull(getValue(record, 'moderatorName')),
    scheduledAt: String(getValue(record, 'scheduledAt') ?? ''),
    createdAt: String(getValue(record, 'createdAt') ?? ''),
  };
}

function toLanguages(value: unknown): Language[] {
  return Array.isArray(value) ? value.map((v) => Number(v) as Language).filter((v) => Number.isFinite(v)) : [];
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}
