import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from './ask-assistant.model';
import { AskAssistantService } from './ask-assistant.service';

@Component({
  selector: 'app-ask-assistant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ask-assistant.component.html',
  styleUrls: ['./ask-assistant.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskAssistantComponent {
  private messageId = 0;

  @ViewChild('askInput') askInput?: ElementRef<HTMLInputElement>;
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('bottomAnchor') bottomAnchor?: ElementRef<HTMLDivElement>;
  arrow = '/icons/icons-24/arrow-right.svg';
  logo = '/AskAMuslimLogo.png';

  inputValue = '';
  isSuggestionsOpen = false;
  hasSelectedSuggestion = false;
  suggestions = [
    'Is it permissible to ....',
    'Why do Muslims ....',
    'Is it Haram to ....',
    'What’s the meaning of ...',
  ];
  filteredSuggestions = [...this.suggestions];

  messages: ChatMessage[] = [];
  isResponding = false;

  constructor(
    private readonly askAssistantService: AskAssistantService,
    private readonly cdr: ChangeDetectorRef,
  ) { }

  onInput(value: string): void {
    this.inputValue = value;
    this.hasSelectedSuggestion = false;
    this.filteredSuggestions = this.filterSuggestions(value);
    this.isSuggestionsOpen = true;
  }

  onFocus(): void {
    if (!this.hasSelectedSuggestion) {
      this.filteredSuggestions = this.filterSuggestions(this.inputValue);
      this.isSuggestionsOpen = true;
    }
  }

  onBlur(): void {
    this.isSuggestionsOpen = false;
  }

  selectSuggestion(value: string): void {
    const cleanValue = value.replace(/[.\u2026]+$/g, '').trim();
    this.inputValue = cleanValue ? `${cleanValue} ` : '';
    this.hasSelectedSuggestion = true;
    this.isSuggestionsOpen = false;
    // Refocus the input after selection to keep user in the flow
    setTimeout(() => this.askInput?.nativeElement.focus({ preventScroll: true }), 0);
  }

  async submitQuestion(event?: Event): Promise<void> {
    event?.preventDefault();

    const question = this.inputValue.trim();
    if (!question || this.isResponding) {
      return;
    }

    this.appendMessage('user', question);
    this.resetInput();
    this.scrollToBottom(true);

    this.isResponding = true;
    try {
      const answer = await firstValueFrom(this.askAssistantService.generateAnswer(question));
      this.appendMessage('assistant', answer);
      this.scrollToBottom(true);
    } finally {
      this.isResponding = false;
      this.askInput?.nativeElement.focus({ preventScroll: true });
    }
  }

  trackByMessage = (_: number, message: ChatMessage): number => message.id;

  private filterSuggestions(value: string): string[] {
    const query = value.trim().toLowerCase();
    if (!query) {
      return [...this.suggestions];
    }

    return this.suggestions.filter((item) => item.toLowerCase().includes(query));
  }

  private appendMessage(role: ChatMessage['role'], text: string): void {
    this.messages = [...this.messages, { id: ++this.messageId, role, text, createdAt: Date.now() }];
  }

  private resetInput(): void {
    this.inputValue = '';
    this.isSuggestionsOpen = false;
    this.hasSelectedSuggestion = false;
    this.filteredSuggestions = [...this.suggestions];
  }

  private scrollToBottom(smooth = true): void {
    // Ensure the view reflects latest messages before measuring/scrolling
    this.cdr.detectChanges();
    setTimeout(() => {
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
