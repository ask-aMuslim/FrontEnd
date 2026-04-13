import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts raw seconds to human readable time.
 * - < 1 hour: m:ss
 * - >= 1 hour: h:mm:ss
 */
@Pipe({
  name: 'timeFormat',
  standalone: true,
  pure: true,
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return '0:00';
    }

    const totalSeconds = Math.floor(value);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const secondsPart = seconds.toString().padStart(2, '0');

    if (hours > 0) {
      const minutesPart = minutes.toString().padStart(2, '0');
      return `${hours}:${minutesPart}:${secondsPart}`;
    }

    return `${totalMinutes}:${secondsPart}`;
  }
}
