import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TokenService } from '../../../../core/auth/token.service';
import { MeetingInquiryRequestStatus } from '../../../../core/models/interfaces/enums.model';
import { MeetingRequestsService } from '../../../../core/services/meeting-requests.service';
import { MeetingHistoryComponent } from './meeting-history.component';

describe('MeetingHistoryComponent', () => {
  let fixture: ComponentFixture<MeetingHistoryComponent>;
  let serviceSpy: jasmine.SpyObj<MeetingRequestsService>;

  const apiResponse = {
    succeeded: true,
    errors: [],
    data: [
      { id: 'a', topic: 2, message: 'Pending one', status: 1, scheduledAt: '2026-11-01T10:00:00Z', createdAt: '2026-10-01T10:00:00Z' },
      { id: 'b', topic: 7, message: 'Accepted one', status: 2, scheduledAt: '2026-11-05T10:00:00Z', createdAt: '2026-10-20T10:00:00Z' },
    ],
  };

  function create(userId: string | null = 'user-1'): void {
    TestBed.overrideProvider(TokenService, { useValue: { userId: signal(userId) } });
    fixture = TestBed.createComponent(MeetingHistoryComponent);
    fixture.detectChanges();
  }

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj<MeetingRequestsService>('MeetingRequestsService', ['getByRequester']);
    serviceSpy.getByRequester.and.returnValue(of(apiResponse));

    await TestBed.configureTestingModule({
      imports: [MeetingHistoryComponent],
      providers: [
        provideRouter([]),
        { provide: MeetingRequestsService, useValue: serviceSpy },
        { provide: TokenService, useValue: { userId: signal('user-1') } },
      ],
    }).compileComponents();
  });

  it('loads the signed-in user\'s meetings', () => {
    create();

    expect(serviceSpy.getByRequester).toHaveBeenCalledWith('user-1');
    expect(text()).toContain('Pending one');
    expect(text()).toContain('Accepted one');
  });

  it('filters by status', () => {
    create();

    fixture.componentInstance.selectStatus(MeetingInquiryRequestStatus.Accepted);
    fixture.detectChanges();

    expect(text()).toContain('Accepted one');
    expect(text()).not.toContain('Pending one');
  });

  it('says so when a filter matches nothing', () => {
    create();

    fixture.componentInstance.selectStatus(MeetingInquiryRequestStatus.Rejected);
    fixture.detectChanges();

    expect(text()).toContain('No meetings match this filter.');
  });

  it('does not call the API until the user id is known', () => {
    create(null);

    expect(serviceSpy.getByRequester).not.toHaveBeenCalled();
  });

  it('shows an error with retry when loading fails', () => {
    serviceSpy.getByRequester.and.returnValue(throwError(() => new Error('boom')));
    create();

    expect(text()).toContain('Unable to load your meetings right now.');
    expect(text()).toContain('Retry');
  });

  it('shows an empty state with a call to action when there are no meetings', () => {
    serviceSpy.getByRequester.and.returnValue(of({ succeeded: true, errors: [], data: [] }));
    create();

    expect(text()).toContain('No meetings yet.');
    expect(text()).toContain('Request a meeting');
  });
});
