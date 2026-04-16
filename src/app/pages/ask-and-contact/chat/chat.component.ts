import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    WritableSignal,
    computed,
    inject,
    signal,
} from '@angular/core';
import { ChatService } from './chat.service';

@Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule],
    template: `
    <section>
      <h2>AI Chat Stream (SSE)</h2>

      <label for="chat-user-id">User ID</label>
      <input
        id="chat-user-id"
        type="text"
        [value]="userId()"
        (input)="onUserIdInput($event)"
      />

      <label for="chat-thread-id">Thread ID (optional)</label>
      <input
        id="chat-thread-id"
        type="text"
        [value]="threadId()"
        (input)="onThreadIdInput($event)"
      />

      <label for="chat-question">Question</label>
      <textarea
        id="chat-question"
        rows="5"
        [value]="question()"
        (input)="onQuestionInput($event)"
      ></textarea>

      <div>
        <button
          type="button"
          (click)="startStreaming()"
          [disabled]="!canStartStream()"
        >
          Start stream
        </button>

        <button
          type="button"
          (click)="stopStreaming()"
          [disabled]="!isStreaming()"
        >
          Stop stream
        </button>
      </div>

      <p>Streaming: {{ isStreaming() ? 'yes' : 'no' }}</p>
      <p>Thread: {{ activeThreadId() ?? 'n/a' }}</p>

      @if (error(); as streamError) {
        <p>{{ streamError }}</p>
      }

      <pre>{{ streamedResponse() }}</pre>
    </section>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnDestroy {
    private readonly chatService = inject(ChatService);

    readonly userId: WritableSignal<string> = signal('aa6310336@gmail.com');
    readonly threadId: WritableSignal<string> = signal('');
    readonly question: WritableSignal<string> = signal('');

    readonly streamedResponse = this.chatService.streamedResponse;
    readonly isStreaming = this.chatService.isStreaming;
    readonly error = this.chatService.error;
    readonly activeThreadId = this.chatService.activeThreadId;

    readonly canStartStream = computed(() => {
        return !this.isStreaming() && this.question().trim().length > 0;
    });

    ngOnDestroy(): void {
        this.chatService.stopStream();
    }

    async startStreaming(): Promise<void> {
        const trimmedQuestion = this.question().trim();
        if (!trimmedQuestion) {
            return;
        }

        await this.chatService.startStream({
            userId: this.userId().trim(),
            question: trimmedQuestion,
            threadId: this.threadId().trim() || null,
        });
    }

    stopStreaming(): void {
        this.chatService.stopStream();
    }

    onUserIdInput(event: Event): void {
        this.userId.set(this.readInputValue(event));
    }

    onThreadIdInput(event: Event): void {
        this.threadId.set(this.readInputValue(event));
    }

    onQuestionInput(event: Event): void {
        this.question.set(this.readInputValue(event));
    }

    private readInputValue(event: Event): string {
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            return target.value;
        }

        return '';
    }
}
