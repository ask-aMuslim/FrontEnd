import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_LOADING } from '../../core/http/context-tokens';

export interface AssistantChatRequest {
  userId: string;
  message: string;
  threadId: string | null;
}

export interface AssistantThreadRecord {
  threadId: string;
  title?: string;
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
  title?: string | null;
}

interface ChatStreamBody {
  userId: string;
  question: string;
  threadId: string | null;
}

@Injectable({ providedIn: 'root' })
export class AssistantChatFacade {
  private readonly baseUrl = environment.askAssistantApiBaseUrl.replaceAll(/\/+$/g, '');
  private readonly jsonHeaders = new HttpHeaders({ Accept: 'application/json' });
  private readonly jsonContext = new HttpContext().set(SKIP_LOADING, true);
  private readonly streamHeaders = new HttpHeaders({
    Accept: 'application/x-ndjson, text/event-stream, application/json',
    'Content-Type': 'application/json',
    'X-stream': 'true',
  });
  private readonly streamContext = new HttpContext().set(SKIP_LOADING, true);

  constructor(private readonly http: HttpClient) { }

  listUserThreads(userId: string): Observable<AssistantThreadRecord[]> {
    const encodedUserId = encodeURIComponent(userId);
    const primaryUrl = `${this.baseUrl}/api/users/${encodedUserId}/threads`;
    const fallbackUrl = `${this.baseUrl}/api/conversations/${encodedUserId}`;

    return this
      .getWithFallback(primaryUrl, fallbackUrl, (error) => this.isNotFound(error))
      .pipe(map((payload) => this.normalizeThreads(payload)));
  }

  getThread(threadId: string): Observable<AssistantThreadRecord> {
    const encodedThreadId = encodeURIComponent(threadId);
    const primaryUrl = `${this.baseUrl}/api/threads/${encodedThreadId}`;
    const fallbackUrl = `${this.baseUrl}/api/Conversations/${encodedThreadId}`;

    return this
      .getWithFallback(primaryUrl, fallbackUrl, (error) => this.shouldUseLegacyHistoryFallback(error))
      .pipe(map((payload) => {
        const records = this.normalizeThreads({ data: [payload] });
        if (records.length === 0) {
          const fallback = this.asRecord(payload);
          const threadId = fallback ? this.readStringMeta(fallback, ['thread_id', 'threadId', 'id']) : null;
          if (threadId) {
            return {
              threadId,
              createdAt: this.toTimestamp(fallback?.['created_at'] ?? fallback?.['createdAt']),
              updatedAt: this.toTimestamp(fallback?.['updated_at'] ?? fallback?.['updatedAt']),
              title: this.readStringRaw(fallback!, ['threadname', 'title', 'name']) ?? undefined,
            };
          }
          throw new Error('Thread not found in response payload');
        }
        return records[0];
      }));
  }

  getThreadHistory(threadId: string): Observable<AssistantHistoryRecord[]> {
    const encodedThreadId = encodeURIComponent(threadId);
    const primaryUrl = `${this.baseUrl}/api/threads/${encodedThreadId}/history`;
    const fallbackUrl = `${this.baseUrl}/api/Conversations/${encodedThreadId}`;

    return this
      .getWithFallback(primaryUrl, fallbackUrl, (error) => this.shouldUseLegacyHistoryFallback(error))
      .pipe(map((payload) => this.normalizeHistory(payload)));
  }

  streamChat(request: AssistantChatRequest): Observable<AssistantStreamRecord> {
    const body = this.buildStreamBody(request);
    const endpoint = `${this.baseUrl}/api/chat?stream=true`;

    return new Observable<AssistantStreamRecord>((subscriber) => {
      let isUnsubscribed = false;
      const abortController = new AbortController();

      let pendingLine = '';
      // Track the accumulated streamed text so we can detect and skip the
      // final "summary" chunk that some backends emit (it contains the full
      // response as a single `message`/`response` field, duplicating what
      // was already delivered token-by-token as `delta` events).
      let accumulatedText = '';

      const emitFromChunk = (chunkStr: string): void => {
        const buffer = `${pendingLine}${chunkStr}`;
        const parsed = this.parseStreamBuffer(buffer, false);
        pendingLine = parsed.remainder;

        for (const event of parsed.events) {
          if (event.kind === 'delta' && event.text) {
            // Deduplicate: skip if text looks like the accumulated summary
            const isSummary = event.text.length > 200 &&
              accumulatedText.length > 50 &&
              event.text.replace(/\s/g, '').includes(
                accumulatedText.replace(/\s/g, '').slice(0, 80)
              );
            if (isSummary) {
              console.log('[FACADE SKIP SUMMARY DUPLICATE]', event.text.length, 'chars');
              continue;
            }
            accumulatedText += event.text;
          }
          console.log('[FACADE EMIT FROM CHUNK]', event);
          subscriber.next(event);
        }
      };

      globalThis.fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/x-ndjson, text/event-stream, application/json',
          'Content-Type': 'application/json',
          'X-stream': 'true',
        },
        body: JSON.stringify(body),
        signal: abortController.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Stream HTTP Error: ${response.status}`);
          }

          if (!response.body) {
            throw new Error('Stream response body is empty');
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder('utf-8');

          while (!isUnsubscribed) {
            const { done, value } = await reader.read();
            if (done) {
              // Process the final remainder
              if (pendingLine.trim()) {
                const parsed = this.parseStreamBuffer(pendingLine, true);
                for (const event of parsed.events) {
                  console.log('[FACADE REMAINDER CHUNK]', event);
                  subscriber.next(event);
                }
              }
              break;
            }

            const chunkStr = decoder.decode(value, { stream: true });
            emitFromChunk(chunkStr);
          }

          if (!isUnsubscribed) {
            subscriber.complete();
          }
        })
        .catch((error) => {
          if (!isUnsubscribed && error.name !== 'AbortError') {
            subscriber.error(error);
          }
        });

      return () => {
        isUnsubscribed = true;
        abortController.abort();
      };
    });
  }

  private getWithFallback(
    primaryUrl: string,
    fallbackUrl: string,
    shouldFallback: (error: unknown) => boolean,
  ): Observable<unknown> {
    return this.http.get<unknown>(primaryUrl, { headers: this.jsonHeaders, context: this.jsonContext }).pipe(
      catchError((error: unknown) => {
        if (shouldFallback(error)) {
          return this.http.get<unknown>(fallbackUrl, { headers: this.jsonHeaders, context: this.jsonContext });
        }

        return throwError(() => error);
      }),
    );
  }

  private shouldUseLegacyHistoryFallback(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    // The legacy /api/Conversations/{id} history route is still required
    // for some deployments when the newer /api/threads/{id}/history route
    // responds with non-404 errors (e.g. 405/5xx during rollout drift).
    if (error.status === 401 || error.status === 403) {
      return false;
    }

    return error.status === 0 || error.status >= 400;
  }

  private parseStreamBuffer(buffer: string, flushRemainder: boolean): {
    events: AssistantStreamRecord[];
    remainder: string;
  } {
    // SECURITY: The backend incorrectly serializes the SSE boundaries as literal slash-n 
    // strings ("\\n") instead of genuine newline characters. We must surgically unescape 
    // the boundaries without corrupting inner JSON payloads which legally contain "\\n".
    const normalizedBuffer = buffer
      .replace(/\\n\\nevent:/g, '\n\nevent:')
      .replace(/\\nevent:/g, '\nevent:')
      .replace(/\\ndata:/g, '\ndata:')
      .replace(/\\n\\n$/g, '\n\n')
      .replaceAll('\r\n', '\n');

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

    if (
      normalizedLine.startsWith('event:')
      || normalizedLine.startsWith('id:')
      || normalizedLine.startsWith('retry:')
      || normalizedLine.startsWith(':')
    ) {
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
      // Plain-text delta — preserve whitespace exactly as received
      return [{
        kind: 'delta',
        text: payload,
        threadId: null,
        statusCode: null,
      }];
    }

    const parsedData = this.asRecord(parsed['data']);
    const threadId = this.readStringMeta(parsed, ['threadId', 'thread_id'])
      ?? (parsedData ? this.readStringMeta(parsedData, ['threadId', 'thread_id']) : null);
    const statusCode = this.readNumber(parsed, ['statusCode', 'status', 'code'])
      ?? (parsedData ? this.readNumber(parsedData, ['statusCode', 'status', 'code']) : null);
    const title = this.readStringRaw(parsed, ['threadname', 'threadTitle', 'thread_title', 'title', 'threadName', 'thread_name', 'name'])
      ?? (parsedData ? this.readStringRaw(parsedData, ['threadname', 'threadTitle', 'thread_title', 'title', 'threadName', 'thread_name', 'name']) : null);

    // Read delta text — do NOT trim so leading spaces between tokens are preserved.
    // The backend sends {kind:'delta', text:' token'} — 'text' is the primary key.
    // Also check 'delta', 'token', 'chunk' as fallbacks for other backends.
    const deltaText = this.readStringRaw(parsed, ['text', 'delta', 'token', 'chunk'])
      ?? (parsedData ? this.readStringRaw(parsedData, ['text', 'delta', 'token', 'chunk']) : null);

    // 'message', 'content', 'response' are summary fields sent once at the end.
    // They contain the FULL accumulated answer and must be ignored as deltas
    // to prevent duplication. We only use them to extract metadata (threadId).
    const summaryText = this.readStringRaw(parsed, ['message', 'content', 'response'])
      ?? (parsedData ? this.readStringRaw(parsedData, ['response', 'message', 'content']) : null)
      ?? '';

    // Use deltaText if present. If deltaText IS the text field but it's a very long
    // summary (> 150 chars) and we already have accumulated content, it is a duplicate.
    // The de-duplication in emitFromChunk handles this case in the outer loop.
    const text = deltaText ?? (summaryText.length <= 150 ? summaryText : '');

    const parsedErrors = parsed['errors'];
    const errors = Array.isArray(parsedErrors)
      ? parsedErrors.map((entry) => `${entry ?? ''}`.trim()).filter((entry) => entry.length > 0)
      : [];
    const firstError = this.readStringMeta(parsed, ['error', 'detail']);

    const isError = (statusCode !== null && statusCode >= 400)
      || errors.length > 0
      || (!!firstError && !text);
    let kind: AssistantStreamKind = 'meta';
    if (isError) {
      kind = 'error';
    } else if (text) {
      kind = 'delta';
    }

    const errorText = errors.length > 0
      ? errors.join('\n')
      : (firstError ?? '');

    const parsedRecord: AssistantStreamRecord = {
      kind,
      text: kind === 'error' && errorText ? errorText : text,
      threadId,
      statusCode,
      title,
    };
    console.log('[DEBUG STREAM PAYLOAD]:', parsedRecord);
    return [parsedRecord];
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
        const title = this.readStringRaw(entry, ['threadname', 'title', 'name']) ?? undefined;

        return {
          threadId,
          title,
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

  /**
   * Read a metadata string field — trims whitespace.
   * Use for IDs, error messages, role strings, etc. (NOT for content/delta tokens).
   */
  private readStringMeta(record: Record<string, unknown>, keys: readonly string[]): string | null {
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }

    return null;
  }

  /**
   * Read a content/delta string field — preserves whitespace exactly.
   * Use for streaming tokens and message text where leading spaces matter.
   */
  private readStringRaw(record: Record<string, unknown>, keys: readonly string[]): string | null {
    for (const key of keys) {
      const candidate = record[key];
      // Allow strings that are non-empty even if only whitespace (spaces between tokens)
      if (typeof candidate === 'string' && candidate.length > 0) {
        return candidate;
      }
    }

    return null;
  }

  /** @deprecated Use readStringMeta or readStringRaw instead */
  private readString(record: Record<string, unknown>, keys: readonly string[]): string | null {
    return this.readStringMeta(record, keys);
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
