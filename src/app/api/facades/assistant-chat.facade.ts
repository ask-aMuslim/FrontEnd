import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AssistantChatRequest {
  userId: string;
  message: string;
  threadId: string | null;
}

export interface AssistantThreadRecord {
  threadId: string;
  createdAt: number;
  updatedAt: number;
}

export type AssistantRole = 'user' | 'assistant';

export interface AssistantHistoryRecord {
  role: AssistantRole;
  content: string;
  createdAt: number;
}

export type AssistantStreamKind = 'meta' | 'delta' | 'error';

export interface AssistantStreamRecord {
  kind: AssistantStreamKind;
  text: string;
  threadId: string | null;
  statusCode: number | null;
}

interface ChatStreamBody {
  userId: string;
  question: string;
  threadId: string | null;
  UserId: string;
  Message: string;
  ThreadId: string | null;
}

@Injectable({ providedIn: 'root' })
export class AssistantChatFacade {
  private readonly baseUrl = environment.askAssistantApiBaseUrl.replaceAll(/\/+$/g, '');
  private readonly jsonHeaders = new HttpHeaders({ Accept: 'application/json' });
  private readonly streamHeaders = new HttpHeaders({
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
    'X-Stream': 'true',
  });

  constructor(private readonly http: HttpClient) { }

  listUserThreads(userId: string): Observable<AssistantThreadRecord[]> {
    const encodedUserId = encodeURIComponent(userId);
    const primaryUrl = `${this.baseUrl}/api/conversations/${encodedUserId}`;
    const fallbackUrl = `${this.baseUrl}/api/users/${encodedUserId}/threads`;

    return this
      .getWithNotFoundFallback(primaryUrl, fallbackUrl)
      .pipe(map((payload) => this.normalizeThreads(payload)));
  }

  getThreadHistory(threadId: string): Observable<AssistantHistoryRecord[]> {
    const encodedThreadId = encodeURIComponent(threadId);
    const primaryUrl = `${this.baseUrl}/api/Conversations/${encodedThreadId}`;
    const fallbackUrl = `${this.baseUrl}/api/threads/${encodedThreadId}/history`;

    return this
      .getWithNotFoundFallback(primaryUrl, fallbackUrl)
      .pipe(map((payload) => this.normalizeHistory(payload)));
  }

  streamChat(request: AssistantChatRequest): Observable<AssistantStreamRecord> {
    const body = this.buildStreamBody(request);
    const endpoint = `${this.baseUrl}/api/chat`;

    return new Observable<AssistantStreamRecord>((subscriber) => {
      let processedLength = 0;
      let pendingLine = '';

      const emitFromFullText = (fullText: string, flushRemainder: boolean): void => {
        if (!flushRemainder && fullText.length <= processedLength) {
          return;
        }

        const deltaText = flushRemainder
          ? pendingLine
          : fullText.slice(processedLength);

        if (!flushRemainder) {
          processedLength = fullText.length;
        }

        const buffer = flushRemainder ? deltaText : `${pendingLine}${deltaText}`;
        const parsed = this.parseStreamBuffer(buffer, flushRemainder);
        pendingLine = parsed.remainder;

        for (const event of parsed.events) {
          subscriber.next(event);
        }
      };

      const requestSubscription = this.http.request('POST', endpoint, {
        body,
        headers: this.streamHeaders,
        observe: 'events',
        reportProgress: true,
        responseType: 'text',
      }).subscribe({
        next: (event: HttpEvent<string>) => {
          if (event.type === HttpEventType.DownloadProgress) {
            emitFromFullText(event.partialText ?? '', false);
            return;
          }

          if (event.type === HttpEventType.Response) {
            emitFromFullText(event.body ?? '', false);
            emitFromFullText('', true);
            subscriber.complete();
          }
        },
        error: (error: unknown) => subscriber.error(error),
      });

      return () => {
        requestSubscription.unsubscribe();
      };
    });
  }

  private getWithNotFoundFallback(primaryUrl: string, fallbackUrl: string): Observable<unknown> {
    return this.http.get<unknown>(primaryUrl, { headers: this.jsonHeaders }).pipe(
      catchError((error: unknown) => {
        if (this.isNotFound(error)) {
          return this.http.get<unknown>(fallbackUrl, { headers: this.jsonHeaders });
        }

        return throwError(() => error);
      }),
    );
  }

  private parseStreamBuffer(buffer: string, flushRemainder: boolean): {
    events: AssistantStreamRecord[];
    remainder: string;
  } {
    const normalizedBuffer = buffer.replaceAll('\r\n', '\n');
    const lines = normalizedBuffer.split('\n');
    const lineCount = lines.length;

    const parseLimit = flushRemainder ? lineCount : Math.max(0, lineCount - 1);
    const remainder = flushRemainder || lineCount === 0 ? '' : lines[lineCount - 1] ?? '';

    const events: AssistantStreamRecord[] = [];

    for (let index = 0; index < parseLimit; index += 1) {
      const lineEvents = this.parseStreamLine(lines[index] ?? '');
      if (lineEvents.length > 0) {
        events.push(...lineEvents);
      }
    }

    return { events, remainder };
  }

  private parseStreamLine(rawLine: string): AssistantStreamRecord[] {
    const normalizedLine = rawLine.trim();
    if (!normalizedLine) {
      return [];
    }

    const payload = normalizedLine.startsWith('data:')
      ? normalizedLine.slice(5).trim()
      : normalizedLine;

    if (!payload || payload === '[DONE]') {
      return [];
    }

    return this.parseStreamPayload(payload);
  }

  private parseStreamPayload(payload: string): AssistantStreamRecord[] {
    const parsed = this.tryParseJson(payload);
    if (!parsed) {
      return [{
        kind: 'delta',
        text: payload,
        threadId: null,
        statusCode: null,
      }];
    }

    const threadId = this.readString(parsed, ['threadId', 'thread_id']);
    const statusCode = this.readNumber(parsed, ['statusCode', 'status', 'code']);
    const text = this.readString(parsed, ['data', 'message', 'content']) ?? '';

    const isError = statusCode !== null && statusCode >= 400;
    let kind: AssistantStreamKind = 'meta';
    if (isError) {
      kind = 'error';
    } else if (text) {
      kind = 'delta';
    }

    return [{
      kind,
      text,
      threadId,
      statusCode,
    }];
  }

  private normalizeThreads(payload: unknown): AssistantThreadRecord[] {
    const threadCandidates = this.extractArray(payload, ['threads', 'conversations', 'items', 'data', 'results']);

    return threadCandidates
      .map((entry) => this.asRecord(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .map((entry) => {
        const threadId = this.readString(entry, ['thread_id', 'threadId', 'id']);
        if (!threadId) {
          return null;
        }

        const createdAt = this.toTimestamp(entry['created_at'] ?? entry['createdAt']);
        const updatedAt = this.toTimestamp(entry['updated_at'] ?? entry['updatedAt'] ?? entry['created_at'] ?? entry['createdAt']);

        return {
          threadId,
          createdAt,
          updatedAt,
        } as AssistantThreadRecord;
      })
      .filter((entry): entry is AssistantThreadRecord => entry !== null)
      .sort((left, right) => right.updatedAt - left.updatedAt);
  }

  private normalizeHistory(payload: unknown): AssistantHistoryRecord[] {
    const messageCandidates = this.extractArray(payload, ['messages', 'history', 'items', 'data', 'results']);

    return messageCandidates
      .map((entry) => this.asRecord(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .map((entry) => {
        const content = this.readString(entry, ['content', 'text', 'message']) ?? '';
        if (!content) {
          return null;
        }

        const rawRole = this.readString(entry, ['role', 'sender']) ?? 'assistant';
        const role = rawRole.toLowerCase() === 'user' ? 'user' : 'assistant';

        return {
          role,
          content,
          createdAt: this.toTimestamp(entry['created_at'] ?? entry['createdAt']),
        } as AssistantHistoryRecord;
      })
      .filter((entry): entry is AssistantHistoryRecord => entry !== null);
  }

  private extractArray(payload: unknown, preferredKeys: readonly string[]): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    const record = this.asRecord(payload);
    if (!record) {
      return [];
    }

    for (const key of preferredKeys) {
      const candidate = record[key];
      if (Array.isArray(candidate)) {
        return candidate;
      }

      const nested = this.asRecord(candidate);
      if (!nested) {
        continue;
      }

      for (const nestedKey of preferredKeys) {
        const nestedCandidate = nested[nestedKey];
        if (Array.isArray(nestedCandidate)) {
          return nestedCandidate;
        }
      }
    }

    return [];
  }

  private buildStreamBody(request: AssistantChatRequest): ChatStreamBody {
    return {
      userId: request.userId,
      question: request.message,
      threadId: request.threadId,
      UserId: request.userId,
      Message: request.message,
      ThreadId: request.threadId,
    };
  }

  private isNotFound(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 404;
  }

  private tryParseJson(value: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(value) as unknown;
      return this.asRecord(parsed);
    } catch {
      return null;
    }
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : null;
  }

  private readString(record: Record<string, unknown>, keys: readonly string[]): string | null {
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }

    return null;
  }

  private readNumber(record: Record<string, unknown>, keys: readonly string[]): number | null {
    for (const key of keys) {
      const candidate = record[key];

      if (typeof candidate === 'number' && Number.isFinite(candidate)) {
        return candidate;
      }

      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        const parsed = Number(candidate);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private toTimestamp(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value > 10_000_000_000 ? value : value * 1000;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const normalized = value.includes('T')
        ? value
        : value.replace(' ', 'T');
      const parsed = Date.parse(normalized);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return Date.now();
  }
}
