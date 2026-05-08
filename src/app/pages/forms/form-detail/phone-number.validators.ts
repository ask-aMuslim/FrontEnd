import { AbstractControl, AsyncValidatorFn, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { validatePhoneNumber } from './phone-number.formatter';

export interface PhoneNumberValidationContext {
    countryCode$: Observable<string>;
}

/**
 * Custom validator for phone number format
 * Usage: control.setValidators(phoneNumberValidator(countryCode$))
 */
export function phoneNumberValidator(countryCode$: Observable<string>): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
        if (!control.value) {
            return of(null);
        }

        return countryCode$.pipe(
            map((countryCode) => {
                const result = validatePhoneNumber(control.value as string, countryCode);

                if (result.isValid) {
                    return null;
                }

                if (result.error === 'TOO_SHORT') {
                    return { phoneNumberTooShort: true };
                }

                if (result.error === 'TOO_LONG') {
                    return { phoneNumberTooLong: true };
                }

                if (result.error === 'INVALID_FORMAT' || result.error === 'INVALID_COUNTRY_CODE') {
                    return { phoneNumberInvalid: true };
                }

                return { phoneNumberInvalid: true };
            }),
        );
    };
}

/**
 * Simple synchronous validator for basic phone number format
 * Useful for quick validation before async check
 */
export function phoneNumberFormatValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        const value = String(control.value).trim();

        // Must have at least some digits
        if (!value.match(/\d/)) {
            return { phoneNumberEmpty: true };
        }

        // Should not be too short (at least 5 digits)
        const digitCount = value.replace(/\D/g, '').length;
        if (digitCount < 5) {
            return { phoneNumberTooShort: true };
        }

        // Should not be too long (max 15 digits according to E.164)
        if (digitCount > 15) {
            return { phoneNumberTooLong: true };
        }

        return null;
    };
}
