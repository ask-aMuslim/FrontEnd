import { Component, Input, Output, EventEmitter } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { InlineSvgDirective } from '../../../../shared/directives/inline-svg.directive';

@Component({
  selector: 'app-edit-contact-information',
  standalone: true,
  imports: [FormsModule, InlineSvgDirective],
  templateUrl: './edit-contact-information.component.html',
  styleUrls: ['./edit-contact-information.component.scss'],
})
export class EditContactInformationComponent {
  @Input() city: string = '';
  @Input() country: string = '';
  @Input() countryCode: string = '';
  @Input() phoneNumber: string = '';
  @Input() email: string = '';
  @Output() save = new EventEmitter<{ city: string; country?: string; countryCode?: string; phoneNumber: string; email: string }>();
  @Output() cancel = new EventEmitter<void>();

  onSave() {
    this.save.emit({
      city: this.city,
      country: this.country || undefined,
      countryCode: this.countryCode || undefined,
      phoneNumber: this.phoneNumber,
      email: this.email,
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}
