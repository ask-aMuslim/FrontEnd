import { DestroyRef, Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, filter, fromEvent } from 'rxjs';
import { SupportMailsFacade } from '../../api/facades/support-mails.facade';
import { TokenService } from '../auth/token.service';

/**
 * Unread Support Mails count for the header bell and the contact page.
 * Refreshes on sign-in, on navigation into /contact, and when the window
 * regains focus. Browser only (the site is server-rendered).
 */
@Injectable({ providedIn: 'root' })
export class SupportMailUnreadService {
  private readonly facade = inject(SupportMailsFacade);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _unreadCount = signal(0);
  readonly unreadCount = this._unreadCount.asReadonly();

  private inFlight: Subscription | null = null;

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    effect(() => {
      if (this.tokenService.isAuthenticated()) {
        this.refresh();
      } else {
        this.inFlight?.unsubscribe();
        this._unreadCount.set(0);
      }
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter((event) => event.urlAfterRedirects.startsWith('/contact')),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.refresh());

    fromEvent(window, 'focus')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
  }

  refresh(): void {
    if (!this.isBrowser || !this.tokenService.isAuthenticated()) {
      return;
    }

    this.inFlight?.unsubscribe();
    this.inFlight = this.facade.getUnreadCount().subscribe({
      next: (count) => this._unreadCount.set(count),
      error: () => {
        // Keep the last known count; the badge is best-effort.
      },
    });
  }
}
