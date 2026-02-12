import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';

@Component({
    selector: 'app-announcement-bar',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './announcement-bar.html',
    styleUrls: ['./announcement-bar.scss'],
})
export class AnnouncementBar implements OnInit {
    protected isVisible = false;
    protected isClosing = false;
    private readonly STORAGE_KEY = 'announcement-bar-dismissed-date';
    private readonly platformId = inject(PLATFORM_ID);

    ngOnInit(): void {
        this.checkVisibility();
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
            this.isVisible = true;
        }
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
