/* eslint-disable no-undef */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { EventDetailComponent } from './event-detail.component';
import { EventsService } from '../../../core/services/events.service';

describe('EventDetailComponent', () => {
  let component: EventDetailComponent;
  let fixture: ComponentFixture<EventDetailComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let eventsServiceSpy: jasmine.SpyObj<EventsService>;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    eventsServiceSpy = jasmine.createSpyObj<EventsService>('EventsService', ['getById']);
    eventsServiceSpy.getById.and.returnValue(
      of({
        id: 'event-1',
        title: 'Hidden event',
        description: 'Should not be displayed',
        isPublished: false,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [EventDetailComponent],
      providers: [
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'event-1' }) } },
        },
        { provide: EventsService, useValue: eventsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect away from unpublished events', () => {
    expect(eventsServiceSpy.getById).toHaveBeenCalledWith('event-1');
    expect(component.event).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/events']);
  });
});
