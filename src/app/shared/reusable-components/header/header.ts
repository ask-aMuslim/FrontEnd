import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
  styleUrls: ['./header.scss'],
})
export class Header {
  protected readonly authService = inject(AuthService);

  protected readonly navLinks: NavLink[] = [
    { label: 'Home', path: '/home' },
    { label: 'About', path: '/about' },
    { label: 'Q&A', path: '/ask-and-contact' },
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

}
