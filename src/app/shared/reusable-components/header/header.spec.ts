import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    })
      .compileComponents();

    fixture = TestBed.createComponent(Header);
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
