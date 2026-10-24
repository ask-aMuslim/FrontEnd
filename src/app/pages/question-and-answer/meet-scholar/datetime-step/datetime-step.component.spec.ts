import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { DatetimeStepComponent } from './datetime-step.component';

describe('DatetimeStepComponent', () => {
  let fixture: ComponentFixture<DatetimeStepComponent>;
  let component: DatetimeStepComponent;
  let form: FormGroup;

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatetimeStepComponent] }).compileComponents();

    form = new FormGroup({ scheduledDate: new FormControl(null), scheduledTime: new FormControl(null) });
    fixture = TestBed.createComponent(DatetimeStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('form', form);
    fixture.componentRef.setInput('availableDates', [
      { value: '2026-10-25', label: 'Sun, Oct 25', disabled: false },
      { value: '2026-10-23', label: 'Fri, Oct 23', disabled: true },
    ]);
    fixture.componentRef.setInput('availableTimes', [{ value: '10:00', label: '10:00 AM', disabled: false }]);
    fixture.componentRef.setInput('timeZone', 'America/New_York');
    fixture.detectChanges();
  });

  it('explains the fixed session length, the notice period and the timezone', () => {
    expect(text()).toContain('Sessions are 30 minutes');
    expect(text()).toContain("at least 24 hours' notice");
    expect(text()).toContain('America/New_York');
  });

  it('no longer asks for a duration', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('#meet-scholar-duration')).toBeNull();
  });

  it('will not continue until both a date and a time are chosen', () => {
    const next = jasmine.createSpy('next');
    component.next.subscribe(next);

    component.onNext();
    fixture.detectChanges();
    expect(next).not.toHaveBeenCalled();
    expect(text()).toContain('Please choose both a date and a time.');

    form.patchValue({ scheduledDate: '2026-10-25' });
    component.onNext();
    expect(next).not.toHaveBeenCalled();

    form.patchValue({ scheduledTime: '10:00' });
    component.onNext();
    fixture.detectChanges();
    expect(next).toHaveBeenCalledTimes(1);
    expect(text()).not.toContain('Please choose both a date and a time.');
  });

  it('disables days that cannot be requested', () => {
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.meet-scholar-datetime-step__date-option'));

    expect(buttons.find((b) => b.textContent?.includes('Oct 23'))!.disabled).toBeTrue();
    expect(buttons.find((b) => b.textContent?.includes('Oct 25'))!.disabled).toBeFalse();
  });
});
