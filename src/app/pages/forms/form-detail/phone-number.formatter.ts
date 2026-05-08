import { parsePhoneNumber, isValidPhoneNumber, AsYouType, getCountryCallingCode } from 'libphonenumber-js';

export interface PhoneNumberValidationResult {
    isValid: boolean;
    error?: 'INVALID_COUNTRY_CODE' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_FORMAT' | null;
    e164?: string;
}

export interface PhoneNumberFormatting {
    formatted: string;
    e164: string;
}

/**
 * Validate phone number for a given country
 */
export function validatePhoneNumber(
    phoneNumber: string,
    countryCode: string,
): PhoneNumberValidationResult {
    if (!phoneNumber.trim()) {
        return { isValid: false, error: 'INVALID_FORMAT' };
    }

    try {
        // Parse the phone number with the selected country code
        const parsed = parsePhoneNumber(phoneNumber, countryCode as any);

        if (!parsed) {
            return { isValid: false, error: 'INVALID_FORMAT' };
        }

        if (!isValidPhoneNumber(phoneNumber, countryCode as any)) {
            // Determine specific error
            const numberStr = phoneNumber.replace(/\D/g, '');
            if (numberStr.length < 6) {
                return { isValid: false, error: 'TOO_SHORT' };
            } else if (numberStr.length > 15) {
                return { isValid: false, error: 'TOO_LONG' };
            }
            return { isValid: false, error: 'INVALID_FORMAT' };
        }

        return {
            isValid: true,
            error: null,
            e164: parsed.format('E.164'),
        };
    } catch {
        return { isValid: false, error: 'INVALID_FORMAT' };
    }
}

/**
 * Format phone number as-you-type with the selected country
 */
export function formatPhoneNumberAsYouType(
    input: string,
    countryCode: string,
): string {
    try {
        const formatter = new AsYouType(countryCode as any);
        return formatter.input(input) || input;
    } catch {
        return input;
    }
}

/**
 * Parse and normalize a phone number (handles pasted numbers)
 */
export function parsePhoneNumberInput(
    input: string,
    countryCode: string,
): string {
    // Remove leading/trailing whitespace
    let cleaned = input.trim();

    // If it starts with +, keep it; otherwise prepend the country code if not present
    if (!cleaned.startsWith('+')) {
        // Extract calling code from country
        try {
            const callingCode = getCountryCallingCode(countryCode as any);
            if (callingCode && !cleaned.startsWith('+' + callingCode)) {
                cleaned = '+' + callingCode + cleaned;
            }
        } catch {
            // Ignore
        }
    }

    return cleaned;
}

/**
 * Get placeholder example based on country
 */
export function getPhoneNumberPlaceholder(countryCode: string): string {
    const placeholders: Record<string, string> = {
        US: '(555) 123-4567',
        CA: '(555) 123-4567',
        GB: '01632 960000',
        DE: '030 12345678',
        FR: '01 23 45 67 89',
        IT: '06 1234 5678',
        ES: '912 345 678',
        EG: '10 1234 5678',
        SA: '50 123 4567',
        AE: '50 123 4567',
        IN: '98765 43210',
        JP: '90-1234-5678',
        AU: '02 1234 5678',
    };

    return placeholders[countryCode] || '+1 (555) 123-4567';
}

/**
 * Sanitize pasted phone number input
 */
export function sanitizePhoneNumberInput(input: string): string {
    // Remove extra spaces, brackets, and normalize
    return input
        .replace(/[\s\-()[\]{}]/g, '') // Remove spaces, dashes, brackets
        .replace(/[^\d+]/g, ''); // Keep only digits and plus sign
}

/**
 * Extract E.164 formatted number from user input
 */
export function extractE164(input: string, countryCode: string): string | null {
    try {
        const sanitized = sanitizePhoneNumberInput(input);
        const parsed = parsePhoneNumber(sanitized, countryCode as any);

        if (parsed && isValidPhoneNumber(sanitized, countryCode as any)) {
            return parsed.format('E.164');
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Get user-friendly error message
 */
export function getPhoneErrorMessage(
    error: 'INVALID_COUNTRY_CODE' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID_FORMAT' | null,
): string {
    switch (error) {
        case 'TOO_SHORT':
            return 'Phone number is too short.';
        case 'TOO_LONG':
            return 'Phone number is too long.';
        case 'INVALID_COUNTRY_CODE':
            return 'Invalid country code.';
        case 'INVALID_FORMAT':
            return 'Please enter a valid phone number.';
        default:
            return 'Please check this field.';
    }
}
