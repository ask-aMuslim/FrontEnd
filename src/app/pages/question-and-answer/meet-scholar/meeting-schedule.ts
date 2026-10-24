/**
 * Date and time options for the meet-scholar form.
 *
 * Everything here works in the user's local time: a date is a local `yyyy-MM-dd` key and a time is a
 * local `HH:mm`. The instant sent to the API is built from those local parts, so the day the user
 * picked is always the day that gets requested, whatever the timezone.
 */

/** Every session is this long; it is shown to the user but not chosen by them. */
export const MEETING_DURATION_MINUTES = 30;

/** A scholar has to review and accept a request, so slots that start sooner than this are not offered. */
export const MIN_NOTICE_HOURS = 24;

/** How many days from today the date picker lists. */
export const BOOKING_WINDOW_DAYS = 12;

/** Start hours (24h clock) offered each day. */
export const SLOT_HOURS: readonly number[] = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export interface DateOption {
  value: string;
  label: string;
  disabled: boolean;
}

export interface TimeOption {
  value: string;
  label: string;
  disabled: boolean;
}

/** Local `yyyy-MM-dd` key for a date. */
export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The instant for a local date key and `HH:mm` time. Returns null when either is malformed. */
export function buildScheduledAt(dateKey: string | null | undefined, time: string | null | undefined): Date | null {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey ?? '');
  const timeParts = /^(\d{1,2}):(\d{2})$/.exec(time ?? '');
  if (!dateParts || !timeParts) {
    return null;
  }

  const [year, month, day] = [Number(dateParts[1]), Number(dateParts[2]), Number(dateParts[3])];
  const [hours, minutes] = [Number(timeParts[1]), Number(timeParts[2])];
  const date = new Date(year, month - 1, day, hours, minutes);

  // new Date() rolls impossible values over (e.g. 31 February); reject those.
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

/** The earliest start time that can still be requested. */
export function earliestStart(now: Date = new Date()): Date {
  return new Date(now.getTime() + MIN_NOTICE_HOURS * 60 * 60 * 1000);
}

export function isSlotAvailable(dateKey: string, time: string, now: Date = new Date()): boolean {
  const start = buildScheduledAt(dateKey, time);
  return start !== null && start.getTime() >= earliestStart(now).getTime();
}

/** "8:00 AM" for "08:00"; the input unchanged when it isn't a time. */
export function formatSlotTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) {
    return time;
  }

  const hours = Number(match[1]);
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 === 0 ? 12 : hours % 12}:${match[2]} ${period}`;
}

export function buildTimeOptions(dateKey: string | null, now: Date = new Date()): TimeOption[] {
  return SLOT_HOURS.map((hour) => {
    const value = `${String(hour).padStart(2, '0')}:00`;
    return {
      value,
      label: formatSlotTime(value),
      disabled: dateKey === null ? true : !isSlotAvailable(dateKey, value, now),
    };
  });
}

/** Today and the following days; a day is disabled when none of its slots can be requested any more. */
export function buildDateOptions(now: Date = new Date()): DateOption[] {
  const options: DateOption[] = [];

  for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const value = toDateKey(date);
    options.push({
      value,
      label: `${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${date.toLocaleDateString('en-US', { month: 'short' })} ${date.getDate()}`,
      disabled: !SLOT_HOURS.some((hour) => isSlotAvailable(value, `${String(hour).padStart(2, '0')}:00`, now)),
    });
  }

  return options;
}

/** The viewer's IANA timezone, e.g. "America/New_York". Empty when the browser can't say. */
export function timeZoneLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
}
