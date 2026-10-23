import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';

import type { AppNotification } from '../../../core/helpers/notification.helper';
import { NotificationsService } from '../../../core/services/notifications.service';
import { NotificationBellComponent } from './notification-bell.component';

describe('NotificationBellComponent', () => {
  const id = '3f2b8f0e-6b1c-4c1e-9a55-0c1f2d3e4a5b';

  let fixture: ComponentFixture<NotificationBellComponent>;
  let router: Router;
  let unreadCount: ReturnType<typeof signal<number>>;
  let notifications: ReturnType<typeof signal<readonly AppNotification[]>>;
  let error: ReturnType<typeof signal<string | null>>;
  let service: {
    unreadCount: typeof unreadCount;
    notifications: typeof notifications;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: typeof error;
    loadLatest: jasmine.Spy;
    markRead: jasmine.Spy;
    markAllRead: jasmine.Spy;
  };

  function item(overrides: Partial<AppNotification> = {}): AppNotification {
    return {
      id: 'n1',
      title: 'Your meeting request was accepted',
      message: 'Your meeting about Fiqh was accepted.',
      isRead: false,
      actionUrl: `meeting-requests/${id}?event=accepted&id=7c0d`,
      notificationType: 'MeetingRequest',
      createdAt: new Date().toISOString(),
      ...overrides,
    };
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function openPanel(): void {
    (el().querySelector('.bell') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    unreadCount = signal(0);
    notifications = signal<readonly AppNotification[]>([]);
    error = signal<string | null>(null);
    service = {
      unreadCount,
      notifications,
      isLoading: signal(false),
      error,
      loadLatest: jasmine.createSpy('loadLatest'),
      markRead: jasmine.createSpy('markRead'),
      markAllRead: jasmine.createSpy('markAllRead'),
    };

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent],
      providers: [provideRouter([]), { provide: NotificationsService, useValue: service }],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(NotificationBellComponent);
    fixture.detectChanges();
  });

  it('shows no badge when everything is read', () => {
    expect(el().querySelector('.bell__badge')).toBeNull();
  });

  it('shows the unread count, capped at 9+', () => {
    unreadCount.set(3);
    fixture.detectChanges();
    expect(el().querySelector('.bell__badge')?.textContent?.trim()).toBe('3');

    unreadCount.set(25);
    fixture.detectChanges();
    expect(el().querySelector('.bell__badge')?.textContent?.trim()).toBe('9+');
  });

  it('opens the dropdown and loads the latest notifications', () => {
    openPanel();

    expect(service.loadLatest).toHaveBeenCalled();
    expect(el().querySelector('.panel')).not.toBeNull();
    expect(el().querySelector('.bell')?.getAttribute('aria-expanded')).toBe('true');
  });

  it('says so when there is nothing to show', () => {
    openPanel();
    expect(el().textContent).toContain('all caught up');
  });

  it('shows an error with retry', () => {
    error.set('Unable to load your notifications right now.');
    openPanel();
    service.loadLatest.calls.reset();

    expect(el().textContent).toContain('Unable to load your notifications right now.');
    (el().querySelector('.panel__state--error .panel__link') as HTMLButtonElement).click();
    expect(service.loadLatest).toHaveBeenCalled();
  });

  it('lists notifications and marks unread ones', () => {
    notifications.set([item(), item({ id: 'n2', title: 'Old one', isRead: true })]);
    openPanel();

    expect(el().querySelectorAll('.item').length).toBe(2);
    expect(el().querySelectorAll('.item--unread').length).toBe(1);
    expect(el().textContent).toContain('Your meeting request was accepted');
  });

  it('marks everything read from the header link', () => {
    unreadCount.set(2);
    notifications.set([item()]);
    openPanel();

    (el().querySelector('.panel__header .panel__link') as HTMLButtonElement).click();

    expect(service.markAllRead).toHaveBeenCalled();
  });

  it('marks a notification read, opens its page and closes the dropdown', () => {
    const navigated = jasmine.createSpy('navigated');
    fixture.componentInstance.navigated.subscribe(navigated);
    const notification = item();
    notifications.set([notification]);
    openPanel();

    (el().querySelector('.item') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(service.markRead).toHaveBeenCalledWith(notification);
    expect(router.navigate).toHaveBeenCalledWith(['/question-and-answer', 'meet-scholar', 'history', id]);
    expect(navigated).toHaveBeenCalled();
    expect(el().querySelector('.panel')).toBeNull();
  });

  it('opens http(s) links in a new tab', () => {
    const open = spyOn(window, 'open');
    notifications.set([item({ actionUrl: 'https://example.com/certificate/1', notificationType: 'Certificate' })]);
    openPanel();

    (el().querySelector('.item') as HTMLButtonElement).click();

    expect(open).toHaveBeenCalledWith('https://example.com/certificate/1', '_blank', 'noopener,noreferrer');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('only marks a notification without a usable link as read and stays open', () => {
    notifications.set([item({ actionUrl: 'javascript:alert(1)' })]);
    openPanel();

    (el().querySelector('.item') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(service.markRead).toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(el().querySelector('.panel')).not.toBeNull();
  });

  it('closes on Escape and on a click outside', () => {
    openPanel();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el().querySelector('.panel')).toBeNull();

    openPanel();
    document.body.click();
    fixture.detectChanges();
    expect(el().querySelector('.panel')).toBeNull();
  });
});
