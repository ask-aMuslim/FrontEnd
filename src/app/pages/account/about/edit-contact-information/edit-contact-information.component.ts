import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InlineSvgDirective } from '../../../../shared/directives/inline-svg.directive';

@Component({
  selector: 'app-edit-contact-information',
  standalone: true,
  imports: [CommonModule, FormsModule, InlineSvgDirective],
  templateUrl: './edit-contact-information.component.html',
  styleUrls: ['./edit-contact-information.component.scss'],
})
export class EditContactInformationComponent {
  @Input() city: string = '';
  @Input() phoneNumber: string = '';
  @Input() email: string = '';
  @Output() save = new EventEmitter<{ city: string; phoneNumber: string; email: string }>();
  @Output() cancel = new EventEmitter<void>();

  onSave() {
    this.save.emit({
      city: this.city,
      phoneNumber: this.phoneNumber,
      email: this.email,
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}
