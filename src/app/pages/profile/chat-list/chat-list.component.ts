import { Component, Input, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InlineSvgDirective } from '../../../shared/directives/inline-svg.directive';
import { AssistantChatFacade, AssistantThreadRecord } from '../../../api/facades/assistant-chat.facade';

@Component({
  selector: 'app-chat-list',
  imports: [InlineSvgDirective, RouterLink],
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss'],
})
export class ChatListComponent implements OnDestroy {
  private readonly assistantChatFacade = inject(AssistantChatFacade);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  private _userId = '';
  threads: AssistantThreadRecord[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  selectedChatId: string | null = null;

  @Input()
  set userId(value: string) {
    this._userId = value || '';
    if (this._userId) {
      this.loadUserThreads();
    } else {
      this.threads = [];
      this.cdr.markForCheck();
    }
  }

  get userId(): string {
    return this._userId;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserThreads(): void {
    if (!this.userId) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    this.assistantChatFacade
      .listUserThreads(this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (threads) => {
          this.threads = threads || [];
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          console.error('[ChatListComponent] Failed to load user threads:', error);
          this.errorMessage = 'Unable to load your chats. Please try again.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  selectChat(thread: AssistantThreadRecord): void {
    if (!thread?.threadId) {
      return;
    }

    this.selectedChatId = thread.threadId;
    
    // Save thread ID to session storage so that AskAssistantComponent picks it up
    globalThis.sessionStorage.setItem('aam_ask_assistant_active_thread', thread.threadId);
    
    // Navigate to the Islamic Assistant workspace
    void this.router.navigate(['/question-and-answer', 'ask-assistant']);
  }

  formatLastResponse(updatedAt: number): string {
    if (!updatedAt) {
      return '';
    }

    const now = Date.now();
    const diffMs = now - updatedAt;
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }

    // Fallback to localized standard absolute date time
    const date = new Date(updatedAt);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
}
