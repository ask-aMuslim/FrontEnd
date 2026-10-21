import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SupportMailUnreadService } from './support-mail-unread.service';
import { SupportMailsFacade } from '../../api/facades/support-mails.facade';
import { TokenService } from '../auth/token.service';

describe('SupportMailUnreadService', () => {
  let facade: jasmine.SpyObj<SupportMailsFacade>;
  let visibility: DocumentVisibilityState;

  beforeEach(() => {
    visibility = 'visible';
    spyOnProperty(document, 'visibilityState').and.callFake(() => visibility);
    facade = jasmine.createSpyObj<SupportMailsFacade>('SupportMailsFacade', ['getUnreadCount']);
    facade.getUnreadCount.and.returnValue(of(3));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: SupportMailsFacade, useValue: facade },
        { provide: TokenService, useValue: { isAuthenticated: signal(true) } },
      ],
    });
  });

  it('loads the count on sign-in', fakeAsync(() => {
    const service = TestBed.inject(SupportMailUnreadService);
    TestBed.tick();
    expect(service.unreadCount()).toBe(3);
    discardPeriodicTasks();
  }));

  it('refreshes every 2 minutes only while the tab is visible', fakeAsync(() => {
    TestBed.inject(SupportMailUnreadService);
    TestBed.tick();
    facade.getUnreadCount.calls.reset();

    tick(SupportMailUnreadService.pollIntervalMs);
    expect(facade.getUnreadCount).toHaveBeenCalledTimes(1);

    visibility = 'hidden';
    tick(SupportMailUnreadService.pollIntervalMs);
    expect(facade.getUnreadCount).toHaveBeenCalledTimes(1);

    discardPeriodicTasks();
  }));
});
