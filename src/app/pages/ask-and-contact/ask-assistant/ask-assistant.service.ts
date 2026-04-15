import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  AssistantChatFacade,
  AssistantChatRequest,
  AssistantHistoryRecord,
  AssistantStreamRecord,
  AssistantThreadRecord,
} from '../../../api/facades/assistant-chat.facade';
import { TokenService } from '../../../core/auth/token.service';
import {
  AskAssistantConversation,
  AskAssistantMessageSeed,
  AskAssistantStreamUpdate,
} from './ask-assistant.model';

@Injectable({ providedIn: 'root' })
export class AskAssistantService {
  private static readonly guestStorageKey = 'aam_ask_assistant_guest_user_id';
  private static readonly guestIdPrefix = 'guest-';
  private static readonly fallbackServerGuestId = 'guest-server';

  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly assistantChatFacade = inject(AssistantChatFacade);
  private readonly tokenService = inject(TokenService);

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
      map((threads) => threads.map((thread) => this.mapConversation(thread))),
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
  }): Observable<AskAssistantStreamUpdate> {
    const request: AssistantChatRequest = {
      userId: payload.userId,
      message: payload.question,
      threadId: payload.threadId,
    };

    return this.assistantChatFacade.streamChat(request).pipe(
      map((event) => this.mapStreamUpdate(event)),
    );
  }

  private mapConversation(thread: AssistantThreadRecord): AskAssistantConversation {
    return {
      threadId: thread.threadId,
      title: this.buildConversationTitle(thread.threadId),
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
    };
  }

  private buildConversationTitle(threadId: string): string {
    const shortThreadId = threadId.slice(0, 8);
    return `Conversation #${shortThreadId}`;
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
