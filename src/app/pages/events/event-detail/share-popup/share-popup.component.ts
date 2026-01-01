import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSVGModule } from 'ng-inline-svg';

@Component({
  selector: 'app-share-popup',
  imports: [CommonModule, InlineSVGModule],
  templateUrl: './share-popup.component.html',
  styleUrl: './share-popup.component.scss',
})
export class SharePopupComponent {
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  closePopup(): void {
    this.close.emit();
  }

  confirmShare(): void {
    this.confirm.emit();
    this.close.emit();
  }
}
