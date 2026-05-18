import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { QuestionAndAnswerSidebarComponent } from './sidebar/question-and-answer-sidebar.component';

@Component({
  selector: 'app-question-and-answer',
  standalone: true,
  imports: [CommonModule, RouterOutlet, QuestionAndAnswerSidebarComponent],
  templateUrl: './question-and-answer.component.html',
  styleUrls: ['./question-and-answer.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class QuestionAndAnswerComponent {
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



  navigateToContact(): void {
    void this.router.navigate(['/contact']);
  }
}
