const DIRECT_API_BASE_URL = 'https://api.askamuslim.com';
const DIRECT_ASSISTANT_API_BASE_URL = 'https://localhost:8000';
const DIRECT_ASSISTANT_API_BASE_URL_FALLBACK = 'http://127.0.0.1:8000';

const NETLIFY_API_BASE_URL = '/backend';
const NETLIFY_ASSISTANT_API_BASE_URL = '/assistant-api';

function isNetlifyBrowserHost(): boolean {
  if (typeof globalThis === 'undefined' || !('location' in globalThis)) {
    return false;
  }

  const hostname = globalThis.location?.hostname?.toLowerCase() ?? '';
  return hostname.endsWith('.netlify.app') || hostname.endsWith('.netlify.live');
}

export function resolveApiBaseUrl(): string {
  return isNetlifyBrowserHost() ? NETLIFY_API_BASE_URL : DIRECT_API_BASE_URL;
}

export function resolveAssistantApiBaseUrl(): string {
  return isNetlifyBrowserHost()
    ? NETLIFY_ASSISTANT_API_BASE_URL
    : DIRECT_ASSISTANT_API_BASE_URL;
}

export function resolveAssistantApiFallbackBaseUrl(): string {
  return isNetlifyBrowserHost()
    ? NETLIFY_ASSISTANT_API_BASE_URL
    : DIRECT_ASSISTANT_API_BASE_URL_FALLBACK;
}
