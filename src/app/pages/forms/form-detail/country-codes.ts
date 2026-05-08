import { getCountries } from 'libphonenumber-js';
import { getCountryCallingCode } from 'libphonenumber-js';

export interface CountryCode {
  code: string;
  label: string;
  countryCode: string; // ISO 3166-1 alpha-2 code
  isPreferred?: boolean;
}

// Preferred countries to show at the top of the list
const PREFERRED_COUNTRIES = ['US', 'EG', 'SA', 'AE'];

/**
 * Get a sorted list of country codes with labels
 * Uses libphonenumber-js for authoritative country data
 */
export function getCountryCodesList(): CountryCode[] {
  const countries = getCountries();

  const countryCodes: CountryCode[] = [];

  for (const countryCode of countries) {
    try {
      const callingCode = getCountryCallingCode(countryCode as any);
      if (callingCode) {
        countryCodes.push({
          code: `+${callingCode}`,
          label: `+${callingCode} ${countryCode}`,
          countryCode,
          isPreferred: PREFERRED_COUNTRIES.includes(countryCode),
        });
      }
    } catch {
      // Skip countries that don't have a calling code
    }
  }

  // Sort by calling code numerically, then by country code
  countryCodes.sort((a, b) => {
    // Preferred countries first
    if (a.isPreferred && !b.isPreferred) return -1;
    if (!a.isPreferred && b.isPreferred) return 1;

    const aCode = parseInt(a.code.slice(1), 10);
    const bCode = parseInt(b.code.slice(1), 10);
    if (aCode !== bCode) {
      return aCode - bCode;
    }
    return a.countryCode.localeCompare(b.countryCode);
  });

  // Remove duplicates by calling code, keeping the first occurrence
  const uniqueCountryCodes: CountryCode[] = [];
  const seenCodes = new Set<string>();

  for (const country of countryCodes) {
    if (!seenCodes.has(country.code)) {
      uniqueCountryCodes.push(country);
      seenCodes.add(country.code);
    }
  }

  return uniqueCountryCodes;
}

/**
 * Get a deduplicated list where each calling code appears only once
 * Useful for dropdown selectors
 */
export function getUniqueCountryCodesList(): CountryCode[] {
  return getCountryCodesList();
}

/**
 * Get country code by ISO country code
 */
export function getCountryCodeByCountry(countryCode: string): string | null {
  try {
    const callingCode = getCountryCallingCode(countryCode as any);
    return callingCode ? `+${callingCode}` : null;
  } catch {
    return null;
  }
}

/**
 * Search countries by label or code
 */
export function searchCountryCodes(query: string, countries: CountryCode[]): CountryCode[] {
  if (!query.trim()) {
    return countries;
  }

  const lowerQuery = query.toLowerCase();

  return countries.filter((country) => {
    return (
      country.label.toLowerCase().includes(lowerQuery) ||
      country.code.includes(lowerQuery) ||
      country.countryCode.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Get ISO country code by phone calling code (e.g., "1" -> "US")
 * Returns the first country with that calling code
 */
export function getIsoCountryCodeByCallingCode(callingCode: string): string | null {
  const countries = getCountryCodesList();
  const code = callingCode.startsWith('+') ? callingCode.slice(1) : callingCode;

  const country = countries.find((c) => c.code === `+${code}`);
  return country?.countryCode ?? null;
}


