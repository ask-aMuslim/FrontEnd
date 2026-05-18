import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';

/**
 * Contract for tracks consumed by the global audio player.
 * Keep this minimal and serializable so it can be persisted to localStorage.
 */
export interface AudioTrack {
  src: string;
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
}

@Injectable({ providedIn: 'root' })
export class AudioService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Persistence keys.
   * `last_time_position` follows the requirement exactly.
   */
  private readonly storageTrackKey = 'last_played_track';
  private readonly storageTimeKey = 'last_time_position';
  private readonly storageVolumeKey = 'audio_volume';

  /**
   * Save current playback position at most once every 1.5s.
   * This avoids localStorage write pressure during frequent timeupdate events.
   */
  private readonly persistIntervalMs = 1_500;

  /**
   * Audio element is only created in browser contexts (SSR-safe).
   */
  private readonly audio: HTMLAudioElement | null = this.isBrowser ? new globalThis.Audio() : null;

  /**
   * Public reactive state (Signals)
   */
  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly volume = signal(1);
  readonly currentTrack = signal<AudioTrack | null>(null);

  /**
   * Percentage progress for progress bars / seek visualization.
   */
  readonly progress = computed(() => {
    const total = this.duration();
    if (!Number.isFinite(total) || total <= 0) {
      return 0;
    }

    const pct = (this.currentTime() / total) * 100;
    return Math.min(100, Math.max(0, pct));
  });

  /**
   * Optional playlist support so OS/media-key next/prev handlers can work.
   */
  private readonly queue = signal<readonly AudioTrack[]>([]);
  private readonly queueIndex = signal(-1);

  /**
   * If restoring a previous session, we store desired seek time here and apply
   * it only after `loadedmetadata` (when duration metadata is ready).
   */
  private pendingRestoreTime: number | null = null;

  /**
   * Throttled localStorage write internals.
   */
  private latestTimeToPersist = 0;
  private lastPersistedAt = 0;
  private persistTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  constructor() {
    this.configureAudioElement();
    this.restorePersistedSession();
    this.setupPositionPersistenceEffect();
    this.setupMediaSessionEffects();
  }

  /**
   * Load or replace current track.
   *
   * @param track Track to load. Pass null to clear player state.
   * @param autoplay Whether playback should start immediately after load.
   * @param resumeAt Optional time to restore after metadata is loaded.
   */
  loadTrack(track: AudioTrack | null, autoplay = false, resumeAt?: number): boolean {
    if (!this.audio || !track?.src?.trim()) {
      this.clearTrackState();
      return false;
    }

    // Avoid unnecessary full reload when the same src is already loaded.
    const current = this.currentTrack();
    const isSameSrc = current?.src === track.src;

    this.currentTrack.set(track);
    this.persistTrack(track);
    this.updateMediaSessionMetadata(track);

    if (!isSameSrc) {
      this.duration.set(0);
      this.currentTime.set(0);
      this.pendingRestoreTime = this.normalizeTime(resumeAt);
      this.audio.src = track.src;
      this.audio.load();
    } else if (typeof resumeAt === 'number') {
      this.seekTo(resumeAt);
    }

    if (autoplay) {
      void this.play();
    }

    return true;
  }

  /**
   * Play current track if available.
   */
  async play(): Promise<void> {
    if (!this.audio || !this.currentTrack()?.src) {
      return;
    }

    try {
      await this.audio.play();
    } catch {
      // Autoplay policy or media error; expose paused state gracefully.
      this.isPlaying.set(false);
    }
  }

  /**
   * Pause playback.
   */
  pause(): void {
    if (!this.audio) {
      return;
    }

    this.audio.pause();
  }

  /**
   * Toggle playback state.
   */
  togglePlayPause(): void {
    if (this.isPlaying()) {
      this.pause();
      return;
    }

    void this.play();
  }

  /**
   * Seek to a specific position (seconds).
   */
  seekTo(seconds: number): void {
    if (!this.audio || !Number.isFinite(seconds)) {
      return;
    }

    const targetTime = this.clampTime(seconds, this.duration());

    try {
      this.audio.currentTime = targetTime;
      this.currentTime.set(targetTime);
      this.flushPersistedTime();
      this.updateMediaSessionPositionState();
    } catch {
      // Ignore invalid seek attempts for unsupported streams.
    }
  }

  /**
   * Set player volume in [0, 1].
   */
  setVolume(nextVolume: number): void {
    const normalized = Math.min(1, Math.max(0, Number.isFinite(nextVolume) ? nextVolume : 1));

    this.volume.set(normalized);

    if (!this.audio) {
      return;
    }

    this.audio.volume = normalized;
    this.persistVolume(normalized);
  }

  /**
   * Optional queue registration to power next/previous actions.
   */
  setQueue(tracks: readonly AudioTrack[], startIndex = 0, autoplay = false): void {
    const sanitized = tracks.filter((track) => !!track.src?.trim());
    this.queue.set(sanitized);

    if (sanitized.length === 0) {
      this.queueIndex.set(-1);
      return;
    }

    const safeIndex = Math.min(sanitized.length - 1, Math.max(0, Math.floor(startIndex)));
    this.queueIndex.set(safeIndex);
    this.loadTrack(sanitized[safeIndex], autoplay);
  }

  /**
   * Play next track in queue when available.
   */
  nextTrack(): void {
    const tracks = this.queue();
    if (tracks.length === 0) {
      return;
    }

    const currentIndex = this.queueIndex();
    const nextIndex = Math.min(tracks.length - 1, Math.max(0, currentIndex + 1));

    if (nextIndex === currentIndex) {
      return;
    }

    this.queueIndex.set(nextIndex);
    this.loadTrack(tracks[nextIndex], true);
  }

  /**
   * Play previous track in queue when available.
   */
  previousTrack(): void {
    const tracks = this.queue();
    if (tracks.length === 0) {
      return;
    }

    const currentIndex = this.queueIndex();
    const prevIndex = Math.max(0, currentIndex - 1);

    if (prevIndex === currentIndex) {
      // Standard UX: if already at first track, restart current track.
      this.seekTo(0);
      return;
    }

    this.queueIndex.set(prevIndex);
    this.loadTrack(tracks[prevIndex], true);
  }

  private configureAudioElement(): void {
    if (!this.audio) {
      return;
    }

    this.audio.preload = 'metadata';

    this.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.addEventListener('durationchange', this.handleDurationChange);
    this.audio.addEventListener('play', this.handlePlay);
    this.audio.addEventListener('pause', this.handlePause);
    this.audio.addEventListener('ended', this.handleEnded);
    this.audio.addEventListener('volumechange', this.handleVolumeChange);
    this.audio.addEventListener('error', this.handleError);

    // Persist final position when user leaves or tab goes hidden.
    globalThis.addEventListener('beforeunload', this.flushPersistedTime);
    globalThis.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.registerMediaSessionActionHandlers();
  }

  private readonly handleLoadedMetadata = (): void => {
    if (!this.audio) {
      return;
    }

    const duration = Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
    this.duration.set(duration);

    if (this.pendingRestoreTime !== null) {
      const restoreAt = this.clampTime(this.pendingRestoreTime, duration);
      this.pendingRestoreTime = null;

      try {
        this.audio.currentTime = restoreAt;
        this.currentTime.set(restoreAt);
      } catch {
        // Ignore restore failures for streams/invalid ranges.
      }
    }

    this.updateMediaSessionPositionState();
  };

  private readonly handleTimeUpdate = (): void => {
    if (!this.audio) {
      return;
    }

    this.currentTime.set(Number.isFinite(this.audio.currentTime) ? this.audio.currentTime : 0);
    this.updateMediaSessionPositionState();
  };

  private readonly handleDurationChange = (): void => {
    if (!this.audio) {
      return;
    }

    this.duration.set(Number.isFinite(this.audio.duration) ? this.audio.duration : 0);
    this.updateMediaSessionPositionState();
  };

  private readonly handlePlay = (): void => {
    this.isPlaying.set(true);
  };

  private readonly handlePause = (): void => {
    this.isPlaying.set(false);
  };

  private readonly handleEnded = (): void => {
    this.isPlaying.set(false);
    this.currentTime.set(this.duration());
    this.nextTrack();
  };

  private readonly handleVolumeChange = (): void => {
    if (!this.audio) {
      return;
    }

    const normalized = Math.min(1, Math.max(0, this.audio.volume));
    this.volume.set(normalized);
    this.persistVolume(normalized);
  };

  private readonly handleError = (): void => {
    // Fail safe: pause visual state while preserving currently selected track metadata.
    this.isPlaying.set(false);
  };

  private readonly handleVisibilityChange = (): void => {
    if (globalThis.document.visibilityState === 'hidden') {
      this.flushPersistedTime();
    }
  };

  private setupPositionPersistenceEffect(): void {
    if (!this.isBrowser) {
      return;
    }

    effect(() => {
      const track = this.currentTrack();
      const now = this.currentTime();

      if (!track?.src) {
        return;
      }

      // Keep track metadata fresh (title/artist/artwork can change).
      this.persistTrack(track);

      // Save playback position (throttled).
      this.latestTimeToPersist = this.normalizeTime(now) ?? 0;
      this.schedulePersistedTime();
    });
  }

  private setupMediaSessionEffects(): void {
    if (!this.isBrowser || !('navigator' in globalThis) || !('mediaSession' in globalThis.navigator)) {
      return;
    }

    effect(() => {
      const playbackState: MediaSessionPlaybackState = this.isPlaying() ? 'playing' : 'paused';
      globalThis.navigator.mediaSession.playbackState = playbackState;
    });

    effect(() => {
      const track = this.currentTrack();
      if (!track) {
        globalThis.navigator.mediaSession.metadata = null;
        return;
      }

      this.updateMediaSessionMetadata(track);
    });
  }

  private registerMediaSessionActionHandlers(): void {
    if (!this.isBrowser || !('navigator' in globalThis) || !('mediaSession' in globalThis.navigator)) {
      return;
    }

    this.safeSetMediaSessionActionHandler('play', () => {
      void this.play();
    });

    this.safeSetMediaSessionActionHandler('pause', () => {
      this.pause();
    });

    this.safeSetMediaSessionActionHandler('nexttrack', () => {
      this.nextTrack();
    });

    this.safeSetMediaSessionActionHandler('previoustrack', () => {
      this.previousTrack();
    });

    // Useful optional integrations supported by many lock screens/headsets.
    this.safeSetMediaSessionActionHandler('seekto', (details) => {
      if (details.seekTime === undefined) {
        return;
      }

      this.seekTo(details.seekTime);
    });
  }

  private safeSetMediaSessionActionHandler(
    action: MediaSessionAction,
    handler: MediaSessionActionHandler,
  ): void {
    if (!('navigator' in globalThis) || !('mediaSession' in globalThis.navigator)) {
      return;
    }

    try {
      globalThis.navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      // Some browsers throw when an action is unsupported.
    }
  }

  private updateMediaSessionMetadata(track: AudioTrack): void {
    if (!this.isBrowser || !('navigator' in globalThis) || !('mediaSession' in globalThis.navigator)) {
      return;
    }

    const artwork = track.artwork
      ? [{ src: track.artwork, sizes: '512x512', type: 'image/png' }]
      : [];

    globalThis.navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'Unknown title',
      artist: track.artist || 'Unknown artist',
      album: track.album || 'Ask A Muslim',
      artwork,
    });
  }

  private updateMediaSessionPositionState(): void {
    if (
      !this.isBrowser ||
      !('navigator' in globalThis) ||
      !('mediaSession' in globalThis.navigator) ||
      !this.audio
    ) {
      return;
    }

    if (!Number.isFinite(this.audio.duration) || this.audio.duration <= 0) {
      return;
    }

    try {
      globalThis.navigator.mediaSession.setPositionState({
        duration: this.audio.duration,
        playbackRate: this.audio.playbackRate || 1,
        position: this.audio.currentTime,
      });
    } catch {
      // setPositionState is not universally supported.
    }
  }

  private restorePersistedSession(): void {
    if (!this.isBrowser || !this.audio) {
      return;
    }

    const restoredVolume = this.readPersistedNumber(this.storageVolumeKey, 1);
    this.setVolume(restoredVolume);

    const restoredTrack = this.readPersistedTrack();
    const restoredTime = this.readPersistedNumber(this.storageTimeKey, 0);

    if (!restoredTrack?.src) {
      return;
    }

    // Do not autoplay when restoring session; just load metadata and seek back.
    this.loadTrack(restoredTrack, false, restoredTime);
  }

  private schedulePersistedTime(): void {
    const now = Date.now();
    const elapsed = now - this.lastPersistedAt;

    if (elapsed >= this.persistIntervalMs && this.persistTimer === null) {
      this.flushPersistedTime();
      return;
    }

    if (this.persistTimer !== null) {
      return;
    }

    const waitMs = Math.max(0, this.persistIntervalMs - elapsed);

    this.persistTimer = globalThis.setTimeout(() => {
      this.persistTimer = null;
      this.flushPersistedTime();
    }, waitMs);
  }

  private readonly flushPersistedTime = (): void => {
    if (!this.isBrowser) {
      return;
    }

    const track = this.currentTrack();
    if (!track?.src) {
      return;
    }

    try {
      globalThis.localStorage.setItem(this.storageTimeKey, String(this.latestTimeToPersist));
      this.lastPersistedAt = Date.now();
    } catch {
      // Ignore storage failures (private mode / quota / user policy).
    }
  };

  private persistTrack(track: AudioTrack): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      globalThis.localStorage.setItem(this.storageTrackKey, JSON.stringify(track));
    } catch {
      // Ignore persistence failures.
    }
  }

  private persistVolume(nextVolume: number): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      globalThis.localStorage.setItem(this.storageVolumeKey, String(nextVolume));
    } catch {
      // Ignore persistence failures.
    }
  }

  private readPersistedTrack(): AudioTrack | null {
    try {
      const raw = globalThis.localStorage.getItem(this.storageTrackKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<AudioTrack>;
      if (typeof parsed.src !== 'string' || typeof parsed.title !== 'string') {
        return null;
      }

      return {
        src: parsed.src,
        title: parsed.title,
        artist: typeof parsed.artist === 'string' ? parsed.artist : undefined,
        album: typeof parsed.album === 'string' ? parsed.album : undefined,
        artwork: typeof parsed.artwork === 'string' ? parsed.artwork : undefined,
      };
    } catch {
      return null;
    }
  }

  private readPersistedNumber(key: string, fallback: number): number {
    try {
      const raw = globalThis.localStorage.getItem(key);
      if (raw === null) {
        return fallback;
      }

      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }

  private normalizeTime(seconds: number | undefined): number | null {
    if (seconds === undefined || !Number.isFinite(seconds)) {
      return null;
    }

    return Math.max(0, seconds);
  }

  private clampTime(seconds: number, knownDuration: number): number {
    const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);

    if (!Number.isFinite(knownDuration) || knownDuration <= 0) {
      return safeSeconds;
    }

    return Math.min(safeSeconds, knownDuration);
  }

  private clearTrackState(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
    }

    this.currentTrack.set(null);
    this.isPlaying.set(false);
    this.currentTime.set(0);
    this.duration.set(0);
    this.pendingRestoreTime = null;

    if (this.isBrowser) {
      try {
        globalThis.localStorage.removeItem(this.storageTrackKey);
        globalThis.localStorage.removeItem(this.storageTimeKey);
      } catch {
        // Ignore storage failures.
      }
    }

    if (this.isBrowser && 'navigator' in globalThis && 'mediaSession' in globalThis.navigator) {
      globalThis.navigator.mediaSession.metadata = null;
      globalThis.navigator.mediaSession.playbackState = 'none';
    }
  }
}
