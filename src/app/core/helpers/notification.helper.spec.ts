import {
  formatRelativeTime,
  parseNotifications,
  parseUnreadCount,
  resolveNotificationLink,
} from './notification.helper';

describe('notification.helper', () => {
  const id = '3f2b8f0e-6b1c-4c1e-9a55-0c1f2d3e4a5b';

  describe('resolveNotificationLink', () => {
    it('opens a support mail thread', () => {
      expect(resolveNotificationLink({ actionUrl: `support-mails/${id}?event=staff_reply&id=7c0d` })).toEqual({
        kind: 'internal',
        commands: ['/contact', 'mails', id],
      });
    });

    it('opens a meeting request page', () => {
      expect(resolveNotificationLink({ actionUrl: `meeting-requests/${id}?event=accepted&id=7c0d` })).toEqual({
        kind: 'internal',
        commands: ['/question-and-answer', 'meet-scholar', 'history', id],
      });
    });

    it('tolerates a leading slash', () => {
      expect(resolveNotificationLink({ actionUrl: `/meeting-requests/${id}` }).kind).toBe('internal');
    });

    it('opens plain http(s) links externally', () => {
      expect(resolveNotificationLink({ actionUrl: 'https://example.com/certificate/1' })).toEqual({
        kind: 'external',
        url: 'https://example.com/certificate/1',
      });
    });

    it('ignores missing links', () => {
      expect(resolveNotificationLink({ actionUrl: null }).kind).toBe('none');
      expect(resolveNotificationLink({ actionUrl: '   ' }).kind).toBe('none');
    });

    it('ignores dangerous or unknown links', () => {
      for (const actionUrl of [
        'javascript:alert(1)',
        'data:text/html,hi',
        'ftp://example.com/file',
        'support-mails/not-a-guid',
        `support-mails/${id}/extra`,
        `unknown/${id}`,
        'https://',
      ]) {
        expect(resolveNotificationLink({ actionUrl }).kind).withContext(actionUrl).toBe('none');
      }
    });
  });

  describe('parseNotifications', () => {
    it('reads the paged response and drops rows without an id', () => {
      const result = parseNotifications({
        succeeded: true,
        errors: [],
        data: {
          items: [
            { id: 'a', title: 'T', message: 'M', isRead: false, actionUrl: 'x', notificationType: 'SupportMail', createdAt: '2026-10-01T10:00:00Z' },
            { title: 'no id' },
          ],
        },
      });

      expect(result.length).toBe(1);
      expect(result[0]).toEqual({
        id: 'a',
        title: 'T',
        message: 'M',
        isRead: false,
        actionUrl: 'x',
        notificationType: 'SupportMail',
        createdAt: '2026-10-01T10:00:00Z',
      });
    });
  });

  describe('parseUnreadCount', () => {
    it('reads the wrapped count', () => {
      expect(parseUnreadCount({ succeeded: true, errors: [], data: 4 })).toBe(4);
    });

    it('treats anything unreadable as zero', () => {
      expect(parseUnreadCount(null)).toBe(0);
      expect(parseUnreadCount({ data: 'x' })).toBe(0);
      expect(parseUnreadCount({ data: -3 })).toBe(0);
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date('2026-10-23T12:00:00Z');

    it('formats recent times', () => {
      expect(formatRelativeTime('2026-10-23T11:59:50Z', now)).toBe('just now');
      expect(formatRelativeTime('2026-10-23T11:55:00Z', now)).toBe('5 minutes ago');
      expect(formatRelativeTime('2026-10-23T09:00:00Z', now)).toBe('3 hours ago');
      expect(formatRelativeTime('2026-10-22T12:00:00Z', now)).toBe('yesterday');
    });

    it('falls back to a date after a week, and to empty for bad input', () => {
      expect(formatRelativeTime('2026-10-01T12:00:00Z', now)).toBe('1 Oct 2026');
      expect(formatRelativeTime('nonsense', now)).toBe('');
      expect(formatRelativeTime(null, now)).toBe('');
    });
  });
});
