import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';

import { HeaderComponent } from './header.component';
import { SupportMailUnreadService } from '../../../core/services/support-mail-unread.service';
import { NotificationsService } from '../../../core/services/notifications.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  const unreadCount = signal(0);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: SupportMailUnreadService, useValue: { unreadCount, refresh: () => undefined } },
        {
          provide: NotificationsService,
          useValue: {
            unreadCount: signal(0),
            notifications: signal([]),
            isLoading: signal(false),
            error: signal(null),
            loadLatest: () => undefined,
          },
        },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('opens My Mails from the user menu', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    (component as unknown as { goToMails(): void }).goToMails();

    expect(router.navigate).toHaveBeenCalledWith(['/contact', 'mails']);
  });

  it('opens My Meetings from the user menu', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    (component as unknown as { goToMeetings(): void }).goToMeetings();

    expect(router.navigate).toHaveBeenCalledWith(['/question-and-answer', 'meet-scholar', 'history']);
  });

  it('treats sibling Q&A routes as active', () => {
    expect(component.isQnaSectionUrl('/question-and-answer/ask-assistant')).toBeTrue();
    expect(component.isQnaSectionUrl('/question-and-answer/meet-scholar')).toBeTrue();
    expect(component.isQnaSectionUrl('/home')).toBeFalse();
  });
});
