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
    eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', ['getAll', 'getNext']);
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
          id: 'published-event-2',
          title: 'Published event 2',
          description: 'Visible event 2',
          imageUrl: '/images/published-2.jpg',
          speakerName: 'Scholar Three',
          speakerImage: '/images/speaker-three.jpg',
          speakerRole: 'Guest speaker',
          startDateTime: '2026-04-03T18:00:00Z',
          tags: ['Talk'],
          isPublished: true,
        },
        {
          id: 'published-event-3',
          title: 'Published event 3',
          description: 'Visible event 3',
          imageUrl: '/images/published-3.jpg',
          speakerName: 'Scholar Four',
          speakerImage: '/images/speaker-four.jpg',
          speakerRole: 'Guest speaker',
          startDateTime: '2026-04-04T18:00:00Z',
          tags: ['Talk'],
          isPublished: true,
        },
        {
          id: 'published-event-4',
          title: 'Published event 4',
          description: 'Visible event 4',
          imageUrl: '/images/published-4.jpg',
          speakerName: 'Scholar Five',
          speakerImage: '/images/speaker-five.jpg',
          speakerRole: 'Guest speaker',
          startDateTime: '2026-04-05T18:00:00Z',
          tags: ['Talk'],
          isPublished: true,
        },
        {
          id: 'published-event-5',
          title: 'Published event 5',
          description: 'Visible event 5',
          imageUrl: '/images/published-5.jpg',
          speakerName: 'Scholar Six',
          speakerImage: '/images/speaker-six.jpg',
          speakerRole: 'Guest speaker',
          startDateTime: '2026-04-06T18:00:00Z',
          tags: ['Talk'],
          isPublished: true,
        },
        {
          id: 'published-event-6',
          title: 'Published event 6',
          description: 'Visible event 6',
          imageUrl: '/images/published-6.jpg',
          speakerName: 'Scholar Seven',
          speakerImage: '/images/speaker-seven.jpg',
          speakerRole: 'Guest speaker',
          startDateTime: '2026-04-07T18:00:00Z',
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
    eventsServiceSpy.getNext.and.returnValue(of(null));

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
    expect(component.eventCards.map((event) => event.id)).toEqual([
      'published-event',
      'published-event-2',
      'published-event-3',
      'published-event-4',
      'published-event-5',
      'published-event-6',
    ]);
    expect(component.pages).toEqual([1]);
    expect(fixture.nativeElement.querySelector('.events-pagination')).toBeNull();
  });
});
