import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MeetingRequestsService } from '../../../../../core/services/meeting-requests.service';
import { MeetingDetailsComponent } from './meeting-details.component';

describe('MeetingDetailsComponent', () => {
  let fixture: ComponentFixture<MeetingDetailsComponent>;
  let serviceSpy: jasmine.SpyObj<MeetingRequestsService>;

  function response(status: number) {
    return {
      succeeded: true,
      errors: [],
      data: {
        id: 'req-1',
        topic: 7,
        status,
        languages: [1, 2],
        message: 'Can we talk about prayer?',
        response: status === 3 ? 'Sorry, not possible.' : null,
        moderatorName: 'Sheikh Ali',
        scheduledAt: '2026-11-05T10:00:00Z',
        createdAt: '2026-10-20T10:00:00Z',
      },
    };
  }

  function create(): void {
    fixture = TestBed.createComponent(MeetingDetailsComponent);
    fixture.detectChanges();
  }

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  function clickButton(label: string): void {
    const button = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes(label),
    );
    expect(button).withContext(`button "${label}"`).toBeTruthy();
    button!.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj<MeetingRequestsService>('MeetingRequestsService', ['getMine', 'cancelMine']);
    serviceSpy.getMine.and.returnValue(of(response(1)));
    serviceSpy.cancelMine.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [MeetingDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: MeetingRequestsService, useValue: serviceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'req-1' } } } },
      ],
    }).compileComponents();
  });

  it('loads the request by the id in the route and shows its details', () => {
    create();

    expect(serviceSpy.getMine).toHaveBeenCalledWith('req-1');
    expect(text()).toContain('Fiqh');
    expect(text()).toContain('Pending');
    expect(text()).toContain('Sheikh Ali');
    expect(text()).toContain('English, Arabic');
    expect(text()).toContain('Can we talk about prayer?');
  });

  it('shows the team response when there is one, and no cancel button once rejected', () => {
    serviceSpy.getMine.and.returnValue(of(response(3)));
    create();

    expect(text()).toContain('Response from the team');
    expect(text()).toContain('Sorry, not possible.');
    expect(text()).not.toContain('Cancel meeting');
  });

  it('offers cancel for a pending request and asks for confirmation first', () => {
    create();

    clickButton('Cancel meeting');

    expect(serviceSpy.cancelMine).not.toHaveBeenCalled();
    expect(text()).toContain('Cancel this meeting?');
  });

  it('cancels after confirmation and reloads the request', () => {
    create();
    serviceSpy.getMine.and.returnValue(of(response(4)));

    clickButton('Cancel meeting');
    clickButton('Yes, cancel meeting');

    expect(serviceSpy.cancelMine).toHaveBeenCalledWith('req-1');
    expect(serviceSpy.getMine).toHaveBeenCalledTimes(2);
    expect(text()).toContain('Cancelled');
    expect(text()).not.toContain('Yes, cancel meeting');
  });

  it('can back out of the confirmation without cancelling', () => {
    create();

    clickButton('Cancel meeting');
    clickButton('Keep meeting');

    expect(serviceSpy.cancelMine).not.toHaveBeenCalled();
    expect(text()).not.toContain('Cancel this meeting?');
  });

  it('shows an error and keeps the request open when cancelling fails', () => {
    serviceSpy.cancelMine.and.returnValue(throwError(() => ({ status: 400, message: 'no' })));
    create();

    clickButton('Cancel meeting');
    clickButton('Yes, cancel meeting');

    expect(text()).toContain('We could not cancel this meeting');
    expect(text()).toContain('Pending');
  });

  it('says so when the request is not found', () => {
    serviceSpy.getMine.and.returnValue(throwError(() => ({ status: 400, message: 'Meeting request not found' })));
    create();

    expect(text()).toContain('Meeting not found');
  });

  it('shows a retryable error when loading fails for another reason', () => {
    serviceSpy.getMine.and.returnValue(throwError(() => ({ status: 500, message: 'boom' })));
    create();

    expect(text()).toContain('Unable to load this meeting right now.');
    expect(text()).toContain('Retry');
  });
});
