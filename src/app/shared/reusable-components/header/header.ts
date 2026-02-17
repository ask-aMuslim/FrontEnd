import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { toFriendlyAuthErrorMessage } from '../../../core/auth/auth-error-message.util';

interface NavLink {
  label: string;
  path: string;
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
  protected isLoggingOut = false;

  protected readonly navLinks: NavLink[] = [
    { label: 'Home', path: '/home' },
    { label: 'Q&A', path: '/ask-and-contact/ask-qa' },
    { label: 'Academy', path: '/academy' },
    { label: 'Events', path: '/events' },
    { label: 'Contact', path: '/ask-and-contact/send-inquiry' },
    // { label: 'MuslimTube', path: '/muslim-tube' },
  ];

  protected navOpen = false;

  protected toggleNav(): void {
    this.navOpen = !this.navOpen;
  }

  protected closeNav(): void {
    this.navOpen = false;
  }

  protected trackByLabel(_index: number, item: NavLink): string {
    return item.label;
  }

  protected handleLogout(): void {
    if (this.isLoggingOut) {
      return;
    }

    this.authService.clearError();
    this.isLoggingOut = true;
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggingOut = false;
        this.closeNav();
      },
      error: () => {
        this.isLoggingOut = false;
        this.closeNav();
      },
    });
  }

  protected get logoutErrorMessage(): string | null {
    return toFriendlyAuthErrorMessage(this.authService.error());
  }

}
