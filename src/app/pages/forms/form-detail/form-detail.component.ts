import { ChangeDetectionStrategy, Component, DestroyRef, HostListener, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  SelectDropdownComponent,
  type SelectOption,
} from '../../../shared/reusable-components/select-dropdown/select-dropdown.component';
import { SeoService } from '../../../core/services/seo.service';
import { getUniqueCountryCodesList, searchCountryCodes, getIsoCountryCodeByCallingCode } from './country-codes';
import {
  validatePhoneNumber,
  formatPhoneNumberAsYouType,
  sanitizePhoneNumberInput,
  getPhoneNumberPlaceholder,
  getPhoneErrorMessage,
  extractE164,
} from './phone-number.formatter';

import { environment } from '../../../../environments/environment';

export interface GoogleFormConfig {
  id: string;
  title: string;
  description: string;
  embedUrl: string;
  directUrl: string;
  badge?: string;
  icon?: string;
  hasFileUpload?: boolean;
  fileUploadNote?: string;
}

export const KNOWN_GOOGLE_FORMS: Record<string, GoogleFormConfig> = {
  'join-ask-a-muslim': {
    id: 'join-ask-a-muslim',
    title: 'Join the Ask A Muslim Team',
    description: 'We are delighted by your interest in joining our community. Complete our official registration form below to join our team and contribute to our global da’wah and outreach mission.',
    embedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfYgoGSOqGLsuUdBvKRmr1mpFMlJXrkxicoFDDl-949o49oGQ/viewform?embedded=true',
    directUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSfYgoGSOqGLsuUdBvKRmr1mpFMlJXrkxicoFDDl-949o49oGQ/viewform?usp=header',
    badge: 'Join Our Mission',
    icon: 'fas fa-hand-holding-heart',
  },
  'revert-buddy-program': {
    id: 'revert-buddy-program',
    title: 'Revert Buddy Program',
    description: 'Connect with a mentor or become a buddy to support new Muslims on their spiritual journey.',
    embedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSf4CEffU8mjL5RdtgCrvASqBdJxGS2MQHEGSb-VOxAZpleLxA/viewform?embedded=true',
    directUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSf4CEffU8mjL5RdtgCrvASqBdJxGS2MQHEGSb-VOxAZpleLxA/viewform',
    badge: 'Community Support',
    icon: 'fas fa-user-friends',
  },
  'dawah-workshop': {
    id: 'dawah-workshop',
    title: 'Request a Da’wah Workshop',
    description: 'Request an interactive workshop to learn effective da’wah and outreach techniques.',
    embedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc2xJle4ZROLniNXFD2mZLIBq9uPrmV1Q3G5SRJuI0XBUQBuw/viewform?embedded=true',
    directUrl: 'https://docs.google.com/forms/d/e/1FAIpQLSc2xJle4ZROLniNXFD2mZLIBq9uPrmV1Q3G5SRJuI0XBUQBuw/viewform',
    badge: 'Educational Workshop',
    icon: 'fas fa-chalkboard-teacher',
  },
  'dawah-table': {
    id: 'dawah-table',
    title: 'Establish a Da’wah Table',
    description: 'Apply to set up and manage an official da’wah table in your local area, university campus, or community center.',
    embedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScnO0EZQXIm7OAvt2ZHcED3FeD83o8fxyI5VSVQ37nrTADUDA/viewform?embedded=true',
    directUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScnO0EZQXIm7OAvt2ZHcED3FeD83o8fxyI5VSVQ37nrTADUDA/viewform?pli=1',
    badge: 'Outreach Initiative',
    icon: 'fas fa-table',
    hasFileUpload: true,
    fileUploadNote: 'This form includes a letter of recommendation upload. Google requires sign-in for file uploads.',
  },
  'establish-a-dawah-table': {
    id: 'dawah-table',
    title: 'Establish a Da’wah Table',
    description: 'Apply to set up and manage an official da’wah table in your local area, university campus, or community center.',
    embedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScnO0EZQXIm7OAvt2ZHcED3FeD83o8fxyI5VSVQ37nrTADUDA/viewform?embedded=true',
    directUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScnO0EZQXIm7OAvt2ZHcED3FeD83o8fxyI5VSVQ37nrTADUDA/viewform?pli=1',
    badge: 'Outreach Initiative',
    icon: 'fas fa-table',
    hasFileUpload: true,
    fileUploadNote: 'This form includes a letter of recommendation upload. Google requires sign-in for file uploads.',
  },
  'establish-dawah-table': {
    id: 'dawah-table',
    title: 'Establish a Da’wah Table',
    description: 'Apply to set up and manage an official da’wah table in your local area, university campus, or community center.',
    embedUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScnO0EZQXIm7OAvt2ZHcED3FeD83o8fxyI5VSVQ37nrTADUDA/viewform?embedded=true',
    directUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScnO0EZQXIm7OAvt2ZHcED3FeD83o8fxyI5VSVQ37nrTADUDA/viewform?pli=1',
    badge: 'Outreach Initiative',
    icon: 'fas fa-table',
    hasFileUpload: true,
    fileUploadNote: 'This form includes a letter of recommendation upload. Google requires sign-in for file uploads.',
  },
};

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
  isMultiSelect: boolean;
  controlName: string;
  placeholder: string;
  inputType: 'text' | 'email' | 'number' | 'date' | 'file' | 'tel';
  options: FormFieldOptionView[];
  selectOptions: SelectOption<string>[];
  countryCodeControlName?: string;
  countryCodeOptions?: SelectOption<string>[];
  // Phone number specific
  phoneFormattedValue?: string;
  phoneE164Value?: string;
  phoneValidationError?: string;
  phoneSearchQuery?: string;
}

declare const grecaptcha: {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options?: { action?: string }) => Promise<string>;
} | undefined;

@Component({
  selector: 'app-form-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, SelectDropdownComponent],
  templateUrl: './form-detail.component.html',
  styleUrls: ['./form-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDetailComponent implements OnInit, OnDestroy {
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
    9: 'PhoneNumber',
  };

  private readonly formsFacade = inject(FormsFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly seoService = inject(SeoService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly countryCodes = signal(getUniqueCountryCodesList());

  readonly phoneFieldValidation = signal<Record<string, string | null>>({});
  readonly phoneFieldFormatted = signal<Record<string, string>>({});
  readonly phoneCountrySearch = signal<Record<string, string>>({});

  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submissionId = signal<string | null>(null);

  readonly googleFormSafeUrl = signal<SafeResourceUrl | null>(null);
  readonly googleFormDirectUrl = signal<string>('');
  readonly customFormTitle = signal<string | null>(null);
  readonly customFormDescription = signal<string | null>(null);
  readonly googleFormHasFileUpload = signal<boolean>(false);
  readonly googleFormFileNote = signal<string>('');
  readonly isGoogleForm = computed(() => this.googleFormSafeUrl() !== null);

  private recaptchaPromise: Promise<void> | null = null;

  get recaptchaSiteKey(): string {
    return environment.recaptchaSiteKey ?? '';
  }

  readonly form = signal<FormDto | null>(null);
  readonly formGroup = signal<FormGroup | null>(null);

  readonly formTitle = computed(() => {
    if (this.customFormTitle()) {
      return this.customFormTitle()!;
    }
    const title = this.form()?.title ?? 'Form';
    return title.replace(/AskAMuslim/g, 'Ask A Muslim');
  });
  readonly formDescription = computed(() => {
    if (this.customFormDescription()) {
      return this.customFormDescription()!;
    }
    const description = this.form()?.description ?? '';
    return description.replace(/AskAMuslim/g, 'Ask A Muslim');
  });
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

    if (environment.recaptchaSiteKey) {
      this.loadRecaptchaScript();
    }
  }

  ngOnDestroy(): void {
    this.toggleRecaptchaBadge(false);
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

    if (environment.recaptchaSiteKey) {
      this.getRecaptchaToken().then((token: string) => {
        if (!token || token.trim() === '') {
          this.submitError.set('Please complete the security verification.');
          this.isSubmitting.set(false);
          return;
        }
        formData.append('recaptchaToken', token);
        this.submitFormWithPayload(form.id, formData);
       }).catch(() => {
         this.submitError.set('Security verification failed. Please try again.');
         this.isSubmitting.set(false);
       });
    } else {
      this.submitFormWithPayload(form.id, formData);
    }
  }

  private submitFormWithPayload(formId: string, formData: FormData): void {
    this.isSubmitting.set(true);
    this.formsFacade.submitFormWithFiles(formId, formData).subscribe({
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

    if (field.isMultiSelect) {
      const current = Array.isArray(control.value) ? control.value : [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      control.setValue(next);
    } else {
      control.setValue(value);
    }
    control.markAsDirty();
    control.markAsTouched();
    control.updateValueAndValidity();
  }

  isSelectOptionSelected(field: FormFieldView, value: string): boolean {
    const control = this.formGroup()?.get(field.controlName) as FormControl | null;
    if (!control) {
      return false;
    }

    if (field.isMultiSelect) {
      return Array.isArray(control.value) && control.value.includes(value);
    }

    return control.value === value;
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

  onCountryCodeSelected(field: FormFieldView, value: string): void {
    if (!field.countryCodeControlName) {
      return;
    }

    const control = this.formGroup()?.get(field.countryCodeControlName) as FormControl | null;
    if (!control) {
      return;
    }

    control.setValue(value);
    control.markAsDirty();
    control.markAsTouched();
    control.updateValueAndValidity();

    // Re-validate phone number with new country code
    const phoneControl = this.formGroup()?.get(field.controlName) as FormControl | null;
    if (phoneControl && phoneControl.value) {
      // Trigger input validation with the current value and new country code
      this.onPhoneNumberInput(field, phoneControl.value);
    }
  }

  onPhoneNumberInput(field: FormFieldView, event: Event | string): void {
    const group = this.formGroup();
    if (!group || !field.countryCodeControlName) {
      return;
    }

    const input = typeof event === 'string' ? event : (event.target as HTMLInputElement)?.value || '';
    const callingCode = group.get(field.countryCodeControlName)?.value ?? '+1';
    // Get ISO country code (e.g., "US") from calling code (e.g., "+1")
    const isoCountryCode = getIsoCountryCodeByCallingCode(callingCode) ?? 'US';

    // Sanitize input
    const sanitized = sanitizePhoneNumberInput(input);

    // Format as-you-type
    const formatted = formatPhoneNumberAsYouType(sanitized, isoCountryCode);

    // Update formatted display
    this.phoneFieldFormatted.update((state) => ({
      ...state,
      [field.id]: formatted,
    }));

    // Validate
    const validation = validatePhoneNumber(sanitized, isoCountryCode);

    // Update validation state
    this.phoneFieldValidation.update((state) => ({
      ...state,
      [field.id]: validation.isValid ? null : getPhoneErrorMessage(validation.error ?? null),
    }));

    // Update FormControl value with sanitized input
    const phoneControl = group.get(field.controlName) as FormControl | null;
    if (phoneControl) {
      phoneControl.setValue(sanitized, { emitEvent: false });

      // Set control errors based on validation
      if (sanitized.length > 0) {
        // Only validate if user has entered something
        if (!validation.isValid) {
          phoneControl.setErrors({
            [validation.error === 'TOO_SHORT'
              ? 'phoneNumberTooShort'
              : validation.error === 'TOO_LONG'
                ? 'phoneNumberTooLong'
                : 'phoneNumberInvalid']: true,
          });
        } else {
          phoneControl.setErrors(null);
        }
      } else {
        // Empty input - check if required
        if (field.isRequired) {
          phoneControl.setErrors({ required: true });
        } else {
          phoneControl.setErrors(null);
        }
      }

      if (typeof event !== 'string') {
        // Also update the input's display value with formatted version
        (event.target as HTMLInputElement).value = formatted;
      }
    }
  }

  onPhoneNumberBlur(field: FormFieldView): void {
    const group = this.formGroup();
    if (!group || !field.countryCodeControlName) {
      return;
    }

    const phoneControl = group.get(field.controlName) as FormControl | null;
    if (!phoneControl) {
      return;
    }

    const callingCode = group.get(field.countryCodeControlName)?.value ?? '+1';
    // Get ISO country code (e.g., "US") from calling code (e.g., "+1")
    const isoCountryCode = getIsoCountryCodeByCallingCode(callingCode) ?? 'US';
    const value = phoneControl.value || '';

    // Validate once more on blur
    const validation = validatePhoneNumber(value, isoCountryCode);

    this.phoneFieldValidation.update((state) => ({
      ...state,
      [field.id]: validation.isValid ? null : getPhoneErrorMessage(validation.error ?? null),
    }));

    // Set control errors
    if (value.length > 0) {
      if (!validation.isValid) {
        phoneControl.setErrors({
          [validation.error === 'TOO_SHORT'
            ? 'phoneNumberTooShort'
            : validation.error === 'TOO_LONG'
              ? 'phoneNumberTooLong'
              : 'phoneNumberInvalid']: true,
        });
      } else {
        phoneControl.setErrors(null);
      }
    }

    phoneControl.markAsTouched();
  }

  onPhonePaste(field: FormFieldView, event: ClipboardEvent): void {
    event.preventDefault();

    const group = this.formGroup();
    if (!group || !field.countryCodeControlName) {
      return;
    }

    const pastedText = event.clipboardData?.getData('text') || '';
    const sanitized = sanitizePhoneNumberInput(pastedText);

    const phoneControl = group.get(field.controlName) as FormControl | null;
    if (phoneControl) {
      // Set the sanitized value and trigger input processing
      phoneControl.setValue(sanitized);
      phoneControl.markAsDirty();

      // Update the input display and validation
      this.onPhoneNumberInput(field, sanitized);
    }
  }

  filterCountriesBySearch(
    field: FormFieldView,
    query: string,
  ): SelectOption<string>[] {
    const allCountries = field.countryCodeOptions || [];

    this.phoneCountrySearch.update((state) => ({
      ...state,
      [field.id]: query,
    }));

    if (!query.trim()) {
      return allCountries;
    }

    return searchCountryCodes(query, this.countryCodes())
      .map((country) => ({
        value: country.code,
        label: country.label,
      }));
  }

  private loadForm(id: string): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.submissionId.set(null);
    this.submitError.set(null);
    this.form.set(null);
    this.formGroup.set(null);
    this.googleFormSafeUrl.set(null);
    this.googleFormDirectUrl.set('');
    this.customFormTitle.set(null);
    this.customFormDescription.set(null);
    this.googleFormHasFileUpload.set(false);
    this.googleFormFileNote.set('');

    const normalizedId = id.trim().toLowerCase();
    const knownConfig = KNOWN_GOOGLE_FORMS[normalizedId];

    if (knownConfig) {
      this.customFormTitle.set(knownConfig.title);
      this.customFormDescription.set(knownConfig.description);
      this.googleFormSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(knownConfig.embedUrl));
      this.googleFormDirectUrl.set(knownConfig.directUrl);
      this.googleFormHasFileUpload.set(knownConfig.hasFileUpload ?? false);
      this.googleFormFileNote.set(knownConfig.fileUploadNote ?? '');
      this.isLoading.set(false);

      this.seoService.setMetaTags({
        title: knownConfig.title,
        description: knownConfig.description,
        keywords: [knownConfig.title, 'Ask A Muslim Form', 'Google Form registration']
      });
      return;
    }

    this.formsFacade.getFormById(id).subscribe({
      next: (form) => {
        if (!form) {
          this.loadError.set('Form not found.');
          this.form.set(null);
          this.formGroup.set(null);
          this.isLoading.set(false);
          return;
        }

        const titleLower = (form.title || '').toLowerCase();
        if (titleLower.includes('join') || titleLower.includes('ask a muslim') || titleLower.includes('askamuslim')) {
          const joinConfig = KNOWN_GOOGLE_FORMS['join-ask-a-muslim'];
          this.form.set(form);
          this.customFormTitle.set(joinConfig.title);
          const description = (form.description && form.description.trim().length > 0)
            ? form.description.trim()
            : joinConfig.description;
          this.customFormDescription.set(description);
          this.googleFormSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(joinConfig.embedUrl));
          this.googleFormDirectUrl.set(joinConfig.directUrl);
          this.googleFormHasFileUpload.set(joinConfig.hasFileUpload ?? false);
          this.googleFormFileNote.set(joinConfig.fileUploadNote ?? '');
          this.isLoading.set(false);

          this.seoService.setMetaTags({
            title: joinConfig.title,
            description,
            keywords: [joinConfig.title, 'Ask A Muslim', 'Join Team']
          });
          return;
        }

        if (titleLower.includes('table') || titleLower.includes('establish')) {
          const tableConfig = KNOWN_GOOGLE_FORMS['dawah-table'];
          this.form.set(form);
          this.customFormTitle.set(tableConfig.title);
          const description = (form.description && form.description.trim().length > 0)
            ? form.description.trim()
            : tableConfig.description;
          this.customFormDescription.set(description);
          this.googleFormSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(tableConfig.embedUrl));
          this.googleFormDirectUrl.set(tableConfig.directUrl);
          this.googleFormHasFileUpload.set(tableConfig.hasFileUpload ?? false);
          this.googleFormFileNote.set(tableConfig.fileUploadNote ?? '');
          this.isLoading.set(false);

          this.seoService.setMetaTags({
            title: tableConfig.title,
            description,
            keywords: [tableConfig.title, 'Ask A Muslim', 'Da’wah Table']
          });
          return;
        }

        this.form.set(form);
        this.formGroup.set(this.buildFormGroup(form));
        this.isLoading.set(false);

        this.seoService.setMetaTags({
          title: form.title,
          description: form.description || `Submit your response for the form: ${form.title} at Ask A Muslim.`,
          keywords: ['Form submission', form.title, 'Islamic community forms']
        });
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

      // Add country code control for PhoneNumber fields
      if (this.normalizeFieldType(field.type) === 'PhoneNumber') {
        const countryCodeControl = new FormControl(
          '+1',
          field.isRequired ? Validators.required : [],
        );
        group.addControl(`${field.id}_countryCode`, countryCodeControl);
      }
    });

    return group;
  }

  private buildResetValues(fields: FormFieldView[]): Record<string, unknown> {
    return fields.reduce<Record<string, unknown>>((acc, field) => {
      acc[field.controlName] = this.getResetValue(field);
      return acc;
    }, {});
  }

  private getInitialValue(
    field: FormFieldDto,
  ): string | number | boolean | string[] | null {
    const normalizedType = this.normalizeFieldType(field.type);
    const isMultiSelect = this.isMultiSelectField(field, normalizedType);

    switch (normalizedType) {
      case 'Checkbox':
        return false;
      case 'Select':
        return isMultiSelect ? [] : null;
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
    const isMultiSelect = this.isMultiSelectField(field, normalizedType);
    const normalizedOptions = this.sortOptions(field).map((option) => ({
      ...option,
      inputId: `${field.id}-${option.id}`,
    }));

    const view: FormFieldView = {
      id: field.id,
      label: field.label,
      type: normalizedType,
      typeLabel: this.resolveTypeLabel(normalizedType),
      isRequired: field.isRequired,
      isMultiSelect,
      controlName: field.id,
      placeholder: this.resolvePlaceholder(field),
      inputType: this.resolveInputType(normalizedType),
      options: normalizedOptions,
      selectOptions: normalizedOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    };

    // Add country code options for PhoneNumber fields
    if (normalizedType === 'PhoneNumber') {
      const defaultCountryCode = 'US';
      view.countryCodeControlName = `${field.id}_countryCode`;
      view.countryCodeOptions = this.countryCodes().map((country) => ({
        value: country.code,
        label: country.label,
      }));
      // Set phone placeholder based on default country
      view.placeholder = getPhoneNumberPlaceholder(defaultCountryCode);
    }

    return view;
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
      case 'PhoneNumber':
        return 'Phone';
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

  private isMultiSelectField(
    field: { type: FormFieldType | number; isMultiSelect?: boolean },
    normalizedType?: FormFieldType,
  ): boolean {
    const resolvedType = normalizedType ?? this.normalizeFieldType(field.type);
    return resolvedType === 'Select' && !!field.isMultiSelect;
  }

  private normalizeMultiSelectValue(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }

    if (typeof value === 'string' && value.trim()) {
      return [value];
    }

    return [];
  }

  private loadRecaptchaScript(): void {
    if (this.recaptchaPromise) {
      this.toggleRecaptchaBadge(true);
      return;
    }
    if (typeof document === 'undefined') {
      return;
    }
    this.recaptchaPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${environment.recaptchaSiteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.toggleRecaptchaBadge(true);
        setTimeout(() => this.toggleRecaptchaBadge(true), 200);
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
      document.head.appendChild(script);
    });
  }

  private getRecaptchaToken(): Promise<string> {
    const executeToken = (resolve: (value: string) => void, reject: (reason?: any) => void) => {
      if (typeof grecaptcha === 'undefined') {
        reject(new Error('reCAPTCHA not ready'));
        return;
      }
      grecaptcha.ready(() => {
        grecaptcha.execute(environment.recaptchaSiteKey, { action: 'submit_form' })
          .then((token: string) => resolve(token))
          .catch((e: unknown) => reject(e));
      });
    };

    return new Promise<string>((resolve, reject) => {
      if (this.recaptchaPromise) {
        this.recaptchaPromise
          .then(() => executeToken(resolve, reject))
          .catch((err) => reject(err));
      } else {
        executeToken(resolve, reject);
      }
    });
  }

  private toggleRecaptchaBadge(show: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }
    const badge = document.querySelector('.grecaptcha-badge') as HTMLElement | null;
    if (badge) {
      badge.style.setProperty('visibility', show ? 'visible' : 'hidden', 'important');
    }
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
      } else if (field.type === 'PhoneNumber' && field.countryCodeControlName) {
        // Extract and submit E.164 formatted number
        const callingCode = group.get(field.countryCodeControlName)?.value ?? '+1';
        // Get the ISO country code (e.g., "US") from the calling code (e.g., "+1")
        const isoCountryCode = getIsoCountryCodeByCallingCode(callingCode) ?? 'US';
        const phoneInput = value ? String(value).trim() : '';

        const e164 = extractE164(phoneInput, isoCountryCode);
        answers[field.controlName] = e164 || null;
      } else if (field.type === 'Select' && field.isMultiSelect) {
        answers[field.controlName] = this.normalizeMultiSelectValue(value);
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
      acc[field.controlName] = field.isMultiSelect
        ? this.normalizeMultiSelectValue(value)
        : value ?? null;
      return acc;
    }, {});
  }

  private getResetValue(
    field: { type: FormFieldType | number; isMultiSelect?: boolean },
  ): string | number | boolean | string[] | null {
    const normalizedType = this.normalizeFieldType(field.type);
    if (normalizedType === 'Select' && this.isMultiSelectField(field, normalizedType)) {
      return [];
    }

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
}
