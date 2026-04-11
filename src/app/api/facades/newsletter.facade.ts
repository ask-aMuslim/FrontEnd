import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

export interface NewsletterSubscribePayload {
    email: string;
}

@Injectable({ providedIn: 'root' })
export class NewsletterFacade {
    /**
     * Backend endpoint is currently configured as /api/Newsletters/subscribe.
     * Keep this centralized so it can be updated easily if contract changes.
     */
    private readonly subscribeEndpoint = '/api/Newsletters/subscribe';

    constructor(private readonly api: ApiService) { }

    subscribe(payload: NewsletterSubscribePayload): Observable<boolean> {
        return this.api.post<unknown>(this.subscribeEndpoint, payload).pipe(
            map((response) => {
                if (typeof response === 'boolean') {
                    return response;
                }

                if (!response || typeof response !== 'object') {
                    return true;
                }

                const envelope = response as Record<string, unknown>;
                const succeeded = envelope['succeeded'] ?? envelope['Succeeded'];
                if (typeof succeeded === 'boolean') {
                    return succeeded;
                }

                const errors = envelope['errors'] ?? envelope['Errors'];
                if (Array.isArray(errors) && errors.length > 0) {
                    return false;
                }

                return true;
            }),
        );
    }
}
