import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MailThreadComponent } from './mail-thread.component';
import { SupportMailsFacade } from '../../../api/facades/support-mails.facade';
import { SupportMailUnreadService } from '../../../core/services/support-mail-unread.service';
import { SeoService } from '../../../core/services/seo.service';
import { SupportMailSenderType, SupportMailStatus, type SupportMailDetail } from '../../../api/facades/support-mails.models';

describe('MailThreadComponent', () => {
  let fixture: ComponentFixture<MailThreadComponent>;
  let component: MailThreadComponent;
  let facade: jasmine.SpyObj<SupportMailsFacade>;
  let unread: { unreadCount: ReturnType<typeof signal<number>>; refresh: jasmine.Spy };

  const mail = (status = SupportMailStatus.Responded): SupportMailDetail => ({
    id: 'mail-1',
    number: 4,
    topic: 7,
    subject: 'Music Enquiry',
    status,
    created: '2026-10-11T10:42:00+00:00',
    lastMessageAt: '2026-10-12T14:15:00+00:00',
    messages: [
      { id: 'a', senderType: SupportMailSenderType.Requester, senderName: 'Noah Smith', senderProfilePictureUrl: null, body: 'First\nquestion', created: '2026-10-11T10:42:00+00:00' },
      { id: 'b', senderType: SupportMailSenderType.Staff, senderName: null, senderProfilePictureUrl: null, body: 'Staff answer', created: '2026-10-12T14:15:00+00:00' },
    ],
  });

  async function setup(detail: () => ReturnType<SupportMailsFacade['getById']>): Promise<void> {
    facade = jasmine.createSpyObj<SupportMailsFacade>('SupportMailsFacade', ['getById', 'markAsRead', 'reply']);
    facade.getById.and.callFake(detail);
    facade.markAsRead.and.returnValue(of(undefined));
    unread = { unreadCount: signal(1), refresh: jasmine.createSpy('refresh') };

    await TestBed.configureTestingModule({
      imports: [MailThreadComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: 'mail-1' })) } },
        { provide: SupportMailsFacade, useValue: facade },
        { provide: SupportMailUnreadService, useValue: unread },
        { provide: SeoService, useValue: { setMetaTags: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MailThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('loads the mail, marks it read and refreshes the badge', async () => {
    await setup(() => of(mail()));
    expect(facade.getById).toHaveBeenCalledWith('mail-1');
    expect(facade.markAsRead).toHaveBeenCalledWith('mail-1');
    expect(unread.refresh).toHaveBeenCalled();
    expect(el().textContent).toContain('Mail #4');
  });

  it('shows messages oldest first, with staff shown as Support Team', async () => {
    await setup(() => of(mail()));
    const names = Array.from(el().querySelectorAll('.message__name')).map((n) => n.textContent?.trim());
    expect(names).toEqual(['Noah Smith', 'Support Team']);
    expect(el().querySelector('.message__body')?.textContent).toBe('First\nquestion');
  });

  it('resolves a relative avatar path against the API host', async () => {
    await setup(() => of(mail()));
    const url = component.avatarUrl({ ...mail().messages[0], senderProfilePictureUrl: '/uploads/noah.jpg' });
    expect(url).toMatch(/^https?:\/\/.+\/uploads\/noah\.jpg$/);
    expect(component.avatarUrl({ ...mail().messages[0], senderProfilePictureUrl: null })).toBe('/images/profile-placeholder.svg');
  });

  it('notes that replying reopens a closed mail', async () => {
    await setup(() => of(mail(SupportMailStatus.Closed)));
    expect(el().textContent).toContain('Replying will reopen it.');
  });

  it('sends a reply and reloads the thread', async () => {
    await setup(() => of(mail()));
    facade.reply.and.returnValue(of('c'));
    component.replyForm.setValue({ body: '  Thank you  ' });

    component.onReply();

    expect(facade.reply).toHaveBeenCalledOnceWith('mail-1', { body: 'Thank you' });
    expect(facade.getById).toHaveBeenCalledTimes(2);
    expect(component.replyForm.controls.body.value).toBe('');
  });

  it('sends on Enter but not on Shift+Enter', async () => {
    await setup(() => of(mail()));
    facade.reply.and.returnValue(of('c'));
    component.replyForm.setValue({ body: 'Hello' });

    component.onComposerKeydown(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    expect(facade.reply).not.toHaveBeenCalled();

    component.onComposerKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(facade.reply).toHaveBeenCalledOnceWith('mail-1', { body: 'Hello' });
  });

  it('puts your messages on the right and Support Team on the left', async () => {
    await setup(() => of(mail()));
    const items = el().querySelectorAll('.message');
    expect(items[0].classList).not.toContain('message--staff');
    expect(items[1].classList).toContain('message--staff');
  });

  it('shows not-found for another user\'s mail', async () => {
    await setup(() => throwError(() => ({ status: 400, messages: ['Mail not found'], fieldErrors: {} })));
    fixture.detectChanges();
    expect(component.notFound()).toBeTrue();
    expect(el().textContent).toContain('Mail not found');
    expect(facade.markAsRead).not.toHaveBeenCalled();
  });
});
