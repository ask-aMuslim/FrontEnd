import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { Subject, finalize, takeUntil } from 'rxjs';
import {
  AskAssistantConversation,
  AskAssistantMessageSeed,
  ChatMessage,
} from './ask-assistant.model';
import { AskAssistantService } from './ask-assistant.service';

@Component({
  selector: 'app-ask-assistant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ask-assistant.component.html',
  styleUrls: ['./ask-assistant.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskAssistantComponent implements OnInit, OnDestroy {
  private static readonly fallbackAssistantError =
    'Service temporarily unavailable. Please retry shortly.';

  private messageId = 0;
  private readonly destroy$ = new Subject<void>();
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('askInput') askInput?: ElementRef<HTMLInputElement>;
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('bottomAnchor') bottomAnchor?: ElementRef<HTMLDivElement>;

  arrow = '/icons/icons-24/arrow-right.svg';
  logo = '/ask-a-muslim-logo.png';

  inputValue = '';
  userId = '';
  activeThreadId: string | null = null;

  messages: ChatMessage[] = [];
  conversations: AskAssistantConversation[] = [];
  isLoadingConversations = false;
  errorMessage: string | null = null;
  isResponding = false;

  private readonly askAssistantService = inject(AskAssistantService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.userId = this.askAssistantService.getResolvedUserId();
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(value: string): void {
    this.inputValue = value;
  }

  startNewConversation(): void {
    this.activeThreadId = null;
    this.messages = [];
    this.errorMessage = null;
    this.messageId = 0;
    this.cdr.markForCheck();
    this.scrollToBottom(false);
  }

  openConversation(threadId: string): void {
    if (!threadId) {
      return;
    }

    this.activeThreadId = threadId;
    this.errorMessage = null;

    this.askAssistantService
      .getThreadMessages(threadId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messageId = 0;
          this.messages = messages.map((message) => this.toChatMessage(message));
          this.cdr.markForCheck();
          this.scrollToBottom(false);
        },
        error: () => {
          this.errorMessage = 'Unable to load this conversation right now.';
          this.cdr.markForCheck();
        },
      });
  }

  submitQuestion(event?: Event): void {
    event?.preventDefault();

    const question = this.inputValue.trim();
    if (!question || this.isResponding) {
      return;
    }

    this.errorMessage = null;
    this.appendMessage('user', question);
    this.resetInput();
    const assistantMessageId = this.appendMessage('assistant', '');
    this.scrollToBottom(true);

    this.isResponding = true;
    this.askAssistantService
      .streamAnswer({
        userId: this.userId,
        question,
        threadId: this.activeThreadId,
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isResponding = false;
          this.removeEmptyAssistantMessage(assistantMessageId);
          this.loadConversations();
          if (this.isBrowser) {
            this.askInput?.nativeElement.focus({ preventScroll: true });
          }
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (eventUpdate) => {
          if (eventUpdate.threadId) {
            this.activeThreadId = eventUpdate.threadId;
          }

          if (eventUpdate.kind === 'delta' && eventUpdate.text) {
            this.patchMessageText(assistantMessageId, (existingText) => `${existingText}${eventUpdate.text}`);
          }

          if (eventUpdate.kind === 'error') {
            const errorText = eventUpdate.text || AskAssistantComponent.fallbackAssistantError;
            this.patchMessageText(assistantMessageId, (existingText) => {
              if (!existingText) {
                return errorText;
              }

              return `${existingText}\n${errorText}`;
            });
          }

          this.scrollToBottom(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.patchMessageText(assistantMessageId, () => AskAssistantComponent.fallbackAssistantError);
          this.cdr.markForCheck();
        },
      });
  }

  isConversationActive(threadId: string): boolean {
    return this.activeThreadId === threadId;
  }

  trackByMessage = (_: number, message: ChatMessage): number => message.id;
  trackByConversation = (_: number, conversation: AskAssistantConversation): string => conversation.threadId;

  private loadConversations(): void {
    this.isLoadingConversations = true;

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
          this.errorMessage = this.errorMessage ?? 'Unable to load previous conversations.';
          this.cdr.markForCheck();
        },
      });
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
    this.messages = [...this.messages, { id, role, text, createdAt: Date.now() }];
    return id;
  }

  private patchMessageText(messageId: number, updater: (currentText: string) => string): void {
    this.messages = this.messages.map((message) => {
      if (message.id !== messageId) {
        return message;
      }

      return {
        ...message,
        text: updater(message.text),
      };
    });
  }

  private removeEmptyAssistantMessage(messageId: number): void {
    const message = this.messages.find((item) => item.id === messageId);
    if (message?.role !== 'assistant' || (message?.text.trim().length ?? 0) > 0) {
      return;
    }

    this.messages = this.messages.filter((item) => item.id !== messageId);
  }

  private resetInput(): void {
    this.inputValue = '';
  }

  private scrollToBottom(smooth = true): void {
    if (!this.isBrowser) {
      return;
    }

    // Ensure the view reflects latest messages before measuring/scrolling
    this.cdr.detectChanges();
    globalThis.setTimeout(() => {
      const behavior = smooth ? ('smooth' as ScrollBehavior) : ('auto' as ScrollBehavior);
      const anchor = this.bottomAnchor?.nativeElement;
      if (anchor) {
        anchor.scrollIntoView({ behavior, block: 'end' });
        return;
      }
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior });
      }
    }, 0);
  }
}
