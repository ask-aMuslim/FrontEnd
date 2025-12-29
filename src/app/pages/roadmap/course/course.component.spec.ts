import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CourseComponent } from './course.component';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('CourseComponent', () => {
  let component: CourseComponent;
  let fixture: ComponentFixture<CourseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({}),
            params: of({ id: 'test-course' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with locked state by default', () => {
    expect(component.course.isLocked).toBe(true);
    expect(component.course.completedLessons).toBe(0);
  });

  it('should unlock course when unlockCourse is called', () => {
    component.unlockCourse();
    expect(component.course.isLocked).toBe(false);
    expect(component.course.completedLessons).toBe(4);
  });

  it('should have correct number of lessons', () => {
    expect(component.course.lessonsList.length).toBe(7);
  });
});
