import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MeetingRequestsService } from '../../../core/services/meeting-requests.service';
import { MyMeetingRequestsComponent } from './my-meeting-requests.component';

describe('MyMeetingRequestsComponent', () => {
  let fixture: ComponentFixture<MyMeetingRequestsComponent>;
  let serviceSpy: jasmine.SpyObj<MeetingRequestsService>;

  const apiResponse = {
    succeeded: true,
    errors: [],
    data: [
      {
        id: 'older',
        topic: 2,
        message: 'Older request',
        status: 1,
        scheduledAt: '2026-11-01T10:00:00Z',
        createdAt: '2026-10-01T10:00:00Z',
      },
      {
        id: 'newer',
        topic: 7,
        message: 'Can we talk about prayer?',
        status: 2,
        response: 'See you then.',
        moderatorName: 'Sheikh Ali',
        scheduledAt: '2026-11-05T10:00:00Z',
        createdAt: '2026-10-20T10:00:00Z',
      },
    ],
  };

  function create(userId: string): void {
    fixture = TestBed.createComponent(MyMeetingRequestsComponent);
    fixture.componentRef.setInput('userId', userId);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj<MeetingRequestsService>('MeetingRequestsService', ['getByRequester']);
    serviceSpy.getByRequester.and.returnValue(of(apiResponse));

    await TestBed.configureTestingModule({
      imports: [MyMeetingRequestsComponent],
      providers: [provideRouter([]), { provide: MeetingRequestsService, useValue: serviceSpy }],
    }).compileComponents();
  });

  it('loads the requests for the given user, newest first', () => {
    create('user-1');

    expect(serviceSpy.getByRequester).toHaveBeenCalledWith('user-1');
    expect(fixture.componentInstance.requests().map((r) => r.id)).toEqual(['newer', 'older']);
  });

  it('shows status, moderator and the team response', () => {
    create('user-1');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Fiqh');
    expect(text).toContain('Accepted');
    expect(text).toContain('Pending');
    expect(text).toContain('with Sheikh Ali');
    expect(text).toContain('Response from the team');
    expect(text).toContain('See you then.');
  });

  it('does not call the API until the user id is known', () => {
    create('');

    expect(serviceSpy.getByRequester).not.toHaveBeenCalled();
  });

  it('shows an error with retry when loading fails', () => {
    serviceSpy.getByRequester.and.returnValue(throwError(() => new Error('boom')));
    create('user-1');

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Unable to load your meeting requests right now.');
    expect(text).toContain('Retry');
  });

  it('shows an empty state when there are no requests', () => {
    serviceSpy.getByRequester.and.returnValue(of({ succeeded: true, errors: [], data: [] }));
    create('user-1');

    expect((fixture.nativeElement as HTMLElement).textContent).toContain("You haven't requested any meetings yet.");
  });
});
