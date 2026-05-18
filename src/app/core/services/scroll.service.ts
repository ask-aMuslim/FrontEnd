import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

/**
 * Scroll Service
 * 
 * Provides utilities for scrolling to specific positions in the page.
 * Used for scroll-to-top on multi-step pages (quiz, multi-step forms, etc.)
 */
@Injectable({
    providedIn: 'root'
})
export class ScrollService {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly document = inject(DOCUMENT);

    /**
     * Scroll to the top of the page
     * Useful for multi-step components when transitioning between steps
     * 
     * @param behavior - scroll behavior ('auto' or 'smooth')
     * @param delay - optional delay in milliseconds before scrolling
     */
    scrollToTop(behavior: ScrollBehavior = 'auto', delay: number = 0): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        if (delay > 0) {
            globalThis.setTimeout(() => {
                this.performScroll(0, behavior);
            }, delay);
        } else {
            this.performScroll(0, behavior);
        }
    }

    /**
     * Scroll to a specific element
     * 
     * @param selector - CSS selector of the element to scroll to
     * @param behavior - scroll behavior ('auto' or 'smooth')
     * @param offset - optional pixel offset from the element (for fixed headers)
     */
    scrollToElement(selector: string, behavior: ScrollBehavior = 'auto', offset: number = 0): void {
        const window = this.document.defaultView;
        if (!isPlatformBrowser(this.platformId) || !window) {
            return;
        }

        const element = this.document.querySelector(selector);
        if (element) {
            const targetPosition = element.getBoundingClientRect().top + window.scrollY - offset;
            this.performScroll(targetPosition, behavior);
        }
    }

    /**
     * Scroll to the main content area
     * Useful for ensuring quiz content is visible
     */
    scrollToMainContent(): void {
        this.scrollToElement('main', 'auto', 40);
    }

    private performScroll(position: number, behavior: ScrollBehavior): void {
        const window = this.document.defaultView;
        if (window) {
            window.scrollTo({
                top: position,
                behavior: behavior
            });
        }
    }
}

