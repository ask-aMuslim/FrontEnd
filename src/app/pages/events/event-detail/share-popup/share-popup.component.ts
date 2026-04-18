import { Component, EventEmitter, Output, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-share-popup',
  imports: [],
  templateUrl: './share-popup.component.html',
  styleUrls: ['./share-popup.component.scss'],
})
export class SharePopupComponent {
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  private readonly document = inject(DOCUMENT);

  closePopup(): void {
    this.close.emit();
  }

  confirmShare(): void {
    const currentUrl = this.document.defaultView?.location.href;
    if (currentUrl) {
      void this.document.defaultView?.navigator.clipboard?.writeText(currentUrl);
    }

    this.confirm.emit();
    this.close.emit();
  }
}
