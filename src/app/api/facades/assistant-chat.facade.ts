import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subscriber, catchError, map, throwError } from 'rxjs';
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

interface AssistantStreamState {
  pendingLine: string;
  accumulatedText: string;
}

function resolveAssistantBaseUrls(primaryUrl: string, fallbackUrl: string): string[] {
  const urls = [primaryUrl, fallbackUrl]
    .map((value) => value.trim().replaceAll(/\/+$/g, ''))
    .filter((value) => value.length > 0);

  return [...new Set(urls)];
}

@Injectable({ providedIn: 'root' })
export class AssistantChatFacade {
  private readonly assistantBaseUrls = resolveAssistantBaseUrls(
    environment.askAssistantApiBaseUrl,
    environment.askAssistantApiBaseUrlFallback,
  );
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
    const primaryUrls = this.buildAssistantUrlCandidates(`/api/users/${encodedUserId}/threads`);
    const fallbackUrls = this.buildAssistantUrlCandidates(`/api/conversations/${encodedUserId}`);

    return this
      .getWithFallback(primaryUrls, fallbackUrls, (error) => this.isNotFound(error))
      .pipe(map((payload) => this.normalizeThreads(payload)));
  }

  getThread(threadId: string): Observable<AssistantThreadRecord> {
    const encodedThreadId = encodeURIComponent(threadId);
    const primaryUrls = this.buildAssistantUrlCandidates(`/api/threads/${encodedThreadId}`);
    const fallbackUrls = this.buildAssistantUrlCandidates(`/api/Conversations/${encodedThreadId}`);

    return this
      .getWithFallback(primaryUrls, fallbackUrls, (error) => this.shouldUseLegacyHistoryFallback(error))
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
    const primaryUrls = this.buildAssistantUrlCandidates(`/api/threads/${encodedThreadId}/history`);
    const fallbackUrls = this.buildAssistantUrlCandidates(`/api/Conversations/${encodedThreadId}`);

    return this
      .getWithFallback(primaryUrls, fallbackUrls, (error) => this.shouldUseLegacyHistoryFallback(error))
      .pipe(map((payload) => this.normalizeHistory(payload)));
  }

  streamChat(request: AssistantChatRequest): Observable<AssistantStreamRecord> {
    const body = this.buildStreamBody(request);
    const endpoints = this.buildAssistantUrlCandidates('/api/chat?stream=true');

    return new Observable<AssistantStreamRecord>((subscriber) => {
      const abortController = new AbortController();
      const streamState: AssistantStreamState = {
        pendingLine: '',
        accumulatedText: '',
      };

      void this.runAssistantStream(endpoints, body, abortController, streamState, subscriber)
        .catch((error: unknown) => {
          if (!this.isAbortError(error)) {
            subscriber.error(error);
          }
        });

      return () => {
        abortController.abort();
      };
    });
  }

  private buildAssistantUrlCandidates(path: string): string[] {
    return this.assistantBaseUrls.map((baseUrl) => `${baseUrl}${path}`);
  }

  private getWithFallback(
    primaryUrls: readonly string[],
    fallbackUrls: readonly string[],
    shouldFallback: (error: unknown) => boolean,
  ): Observable<unknown> {
    return this.tryGetFromCandidates(primaryUrls).pipe(
      catchError((error: unknown) => {
        if (!shouldFallback(error)) {
          return throwError(() => error);
        }

        return this.tryGetFromCandidates(fallbackUrls);
      }),
    );
  }

  private tryGetFromCandidates(urls: readonly string[]): Observable<unknown> {
    const [url, ...rest] = urls;
    if (!url) {
      return throwError(() => new Error('No assistant API URL candidates are available.'));
    }

    return this.http.get<unknown>(url, { headers: this.jsonHeaders, context: this.jsonContext }).pipe(
      catchError((error: unknown) => {
        if (rest.length === 0) {
          return throwError(() => error);
        }

        return this.tryGetFromCandidates(rest);
      }),
    );
  }

  private async runAssistantStream(
    candidateEndpoints: readonly string[],
    body: ChatStreamBody,
    abortController: AbortController,
    streamState: AssistantStreamState,
    subscriber: Subscriber<AssistantStreamRecord>,
  ): Promise<void> {
    let lastError: unknown = null;

    for (const endpoint of candidateEndpoints) {
      try {
        await this.processAssistantStreamEndpoint(endpoint, body, abortController, streamState, subscriber);
        subscriber.complete();
        return;
      } catch (error) {
        if (this.isAbortError(error)) {
          return;
        }

        lastError = error;
        streamState.pendingLine = '';
        streamState.accumulatedText = '';
      }
    }

    throw lastError ?? new Error('Unable to connect to the assistant stream.');
  }

  private async processAssistantStreamEndpoint(
    endpoint: string,
    body: ChatStreamBody,
    abortController: AbortController,
    streamState: AssistantStreamState,
    subscriber: Subscriber<AssistantStreamRecord>,
  ): Promise<void> {
    const response = await globalThis.fetch(endpoint, {
      method: 'POST',
      headers: {
        'Accept': 'application/x-ndjson, text/event-stream, application/json',
        'Content-Type': 'application/json',
        'X-stream': 'true',
      },
      body: JSON.stringify(body),
      signal: abortController.signal,
    });

    this.assertStreamResponse(response);
    await this.consumeAssistantStreamResponse(response, streamState, subscriber, abortController.signal);
  }

  private assertStreamResponse(response: Response): void {
    if (!response.ok) {
      throw new Error(`Stream HTTP Error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Stream response body is empty');
    }
  }

  private async consumeAssistantStreamResponse(
    response: Response,
    streamState: AssistantStreamState,
    subscriber: Subscriber<AssistantStreamRecord>,
    signal: AbortSignal,
  ): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Stream response body is empty');
    }

    const decoder = new TextDecoder('utf-8');

    try {
      while (!signal.aborted) {
        const { done, value } = await reader.read();
        if (done) {
          this.flushAssistantStreamRemainder(streamState, subscriber);
          return;
        }

        const chunkStr = decoder.decode(value, { stream: true });
        this.emitAssistantStreamChunk(chunkStr, streamState, subscriber);
      }
    } finally {
      reader.releaseLock();
    }
  }

  private emitAssistantStreamChunk(
    chunkStr: string,
    streamState: AssistantStreamState,
    subscriber: Subscriber<AssistantStreamRecord>,
  ): void {
    const buffer = `${streamState.pendingLine}${chunkStr}`;
    const parsed = this.parseStreamBuffer(buffer, false);
    streamState.pendingLine = parsed.remainder;

    for (const event of parsed.events) {
      if (event.kind === 'delta' && event.text) {
        if (this.isSummaryDuplicate(event.text, streamState.accumulatedText)) {
          console.log('[FACADE SKIP SUMMARY DUPLICATE]', event.text.length, 'chars');
          continue;
        }

        streamState.accumulatedText += event.text;
      }

      console.log('[FACADE EMIT FROM CHUNK]', event);
      subscriber.next(event);
    }
  }

  private flushAssistantStreamRemainder(
    streamState: AssistantStreamState,
    subscriber: Subscriber<AssistantStreamRecord>,
  ): void {
    if (!streamState.pendingLine.trim()) {
      return;
    }

    const parsed = this.parseStreamBuffer(streamState.pendingLine, true);
    for (const event of parsed.events) {
      console.log('[FACADE REMAINDER CHUNK]', event);
      subscriber.next(event);
    }
  }

  private isSummaryDuplicate(text: string, accumulatedText: string): boolean {
    return text.length > 200
      && accumulatedText.length > 50
      && text.replace(/\s/g, '').includes(
        accumulatedText.replace(/\s/g, '').slice(0, 80),
      );
  }

  private isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
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
      .replaceAll(String.raw`\n\nevent:`, String.raw`\n\nevent:`)
      .replaceAll(String.raw`\nevent:`, String.raw`\nevent:`)
      .replaceAll(String.raw`\ndata:`, String.raw`\ndata:`)
      .replaceAll(String.raw`\n\n`, String.raw`\n\n`)
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

    // 'message', 'content', 'response' are summary fields sent once at the end
    // (e.g. in the backend's `done` SSE event). They contain the FULL accumulated
    // answer and must NEVER be treated as delta text — doing so causes the full
    // response to be appended a second time after streaming completes.
    // We read them only to extract metadata (threadId, title, etc.).

    // Only deltaText drives the visible bubble. Summary fields are always ignored.
    const text = deltaText ?? '';

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

    return threadCandidates.reduce<AssistantThreadRecord[]>((records, entry) => {
      const record = this.asRecord(entry);
      if (!record) {
        return records;
      }

      const threadId = this.readStringMeta(record, ['thread_id', 'threadId', 'id']);
      if (!threadId) {
        return records;
      }

      const createdAt = this.toTimestamp(record['created_at'] ?? record['createdAt']);
      const updatedAt = this.toTimestamp(record['updated_at'] ?? record['updatedAt'] ?? record['created_at'] ?? record['createdAt']);
      const title = this.readStringRaw(record, ['threadname', 'title', 'name']) ?? undefined;

      records.push({
        threadId,
        title,
        createdAt,
        updatedAt,
      });

      return records;
    }, []).sort((left, right) => right.updatedAt - left.updatedAt);
  }

  private normalizeHistory(payload: unknown): AssistantHistoryRecord[] {
    const messageCandidates = this.extractArray(payload, ['messages', 'history', 'items', 'data', 'results']);

    return messageCandidates.reduce<AssistantHistoryRecord[]>((records, entry) => {
      const record = this.asRecord(entry);
      if (!record) {
        return records;
      }

      const content = this.readStringRaw(record, ['content', 'text', 'message']) ?? '';
      if (!content) {
        return records;
      }

      const rawRole = this.readStringMeta(record, ['role', 'sender']) ?? 'assistant';
      const role = rawRole.toLowerCase() === 'user' ? 'user' : 'assistant';

      records.push({
        role,
        content,
        createdAt: this.toTimestamp(record['created_at'] ?? record['createdAt']),
      });

      return records;
    }, []);
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
