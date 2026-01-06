import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-popup',
  imports: [CommonModule],
  templateUrl: './profile-popup.component.html',
  styleUrl: './profile-popup.component.scss',
})
export class ProfilePopupComponent {
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  closePopup(): void {
    this.close.emit();
  }

  goToProfile(): void {
    this.router.navigate(['/account']);
    this.close.emit();
  }
}
