import {
  MIN_NOTICE_HOURS,
  buildDateOptions,
  buildScheduledAt,
  buildTimeOptions,
  formatSlotTime,
  isSlotAvailable,
  toDateKey,
} from './meeting-schedule';

describe('meeting-schedule', () => {
  // Local time, so the expectations hold in any timezone the tests run in.
  const now = new Date(2026, 9, 23, 10, 0); // Fri 23 Oct 2026, 10:00 local

  describe('toDateKey', () => {
    it('uses the local calendar day', () => {
      expect(toDateKey(new Date(2026, 9, 23, 0, 5))).toBe('2026-10-23');
      expect(toDateKey(new Date(2026, 9, 23, 23, 55))).toBe('2026-10-23');
    });
  });

  describe('buildScheduledAt', () => {
    it('books exactly the day and time that were picked', () => {
      const at = buildScheduledAt('2026-10-24', '10:00')!;

      expect(at.getFullYear()).toBe(2026);
      expect(at.getMonth()).toBe(9);
      expect(at.getDate()).toBe(24);
      expect(at.getHours()).toBe(10);
      expect(at.getMinutes()).toBe(0);
    });

    it('rejects malformed or impossible input', () => {
      expect(buildScheduledAt(null, '10:00')).toBeNull();
      expect(buildScheduledAt('2026-10-24', null)).toBeNull();
      expect(buildScheduledAt('24/10/2026', '10:00')).toBeNull();
      expect(buildScheduledAt('2026-02-31', '10:00')).toBeNull();
    });
  });

  describe('availability', () => {
    it('does not offer slots sooner than the minimum notice', () => {
      expect(isSlotAvailable('2026-10-23', '17:00', now)).toBeFalse(); // later today
      expect(isSlotAvailable('2026-10-24', '09:00', now)).toBeFalse(); // 23h away
      expect(isSlotAvailable('2026-10-24', '10:00', now)).toBeTrue(); // exactly the notice period
      expect(isSlotAvailable('2026-10-25', '08:00', now)).toBeTrue();
      expect(MIN_NOTICE_HOURS).toBe(24);
    });

    it('disables times for the chosen day that are too soon', () => {
      const times = buildTimeOptions('2026-10-24', now);

      expect(times.find((t) => t.value === '09:00')!.disabled).toBeTrue();
      expect(times.find((t) => t.value === '10:00')!.disabled).toBeFalse();
      expect(times.find((t) => t.value === '17:00')!.disabled).toBeFalse();
    });

    it('disables every time until a date is chosen', () => {
      expect(buildTimeOptions(null, now).every((t) => t.disabled)).toBeTrue();
    });

    it('lists the booking window with the local day in each label and value', () => {
      const dates = buildDateOptions(now);

      expect(dates.length).toBe(12);
      expect(dates[0]).toEqual({ value: '2026-10-23', label: 'Fri, Oct 23', disabled: true });
      expect(dates[1].value).toBe('2026-10-24');
      expect(dates[1].label).toBe('Sat, Oct 24');
      expect(dates[1].disabled).toBeFalse();
    });

    it('disables a day once none of its slots is far enough away', () => {
      const lateEvening = new Date(2026, 9, 23, 20, 0); // earliest start is Sat 24 Oct 20:00, after every slot that day

      expect(buildTimeOptions('2026-10-24', lateEvening).every((t) => t.disabled)).toBeTrue();
      expect(buildDateOptions(lateEvening)[1].disabled).toBeTrue();
      expect(buildDateOptions(lateEvening)[2].disabled).toBeFalse();
    });
  });

  describe('formatSlotTime', () => {
    it('formats 24h times for display', () => {
      expect(formatSlotTime('08:00')).toBe('8:00 AM');
      expect(formatSlotTime('12:00')).toBe('12:00 PM');
      expect(formatSlotTime('17:00')).toBe('5:00 PM');
      expect(formatSlotTime('00:00')).toBe('12:00 AM');
      expect(formatSlotTime('later')).toBe('later');
    });
  });
});
