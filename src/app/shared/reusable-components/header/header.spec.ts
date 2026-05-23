import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])],
    })
      .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('treats sibling Q&A routes as active', () => {
    expect(component.isQnaSectionUrl('/question-and-answer/ask-assistant')).toBeTrue();
    expect(component.isQnaSectionUrl('/question-and-answer/meet-scholar')).toBeTrue();
    expect(component.isQnaSectionUrl('/home')).toBeFalse();
  });
});
