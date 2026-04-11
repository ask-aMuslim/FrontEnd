import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

interface NavLink {
  label: string;
  path: string;
  section?: 'qna';
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly isQnaSectionActive = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => this.isQnaSectionUrl(event.urlAfterRedirects)),
      startWith(this.isQnaSectionUrl(this.router.url)),
    ),
    { initialValue: this.isQnaSectionUrl(this.router.url) },
  );

  protected readonly navLinks: NavLink[] = [
    { label: 'Home', path: '/home' },
    { label: 'About', path: '/about' },
    { label: 'Q&A', path: '/question-and-answer/topics', section: 'qna' },
    { label: 'Academy', path: '/academy' },
    { label: 'Resources', path: '/resources' },
    { label: 'Events', path: '/events' },
    { label: 'Contact', path: '/contact' },
    // { label: 'MuslimTube', path: '/muslim-tube' },
  ];

  protected isMobileMenuOpen = signal(false);

  protected toggleNav(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  protected closeNav(): void {
    this.resetMobileState();
  }

  private resetMobileState() {
    this.isMobileMenuOpen.set(false);
  }

  protected trackByLabel(_index: number, item: NavLink): string {
    return item.label;
  }

  isQnaSectionUrl(url: string): boolean {
    return url.startsWith('/question-and-answer') || url.startsWith('/ask-and-contact');
  }

}
