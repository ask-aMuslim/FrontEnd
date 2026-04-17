import { environment } from '../../../environments/environment';

const localAssetPrefixes = ['/images/', '/icons/', '/academy-assets/', '/backgrounds/', '/footer/', '/header/'];
const legacyAcademyAssetPrefix = '/academy/';
const academyAssetPrefix = '/academy-assets/';

export function toApiMediaUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith(legacyAcademyAssetPrefix)) {
    return `${academyAssetPrefix}${trimmed.slice(legacyAcademyAssetPrefix.length)}`;
  }

  if (isAbsoluteUrl(trimmed) || isLocalAssetPath(trimmed)) {
    return trimmed;
  }

  const mediaPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${resolveApiHostUrl()}${mediaPath}`;
}

function resolveApiHostUrl(): string {
  const configured = environment.apiBaseUrl.trim().replaceAll(/\/+$/g, '');
  if (configured.length === 0) {
    return '';
  }

  if (configured.endsWith('/api')) {
    return configured.slice(0, -4);
  }

  return configured;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isLocalAssetPath(value: string): boolean {
  return localAssetPrefixes.some((prefix) => value.startsWith(prefix));
}
