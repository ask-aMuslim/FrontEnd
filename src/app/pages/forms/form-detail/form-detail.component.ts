import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormDto,
  FormFieldDto,
  FormFieldOptionDto,
  FormFieldType,
  FormsFacade,
} from '../../../api/facades/forms.facade';
import {
  SelectDropdownComponent,
  type SelectOption,
} from '../../../shared/reusable-components/select-dropdown/select-dropdown.component';

interface FormFieldOptionView extends FormFieldOptionDto {
  inputId: string;
}

// File objects are stored directly in FormControl.value
// No wrapper interface needed - File has name, size, type natively

interface FormFieldView {
  id: string;
  label: string;
  type: FormFieldType;
  typeLabel: string;
  isRequired: boolean;
  controlName: string;
  placeholder: string;
  inputType: 'text' | 'email' | 'number' | 'date' | 'file';
  options: FormFieldOptionView[];
  selectOptions: SelectOption<string>[];
}

@Component({
  selector: 'app-form-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SelectDropdownComponent],
  templateUrl: './form-detail.component.html',
  styleUrls: ['./form-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDetailComponent implements OnInit {
  private static readonly loadFailureMessage = 'Unable to load this form right now.';
  private static readonly submitFailureMessage = 'Unable to submit your form right now.';
  private static readonly textAreaRows = 6;
  private static readonly numberPattern = /^-?\d+(\.\d+)?$/;
  private static readonly datePattern = /^\d{4}-\d{2}-\d{2}$/;
  private static readonly fieldTypeMap: Record<number, FormFieldType> = {
    0: 'Text',
    1: 'TextArea',
    2: 'Email',
    3: 'Number',
    4: 'Date',
    5: 'Checkbox',
    6: 'Radio',
    7: 'Select',
    8: 'File',
  };

  private readonly formsFacade = inject(FormsFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submissionId = signal<string | null>(null);

  readonly form = signal<FormDto | null>(null);
  readonly formGroup = signal<FormGroup | null>(null);

  readonly formTitle = computed(() => this.form()?.title ?? 'Form');
  readonly formDescription = computed(() => this.form()?.description ?? '');
  readonly isPublished = computed(() => this.form()?.isPublished ?? false);

  readonly fields = computed<FormFieldView[]>(() => {
    const form = this.form();
    if (!form) {
      return [];
    }

    return this.sortFields(form.fields).map((field) => this.mapFieldView(field));
  });

  readonly fieldCount = computed(() => this.fields().length);
  readonly requiredCount = computed(
    () => this.fields().filter((field) => field.isRequired).length,
  );
  readonly optionalCount = computed(
    () => Math.max(0, this.fieldCount() - this.requiredCount()),
  );
  readonly hasRequiredFields = computed(() => this.requiredCount() > 0);

  readonly canSubmit = computed(() => {
    const group = this.formGroup();
    return !!group && !this.isSubmitting() && this.fields().length > 0;
  });

  get textAreaRows(): number {
    return FormDetailComponent.textAreaRows;
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.loadError.set('Form ID is missing.');
        return;
      }

      this.loadForm(id);
    });
  }

  goBack(): void {
    void this.router.navigate(['/forms']);
  }

  submitForm(): void {
    const form = this.form();
    const group = this.formGroup();

    if (!form || !group || this.isSubmitting()) {
      return;
    }

    this.submitError.set(null);

    if (group.invalid) {
      group.markAllAsTouched();
      return;
    }

    // Build FormData with answersJson and files
    const formData = this.buildFormDataPayload();

    this.isSubmitting.set(true);
    this.formsFacade.submitFormWithFiles(form.id, formData).subscribe({
      next: (submissionId) => {
        this.submissionId.set(submissionId ?? null);
        this.isSubmitting.set(false);
      },
      error: (error: unknown) => {
        this.submitError.set(this.resolveSubmitError(error));
        this.isSubmitting.set(false);
      },
    });
  }

  submitAnother(): void {
    const group = this.formGroup();
    if (!group) {
      return;
    }

    this.submissionId.set(null);
    this.submitError.set(null);
    group.reset(this.buildResetValues(this.fields()));
  }

  isFieldInvalid(field: FormFieldView): boolean {
    const group = this.formGroup();
    if (!group) {
      return false;
    }

    const control = group.get(field.controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getFieldError(field: FormFieldView): string {
    const group = this.formGroup();
    const control = group?.get(field.controlName);

    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }

    if (control.errors['requiredTrue']) {
      return 'Please agree before submitting.';
    }

    if (control.errors['email']) {
      return 'Please enter a valid email address.';
    }

    if (control.errors['pattern'] && field.type === 'Number') {
      return 'Please enter a valid number.';
    }

    if (control.errors['pattern'] && field.type === 'Date') {
      return 'Please enter a valid date.';
    }

    return 'Please check this field.';
  }

  trackById(_index: number, item: FormFieldView): string {
    return item.id;
  }

  trackOptionById(_index: number, item: FormFieldOptionView): string {
    return item.id;
  }

  onSelectField(field: FormFieldView, value: string): void {
    const control = this.formGroup()?.get(field.controlName) as FormControl | null;
    if (!control) {
      return;
    }

    control.setValue(value);
    control.markAsDirty();
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  onFileSelected(field: FormFieldView, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;

    const control = this.formGroup()?.get(field.controlName) as FormControl | null;
    if (!control) {
      return;
    }

    if (!file) {
      control.setValue(null);
      control.markAsDirty();
      control.markAsTouched();
      control.updateValueAndValidity();
      return;
    }

    // Store the actual File object for multipart submission
    control.setValue(file);
    control.markAsDirty();
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  private loadForm(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.submissionId.set(null);
    this.submitError.set(null);
    this.form.set(null);
    this.formGroup.set(null);

    this.formsFacade.getFormById(id).subscribe({
      next: (form) => {
        if (!form) {
          this.loadError.set('Form not found.');
          this.form.set(null);
          this.formGroup.set(null);
          this.isLoading.set(false);
          return;
        }

        this.form.set(form);
        this.formGroup.set(this.buildFormGroup(form));
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.loadError.set(this.resolveLoadError(error));
        this.form.set(null);
        this.formGroup.set(null);
        this.isLoading.set(false);
      },
    });
  }

  private buildFormGroup(form: FormDto): FormGroup {
    const group = this.fb.group({});

    this.sortFields(form.fields).forEach((field) => {
      const control = new FormControl(
        this.getInitialValue(field),
        this.getValidators(field),
      );
      group.addControl(field.id, control);
    });

    return group;
  }

  private buildResetValues(fields: FormFieldView[]): Record<string, unknown> {
    return fields.reduce<Record<string, unknown>>((acc, field) => {
      acc[field.controlName] = this.getResetValue(field.type);
      return acc;
    }, {});
  }

  private getInitialValue(field: FormFieldDto): string | number | boolean | null {
    const normalizedType = this.normalizeFieldType(field.type);

    switch (normalizedType) {
      case 'Checkbox':
        return false;
      case 'Select':
      case 'Radio':
      case 'Number':
      case 'File':
        return null;
      default:
        return '';
    }
  }

  private getValidators(field: FormFieldDto): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    const normalizedType = this.normalizeFieldType(field.type);

    if (field.isRequired) {
      validators.push(normalizedType === 'Checkbox' ? Validators.requiredTrue : Validators.required);
    }

    if (normalizedType === 'Email') {
      validators.push(Validators.email);
    }

    if (normalizedType === 'Number') {
      validators.push(Validators.pattern(FormDetailComponent.numberPattern));
    }

    if (normalizedType === 'Date') {
      validators.push(Validators.pattern(FormDetailComponent.datePattern));
    }

    return validators;
  }

  private mapFieldView(field: FormFieldDto): FormFieldView {
    const normalizedType = this.normalizeFieldType(field.type);
    const normalizedOptions = this.sortOptions(field).map((option) => ({
      ...option,
      inputId: `${field.id}-${option.id}`,
    }));

    return {
      id: field.id,
      label: field.label,
      type: normalizedType,
      typeLabel: this.resolveTypeLabel(normalizedType),
      isRequired: field.isRequired,
      controlName: field.id,
      placeholder: this.resolvePlaceholder(field),
      inputType: this.resolveInputType(normalizedType),
      options: normalizedOptions,
      selectOptions: normalizedOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    };
  }

  private resolveInputType(type: FormFieldType): 'text' | 'email' | 'number' | 'date' | 'file' {
    switch (type) {
      case 'Email':
        return 'email';
      case 'Number':
        return 'number';
      case 'Date':
        return 'date';
      case 'File':
        return 'file';
      default:
        return 'text';
    }
  }

  private resolveTypeLabel(type: FormFieldType): string {
    switch (type) {
      case 'Text':
        return 'Text';
      case 'TextArea':
        return 'Text area';
      case 'Email':
        return 'Email';
      case 'Number':
        return 'Number';
      case 'Date':
        return 'Date';
      case 'Checkbox':
        return 'Checkbox';
      case 'Radio':
        return 'Radio';
      case 'Select':
        return 'Select';
      case 'File':
        return 'File';
      default:
        return 'Text';
    }
  }

  private resolvePlaceholder(field: FormFieldDto): string {
    const base = field.label?.trim();
    if (!base) {
      return 'Enter your response';
    }

    return `Enter ${base.toLowerCase()}`;
  }

  private sortFields(fields: FormFieldDto[]): FormFieldDto[] {
    return [...fields].sort((a, b) => a.order - b.order);
  }

  private sortOptions(field: FormFieldDto): FormFieldOptionDto[] {
    return [...(field.options ?? [])].sort((a, b) => a.order - b.order);
  }

  private resolveLoadError(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    return FormDetailComponent.loadFailureMessage;
  }

  private resolveSubmitError(error: unknown): string {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    return FormDetailComponent.submitFailureMessage;
  }

  private normalizeFieldType(value: FormFieldType | number): FormFieldType {
    if (typeof value === 'number') {
      return FormDetailComponent.fieldTypeMap[value] ?? 'Text';
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return FormDetailComponent.fieldTypeMap[parsed] ?? 'Text';
      }
    }

    return value;
  }

  private buildFormDataPayload(): FormData {
    const formData = new FormData();
    const group = this.formGroup();
    if (!group) {
      return formData;
    }

    // Build answers object, replacing File objects with their filenames
    const answers: Record<string, unknown> = {};
    const files: File[] = [];

    this.fields().forEach((field) => {
      const value = group.get(field.controlName)?.value;

      if (value instanceof File) {
        // Store file for multipart upload
        files.push(value);
        // Store filename in answers for backend to replace with URL
        answers[field.controlName] = value.name;
      } else {
        answers[field.controlName] = value ?? null;
      }
    });

    // Append answersJson as string
    formData.append('answersJson', JSON.stringify(answers));

    // Append each file under 'files' key
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    return formData;
  }

  private buildAnswerPayload(): Record<string, unknown> {
    const group = this.formGroup();
    if (!group) {
      return {};
    }

    return this.fields().reduce<Record<string, unknown>>((acc, field) => {
      const value = group.get(field.controlName)?.value;
      acc[field.controlName] = value ?? null;
      return acc;
    }, {});
  }

  private getResetValue(type: FormFieldType): string | number | boolean | null {
    switch (type) {
      case 'Checkbox':
        return false;
      case 'Select':
      case 'Radio':
      case 'Number':
      case 'File':
        return null;
      default:
        return '';
    }
  }
}
