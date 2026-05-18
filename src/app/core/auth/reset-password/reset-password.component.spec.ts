import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { ResetPasswordComponent } from './reset-password.component';

const RESET_FLOW_DRAFT_STORAGE_KEY = 'aam_reset_flow_draft';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  afterEach(() => {
    globalThis.sessionStorage.removeItem(RESET_FLOW_DRAFT_STORAGE_KEY);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    })
      .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize OTP timer state', () => {
    (component as any).startOtpTimer();

    expect((component as any).otpTimer()).toBe(60);
    expect((component as any).canResendOtp()).toBeFalse();
    expect((component as any).formattedTimer()).toBe('01:00');
  });

  it('should restore the email and OTP step after refresh', () => {
    sessionStorage.setItem(
      RESET_FLOW_DRAFT_STORAGE_KEY,
      JSON.stringify({
        currentStep: 2,
        userEmail: 'tester@example.com',
        otpDigits: ['1', '2', '3', '4', '5', '6'],
        otpTimerExpiresAt: Date.now() + 30_000,
        resetPasswordToken: '',
        password: '',
        confirmPassword: '',
      }),
    );

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect((component as any).currentStep).toBe(2);
    expect((component as any).userEmail).toBe('tester@example.com');
    expect((component as any).otpDigits).toEqual(['1', '2', '3', '4', '5', '6']);
    expect((component as any).otpForm.value).toEqual({ otp: '123456' });
  });

  it('should restore the password step draft after refresh', () => {
    sessionStorage.setItem(
      RESET_FLOW_DRAFT_STORAGE_KEY,
      JSON.stringify({
        currentStep: 3,
        userEmail: 'tester@example.com',
        otpDigits: ['1', '2', '3', '4', '5', '6'],
        otpTimerExpiresAt: null,
        resetPasswordToken: 'secure-reset-token',
        password: 'Password123',
        confirmPassword: 'Password123',
      }),
    );

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect((component as any).currentStep).toBe(3);
    expect((component as any).userEmail).toBe('tester@example.com');
    expect((component as any).resetPasswordToken).toBe('secure-reset-token');
    expect((component as any).passwordForm.value).toEqual({
      password: 'Password123',
      confirmPassword: 'Password123',
    });
    expect((component as any).passwordsMatch).toBeTrue();
  });
});
