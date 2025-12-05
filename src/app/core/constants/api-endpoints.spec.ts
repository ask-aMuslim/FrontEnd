import { API_ENDPOINTS } from './api-endpoints';
import { environment } from '../../../environments/environment';

describe('API_ENDPOINTS', () => {
  it('encodes path params and preserves base url', () => {
    const raw = 'abc 123/ä';
    const url = API_ENDPOINTS.certificates.getById(raw as any);
    expect(url).toContain(encodeURIComponent(raw));

    const normalizedBase = environment.apiBaseUrl.replace(/\/+$/g, '');
    expect(url.startsWith(normalizedBase)).toBe(true);
  });

  it('accepts numeric ids', () => {
    const url = API_ENDPOINTS.courses.getById(42 as any);
    expect(url).toContain('42');
  });
});
