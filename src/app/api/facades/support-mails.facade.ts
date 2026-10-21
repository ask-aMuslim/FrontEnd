import { HttpClient, HttpContext, HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_LOADING } from '../../core/http/context-tokens';
import { create4 } from '../fn/support-mails/create-4';
import { getEligibility } from '../fn/support-mails/get-eligibility';
import { getMine } from '../fn/support-mails/get-mine';
import { getMineById } from '../fn/support-mails/get-mine-by-id';
import { getTopics } from '../fn/support-mails/get-topics';
import { getUnreadCount } from '../fn/support-mails/get-unread-count';
import { markAsRead2 } from '../fn/support-mails/mark-as-read-2';
import { reply } from '../fn/support-mails/reply';
import type { CreateSupportMailCommand } from '../models/create-support-mail-command';
import type { MeetingInquiryTopic } from '../models/meeting-inquiry-topic';
import type { ReplyToMySupportMailCommand } from '../models/reply-to-my-support-mail-command';
import type {
  SupportMailDetail,
  SupportMailEligibility,
  SupportMailError,
  SupportMailListItem,
  SupportMailListQuery,
  SupportMailPage,
  SupportMailTopic,
} from './support-mails.models';

interface ResultEnvelope<T> {
  succeeded?: boolean;
  errors?: unknown;
  data?: T;
}

/**
 * The signed-in user's Support Mails (/api/SupportMails).
 *
 * Calls HttpClient directly instead of ApiService: ApiService retries every
 * request once, which could create a second mail (or hit the one-per-hour
 * limit) after a slow first attempt, and it drops the error body.
 * The generated fn/support-mails functions discard response bodies, so only
 * their paths and request models are reused here.
 */
@Injectable({ providedIn: 'root' })
export class SupportMailsFacade {
  private readonly http = inject(HttpClient);
  private readonly apiHostUrl = SupportMailsFacade.resolveApiHostUrl(environment.apiBaseUrl);

  getTopics(): Observable<SupportMailTopic[]> {
    return this.getData<SupportMailTopic[]>(getTopics.PATH, undefined, true).pipe(
      map((topics) => (Array.isArray(topics) ? topics : [])),
    );
  }

  getEligibility(): Observable<SupportMailEligibility> {
    return this.getData<SupportMailEligibility>(getEligibility.PATH, undefined, true).pipe(
      map((data) => ({
        canCreate: data?.canCreate !== false,
        nextAllowedAt: data?.nextAllowedAt ?? null,
      })),
    );
  }

  getUnreadCount(): Observable<number> {
    return this.getData<number>(getUnreadCount.PATH, undefined, true).pipe(
      map((count) => (typeof count === 'number' && Number.isFinite(count) ? count : 0)),
    );
  }

  getMine(query: SupportMailListQuery = {}): Observable<SupportMailPage<SupportMailListItem>> {
    let params = new HttpParams()
      .set('pageNumber', String(query.pageNumber ?? 1))
      .set('pageSize', String(query.pageSize ?? 10));
    if (query.status) {
      params = params.set('status', String(query.status));
    }
    const searchTerm = query.searchTerm?.trim();
    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    return this.getData<SupportMailPage<SupportMailListItem>>(getMine.PATH, params).pipe(
      map((page) => ({
        items: page?.items ?? [],
        pageNumber: page?.pageNumber ?? 1,
        totalPages: page?.totalPages ?? 0,
        totalCount: page?.totalCount ?? 0,
        hasPreviousPage: page?.hasPreviousPage ?? false,
        hasNextPage: page?.hasNextPage ?? false,
      })),
    );
  }

  getById(id: string): Observable<SupportMailDetail> {
    return this.getData<SupportMailDetail>(this.withId(getMineById.PATH, id)).pipe(
      map((mail) => ({ ...mail, messages: mail?.messages ?? [] })),
    );
  }

  /** Creates a mail and returns its id. */
  create(input: { topic: number; subject: string; explanation: string | null }): Observable<string> {
    const command: CreateSupportMailCommand = {
      topic: input.topic as MeetingInquiryTopic,
      subject: input.subject,
      explanation: input.explanation,
    };
    return this.http
      .post<unknown>(this.url(create4.PATH), command, { observe: 'response' })
      .pipe(
        map((response) => SupportMailsFacade.readCreatedId(response)),
        catchError((error: unknown) => throwError(() => SupportMailsFacade.normalizeError(error))),
      );
  }

  /** Adds a reply and returns the new message id. */
  reply(id: string, command: ReplyToMySupportMailCommand): Observable<string | null> {
    return this.http.post<ResultEnvelope<string>>(this.url(this.withId(reply.PATH, id)), command).pipe(
      map((response) => (typeof response?.data === 'string' ? response.data : null)),
      catchError((error: unknown) => throwError(() => SupportMailsFacade.normalizeError(error))),
    );
  }

  markAsRead(id: string): Observable<void> {
    return this.http
      .put<void>(this.url(this.withId(markAsRead2.PATH, id)), null, {
        context: new HttpContext().set(SKIP_LOADING, true),
      })
      .pipe(catchError((error: unknown) => throwError(() => SupportMailsFacade.normalizeError(error))));
  }

  /** Turns any error from these calls (ApiError, HttpErrorResponse, ...) into a SupportMailError. */
  static normalizeError(error: unknown): SupportMailError {
    const record = SupportMailsFacade.asRecord(error);
    const original = record?.['originalError'];
    const httpError = error instanceof HttpErrorResponse
      ? error
      : original instanceof HttpErrorResponse ? original : null;

    const statusCandidate = record?.['statusCode'] ?? record?.['status'];
    const status = httpError?.status
      ?? (typeof statusCandidate === 'number' ? statusCandidate : 0);

    const body = SupportMailsFacade.parseBody(httpError ? httpError.error : null);
    const messages: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    const errors = body?.['errors'];
    if (Array.isArray(errors)) {
      messages.push(...errors.filter((e): e is string => typeof e === 'string' && e.length > 0));
    } else if (errors && typeof errors === 'object') {
      for (const [field, value] of Object.entries(errors as Record<string, unknown>)) {
        const list = Array.isArray(value) ? value.map(String) : typeof value === 'string' ? [value] : [];
        if (list.length > 0) {
          fieldErrors[field.charAt(0).toLowerCase() + field.slice(1)] = list;
        }
      }
    }

    if (messages.length === 0 && Object.keys(fieldErrors).length === 0) {
      const detail = body?.['detail'] ?? body?.['message'] ?? record?.['message'];
      if (typeof detail === 'string' && detail.length > 0) {
        messages.push(detail);
      }
    }

    return { status, messages, fieldErrors };
  }

  private getData<T>(path: string, params?: HttpParams, background = false): Observable<T> {
    const context = background ? new HttpContext().set(SKIP_LOADING, true) : undefined;
    return this.http.get<ResultEnvelope<T>>(this.url(path), { params, context }).pipe(
      map((response) => response?.data as T),
      catchError((error: unknown) => throwError(() => SupportMailsFacade.normalizeError(error))),
    );
  }

  private url(path: string): string {
    return `${this.apiHostUrl}${path}`;
  }

  private withId(path: string, id: string): string {
    return path.replace('{id}', encodeURIComponent(id));
  }

  private static readCreatedId(response: HttpResponse<unknown>): string {
    const body = response.body;
    if (typeof body === 'string' && body.length > 0) {
      return body;
    }
    const data = SupportMailsFacade.asRecord(body)?.['data'];
    if (typeof data === 'string' && data.length > 0) {
      return data;
    }
    const location = response.headers.get('Location') ?? '';
    return location.split('/').filter(Boolean).pop() ?? '';
  }

  private static parseBody(body: unknown): Record<string, unknown> | null {
    if (typeof body === 'string') {
      try {
        return SupportMailsFacade.asRecord(JSON.parse(body));
      } catch {
        return null;
      }
    }
    return SupportMailsFacade.asRecord(body);
  }

  private static asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  }

  private static resolveApiHostUrl(apiBaseUrl: string): string {
    const base = apiBaseUrl.replaceAll(/\/+$/g, '');
    return base.endsWith('/api') ? base.slice(0, -4) : base;
  }
}
