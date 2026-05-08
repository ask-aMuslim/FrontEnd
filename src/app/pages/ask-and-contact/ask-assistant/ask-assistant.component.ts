import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ApplicationRef, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, PLATFORM_ID, ViewChild, WritableSignal, inject, signal } from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import {
  AskAssistantConversation,
  AskAssistantMessageSeed,
  ChatMessage,
} from './ask-assistant.model';
import { AskAssistantService } from './ask-assistant.service';
import { buildChatTitleFromMessages } from './ask-assistant-title.util';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';

interface AskAssistantConversationSection {
  label: string;
  items: AskAssistantConversation[];
}

@Component({
  selector: 'app-ask-assistant',
  standalone: true,
  imports: [CommonModule, MarkdownPipe],
  templateUrl: './ask-assistant.component.html',
  styleUrls: ['./ask-assistant.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AskAssistantComponent implements OnInit, OnDestroy {
  private static readonly fallbackAssistantError =
    'Service temporarily unavailable. Please retry shortly.';
  private static readonly activeThreadStorageKey = 'aam_ask_assistant_active_thread';

  private messageId = 0;
  private readonly destroy$ = new Subject<void>();
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('askInput') askInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('bottomAnchor') bottomAnchor?: ElementRef<HTMLDivElement>;

  closeIcon = '/icons/icons-24/arrow-right.svg';
  newChatIcon = '/icons/icons-24/plus.svg';
  logo = '/ask-a-muslim-logo.png';

  inputValue = '';
  userId = '';
  activeThreadId: string | null = null;
  isHistoryDrawerOpen = false;

  messages: WritableSignal<ChatMessage[]> = signal([]);
  conversations: AskAssistantConversation[] = [];
  isLoadingConversations = false;
  conversationErrorMessage: string | null = null;
  errorMessage: string | null = null;
  isResponding: WritableSignal<boolean> = signal(false);

  private readonly askAssistantService = inject(AskAssistantService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly appRef = inject(ApplicationRef);

  ngOnInit(): void {
    this.userId = this.askAssistantService.getResolvedUserId();
    const savedThreadId = this.readActiveThreadFromStorage();
    if (savedThreadId) {
      this.activeThreadId = savedThreadId;
    }
    this.loadConversations();
    if (savedThreadId) {
      this.openConversation(savedThreadId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(value: string): void {
    this.inputValue = value;
    this.resizeComposer();
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    this.submitQuestion(event);
  }

  toggleHistoryDrawer(): void {
    this.isHistoryDrawerOpen = !this.isHistoryDrawerOpen;
    this.cdr.markForCheck();
  }

  closeHistoryDrawer(): void {
    this.isHistoryDrawerOpen = false;
    this.cdr.markForCheck();
  }

  startNewConversation(): void {
    this.closeHistoryDrawer();
    this.activeThreadId = null;
    this.clearActiveThreadFromStorage();
    this.messages.set([]);
    this.errorMessage = null;
    this.resetInput();
    this.resizeComposer();
    this.messageId = 0;
    this.cdr.markForCheck();
    this.scrollToBottom(false);
  }

  openConversation(threadId: string): void {
    if (!threadId) {
      return;
    }

    this.activeThreadId = threadId;
    this.saveActiveThreadToStorage(threadId);
    this.closeHistoryDrawer();
    this.errorMessage = null;
    this.resetInput();
    this.resizeComposer();

    this.askAssistantService
      .getThreadMessages(threadId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messageId = 0;
          this.messages.set(messages.map((message) => this.toChatMessage(message)));
          this.cdr.markForCheck();
          this.scrollToBottom(false);
        },
        error: (error: unknown) => {
          this.errorMessage = this.buildOpenConversationErrorMessage(error);
          this.cdr.markForCheck();
        },
      });
  }

  submitQuestion(event?: Event): void {
    globalThis.console.log('[AskAssistantComponent] submitQuestion execution started!!!!');
    event?.preventDefault();

    const question = this.inputValue.trim();
    if (!question || this.isResponding()) {
      return;
    }

    this.errorMessage = null;
    this.appendMessage('user', question);
    this.resetInput();
    this.resizeComposer();
    this.scrollToBottom(true);

    // Reserve a slot but DON'T create an empty assistant bubble yet.
    // We create the bubble only when the first token arrives so there
    // is no blank-then-populated flash.
    const assistantMessageId = ++this.messageId;
    let assistantMessageCreated = false;

    const isNewThread = !this.activeThreadId;
    const tempTitle = question.slice(0, 47);

    this.isResponding.set(true);
    this.askAssistantService
      .streamAnswer({
        userId: this.userId,
        question,
        threadId: this.activeThreadId,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.ngZone.run(() => {
            this.isResponding.set(false);

            if (this.activeThreadId) {
              this.bumpActiveConversation();
            }

            globalThis.setTimeout(() => this.cdr.detectChanges(), 0);
            if (this.isBrowser) {
              this.askInput?.nativeElement.focus({ preventScroll: true });
            }
          });
        }),
      )
      .subscribe({
        next: (eventUpdate) => {
          if (eventUpdate.threadId) {
            this.activeThreadId = eventUpdate.threadId;
            this.saveActiveThreadToStorage(eventUpdate.threadId);
          }

          const targetThreadId = eventUpdate.threadId || this.activeThreadId;
          if (targetThreadId) {
            const existingConvIndex = this.conversations.findIndex((c) => c.threadId === targetThreadId);

            if (existingConvIndex >= 0) {
              const currentConv = this.conversations[existingConvIndex];
              if (eventUpdate.title && currentConv.title !== eventUpdate.title) {
                currentConv.title = eventUpdate.title;
                this.conversations = [...this.conversations];
                this.cdr.markForCheck();
              }
            } else if (isNewThread && eventUpdate.threadId) {
              this.conversations = [
                {
                  threadId: eventUpdate.threadId,
                  title: eventUpdate.title || tempTitle,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                },
                ...this.conversations
              ];
              this.cdr.markForCheck();
            }
          }

          if (eventUpdate.kind === 'delta' && eventUpdate.text) {
            globalThis.console.log('[Component Stream Next] Chunk:', eventUpdate.text);
            if (assistantMessageCreated) {
              this.patchMessageText(assistantMessageId, (existingText) => `${existingText}${eventUpdate.text}`);
            } else {
              this.messages.update((current) => [...current, { id: assistantMessageId, role: 'assistant', text: eventUpdate.text, createdAt: Date.now() }]);
              assistantMessageCreated = true;
            }
            globalThis.console.log('[Component Stream Next] Array length:', this.messages().length);
          }

          if (eventUpdate.kind === 'error') {
            const errorText = eventUpdate.text || AskAssistantComponent.fallbackAssistantError;
            if (assistantMessageCreated) {
              this.patchMessageText(assistantMessageId, (existingText) => existingText ? `${existingText}\n${errorText}` : errorText);
            } else {
              this.messages.update((current) => [...current, { id: assistantMessageId, role: 'assistant', text: errorText, createdAt: Date.now() }]);
              assistantMessageCreated = true;
            }
          }

          globalThis.setTimeout(() => this.cdr.detectChanges(), 0);
          this.scrollToBottom(false);
        },
        error: () => {
          if (assistantMessageCreated) {
            this.patchMessageText(assistantMessageId, () => AskAssistantComponent.fallbackAssistantError);
          } else {
            this.messages.update((current) => [...current, { id: assistantMessageId, role: 'assistant', text: AskAssistantComponent.fallbackAssistantError, createdAt: Date.now() }]);
          }
          globalThis.setTimeout(() => this.cdr.detectChanges(), 0);
        },
      });
  }

  isConversationActive(threadId: string): boolean {
    return this.activeThreadId === threadId;
  }

  get activeChatTitle(): string {
    const selectedConversationTitle = this.activeThreadId
      ? this.conversations.find((conversation) => conversation.threadId === this.activeThreadId)?.title
      : null;

    return selectedConversationTitle
      ?? buildChatTitleFromMessages(this.messages())
      ?? 'New chat';
  }

  get conversationSections(): AskAssistantConversationSection[] {
    if (this.conversations.length === 0) {
      return [];
    }

    const sections = new Map<string, AskAssistantConversation[]>();
    for (const conversation of this.conversations) {
      const label = this.getConversationSectionLabel(conversation.updatedAt);
      const existing = sections.get(label);
      if (existing) {
        existing.push(conversation);
        continue;
      }

      sections.set(label, [conversation]);
    }

    return Array.from(sections.entries()).map(([label, items]) => ({
      label,
      items,
    }));
  }

  trackByMessage = (_: number, message: ChatMessage): number => message.id;
  trackByConversation = (_: number, conversation: AskAssistantConversation): string => conversation.threadId;
  trackByConversationSection = (_: number, section: AskAssistantConversationSection): string => section.label;

  private bumpActiveConversation(): void {
    if (!this.activeThreadId) {
      return;
    }

    const index = this.conversations.findIndex((c) => c.threadId === this.activeThreadId);
    if (index >= 0) {
      const conv = this.conversations[index];
      if (conv) {
        conv.updatedAt = Date.now();
        this.conversations.splice(index, 1);
        this.conversations.unshift(conv);
        this.conversations = [...this.conversations];
        this.cdr.markForCheck();
      }
    }
  }





  private loadConversations(): void {
    this.isLoadingConversations = true;
    this.conversationErrorMessage = null;

    this.askAssistantService
      .getConversations(this.userId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingConversations = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (conversations) => {
          this.conversations = conversations;
          this.cdr.markForCheck();
        },
        error: () => {
          this.conversationErrorMessage = 'Unable to load previous chats.';
          this.cdr.markForCheck();
        },
      });
  }

  private getConversationSectionLabel(updatedAt: number): string {
    const updatedDate = new Date(updatedAt);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfUpdatedDate = new Date(
      updatedDate.getFullYear(),
      updatedDate.getMonth(),
      updatedDate.getDate(),
    );
    const diffDays = Math.round((startOfToday.getTime() - startOfUpdatedDate.getTime()) / 86_400_000);

    if (diffDays <= 0) {
      return 'Today';
    }

    if (diffDays === 1) {
      return 'Yesterday';
    }

    if (diffDays < 7) {
      return 'This week';
    }

    if (diffDays < 30) {
      return 'This month';
    }

    return 'Earlier';
  }

  private toChatMessage(message: AskAssistantMessageSeed): ChatMessage {
    return {
      id: ++this.messageId,
      role: message.role,
      text: message.text,
      createdAt: message.createdAt,
    };
  }

  private appendMessage(role: ChatMessage['role'], text: string): number {
    const id = ++this.messageId;
    this.messages.update((current) => [...current, { id, role, text, createdAt: Date.now() }]);
    return id;
  }

  private patchMessageText(messageId: number, updater: (currentText: string) => string): void {
    this.messages.update((current) => current.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      return {
        ...message,
        text: updater(message.text),
      };
    }));
  }

  private removeEmptyAssistantMessage(messageId: number): void {
    const message = this.messages().find((item) => item.id === messageId);
    if (message?.role !== 'assistant' || (message?.text.trim().length ?? 0) > 0) {
      return;
    }

    this.messages.update((current) => current.filter((item) => item.id !== messageId));
  }

  private buildOpenConversationErrorMessage(error: unknown): string {
    const statusCode = this.readStatusCode(error);

    if (statusCode === 404) {
      return 'This chat is no longer available.';
    }

    if (statusCode === 401 || statusCode === 403) {
      return 'Please sign in again to open this chat.';
    }

    if (statusCode === 0) {
      return 'Chat service is currently unreachable. Please try again shortly.';
    }

    if (statusCode !== null && statusCode >= 500) {
      return 'Chat service is temporarily unavailable. Please try again shortly.';
    }

    return 'Unable to load this chat right now.';
  }

  private readStatusCode(error: unknown): number | null {
    if (error instanceof HttpErrorResponse) {
      return this.toFiniteStatusCode(error.status);
    }

    const status = this.readErrorNumericCode(error, 'status');
    if (status !== null) {
      return status;
    }

    return this.readErrorNumericCode(error, 'statusCode');
  }

  private readErrorNumericCode(error: unknown, key: 'status' | 'statusCode'): number | null {
    if (!error || typeof error !== 'object' || !(key in error)) {
      return null;
    }

    const value = (error as Record<string, unknown>)[key];
    return typeof value === 'number'
      ? this.toFiniteStatusCode(value)
      : null;
  }

  private toFiniteStatusCode(value: number): number | null {
    return Number.isFinite(value) ? value : null;
  }

  private readActiveThreadFromStorage(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return globalThis.sessionStorage.getItem(AskAssistantComponent.activeThreadStorageKey) || null;
  }

  private saveActiveThreadToStorage(threadId: string): void {
    if (!this.isBrowser) {
      return;
    }
    globalThis.sessionStorage.setItem(AskAssistantComponent.activeThreadStorageKey, threadId);
  }

  private clearActiveThreadFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }
    globalThis.sessionStorage.removeItem(AskAssistantComponent.activeThreadStorageKey);
  }

  private resetInput(): void {
    this.inputValue = '';
  }

  private resizeComposer(): void {
    if (!this.isBrowser || !this.askInput) {
      return;
    }

    const composer = this.askInput.nativeElement;
    composer.style.height = 'auto';
    composer.style.height = `${composer.scrollHeight}px`;
  }

  private scrollToBottom(smooth = true): void {
    if (!this.isBrowser) {
      return;
    }

    // We don't forcefully sync appRef here to avoid recursive tick errors.
    // The caller is expected to handle change detection.
    globalThis.setTimeout(() => {
      const behavior = smooth ? ('smooth' as ScrollBehavior) : ('auto' as ScrollBehavior);
      const anchor = this.bottomAnchor?.nativeElement;
      if (anchor) {
        anchor.scrollIntoView({ behavior, block: 'end' });
      }
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior });
      }

      if (this.messages().length > 0) {
        this.askInput?.nativeElement.scrollIntoView({ behavior, block: 'end' });
      }
    }, 0);
  }
}
