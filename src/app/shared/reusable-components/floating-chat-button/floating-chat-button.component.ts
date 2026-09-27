import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-floating-chat-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './floating-chat-button.component.html',
  styleUrls: ['./floating-chat-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingChatButtonComponent {
  private readonly router = inject(Router);

  /**
   * Tracks whether the user is currently on the AI assistant/chatbot page.
   * When on this route, we hide the floating button to prevent redundancy and screen clutter.
   */
  protected readonly isChatbotPage = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.checkIsChatbotUrl(event.urlAfterRedirects)),
      startWith(this.checkIsChatbotUrl(this.router.url)),
    ),
    { initialValue: this.checkIsChatbotUrl(this.router.url) },
  );

  private checkIsChatbotUrl(url: string): boolean {
    const cleanUrl = url.split('?')[0].split('#')[0];
    return cleanUrl === '/question-and-answer/ask-assistant';
  }
}
