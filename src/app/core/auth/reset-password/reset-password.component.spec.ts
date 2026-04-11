import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should count down the OTP resend timer and re-enable resend', () => {
    jasmine.clock().install();

    try {
      (component as any).startOtpTimer();

      expect((component as any).otpTimer()).toBe(60);
      expect((component as any).canResendOtp()).toBeFalse();

      jasmine.clock().tick(3000);

      expect((component as any).otpTimer()).toBe(57);
      expect((component as any).formattedTimer()).toBe('00:57');

      jasmine.clock().tick(57000);

      expect((component as any).otpTimer()).toBe(0);
      expect((component as any).canResendOtp()).toBeTrue();
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
