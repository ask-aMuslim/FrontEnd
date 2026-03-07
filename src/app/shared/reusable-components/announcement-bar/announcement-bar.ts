import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, OnInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { StudentFacade } from '../../../api/facades/student.facade';

@Component({
    selector: 'app-announcement-bar',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './announcement-bar.html',
    styleUrls: ['./announcement-bar.scss'],
})
export class AnnouncementBar implements OnInit, OnDestroy {
    protected isVisible = false;
    protected isClosing = false;
    private readonly STORAGE_KEY = 'announcement-bar-dismissed-date';
    private readonly platformId = inject(PLATFORM_ID);
    private readonly studentFacade = inject(StudentFacade);
    private readonly destroy$ = new Subject<void>();

    ngOnInit(): void {
        this.checkVisibility();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkVisibility(): void {
        // Only access localStorage in the browser
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        const dismissedDate = localStorage.getItem(this.STORAGE_KEY);
        const today = new Date().toDateString();

        // Show if never dismissed or if dismissed on a different day
        if (!dismissedDate || dismissedDate !== today) {
            // Check if profile is complete
            this.checkProfileCompletion();
        }
    }

    private checkProfileCompletion(): void {
        this.studentFacade
            .me()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (profile) => {
                    // Show bar if profile is missing any key information
                    const profileRecord = (profile as Record<string, unknown>) || {};
                    const isIncomplete = !profile?.firstName || !profile?.lastName ||
                        !profileRecord['profileImage'];
                    this.isVisible = isIncomplete;
                },
                error: () => {
                    // Show bar on error to encourage profile setup
                    this.isVisible = true;
                },
            });
    }

    protected closeBar(): void {
        // Only access localStorage in the browser
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        const today = new Date().toDateString();
        localStorage.setItem(this.STORAGE_KEY, today);
        this.isClosing = true;

        // Wait for animation to complete before hiding
        setTimeout(() => {
            this.isVisible = false;
            this.isClosing = false;

            // Reappear after 5 seconds
            setTimeout(() => {
                this.isVisible = true;
            }, 5000);
        }, 400);
    }
}

