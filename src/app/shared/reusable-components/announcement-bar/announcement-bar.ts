import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, OnDestroy, PLATFORM_ID, effect, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { StudentFacade } from '../../../api/facades/student.facade';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-announcement-bar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './announcement-bar.html',
  styleUrls: ['./announcement-bar.scss'],
})
export class AnnouncementBar implements OnDestroy {
  protected isVisible = false;
  protected isClosing = false;
  private readonly STORAGE_KEY = 'announcement-bar-dismissed-date';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly studentFacade = inject(StudentFacade);
  private readonly authService = inject(AuthService);
  private readonly destroy$ = new Subject<void>();
  private hasAuthenticatedSession = false;

  private readonly authVisibilityEffect = effect(() => {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const authenticated = this.authService.isAuthenticated();

    if (!authenticated) {
      this.hasAuthenticatedSession = false;
      this.isVisible = false;
      return;
    }

    if (!this.hasAuthenticatedSession) {
      this.hasAuthenticatedSession = true;
      globalThis.localStorage.removeItem(this.STORAGE_KEY);
    }

    this.checkProfileCompletion();
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkProfileCompletion(): void {
    if (!this.authService.isAuthenticated()) {
      this.isVisible = false;
      return;
    }

    this.studentFacade
      .me()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          // API provides completion flag; show bar only when profile is not completed.
          this.isVisible = profile?.isProfileCompleted === false;
        },
        error: () => {
          this.isVisible = false;
        },
      });
  }

  protected closeBar(): void {
    // Only access localStorage in the browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const today = new Date().toDateString();
    globalThis.localStorage.setItem(this.STORAGE_KEY, today);
    this.isClosing = true;

    // Wait for animation to complete before hiding
    globalThis.setTimeout(() => {
      this.isVisible = false;
      this.isClosing = false;

      // Reappear after 5 seconds
      globalThis.setTimeout(() => {
        this.isVisible = true;
      }, 5000);
    }, 400);
  }
}

