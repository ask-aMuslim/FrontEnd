import { Injectable, WritableSignal, signal } from '@angular/core';

const CHAT_API_BASE_URL = 'https://travis-photographic-pool-fares.trycloudflare.com';

type JsonRecord = Record<string, unknown>;

interface ParsedSseFrame {
    readonly eventType: string;
    readonly payload: string;
}

interface ParsedFrameBatch {
    readonly frames: readonly string[];
    readonly remainder: string;
}

interface HandledFrameResult {
    readonly isDoneEvent: boolean;
}

interface NormalizedChatRequest {
    readonly userId: string;
    readonly question: string;
    readonly threadId: string | null;
}

export interface ChatStreamRequest {
    readonly userId: string;
    readonly question: string;
    readonly threadId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
    readonly streamedResponse: WritableSignal<string> = signal('');
    readonly isStreaming: WritableSignal<boolean> = signal(false);
    readonly error: WritableSignal<string | null> = signal(null);
    readonly activeThreadId: WritableSignal<string | null> = signal(null);

    private abortController: AbortController | null = null;

    async startStream(request: ChatStreamRequest): Promise<void> {
        const normalizedRequest = this.normalizeRequest(request);
        if (!normalizedRequest) {
            return;
        }

        this.stopStream();

        const controller = new AbortController();
        this.initializeStreamState(controller, normalizedRequest.threadId);

        try {
            const response = await this.openStreamResponse(normalizedRequest, controller.signal);
            const receivedDoneEvent = await this.consumeStreamResponse(response);

            if (!receivedDoneEvent && !controller.signal.aborted) {
                this.error.set('The chat stream ended unexpectedly. Please retry.');
            }
        } catch (error: unknown) {
            if (!this.isAbortError(error)) {
                this.error.set(this.toErrorMessage(error));
            }
        } finally {
            this.finalizeController(controller);
        }
    }

    stopStream(): void {
        const activeController = this.abortController;
        if (!activeController) {
            return;
        }

        this.abortController = null;
        activeController.abort();
        this.isStreaming.set(false);
    }

    private normalizeRequest(request: ChatStreamRequest): NormalizedChatRequest | null {
        const userId = request.userId.trim();
        const question = request.question.trim();

        if (!userId || !question) {
            this.error.set('A non-empty user ID and question are required to start the stream.');
            return null;
        }

        return {
            userId,
            question,
            threadId: request.threadId ?? null,
        };
    }

    private initializeStreamState(controller: AbortController, threadId: string | null): void {
        this.abortController = controller;
        this.activeThreadId.set(threadId);
        this.streamedResponse.set('');
        this.error.set(null);
        this.isStreaming.set(true);
    }

    private finalizeController(controller: AbortController): void {
        if (this.abortController !== controller) {
            return;
        }

        this.abortController = null;
        this.isStreaming.set(false);
    }

    private async openStreamResponse(
        request: NormalizedChatRequest,
        signal: AbortSignal,
    ): Promise<Response> {
        const endpoint = `${CHAT_API_BASE_URL}/api/chat?stream=true`;
        const response = await globalThis.fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'text/event-stream, application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
            signal,
        });

        if (!response.ok) {
            throw new Error(`Chat stream request failed (${response.status} ${response.statusText}).`);
        }

        if (!response.body) {
            throw new Error('The server response did not include a readable stream.');
        }

        return response;
    }

    private async consumeStreamResponse(response: Response): Promise<boolean> {
        if (!response.body) {
            return false;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let pendingBuffer = '';
        let receivedDoneEvent = false;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }

                pendingBuffer += decoder.decode(value, { stream: true });
                const parsedBatch = this.extractCompleteFrames(pendingBuffer);
                pendingBuffer = parsedBatch.remainder;
                receivedDoneEvent = this.consumeFrameBatch(parsedBatch.frames, receivedDoneEvent);
            }

            pendingBuffer += decoder.decode();
            const trailingFrames = this.extractCompleteFrames(pendingBuffer, true);
            return this.consumeFrameBatch(trailingFrames.frames, receivedDoneEvent);
        } finally {
            reader.releaseLock();
        }
    }

    private consumeFrameBatch(frames: readonly string[], hasDoneEvent: boolean): boolean {
        let receivedDoneEvent = hasDoneEvent;

        for (const frame of frames) {
            const handled = this.handleSseFrame(frame);
            if (handled.isDoneEvent) {
                receivedDoneEvent = true;
            }
        }

        return receivedDoneEvent;
    }

    private handleSseFrame(frame: string): HandledFrameResult {
        const parsedFrame = this.parseSseFrame(frame);
        if (!parsedFrame) {
            return { isDoneEvent: false };
        }

        if (parsedFrame.payload === '[DONE]') {
            return { isDoneEvent: true };
        }

        const payloadRecord = this.tryParseRecord(parsedFrame.payload);

        if (!payloadRecord) {
            if (parsedFrame.eventType === 'done') {
                this.applyFinalSnapshot(parsedFrame.payload);
                return { isDoneEvent: true };
            }

            this.appendDelta(parsedFrame.payload);
            return { isDoneEvent: false };
        }

        const statusCode = this.readNumber(payloadRecord, ['statusCode', 'status', 'code']);
        if (statusCode !== null && statusCode >= 400) {
            const message = this.resolveErrorMessage(payloadRecord)
                ?? `The stream failed with status code ${statusCode}.`;
            this.error.set(message);
            return { isDoneEvent: true };
        }

        const resolvedThreadId = this.readString(payloadRecord, ['threadId', 'thread_id'])
            ?? this.readNestedString(payloadRecord, 'data', ['threadId', 'thread_id']);
        if (resolvedThreadId) {
            this.activeThreadId.set(resolvedThreadId);
        }

        const delta = this.resolveDeltaToken(payloadRecord);
        if (delta) {
            this.appendDelta(delta);
        }

        const shouldFinalize = parsedFrame.eventType === 'done';
        if (shouldFinalize) {
            const finalSnapshot = this.resolveFinalSnapshot(payloadRecord);
            if (finalSnapshot) {
                this.applyFinalSnapshot(finalSnapshot);
            }
            return { isDoneEvent: true };
        }

        const errorMessage = this.resolveErrorMessage(payloadRecord);
        if (errorMessage && !delta) {
            this.error.set(errorMessage);
        }

        return { isDoneEvent: false };
    }

    private appendDelta(token: string): void {
        this.streamedResponse.update((current) => `${current}${token}`);
    }

    private applyFinalSnapshot(snapshot: string): void {
        const next = snapshot.trim();
        if (!next) {
            return;
        }

        this.streamedResponse.update((current) => {
            if (!current) {
                return next;
            }

            return next.length >= current.length ? next : current;
        });
    }

    private extractCompleteFrames(buffer: string, flushRemainder = false): ParsedFrameBatch {
        const normalized = buffer
            .replaceAll('\r\n', '\n')
            .replaceAll('\r', '\n');

        const frames: string[] = [];
        let searchIndex = 0;

        while (true) {
            const separatorIndex = normalized.indexOf('\n\n', searchIndex);
            if (separatorIndex < 0) {
                break;
            }

            const frame = normalized.slice(searchIndex, separatorIndex).trim();
            if (frame.length > 0) {
                frames.push(frame);
            }

            searchIndex = separatorIndex + 2;
        }

        let remainder = normalized.slice(searchIndex);

        if (flushRemainder) {
            const tail = remainder.trim();
            if (tail.length > 0) {
                frames.push(tail);
            }
            remainder = '';
        }

        return { frames, remainder };
    }

    private parseSseFrame(frame: string): ParsedSseFrame | null {
        const lines = frame.split('\n');
        let eventType = 'message';
        const dataLines: string[] = [];

        for (const rawLine of lines) {
            const line = rawLine.trimEnd();
            if (!line || line.startsWith(':')) {
                continue;
            }

            if (line.startsWith('event:')) {
                eventType = line.slice(6).trim() || 'message';
                continue;
            }

            if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trimStart());
            }
        }

        if (dataLines.length === 0) {
            return null;
        }

        return {
            eventType,
            payload: dataLines.join('\n').trim(),
        };
    }

    private resolveDeltaToken(payload: JsonRecord): string {
        return this.readString(payload, ['delta', 'token'])
            ?? this.readNestedString(payload, 'data', ['delta', 'token'])
            ?? '';
    }

    private resolveFinalSnapshot(payload: JsonRecord): string {
        return this.readString(payload, ['response', 'content'])
            ?? this.readNestedString(payload, 'data', ['response', 'content'])
            ?? '';
    }

    private resolveErrorMessage(payload: JsonRecord): string | null {
        const directMessage = this.readString(payload, ['error', 'detail', 'message']);
        if (directMessage) {
            return directMessage;
        }

        const errors = payload['errors'];
        if (Array.isArray(errors)) {
            const joined = errors
                .map((item) => `${item ?? ''}`.trim())
                .filter((item) => item.length > 0)
                .join('\n');

            return joined || null;
        }

        const nestedData = this.asRecord(payload['data']);
        return nestedData
            ? this.readString(nestedData, ['error', 'detail', 'message'])
            : null;
    }

    private readNestedString(record: JsonRecord, key: string, candidateKeys: readonly string[]): string | null {
        const nested = this.asRecord(record[key]);
        return nested
            ? this.readString(nested, candidateKeys)
            : null;
    }

    private tryParseRecord(rawPayload: string): JsonRecord | null {
        try {
            const parsed = JSON.parse(rawPayload) as unknown;
            return this.asRecord(parsed);
        } catch {
            return null;
        }
    }

    private asRecord(value: unknown): JsonRecord | null {
        return value !== null && typeof value === 'object'
            ? (value as JsonRecord)
            : null;
    }

    private readString(record: JsonRecord, keys: readonly string[]): string | null {
        for (const key of keys) {
            const candidate = record[key];
            if (typeof candidate === 'string' && candidate.trim().length > 0) {
                return candidate.trim();
            }
        }

        return null;
    }

    private readNumber(record: JsonRecord, keys: readonly string[]): number | null {
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

    private isAbortError(error: unknown): boolean {
        return error instanceof DOMException && error.name === 'AbortError';
    }

    private toErrorMessage(error: unknown): string {
        if (error instanceof Error && error.message.trim().length > 0) {
            return error.message;
        }

        return 'Unable to start the AI stream right now. Please try again.';
    }
}
