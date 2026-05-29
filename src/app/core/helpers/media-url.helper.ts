import { environment } from '../../../environments/environment';

const localAssetPrefixes = ['/images/', '/icons/', '/academy-assets/', '/backgrounds/', '/footer/', '/header/'];
const legacyAcademyAssetPrefix = '/academy/';
const academyAssetPrefix = '/academy-assets/';

const legacyApiHosts = [
  'https://aam-api.ask-a-muslim.com',
  'http://aam-api.ask-a-muslim.com',
];

export function toApiMediaUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  let trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // Normalize /api/uploads/ to /uploads/ (case-insensitive)
  if (trimmed.includes('/api/uploads/')) {
    trimmed = trimmed.replace(/\/api\/uploads\//i, '/uploads/');
  } else if (trimmed.startsWith('api/uploads/')) {
    trimmed = trimmed.replace(/^api\/uploads\//i, 'uploads/');
  }

  if (trimmed.startsWith(legacyAcademyAssetPrefix)) {
    return `${academyAssetPrefix}${trimmed.slice(legacyAcademyAssetPrefix.length)}`;
  }

  if (isLocalAssetPath(trimmed)) {
    return trimmed;
  }

  for (const legacyHost of legacyApiHosts) {
    if (trimmed.startsWith(legacyHost)) {
      const path = trimmed.slice(legacyHost.length);
      const mediaPath = path.startsWith('/') ? path : `/${path}`;
      return `${resolveApiHostUrl()}${mediaPath}`;
    }
  }

  if (isAbsoluteUrl(trimmed)) {
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
