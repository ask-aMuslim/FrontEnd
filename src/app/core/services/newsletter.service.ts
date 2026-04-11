import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { NewsletterFacade } from '../../api/facades/newsletter.facade';

export interface NewsletterSubscriptionResult {
    success: boolean;
    message: string;
}

@Injectable({ providedIn: 'root' })
export class NewsletterService {
    private readonly newsletterFacade = inject(NewsletterFacade);

    subscribe(email: string): Observable<NewsletterSubscriptionResult> {
        const normalizedEmail = email.trim().toLowerCase();
        if (!this.isValidEmail(normalizedEmail)) {
            return of({
                success: false,
                message: 'Please enter a valid email address.',
            });
        }

        return this.newsletterFacade.subscribe({ email: normalizedEmail }).pipe(
            map((isSubscribed) => ({
                success: isSubscribed,
                message: isSubscribed
                    ? 'You are subscribed to our newsletter.'
                    : 'Unable to subscribe right now. Please try again in a moment.',
            })),
            catchError(() =>
                of({
                    success: false,
                    message: 'Unable to subscribe right now. Please try again in a moment.',
                }),
            ),
        );
    }

    private isValidEmail(value: string): boolean {
        if (!value) {
            return false;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailPattern.test(value);
    }
}
