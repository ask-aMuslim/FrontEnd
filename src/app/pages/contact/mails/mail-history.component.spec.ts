import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MailHistoryComponent } from './mail-history.component';
import { SupportMailsFacade } from '../../../api/facades/support-mails.facade';
import { SeoService } from '../../../core/services/seo.service';
import { SupportMailStatus, type SupportMailListItem, type SupportMailPage } from '../../../api/facades/support-mails.models';

describe('MailHistoryComponent', () => {
  let fixture: ComponentFixture<MailHistoryComponent>;
  let component: MailHistoryComponent;
  let facade: jasmine.SpyObj<SupportMailsFacade>;

  const item = (n: number, overrides: Partial<SupportMailListItem> = {}): SupportMailListItem => ({
    id: `mail-${n}`,
    number: n,
    topic: 7,
    subject: `Subject ${n}`,
    preview: 'Preview text',
    status: SupportMailStatus.AwaitingResponse,
    hasUnreadReply: false,
    created: '2026-10-11T10:42:00+00:00',
    lastMessageAt: '2026-10-12T14:15:00+00:00',
    ...overrides,
  });

  const page = (items: SupportMailListItem[], pageNumber = 1, hasNextPage = false): SupportMailPage<SupportMailListItem> => ({
    items,
    pageNumber,
    totalPages: hasNextPage ? pageNumber + 1 : pageNumber,
    totalCount: items.length,
    hasPreviousPage: pageNumber > 1,
    hasNextPage,
  });

  async function setup(first: SupportMailPage<SupportMailListItem>): Promise<void> {
    facade = jasmine.createSpyObj<SupportMailsFacade>('SupportMailsFacade', ['getMine']);
    facade.getMine.and.returnValue(of(first));

    await TestBed.configureTestingModule({
      imports: [MailHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: SupportMailsFacade, useValue: facade },
        { provide: SeoService, useValue: { setMetaTags: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MailHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  it('renders status badges and marks unread mails', async () => {
    await setup(page([
      item(1, { status: SupportMailStatus.Responded, hasUnreadReply: true }),
      item(2, { status: SupportMailStatus.Closed }),
    ]));

    const cards = el().querySelectorAll('.mail-card');
    expect(cards.length).toBe(2);
    expect(cards[0].classList).toContain('mail-card--unread');
    expect(cards[0].querySelector('.status-badge')?.textContent?.trim()).toBe('Responded');
    expect(cards[1].querySelector('.status-badge')?.textContent?.trim()).toBe('Closed');
  });

  it('appends the next page on Load more', async () => {
    await setup(page([item(1)], 1, true));
    facade.getMine.and.returnValue(of(page([item(2)], 2, false)));

    component.loadMore();
    fixture.detectChanges();

    expect(facade.getMine).toHaveBeenCalledWith(jasmine.objectContaining({ pageNumber: 2 }));
    expect(component.mails().map((m) => m.number)).toEqual([1, 2]);
    expect(el().textContent).not.toContain('Load more');
  });

  it('filters by status from the first page', async () => {
    await setup(page([item(1)]));
    component.selectStatus(SupportMailStatus.Responded);
    expect(facade.getMine).toHaveBeenCalledWith(jasmine.objectContaining({ pageNumber: 1, status: SupportMailStatus.Responded }));
  });

  it('shows the empty state with a link to send an inquiry', async () => {
    await setup(page([]));
    expect(el().textContent).toContain('No mails yet.');
    expect(el().textContent).toContain('Send an inquiry');
  });
});
