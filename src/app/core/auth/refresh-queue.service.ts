/**
 * Refresh Queue Service
 * 
 * Prevents parallel token refresh requests.
 * Queues pending requests and resolves them when refresh completes.
 */

import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { filter, take, tap, catchError } from 'rxjs/operators';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class RefreshQueueService {
    private readonly tokenService = inject(TokenService);

    // Track if refresh is in progress
    private refreshInProgress = false;

    // Subject to broadcast new token when refresh completes
    private readonly refreshTokenSubject = new BehaviorSubject<string | null>(null);

    // Queue of pending requests waiting for refresh
    private pendingRequests: Array<{
        resolve: (token: string) => void;
        reject: (error: Error) => void;
    }> = [];

    /**
     * Queue a token refresh request.
     * If refresh is already in progress, wait for it to complete.
     * If not, initiate a new refresh.
     */
    queueRefresh(): Observable<string> {
        // If refresh is already in progress, wait for it
        if (this.refreshInProgress) {
            return this.waitForRefresh();
        }

        // Start a new refresh
        this.refreshInProgress = true;

        return this.tokenService.refreshAccessToken().pipe(
            tap({
                next: (newToken) => {
                    this.onRefreshSuccess(newToken);
                },
                error: (error) => {
                    this.onRefreshFailure(error);
                }
            }),
            catchError((error) => {
                // Ensure state is cleaned up
                this.refreshInProgress = false;
                return throwError(() => error);
            })
        );
    }

    /**
     * Check if a refresh is currently in progress
     */
    isRefreshInProgress(): boolean {
        return this.refreshInProgress;
    }

    /**
     * Cancel all pending requests (e.g., on logout)
     */
    cancelAllPending(): void {
        const error = new Error('Refresh cancelled - user logged out');
        this.pendingRequests.forEach(({ reject }) => reject(error));
        this.pendingRequests = [];
        this.refreshInProgress = false;
        this.refreshTokenSubject.next(null);
    }

    // ==================== Private Methods ====================

    /**
     * Wait for an in-progress refresh to complete
     */
    private waitForRefresh(): Observable<string> {
        return new Observable<string>((subscriber) => {
            // Add to pending queue
            const pendingRequest = {
                resolve: (token: string) => {
                    subscriber.next(token);
                    subscriber.complete();
                },
                reject: (error: Error) => {
                    subscriber.error(error);
                }
            };

            this.pendingRequests.push(pendingRequest);

            // Also subscribe to the subject as a backup
            // This handles the case where refresh completes between checks
            const subscription = this.refreshTokenSubject.pipe(
                filter((token): token is string => token !== null),
                take(1)
            ).subscribe({
                next: (token) => {
                    // Remove from pending queue if still there
                    const index = this.pendingRequests.indexOf(pendingRequest);
                    if (index > -1) {
                        this.pendingRequests.splice(index, 1);
                    }
                    subscriber.next(token);
                    subscriber.complete();
                },
                error: (error) => {
                    subscriber.error(error);
                }
            });

            // Cleanup
            return () => {
                subscription.unsubscribe();
                const index = this.pendingRequests.indexOf(pendingRequest);
                if (index > -1) {
                    this.pendingRequests.splice(index, 1);
                }
            };
        });
    }

    /**
     * Handle successful token refresh
     */
    private onRefreshSuccess(newToken: string): void {
        this.refreshInProgress = false;

        // Broadcast new token to all waiting requests
        this.refreshTokenSubject.next(newToken);

        // Resolve all pending requests
        const pendingRequests = [...this.pendingRequests];
        this.pendingRequests = [];

        pendingRequests.forEach(({ resolve }) => {
            resolve(newToken);
        });
    }

    /**
     * Handle failed token refresh
     */
    private onRefreshFailure(error: Error): void {
        this.refreshInProgress = false;

        // Clear the subject
        this.refreshTokenSubject.next(null);

        // Reject all pending requests
        const pendingRequests = [...this.pendingRequests];
        this.pendingRequests = [];

        pendingRequests.forEach(({ reject }) => {
            reject(error);
        });

        // Clear tokens in token service
        this.tokenService.clearTokens();
    }
}
