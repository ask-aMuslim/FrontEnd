import { DestroyRef, Injectable, NgZone, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, filter, fromEvent, interval } from 'rxjs';
import { TokenService } from '../auth/token.service';
import {
  parseNotifications,
  parseUnreadCount,
  type AppNotification,
} from '../helpers/notification.helper';
import { ApiService } from './api.service';

/**
 * The signed-in user's in-app notifications for the header bell.
 *
 * The unread count refreshes on sign-in, when the window regains focus, and every 2 minutes while
 * the tab is visible. The list is loaded when the dropdown opens. Browser only (the site is
 * server-rendered).
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  static readonly pollIntervalMs = 2 * 60_000;
  static readonly pageSize = 10;

  private static readonly path = '/api/Notifications/me';

  private readonly api = inject(ApiService);
  private readonly tokenService = inject(TokenService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _unreadCount = signal(0);
  private readonly _notifications = signal<readonly AppNotification[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly unreadCount = this._unreadCount.asReadonly();
  readonly notifications = this._notifications.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  private countRequest: Subscription | null = null;
  private listRequest: Subscription | null = null;

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    effect(() => {
      if (this.tokenService.isAuthenticated()) {
        this.refreshUnreadCount();
      } else {
        this.countRequest?.unsubscribe();
        this.listRequest?.unsubscribe();
        this._unreadCount.set(0);
        this._notifications.set([]);
        this._error.set(null);
      }
    });

    fromEvent(window, 'focus')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshUnreadCount());

    // Runs outside the Angular zone so the timer doesn't keep the app permanently unstable
    // (hydration waits for stability); the signal update still triggers change detection.
    inject(NgZone).runOutsideAngular(() => {
      interval(NotificationsService.pollIntervalMs)
        .pipe(
          filter(() => document.visibilityState === 'visible'),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => this.refreshUnreadCount());
    });
  }

  refreshUnreadCount(): void {
    if (!this.isBrowser || !this.tokenService.isAuthenticated()) {
      return;
    }

    this.countRequest?.unsubscribe();
    this.countRequest = this.api.get<unknown>(`${NotificationsService.path}/unread-count`).subscribe({
      next: (response) => this._unreadCount.set(parseUnreadCount(response)),
      error: () => {
        // Keep the last known count; the badge is best-effort.
      },
    });
  }

  /** Loads the latest notifications for the dropdown, and refreshes the badge with it. */
  loadLatest(): void {
    if (!this.isBrowser || !this.tokenService.isAuthenticated()) {
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);
    this.refreshUnreadCount();

    this.listRequest?.unsubscribe();
    this.listRequest = this.api
      .get<unknown>(NotificationsService.path, { PageNumber: 1, PageSize: NotificationsService.pageSize })
      .subscribe({
        next: (response) => {
          this._notifications.set(parseNotifications(response));
          this._isLoading.set(false);
        },
        error: () => {
          this._error.set('Unable to load your notifications right now.');
          this._isLoading.set(false);
        },
      });
  }

  /** Marks one notification read straight away, and tells the server. A failure leaves it read until the next refresh. */
  markRead(notification: AppNotification): void {
    if (notification.isRead) {
      return;
    }

    this._notifications.update((list) => list.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
    this._unreadCount.update((count) => Math.max(0, count - 1));

    this.api.put<unknown>(`${NotificationsService.path}/${notification.id}/read`, {}).subscribe({
      error: () => this.refreshUnreadCount(),
    });
  }

  markAllRead(): void {
    if (this._unreadCount() === 0 && this._notifications().every((n) => n.isRead)) {
      return;
    }

    this._notifications.update((list) => list.map((n) => (n.isRead ? n : { ...n, isRead: true })));
    this._unreadCount.set(0);

    this.api.put<unknown>(`${NotificationsService.path}/read-all`, {}).subscribe({
      error: () => this.refreshUnreadCount(),
    });
  }
}
