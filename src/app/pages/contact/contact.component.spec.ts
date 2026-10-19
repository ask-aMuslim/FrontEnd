import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ContactComponent } from './contact.component';
import { TokenService } from '../../core/auth/token.service';
import { AuthService } from '../../core/services/auth.service';
import { FormsFacade } from '../../api/facades/forms.facade';
import { SeoService } from '../../core/services/seo.service';
import { ScrollService } from '../../core/services/scroll.service';
import { SupportMailsFacade } from '../../api/facades/support-mails.facade';
import { SupportMailUnreadService } from '../../core/services/support-mail-unread.service';

describe('ContactComponent', () => {
  let fixture: ComponentFixture<ContactComponent>;
  let component: ContactComponent;
  let facade: jasmine.SpyObj<SupportMailsFacade>;
  const isAuthenticated = signal(true);

  async function setup(authenticated: boolean): Promise<void> {
    isAuthenticated.set(authenticated);
    facade = jasmine.createSpyObj<SupportMailsFacade>('SupportMailsFacade', ['getTopics', 'getEligibility', 'create']);
    facade.getTopics.and.returnValue(of([{ value: 7, key: 'Fiqh', name: 'Fiqh' }]));
    facade.getEligibility.and.returnValue(of({ canCreate: true, nextAllowedAt: null }));

    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideRouter([]),
        { provide: TokenService, useValue: { isAuthenticated, userEmail: signal('noah.smith@example.com') } },
        { provide: AuthService, useValue: { currentUser: signal(null) } },
        { provide: FormsFacade, useValue: { getForms: () => of([]) } },
        { provide: SeoService, useValue: { setMetaTags: () => undefined } },
        { provide: ScrollService, useValue: { scrollToTop: () => undefined } },
        { provide: SupportMailsFacade, useValue: facade },
        { provide: SupportMailUnreadService, useValue: { unreadCount: signal(2), refresh: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function fill(topic: number, subject: string, explanation = ''): void {
    component.contactForm.setValue({ topic, subject, explanation });
  }

  const text = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';

  afterEach(() => {
    try {
      sessionStorage.clear();
    } catch {
      // ignore
    }
  });

  it('keeps the hero and quick-links sections', async () => {
    await setup(false);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.hero-section .hero-title')?.textContent?.trim()).toBe('Get in Touch');
    expect(el.querySelector('.hero-section .hero-pill')?.textContent?.trim()).toBe('Contact Us');
    const links = Array.from(el.querySelectorAll('.quick-link-list a')).map((a) => a.textContent?.trim());
    expect(links).toEqual([
      'Join Ask A Muslim',
      'Request a Da’wah Workshop',
      'Establish a Da’wah Table',
      'Revert Companion Program',
      'New Muslim Support',
    ]);
  });

  it('loads topics and eligibility for signed-in users', async () => {
    await setup(true);
    expect(facade.getTopics).toHaveBeenCalled();
    expect(facade.getEligibility).toHaveBeenCalled();
    expect(component.topicOptions().map((t) => t.name)).toEqual(['Fiqh']);
    expect(text()).toContain('My mails');
  });

  it('uses the fallback topics and skips the API for guests', async () => {
    await setup(false);
    expect(facade.getTopics).not.toHaveBeenCalled();
    expect(component.topicOptions().length).toBe(8);
  });

  it('saves the draft and redirects guests to login on Send', async () => {
    await setup(false);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fill(2, 'What is tafsir?', 'Details');
    component.onSubmit();

    expect(facade.create).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/contact' } });
    expect(JSON.parse(sessionStorage.getItem('aam.contact.supportMailDraft') ?? '{}')).toEqual({
      topic: 2,
      subject: 'What is tafsir?',
      explanation: 'Details',
    });
  });

  it('restores a saved draft after sign-in', async () => {
    sessionStorage.setItem('aam.contact.supportMailDraft', JSON.stringify({ topic: 7, subject: 'Saved', explanation: 'More' }));
    await setup(true);
    expect(component.contactForm.getRawValue()).toEqual({ topic: 7, subject: 'Saved', explanation: 'More' });
    expect(sessionStorage.getItem('aam.contact.supportMailDraft')).toBeNull();
  });

  it('disables Send and shows the hint during the cooldown', async () => {
    await setup(true);
    component.eligibility.set({ canCreate: false, nextAllowedAt: new Date(Date.now() + 30 * 60_000).toISOString() });
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(button?.disabled).toBeTrue();
    expect(text()).toContain('You can send a new inquiry after one hour, at');
  });

  it('counts explanation characters up to 500', async () => {
    await setup(true);
    component.contactForm.controls.explanation.setValue('a'.repeat(42));
    fixture.detectChanges();
    expect(text()).toContain('42/500 characters');
  });

  it('creates the mail and shows the success state with a link to it', async () => {
    await setup(true);
    facade.create.and.returnValue(of('mail-1'));
    fill(7, '  Music Enquiry  ', '');

    component.onSubmit();
    fixture.detectChanges();

    expect(facade.create).toHaveBeenCalledOnceWith({ topic: 7, subject: 'Music Enquiry', explanation: null });
    expect(component.submittedContact()?.id).toBe('mail-1');
    expect(text()).toContain('Your inquiry has been sent successfully.');
    expect(text()).toContain('View this mail');
  });

  it('switches to the cooldown hint when the server rejects a second mail', async () => {
    await setup(true);
    facade.create.and.returnValue(
      throwError(() => ({ status: 400, messages: ['You can send a new inquiry after 2026-10-19T11:42:00.0000000+00:00.'], fieldErrors: {} })),
    );
    facade.getEligibility.and.returnValue(of({ canCreate: false, nextAllowedAt: '2026-10-19T11:42:00+00:00' }));
    fill(1, 'Hello again');

    component.onSubmit();

    expect(component.submitError()).toBeNull();
    expect(component.eligibility().canCreate).toBeFalse();
  });

  it('maps server validation errors to fields', async () => {
    await setup(true);
    facade.create.and.returnValue(
      throwError(() => ({ status: 400, messages: [], fieldErrors: { subject: ["'Subject' must not be empty."] } })),
    );
    fill(1, 'x');

    component.onSubmit();

    expect(component.serverFieldErrors().subject).toBe("'Subject' must not be empty.");
  });
});
