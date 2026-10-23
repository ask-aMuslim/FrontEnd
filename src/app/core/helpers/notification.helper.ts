import { asRecord, extractArray, getValue } from './api-response.helper';

export interface AppNotification {
  readonly id: string;
  readonly title: string;
  readonly message: string;
  readonly isRead: boolean;
  readonly actionUrl: string | null;
  readonly notificationType: string;
  readonly createdAt: string;
}

/** Where a notification leads. */
export type NotificationLink =
  | { readonly kind: 'internal'; readonly commands: readonly string[] }
  | { readonly kind: 'external'; readonly url: string }
  | { readonly kind: 'none' };

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reads the `/api/Notifications/me` response, newest first as the API returns it. Rows without an id are dropped. */
export function parseNotifications(response: unknown): AppNotification[] {
  return extractArray(response)
    .map(toNotification)
    .filter((item): item is AppNotification => item !== null);
}

/** Reads the `/api/Notifications/me/unread-count` response; anything unreadable counts as zero. */
export function parseUnreadCount(response: unknown): number {
  const value = typeof response === 'number' ? response : getValue(asRecord(response), 'data', 'Data');
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Works out where a notification should open.
 *
 * The backend stores a relative key for in-app notifications (`support-mails/{id}?event=…`,
 * `meeting-requests/{id}?event=…`). Admin-written notifications can carry any text, so only those
 * two known keys and plain http(s) links are followed; everything else is ignored.
 */
export function resolveNotificationLink(notification: Pick<AppNotification, 'actionUrl'>): NotificationLink {
  const raw = notification.actionUrl?.trim();
  if (!raw) {
    return { kind: 'none' };
  }

  const external = toExternalUrl(raw);
  if (external) {
    return { kind: 'external', url: external };
  }

  const path = raw.replace(/^\/+/, '').split(/[?#]/)[0];
  const [section, id, ...rest] = path.split('/');
  if (rest.length > 0 || !id || !guidPattern.test(id)) {
    return { kind: 'none' };
  }

  switch (section) {
    case 'support-mails':
      return { kind: 'internal', commands: ['/contact', 'mails', id] };
    case 'meeting-requests':
      return { kind: 'internal', commands: ['/question-and-answer', 'meet-scholar', 'history', id] };
    default:
      return { kind: 'none' };
  }
}

/** "just now", "5 minutes ago", "3 hours ago", "yesterday", then a date. Empty when the value isn't a date. */
export function formatRelativeTime(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 45) {
    return 'just now';
  }

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return formatter.format(-minutes, 'minute');
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return formatter.format(-hours, 'hour');
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return formatter.format(-days, 'day');
  }

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toExternalUrl(value: string): string | null {
  if (!/^https?:\/\//i.test(value)) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function toNotification(raw: unknown): AppNotification | null {
  const record = asRecord(raw);
  const id = getValue(record, 'id');
  if (typeof id !== 'string') {
    return null;
  }

  const actionUrl = getValue(record, 'actionUrl');

  return {
    id,
    title: String(getValue(record, 'title') ?? ''),
    message: String(getValue(record, 'message') ?? ''),
    isRead: getValue(record, 'isRead') === true,
    actionUrl: typeof actionUrl === 'string' && actionUrl.trim().length > 0 ? actionUrl : null,
    notificationType: String(getValue(record, 'notificationType') ?? ''),
    createdAt: String(getValue(record, 'createdAt') ?? ''),
  };
}
