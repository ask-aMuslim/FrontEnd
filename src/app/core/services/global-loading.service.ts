import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Global loading service with minimal-visible-time and show-delay to
 * avoid flicker for fast requests. Keeps the original numeric
 * pending count API available as `isLoading` for backward compatibility
 * and exposes `isVisible` boolean signal for overlay display.
 */
@Injectable({ providedIn: 'root' })
export class GlobalLoadingService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly pendingRequests = signal(0);

  // Backwards-compatible: numeric pending count
  readonly isLoading = this.pendingRequests.asReadonly();

  // Visible state used by the overlay (debounced + min visible)
  private readonly visible = signal(false);
  readonly isVisible = this.visible.asReadonly();

  // Timing config (ms)
  private readonly showDelay = 150; // delay before showing loader
  private readonly minVisible = 250; // minimum time loader stays visible

  private showTimer: any = null;
  private hideTimer: any = null;
  private visibleSince = 0;

  start(): void {
    this.pendingRequests.update((count) => count + 1);

    if (!this.isBrowser) {
      return;
    }

    // If already visible, nothing else to do
    if (this.visible()) {
      return;
    }

    // Cancel pending hides
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    // Start show timer if not already scheduled
    this.showTimer ??= setTimeout(() => {
      this.showTimer = null;
      this.visible.set(true);
      this.visibleSince = Date.now();
    }, this.showDelay);
  }

  stop(): void {
    this.pendingRequests.update((count) => Math.max(0, count - 1));

    if (!this.isBrowser) {
      if (this.pendingRequests() === 0) {
        this.visible.set(false);
      }
      return;
    }

    // If there are still pending requests, keep visible
    if (this.pendingRequests() > 0) {
      return;
    }

    // Cancel pending show if present
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }

    // If not visible yet, nothing to hide
    if (!this.visible()) {
      return;
    }

    const elapsed = Date.now() - this.visibleSince;
    const remaining = Math.max(0, this.minVisible - elapsed);

    // Ensure minimum visible duration
    this.hideTimer = setTimeout(() => {
      this.hideTimer = null;
      this.visible.set(false);
    }, remaining);
  }
}

