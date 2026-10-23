import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { ApiService } from './api.service';
import { TokenService } from '../auth/token.service';

describe('NotificationsService', () => {
  let api: jasmine.SpyObj<ApiService>;
  let isAuthenticated: ReturnType<typeof signal<boolean>>;
  let visibility: DocumentVisibilityState;

  const listResponse = {
    succeeded: true,
    errors: [],
    data: {
      items: [
        { id: 'a', title: 'First', message: 'm', isRead: false, actionUrl: null, notificationType: 'SupportMail', createdAt: '2026-10-23T10:00:00Z' },
        { id: 'b', title: 'Second', message: 'm', isRead: true, actionUrl: null, notificationType: 'MeetingRequest', createdAt: '2026-10-22T10:00:00Z' },
      ],
    },
  };

  function respond(): void {
    api.get.and.callFake(((url: string) =>
      of(url.endsWith('/unread-count') ? { succeeded: true, errors: [], data: 3 } : listResponse)) as never);
  }

  beforeEach(() => {
    visibility = 'visible';
    spyOnProperty(document, 'visibilityState').and.callFake(() => visibility);

    api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'put']);
    api.put.and.returnValue(of(null) as never);
    respond();
    isAuthenticated = signal(true);

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiService, useValue: api },
        { provide: TokenService, useValue: { isAuthenticated } },
      ],
    });
  });

  it('loads the unread count on sign-in', fakeAsync(() => {
    const service = TestBed.inject(NotificationsService);
    TestBed.tick();

    expect(api.get).toHaveBeenCalledWith('/api/Notifications/me/unread-count');
    expect(service.unreadCount()).toBe(3);
    discardPeriodicTasks();
  }));

  it('loads the latest notifications for the dropdown', fakeAsync(() => {
    const service = TestBed.inject(NotificationsService);
    TestBed.tick();

    service.loadLatest();

    expect(api.get).toHaveBeenCalledWith('/api/Notifications/me', { PageNumber: 1, PageSize: 10 });
    expect(service.notifications().map((n) => n.id)).toEqual(['a', 'b']);
    expect(service.isLoading()).toBeFalse();
    discardPeriodicTasks();
  }));

  it('reports an error when the list cannot be loaded', fakeAsync(() => {
    const service = TestBed.inject(NotificationsService);
    TestBed.tick();
    api.get.and.returnValue(throwError(() => new Error('boom')) as never);

    service.loadLatest();

    expect(service.error()).toBe('Unable to load your notifications right now.');
    expect(service.isLoading()).toBeFalse();
    discardPeriodicTasks();
  }));

  it('marks one notification read immediately and tells the server', fakeAsync(() => {
    const service = TestBed.inject(NotificationsService);
    TestBed.tick();
    service.loadLatest();

    service.markRead(service.notifications()[0]);

    expect(service.notifications()[0].isRead).toBeTrue();
    expect(service.unreadCount()).toBe(2);
    expect(api.put).toHaveBeenCalledWith('/api/Notifications/me/a/read', {});
    discardPeriodicTasks();
  }));

  it('does not call the server for a notification that is already read', fakeAsync(() => {
    const service = TestBed.inject(NotificationsService);
    TestBed.tick();
    service.loadLatest();

    service.markRead(service.notifications()[1]);

    expect(api.put).not.toHaveBeenCalled();
    expect(service.unreadCount()).toBe(3);
    discardPeriodicTasks();
  }));

  it('marks everything read', fakeAsync(() => {
    const service = TestBed.inject(NotificationsService);
    TestBed.tick();
    service.loadLatest();

    service.markAllRead();

    expect(service.unreadCount()).toBe(0);
    expect(service.notifications().every((n) => n.isRead)).toBeTrue();
    expect(api.put).toHaveBeenCalledWith('/api/Notifications/me/read-all', {});
    discardPeriodicTasks();
  }));

  it('refreshes every 2 minutes only while the tab is visible', fakeAsync(() => {
    TestBed.inject(NotificationsService);
    TestBed.tick();
    api.get.calls.reset();

    tick(NotificationsService.pollIntervalMs);
    expect(api.get).toHaveBeenCalledTimes(1);

    visibility = 'hidden';
    tick(NotificationsService.pollIntervalMs);
    expect(api.get).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('clears everything when the user signs out', fakeAsync(() => {
    const service = TestBed.inject(NotificationsService);
    TestBed.tick();
    service.loadLatest();

    isAuthenticated.set(false);
    TestBed.tick();

    expect(service.unreadCount()).toBe(0);
    expect(service.notifications()).toEqual([]);
    discardPeriodicTasks();
  }));
});
