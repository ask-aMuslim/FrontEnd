import { Component, EventEmitter, Output } from '@angular/core';

import { InlineSvgDirective } from '../../../../shared/directives/inline-svg.directive';

@Component({
  selector: 'app-share-popup',
  imports: [InlineSvgDirective],
  templateUrl: './share-popup.component.html',
  styleUrls: ['./share-popup.component.scss'],
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
