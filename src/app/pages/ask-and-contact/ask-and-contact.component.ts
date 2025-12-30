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
  styleUrl: './ask-and-contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AskAndContactComponent {
  private readonly router = inject(Router);

  readonly isAskQa$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects.startsWith('/ask-and-contact/ask-qa')),
    startWith(this.router.url.startsWith('/ask-and-contact/ask-qa')),
  );

  readonly isQuestion$ = this.router.events.pipe(
    filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    map((event) => event.urlAfterRedirects.includes('/ask-and-contact/ask-qa/question')),
    startWith(this.router.url.includes('/ask-and-contact/ask-qa/question')),
  );

  navigateToRoadmap(): void {
    void this.router.navigate(['/roadmap']);
  }

  navigateToSendInquiry(): void {
    void this.router.navigate(['/ask-and-contact/send-inquiry']);
  }
}
