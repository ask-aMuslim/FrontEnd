import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import {
  AssistantChatFacade,
  AssistantChatRequest,
  AssistantHistoryRecord,
  AssistantStreamRecord,
  AssistantThreadRecord,
} from '../../../api/facades/assistant-chat.facade';
import { TokenService } from '../../../core/auth/token.service';
import { StudentProfileService } from '../../../core/services/student-profile.service';
import {
  AskAssistantChatContext,
  AskAssistantConversation,
  AskAssistantMessageSeed,
  AskAssistantStreamUpdate,
} from './ask-assistant.model';

@Injectable({ providedIn: 'root' })
export class AskAssistantService {
  private static readonly guestStorageKey = 'aam_ask_assistant_guest_user_id';
  private static readonly guestIdPrefix = 'guest-';
  private static readonly fallbackServerGuestId = 'guest-server';
  private static readonly fallbackChatTitle = 'New chat';
  private static readonly fallbackReligiousStatus = 1;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly assistantChatFacade = inject(AssistantChatFacade);
  private readonly tokenService = inject(TokenService);
  private readonly studentProfileService = inject(StudentProfileService);

  getResolvedUserId(): string {
    const authenticatedUserId = this.tokenService.userId();
    if (authenticatedUserId && authenticatedUserId.trim().length > 0) {
      return authenticatedUserId.trim();
    }

    const authenticatedEmail = this.tokenService.userEmail();
    if (authenticatedEmail && authenticatedEmail.trim().length > 0) {
      return authenticatedEmail.trim().toLowerCase();
    }

    return this.getOrCreateGuestUserId();
  }

  getConversations(userId: string): Observable<AskAssistantConversation[]> {
    return this.assistantChatFacade.listUserThreads(userId).pipe(
      map((threads) => threads.map((thread) => this.mapConversation(thread, thread.title ?? AskAssistantService.fallbackChatTitle)))
    );
  }

  getConversation(threadId: string): Observable<AskAssistantConversation> {
    return this.assistantChatFacade.getThread(threadId).pipe(
      map((thread) => this.mapConversation(thread, thread.title ?? AskAssistantService.fallbackChatTitle)),
      catchError(() => of(this.mapConversation({ threadId, createdAt: Date.now(), updatedAt: Date.now() }, AskAssistantService.fallbackChatTitle)))
    );
  }

  getThreadMessages(threadId: string): Observable<AskAssistantMessageSeed[]> {
    return this.assistantChatFacade.getThreadHistory(threadId).pipe(
      map((messages) => messages.map((message) => this.mapHistoryMessage(message))),
    );
  }

  streamAnswer(payload: {
    userId: string;
    question: string;
    threadId: string | null;
    threadName: string;
  }): Observable<AskAssistantStreamUpdate> {
    return this.getChatContext(payload.userId, payload.threadName).pipe(
      switchMap((context) => {
        const request: AssistantChatRequest = {
          userId: payload.userId,
          message: payload.question,
          threadId: payload.threadId,
          threadName: context.threadName,
          religiousStatus: context.religiousStatus,
          isMuslim: context.isMuslim,
          isNewMuslim: context.isNewMuslim,
          oldReligion: context.oldReligion,
        };

        return this.assistantChatFacade.streamChat(request);
      }),
      map((event) => this.mapStreamUpdate(event)),
    );
  }

  private mapConversation(thread: AssistantThreadRecord, title: string): AskAssistantConversation {
    return {
      threadId: thread.threadId,
      title,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
  }

  private mapHistoryMessage(message: AssistantHistoryRecord): AskAssistantMessageSeed {
    return {
      role: message.role,
      text: message.content,
      createdAt: message.createdAt,
    };
  }

  private mapStreamUpdate(event: AssistantStreamRecord): AskAssistantStreamUpdate {
    return {
      kind: event.kind,
      text: event.text,
      threadId: event.threadId,
      statusCode: event.statusCode,
      title: event.title,
    };
  }

  private getChatContext(userId: string, threadName: string): Observable<AskAssistantChatContext> {
    const normalizedThreadName = this.normalizeThreadName(threadName);
    const fallbackContext = this.buildFallbackChatContext(normalizedThreadName);

    if (!this.tokenService.isAuthenticated()) {
      return of(fallbackContext);
    }

    return this.studentProfileService.getMyProfile().pipe(
      map((profile) => {
        if (!profile) {
          return fallbackContext;
        }

        const religiousStatus = this.normalizeReligiousStatus(profile.religiousStatus);
        const isMuslim = typeof profile.isMuslim === 'boolean'
          ? profile.isMuslim
          : religiousStatus !== 1;
        const isNewMuslim = typeof profile.isNewMuslim === 'boolean'
          ? profile.isNewMuslim
          : religiousStatus === 3;

        return {
          threadName: normalizedThreadName,
          religiousStatus,
          isMuslim,
          isNewMuslim,
          oldReligion: this.normalizeOldReligion(profile.oldReligion),
        };
      }),
      catchError(() => of(fallbackContext)),
    );
  }

  private buildFallbackChatContext(threadName: string): AskAssistantChatContext {
    return {
      threadName,
      religiousStatus: AskAssistantService.fallbackReligiousStatus,
      isMuslim: false,
      isNewMuslim: false,
      oldReligion: '',
    };
  }

  private normalizeThreadName(threadName: string): string {
    const normalized = threadName.trim();
    return normalized.length > 0 ? normalized : AskAssistantService.fallbackChatTitle;
  }

  private normalizeOldReligion(oldReligion: unknown): string {
    return typeof oldReligion === 'string' ? oldReligion.trim() : '';
  }

  private normalizeReligiousStatus(value: unknown): number {
    return value === 1 || value === 2 || value === 3
      ? value
      : AskAssistantService.fallbackReligiousStatus;
  }

  private getOrCreateGuestUserId(): string {
    if (!this.isBrowser) {
      return AskAssistantService.fallbackServerGuestId;
    }

    const existingUserId = globalThis.localStorage.getItem(AskAssistantService.guestStorageKey);
    if (existingUserId && existingUserId.trim().length > 0) {
      return existingUserId;
    }

    const generatedUserId = this.generateGuestUserId();
    globalThis.localStorage.setItem(AskAssistantService.guestStorageKey, generatedUserId);
    return generatedUserId;
  }

  private generateGuestUserId(): string {
    // eslint-disable-next-line no-undef
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      // eslint-disable-next-line no-undef
      return `${AskAssistantService.guestIdPrefix}${crypto.randomUUID()}`;
    }

    const randomPart = Math.random().toString(36).slice(2, 10);
    const timestampPart = Date.now().toString(36);
    return `${AskAssistantService.guestIdPrefix}${randomPart}-${timestampPart}`;
  }
}
