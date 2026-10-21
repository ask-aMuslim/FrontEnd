/**
 * Response shapes for /api/SupportMails.
 *
 * The OpenAPI spec declares no response schemas for these endpoints, so the
 * generated client only covers the request bodies. Keep these in sync with
 * AskAMuslimBackend/SUPPORT_MAILS_MOBILE_API.md.
 */

export enum SupportMailStatus {
  AwaitingResponse = 1,
  Responded = 2,
  Closed = 3,
}

export enum SupportMailSenderType {
  Requester = 1,
  Staff = 2,
}

export interface SupportMailTopic {
  value: number;
  key: string;
  name: string;
}

export interface SupportMailEligibility {
  canCreate: boolean;
  nextAllowedAt: string | null;
}

export interface SupportMailListItem {
  id: string;
  number: number;
  topic: number;
  subject: string;
  preview: string;
  status: SupportMailStatus;
  hasUnreadReply: boolean;
  created: string;
  lastMessageAt: string;
}

export interface SupportMailMessage {
  id: string;
  senderType: SupportMailSenderType;
  senderName: string | null;
  senderProfilePictureUrl: string | null;
  body: string;
  created: string;
}

export interface SupportMailDetail {
  id: string;
  number: number;
  topic: number;
  subject: string;
  status: SupportMailStatus;
  created: string;
  lastMessageAt: string;
  messages: SupportMailMessage[];
}

export interface SupportMailPage<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SupportMailListQuery {
  pageNumber?: number;
  pageSize?: number;
  status?: SupportMailStatus | null;
  searchTerm?: string | null;
}

/** Normalized error for every Support Mails call. */
export interface SupportMailError {
  status: number;
  messages: string[];
  fieldErrors: Record<string, string[]>;
}

/** Fallback inquiry types, used for guests and when GET /topics fails. */
export const FALLBACK_SUPPORT_MAIL_TOPICS: readonly SupportMailTopic[] = [
  { value: 1, key: 'GeneralInquiry', name: 'General Inquiry' },
  { value: 2, key: 'Quran', name: 'Quran' },
  { value: 3, key: 'Hadith', name: 'Hadith' },
  { value: 4, key: 'ComparativeReligion', name: 'Comparative Religion' },
  { value: 5, key: 'ConversionGuidance', name: 'Conversion Guidance' },
  { value: 6, key: 'IslamicHistory', name: 'Islamic History' },
  { value: 7, key: 'Fiqh', name: 'Fiqh' },
  { value: 8, key: 'Theology', name: 'Theology' },
];

export const SUPPORT_MAIL_LIMITS = {
  subject: 200,
  explanation: 500,
  reply: 4000,
} as const;

export const SUPPORT_MAIL_STATUS_LABELS: Record<SupportMailStatus, string> = {
  [SupportMailStatus.AwaitingResponse]: 'Will Respond Soon',
  [SupportMailStatus.Responded]: 'Responded',
  [SupportMailStatus.Closed]: 'Closed',
};
