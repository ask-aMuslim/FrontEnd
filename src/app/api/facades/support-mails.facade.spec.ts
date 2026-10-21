import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SupportMailsFacade } from './support-mails.facade';
import type { SupportMailError } from './support-mails.models';

describe('SupportMailsFacade', () => {
  let facade: SupportMailsFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    facade = TestBed.inject(SupportMailsFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps Result.data for eligibility', () => {
    let result: unknown;
    facade.getEligibility().subscribe((value) => (result = value));

    const req = http.expectOne((r) => r.url.endsWith('/api/SupportMails/eligibility'));
    req.flush({ succeeded: true, errors: [], data: { canCreate: false, nextAllowedAt: '2026-10-19T11:42:00+00:00' } });

    expect(result).toEqual({ canCreate: false, nextAllowedAt: '2026-10-19T11:42:00+00:00' });
  });

  it('sends list filters as query params', () => {
    facade.getMine({ pageNumber: 2, pageSize: 10, status: 1, searchTerm: ' music ' }).subscribe();

    const req = http.expectOne((r) => r.url.endsWith('/api/SupportMails'));
    expect(req.request.params.get('pageNumber')).toBe('2');
    expect(req.request.params.get('status')).toBe('1');
    expect(req.request.params.get('searchTerm')).toBe('music');
    req.flush({ succeeded: true, errors: [], data: { items: [], pageNumber: 2, totalPages: 2, totalCount: 11, hasPreviousPage: true, hasNextPage: false } });
  });

  it('reads the plain-string id returned by create', () => {
    let id = '';
    facade.create({ topic: 7, subject: 'Music Enquiry', explanation: null }).subscribe((value) => (id = value));

    const req = http.expectOne((r) => r.url.endsWith('/api/SupportMails') && r.method === 'POST');
    expect(req.request.body).toEqual({ topic: 7, subject: 'Music Enquiry', explanation: null });
    req.flush('3f2b8f0e-6b1c-4c1e-9a55-0c1f2d3e4a5b', { status: 201, statusText: 'Created' });

    expect(id).toBe('3f2b8f0e-6b1c-4c1e-9a55-0c1f2d3e4a5b');
  });

  it('does not retry a failed create', () => {
    let error: SupportMailError | undefined;
    facade.create({ topic: 1, subject: 'Hi', explanation: null }).subscribe({ error: (e) => (error = e) });

    http
      .expectOne((r) => r.method === 'POST')
      .flush({ errors: ['You can send a new inquiry after 2026-10-19T11:42:00.0000000+00:00.'] }, { status: 400, statusText: 'Bad Request' });

    http.expectNone((r) => r.method === 'POST');
    expect(error?.status).toBe(400);
    expect(error?.messages[0]).toContain('You can send a new inquiry after');
  });

  it('maps ProblemDetails validation errors to camelCase fields', () => {
    let error: SupportMailError | undefined;
    facade.reply('abc', { body: '' }).subscribe({ error: (e) => (error = e) });

    http
      .expectOne((r) => r.url.endsWith('/api/SupportMails/abc/replies'))
      .flush(
        { title: 'One or more validation errors occurred.', status: 400, errors: { Body: ["'Body' must not be empty."] } },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(error?.fieldErrors['body']).toEqual(["'Body' must not be empty."]);
  });

  it('normalizes an ApiError from the error interceptor', () => {
    const error = SupportMailsFacade.normalizeError({
      statusCode: 400,
      message: 'Validation failed',
      validationErrors: {},
      originalError: undefined,
    });
    expect(error.status).toBe(400);
    expect(error.messages).toEqual(['Validation failed']);
  });
});
