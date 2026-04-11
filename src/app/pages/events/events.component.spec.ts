/* eslint-disable no-undef */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { EventsComponent } from './events.component';
import { EventsService } from '../../core/services/events.service';

describe('EventsComponent', () => {
  let component: EventsComponent;
  let fixture: ComponentFixture<EventsComponent>;
  let eventsServiceSpy: jasmine.SpyObj<EventsService>;

  beforeEach(async () => {
    eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', ['getAll']);
    eventsServiceSpy.getAll.and.returnValue(
      of([
        {
          id: 'published-event',
          title: 'Published event',
          description: 'Visible event',
          imageUrl: '/images/published.jpg',
          speakerName: 'Scholar One',
          speakerImage: '/images/speaker-one.jpg',
          speakerRole: 'Guest speaker',
          startDateTime: '2026-04-01T18:00:00Z',
          tags: ['Talk'],
          isPublished: true,
        },
        {
          id: 'draft-event',
          title: 'Draft event',
          description: 'Hidden event',
          imageUrl: '/images/draft.jpg',
          speakerName: 'Scholar Two',
          speakerImage: '/images/speaker-two.jpg',
          speakerRole: 'Guest speaker',
          startDateTime: '2026-04-02T18:00:00Z',
          tags: ['Talk'],
          isPublished: false,
        },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [EventsComponent],
      providers: [
        { provide: EventsService, useValue: eventsServiceSpy },
        { provide: PLATFORM_ID, useValue: 'browser' },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should only render published events', () => {
    expect(eventsServiceSpy.getAll).toHaveBeenCalled();
    expect(component.eventCards.map((event) => event.id)).toEqual(['published-event']);
    expect(component.pages).toEqual([1]);
  });
});
