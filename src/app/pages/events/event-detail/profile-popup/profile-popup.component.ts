import { Component, EventEmitter, Output } from '@angular/core';

import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-popup',
  imports: [],
  templateUrl: './profile-popup.component.html',
  styleUrls: ['./profile-popup.component.scss'],
})
export class ProfilePopupComponent {
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  closePopup(): void {
    this.close.emit();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.close.emit();
  }
}
