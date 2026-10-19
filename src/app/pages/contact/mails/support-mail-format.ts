import { SupportMailStatus } from '../../../api/facades/support-mails.models';

/** "2:15 PM" today, otherwise "12 Oct 2026, 2:15 PM", in the viewer's local time. */
export function formatSupportMailTime(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) {
    return time;
  }

  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${day}, ${time}`;
}

export function supportMailStatusClass(status: SupportMailStatus): string {
  switch (status) {
    case SupportMailStatus.AwaitingResponse:
      return 'status-badge--pending';
    case SupportMailStatus.Responded:
      return 'status-badge--responded';
    default:
      return 'status-badge--closed';
  }
}
