import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-ask-and-contact',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './ask-and-contact.component.html',
  styleUrls: ['./ask-and-contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class AskAndContactComponent {
  private readonly router = inject(Router);

  readonly isAskQa$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects.startsWith('/question-and-answer/topics')),
    startWith(this.router.url.startsWith('/question-and-answer/topics')),
  );

  readonly isQuestion$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects.includes('/question-and-answer/topics/question')),
    startWith(this.router.url.includes('/question-and-answer/topics/question')),
  );

  navigateToAcademy(): void {
    void this.router.navigate(['/academy']);
  }

  navigateToSendInquiry(): void {
    void this.router.navigate(['/question-and-answer/send-inquiry']);
  }

  navigateToContact(): void {
    void this.router.navigate(['/contact']);
  }
}
