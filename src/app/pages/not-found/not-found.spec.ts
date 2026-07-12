import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let component: NotFoundComponent;
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have quick links defined', () => {
    expect(component['quickLinks']).toBeDefined();
    expect(component['quickLinks'].length).toBeGreaterThan(0);
  });

  it('should render 404 error code', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const errorCode = compiled.querySelector('.error-code');
    expect(errorCode).toBeTruthy();
  });

  it('should have a return home button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const homeButton = compiled.querySelector('.primary-button');
    expect(homeButton).toBeTruthy();
    expect(homeButton?.getAttribute('href')).toBe('/home');
  });

  it('should display quick navigation links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const quickLinks = compiled.querySelectorAll('.quick-link');
    expect(quickLinks.length).toBe(4);
  });

  it('should display guidance subtitle', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const subtitle = compiled.querySelector('.subtitle');
    expect(subtitle).toBeTruthy();
    expect(subtitle?.textContent).toContain('The path you seek Is not here');
  });
});
