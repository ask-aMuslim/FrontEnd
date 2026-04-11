import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of, retry } from 'rxjs';
import {
    LessonProgressFacade,
    LessonVideoProgressPayload,
} from '../../api/facades/lesson-progress.facade';

interface LessonSyncState {
    lastSyncedPercentage: number;
    lastSyncedAt: number;
    inFlight: boolean;
    completionSynced: boolean;
    pendingSnapshot: LessonVideoProgressPayload | null;
}

@Injectable({ providedIn: 'root' })
export class VideoProgressService {
    private readonly minimumDeltaToSync = 5;
    private readonly periodicSyncMs = 12_000;
    private readonly completionThreshold = 90;

    private readonly progressStream$ = new Subject<LessonVideoProgressPayload>();
    private readonly syncStateByLessonId = new Map<string, LessonSyncState>();
    private readonly platformId = inject(PLATFORM_ID);
    private readonly lessonProgressFacade = inject(LessonProgressFacade);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    constructor() {
        this.progressStream$
            .pipe(
                debounceTime(1000),
                distinctUntilChanged((previous, current) =>
                    previous.courseId === current.courseId
                    && previous.lessonId === current.lessonId
                    && Math.floor(previous.videoProgressPercentage) === Math.floor(current.videoProgressPercentage),
                ),
            )
            .subscribe((snapshot) => {
                this.trySync(snapshot, false);
            });
    }

    recordProgress(snapshot: LessonVideoProgressPayload): void {
        const normalizedSnapshot = this.normalizeSnapshot(snapshot);
        this.persistProgressLocally(normalizedSnapshot.lessonId, normalizedSnapshot.videoProgressPercentage);

        if (normalizedSnapshot.videoProgressPercentage >= this.completionThreshold) {
            this.markLessonCompleted(normalizedSnapshot.lessonId);
        }

        this.progressStream$.next(normalizedSnapshot);
    }

    flushProgress(snapshot: LessonVideoProgressPayload): void {
        const normalizedSnapshot = this.normalizeSnapshot(snapshot);
        this.persistProgressLocally(normalizedSnapshot.lessonId, normalizedSnapshot.videoProgressPercentage);
        this.trySync(normalizedSnapshot, true);
    }

    syncCompletion(snapshot: LessonVideoProgressPayload): void {
        const normalizedSnapshot = this.normalizeSnapshot({
            ...snapshot,
            videoProgressPercentage: Math.max(this.completionThreshold, snapshot.videoProgressPercentage),
        });
        this.markLessonCompleted(normalizedSnapshot.lessonId);
        this.flushProgress(normalizedSnapshot);
    }

    getSavedProgressPercentage(lessonId: string): number {
        if (!this.isBrowser || !lessonId) {
            return 0;
        }

        const savedValue = globalThis.localStorage.getItem(this.progressStorageKey(lessonId));
        if (!savedValue) {
            return 0;
        }

        const parsedValue = Number.parseFloat(savedValue);
        if (!Number.isFinite(parsedValue)) {
            return 0;
        }

        return this.clampPercentage(parsedValue);
    }

    isLessonCompleted(lessonId: string): boolean {
        if (!this.isBrowser || !lessonId) {
            return false;
        }

        return globalThis.localStorage.getItem(this.completedStorageKey(lessonId)) === 'true';
    }

    markLessonCompleted(lessonId: string): void {
        if (!this.isBrowser || !lessonId) {
            return;
        }

        globalThis.localStorage.setItem(this.completedStorageKey(lessonId), 'true');
    }

    private normalizeSnapshot(snapshot: LessonVideoProgressPayload): LessonVideoProgressPayload {
        return {
            courseId: snapshot.courseId,
            lessonId: snapshot.lessonId,
            videoProgressPercentage: this.clampPercentage(snapshot.videoProgressPercentage),
        };
    }

    private clampPercentage(value: number): number {
        if (!Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.min(100, value));
    }

    private persistProgressLocally(lessonId: string, percentage: number): void {
        if (!this.isBrowser || !lessonId) {
            return;
        }

        globalThis.localStorage.setItem(this.progressStorageKey(lessonId), percentage.toFixed(2));
    }

    private trySync(snapshot: LessonVideoProgressPayload, forceSync: boolean): void {
        if (!snapshot.courseId || !snapshot.lessonId) {
            return;
        }

        const state = this.getOrCreateSyncState(snapshot.lessonId);
        const progressDelta = snapshot.videoProgressPercentage - state.lastSyncedPercentage;
        const elapsedSinceSync = Date.now() - state.lastSyncedAt;
        const completionPending =
            snapshot.videoProgressPercentage >= this.completionThreshold && !state.completionSynced;

        const shouldSync =
            forceSync
            || completionPending
            || progressDelta >= this.minimumDeltaToSync
            || elapsedSinceSync >= this.periodicSyncMs;

        if (!shouldSync) {
            return;
        }

        if (state.inFlight) {
            state.pendingSnapshot = this.selectHigherProgressSnapshot(state.pendingSnapshot, snapshot);
            return;
        }

        const payload: LessonVideoProgressPayload = {
            ...snapshot,
            videoProgressPercentage: completionPending
                ? Math.max(snapshot.videoProgressPercentage, this.completionThreshold)
                : snapshot.videoProgressPercentage,
        };

        state.inFlight = true;

        this.lessonProgressFacade
            .saveLessonVideoProgress(payload)
            .pipe(
                retry({ count: 1, delay: 1000 }),
                catchError(() => of(false)),
                finalize(() => {
                    state.inFlight = false;
                    const pendingSnapshot = state.pendingSnapshot;
                    state.pendingSnapshot = null;

                    if (pendingSnapshot) {
                        this.trySync(pendingSnapshot, true);
                    }
                }),
            )
            .subscribe((isSuccess) => {
                if (!isSuccess) {
                    return;
                }

                state.lastSyncedPercentage = Math.max(
                    state.lastSyncedPercentage,
                    payload.videoProgressPercentage,
                );
                state.lastSyncedAt = Date.now();

                if (payload.videoProgressPercentage >= this.completionThreshold) {
                    state.completionSynced = true;
                }
            });
    }

    private getOrCreateSyncState(lessonId: string): LessonSyncState {
        const existingState = this.syncStateByLessonId.get(lessonId);
        if (existingState) {
            return existingState;
        }

        const initialState: LessonSyncState = {
            lastSyncedPercentage: 0,
            lastSyncedAt: 0,
            inFlight: false,
            completionSynced: false,
            pendingSnapshot: null,
        };

        this.syncStateByLessonId.set(lessonId, initialState);
        return initialState;
    }

    private selectHigherProgressSnapshot(
        previous: LessonVideoProgressPayload | null,
        current: LessonVideoProgressPayload,
    ): LessonVideoProgressPayload {
        if (!previous) {
            return current;
        }

        return current.videoProgressPercentage >= previous.videoProgressPercentage
            ? current
            : previous;
    }

    private progressStorageKey(lessonId: string): string {
        return `video-progress-${lessonId}`;
    }

    private completedStorageKey(lessonId: string): string {
        return `video-completed-${lessonId}`;
    }
}
