import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavLink {
  label: string;
  path: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly authService = inject(AuthService);

  protected readonly navLinks: NavLink[] = [
    { label: 'Home', path: '/home' },
    { label: 'Roadmap', path: '/roadmap' },
    { label: 'Ask & Contact', path: '/ask-and-contact' },
    { label: 'Events', path: '/events' },
    { label: 'MuslimTube', path: '/muslim-tube' },
  ];

  protected navOpen = false;

  protected toggleNav(): void {
    this.navOpen = !this.navOpen;
  }

  protected closeNav(): void {
    this.navOpen = false;
  }

  protected trackByLabel(index: number, item: NavLink): string {
    return item.label;
  }

  protected handleLogout(): void {
    this.authService.logout();
    this.closeNav();
  }

}
