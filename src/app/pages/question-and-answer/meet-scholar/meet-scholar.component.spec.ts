import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TokenService } from '../../../core/auth/token.service';
import { MeetingInquiryTopic } from '../../../core/models/interfaces/enums.model';
import { MeetingRequestsService } from '../../../core/services/meeting-requests.service';
import { MeetScholarComponent } from './meet-scholar.component';
import { buildScheduledAt, formatSlotTime } from './meeting-schedule';

describe('MeetScholarComponent', () => {
  let fixture: ComponentFixture<MeetScholarComponent>;
  let component: MeetScholarComponent;
  let router: Router;
  let serviceSpy: jasmine.SpyObj<MeetingRequestsService>;

  function fillValidRequest(): void {
    component.meetingForm.patchValue({ topic: MeetingInquiryTopic.Fiqh, message: 'A question about prayer times.' });
    component.addLanguage(component.languages[0]);
  }

  /** A day far enough ahead that every slot on it is available. */
  function farDate() {
    return component.availableDates[5];
  }

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj<MeetingRequestsService>('MeetingRequestsService', ['create']);
    serviceSpy.create.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [MeetScholarComponent],
      providers: [
        provideRouter([]),
        { provide: MeetingRequestsService, useValue: serviceSpy },
        { provide: TokenService, useValue: { isAuthenticated: () => true } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(MeetScholarComponent);
    component = fixture.componentInstance;
  });

  it('has no name, email or duration fields to fill in', () => {
    expect(component.meetingForm.contains('name')).toBeFalse();
    expect(component.meetingForm.contains('email')).toBeFalse();
    expect(component.meetingForm.contains('durationMinutes')).toBeFalse();
  });

  it('lists days that are not selectable when no slot is far enough away', () => {
    expect(component.availableDates[0].disabled).toBeTrue();
  });

  it('ignores a day that cannot be requested', () => {
    component.selectDate(component.availableDates[0]);

    expect(component.meetingForm.value.scheduledDate).toBeNull();
  });

  it('offers no times until a day is chosen, then only far-enough ones', () => {
    expect(component.availableTimes().every((t) => t.disabled)).toBeTrue();

    component.selectDate(farDate());

    expect(component.availableTimes().every((t) => !t.disabled)).toBeTrue();
  });

  it('sends exactly the day and time that were picked', () => {
    fillValidRequest();
    const day = farDate();
    component.selectDate(day);
    component.selectTime({ value: '10:00', label: formatSlotTime('10:00'), disabled: false });

    component.submitMeetingRequest();

    const expected = buildScheduledAt(day.value, '10:00')!;
    expect(serviceSpy.create).toHaveBeenCalledTimes(1);
    const payload = serviceSpy.create.calls.mostRecent().args[0];
    expect(payload.scheduledAt).toBe(expected.toISOString());
    expect(new Date(payload.scheduledAt!).getDate()).toBe(expected.getDate());
    expect(payload.topic).toBe(MeetingInquiryTopic.Fiqh);
    expect(router.navigate).toHaveBeenCalledWith(
      ['/question-and-answer/meet-scholar/success'],
      { state: { scheduledDateTime: expected } },
    );
  });

  it('asks for a date and time before sending', () => {
    fillValidRequest();

    component.submitMeetingRequest();

    expect(serviceSpy.create).not.toHaveBeenCalled();
    expect(component.submitError()).toBe('Please select both a date and time before sending your request.');
  });

  it('refuses a slot that has become too soon while the page was open', () => {
    fillValidRequest();
    component.meetingForm.patchValue({ scheduledDate: component.availableDates[0].value, scheduledTime: '17:00' });

    component.submitMeetingRequest();

    expect(serviceSpy.create).not.toHaveBeenCalled();
    expect(component.submitError()).toBe('That time is no longer available. Please go back and pick a later time.');
  });

  it('shows an error when the request fails', () => {
    serviceSpy.create.and.returnValue(throwError(() => ({ status: 500, message: 'boom' })));
    fillValidRequest();
    component.selectDate(farDate());
    component.selectTime({ value: '10:00', label: '10:00 AM', disabled: false });

    component.submitMeetingRequest();

    expect(component.submitError()).toBeTruthy();
    expect(component.isSubmitting()).toBeFalse();
  });
});
