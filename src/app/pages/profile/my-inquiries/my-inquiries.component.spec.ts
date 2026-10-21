import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SupportMailsFacade } from '../../../api/facades/support-mails.facade';
import { SupportMailStatus } from '../../../api/facades/support-mails.models';
import { MyInquiriesComponent } from './my-inquiries.component';

describe('MyInquiriesComponent', () => {
  let component: MyInquiriesComponent;
  let fixture: ComponentFixture<MyInquiriesComponent>;
  let facadeSpy: jasmine.SpyObj<SupportMailsFacade>;

  beforeEach(async () => {
    facadeSpy = jasmine.createSpyObj<SupportMailsFacade>('SupportMailsFacade', ['getMine']);
    facadeSpy.getMine.and.returnValue(
      of({
        items: [
          {
            id: 'mail-1',
            number: 4,
            topic: 7,
            subject: 'Music Enquiry',
            preview: '',
            status: SupportMailStatus.Responded,
            hasUnreadReply: true,
            created: '2026-10-11T10:42:00+00:00',
            lastMessageAt: '2026-10-12T14:15:00+00:00',
          },
        ],
        pageNumber: 1,
        totalPages: 3,
        totalCount: 12,
        hasPreviousPage: false,
        hasNextPage: true,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [MyInquiriesComponent],
      providers: [provideRouter([]), { provide: SupportMailsFacade, useValue: facadeSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(MyInquiriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the latest support mails', () => {
    expect(facadeSpy.getMine).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 5 });
    expect(component.mails().length).toBe(1);
  });

  it('links to the full mail history', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Mail #4 · Music Enquiry');
    expect(text).toContain('View all mails (12)');
  });
});
