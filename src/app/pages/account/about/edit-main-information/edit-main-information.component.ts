import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InlineSvgDirective } from '../../../../shared/directives/inline-svg.directive';

@Component({
  selector: 'app-edit-main-information',
  standalone: true,
  imports: [CommonModule, FormsModule, InlineSvgDirective],
  templateUrl: './edit-main-information.component.html',
  styleUrls: ['./edit-main-information.component.scss'],
})
export class EditMainInformationComponent {
  @Input() religion: string = '';
  @Input() reasonOfReligion: string = '';
  @Input() bio: string = '';
  @Output() save = new EventEmitter<{ religion: string; reasonOfReligion: string; bio: string }>();
  @Output() cancel = new EventEmitter<void>();

  onSave() {
    this.save.emit({
      religion: this.religion,
      reasonOfReligion: this.reasonOfReligion,
      bio: this.bio,
    });
  }

  onCancel() {
    this.cancel.emit();
  }
}
