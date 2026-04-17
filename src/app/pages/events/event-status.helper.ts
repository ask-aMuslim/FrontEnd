import { EventStatus } from './event-status.enum';

export type EventStatusVariant = 'upcoming' | 'live' | 'finished';
export type EventStatusBadgeContext = 'hero' | 'card' | 'detail';

export interface EventStatusBadgeState {
  variant: EventStatusVariant;
  text: string;
  isLive: boolean;
  isFinished: boolean;
}

export function parseEventStatusValue(value: unknown): EventStatus | undefined {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) {
    return undefined;
  }

  if (
    normalized !== EventStatus.Upcoming &&
    normalized !== EventStatus.Live &&
    normalized !== EventStatus.Finished
  ) {
    return undefined;
  }

  return normalized;
}

export function resolveEventStatusVariant(
  status: EventStatus | undefined,
  isRecorded: boolean,
): EventStatusVariant {
  if (status === EventStatus.Finished || isRecorded) {
    return 'finished';
  }

  if (status === EventStatus.Live) {
    return 'live';
  }

  return 'upcoming';
}

export function getEventStatusBadgeState(
  context: EventStatusBadgeContext,
  status: EventStatus | undefined,
  isRecorded: boolean,
): EventStatusBadgeState {
  const variant = resolveEventStatusVariant(status, isRecorded);

  return {
    variant,
    text: getBadgeText(context, variant),
    isLive: variant === 'live',
    isFinished: variant === 'finished',
  };
}

function getBadgeText(
  context: EventStatusBadgeContext,
  variant: EventStatusVariant,
): string {
  if (context === 'hero') {
    if (variant === 'live') {
      return '◉ Live Now';
    }

    if (variant === 'finished') {
      return 'Finished Event';
    }

    return 'Upcoming Event';
  }

  if (context === 'card') {
    if (variant === 'live') {
      return '◉ Live Now';
    }

    if (variant === 'finished') {
      return 'Finished';
    }

    return 'Upcoming';
  }

  if (variant === 'live') {
    return '◉ Live Now';
  }

  if (variant === 'finished') {
    return 'Finished Event';
  }

  return 'Upcoming Event';
}
