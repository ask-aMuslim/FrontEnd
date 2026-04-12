import { Component, Input, Output, EventEmitter } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { InlineSvgDirective } from '../../../../shared/directives/inline-svg.directive';

const religionOptions = [
  'Non-Muslim',
  'Born Muslim',
  'New Muslim',
] as const;

@Component({
  selector: 'app-edit-main-information',
  standalone: true,
  imports: [FormsModule, InlineSvgDirective],
  templateUrl: './edit-main-information.component.html',
  styleUrls: ['./edit-main-information.component.scss'],
})
export class EditMainInformationComponent {
  @Input() religion: string = '';
  @Input() reasonOfReligion: string = '';
  @Input() reasonForConversion: string = '';
  @Input() oldReligion: string = '';
  @Input() bio: string = '';
  protected readonly religionOptions = religionOptions;
  @Output() save = new EventEmitter<{
    religion: string;
    reasonOfReligion?: string;
    reasonForConversion?: string;
    oldReligion?: string;
    bio: string;
  }>();
  @Output() cancelEdit = new EventEmitter<void>();

  get isNonMuslim(): boolean {
    return this.religion === 'Non-Muslim';
  }

  get isNewMuslim(): boolean {
    return this.religion === 'New Muslim';
  }

  onReligionChange(): void {
    if (this.isNonMuslim) {
      this.reasonForConversion = '';
      this.oldReligion = '';
      return;
    }

    if (this.isNewMuslim) {
      this.reasonOfReligion = '';
      return;
    }

    this.reasonOfReligion = '';
    this.reasonForConversion = '';
    this.oldReligion = '';
  }

  onSave() {
    if (!this.religion) {
      return;
    }

    this.save.emit({
      religion: this.religion,
      reasonOfReligion: this.isNonMuslim ? this.reasonOfReligion : undefined,
      reasonForConversion: this.isNewMuslim ? this.reasonForConversion : undefined,
      oldReligion: this.isNewMuslim ? this.oldReligion : undefined,
      bio: this.bio,
    });
  }

  onCancel() {
    this.cancelEdit.emit();
  }
}
