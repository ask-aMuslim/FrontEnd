import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';

import { HeaderComponent } from './header.component';
import { SupportMailUnreadService } from '../../../core/services/support-mail-unread.service';

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

  it('opens Mails History from the bell without opening the user menu', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');

    (component as unknown as { openMails(e: Event): void }).openMails(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/contact', 'mails']);
  });

  it('treats sibling Q&A routes as active', () => {
    expect(component.isQnaSectionUrl('/question-and-answer/ask-assistant')).toBeTrue();
    expect(component.isQnaSectionUrl('/question-and-answer/meet-scholar')).toBeTrue();
    expect(component.isQnaSectionUrl('/home')).toBeFalse();
  });
});
