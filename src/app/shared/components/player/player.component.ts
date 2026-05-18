import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TimeFormatPipe } from '../../pipes/time-format.pipe';
import { AudioService } from '../../../core/services/audio.service';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [TimeFormatPipe],
  templateUrl: './player.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerComponent {
  protected readonly audioService = inject(AudioService);

  protected readonly hasTrack = computed(() => !!this.audioService.currentTrack()?.src);

  /**
   * Dynamic track fill for seek bar (left side = filled progress).
   */
  protected readonly seekBarBackground = computed(() => {
    const progress = this.audioService.progress();
    return `linear-gradient(to right, rgba(21, 107, 64, 0.95) 0%, rgba(21, 107, 64, 0.95) ${progress}%, rgba(173, 181, 189, 0.45) ${progress}%, rgba(173, 181, 189, 0.45) 100%)`;
  });

  /**
   * Dynamic track fill for volume slider.
   */
  protected readonly volumeBarBackground = computed(() => {
    const volumePercent = Math.round(this.audioService.volume() * 100);
    return `linear-gradient(to right, rgba(21, 107, 64, 0.95) 0%, rgba(21, 107, 64, 0.95) ${volumePercent}%, rgba(173, 181, 189, 0.45) ${volumePercent}%, rgba(173, 181, 189, 0.45) 100%)`;
  });

  protected onTogglePlayPause(): void {
    this.audioService.togglePlayPause();
  }

  protected onNextTrack(): void {
    this.audioService.nextTrack();
  }

  protected onPreviousTrack(): void {
    this.audioService.previousTrack();
  }

  protected onSeek(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const targetTime = Number(input.value);
    if (!Number.isFinite(targetTime)) {
      return;
    }

    this.audioService.seekTo(targetTime);
  }

  protected onVolumeChange(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const nextVolume = Number(input.value) / 100;
    if (!Number.isFinite(nextVolume)) {
      return;
    }

    this.audioService.setVolume(nextVolume);
  }
}
