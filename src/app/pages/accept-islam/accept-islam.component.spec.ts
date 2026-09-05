/* global describe, beforeEach, it, expect, jasmine */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AcceptIslamComponent } from './accept-islam.component';
import { SeoService } from '../../core/services/seo.service';

describe('AcceptIslamComponent', () => {
  let component: AcceptIslamComponent;
  let fixture: ComponentFixture<AcceptIslamComponent>;
  let seoService: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    const seoSpy = jasmine.createSpyObj('SeoService', ['setMetaTags']);

    await TestBed.configureTestingModule({
      imports: [AcceptIslamComponent],
      providers: [
        provideRouter([]),
        { provide: SeoService, useValue: seoSpy },
      ],
    }).compileComponents();

    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;
    fixture = TestBed.createComponent(AcceptIslamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call seoService.setMetaTags on init', () => {
    expect(seoService.setMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'How to Become Muslim',
      }),
    );
  });

  it('should have correct content for steps', () => {
    expect(component.stepOneEnglish).toContain('I testify that there is no one worthy of worship except Allah');
    expect(component.stepTwoArabic).toContain('أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللهُ');
    expect(component.stepTwoTransliteration).toContain('Ash-hadu an la ilaha illa-Allah');
  });

  it('should have correct external URLs and audio path', () => {
    expect(component.newMuslimFormUrl).toContain('noorohio.org');
    expect(component.noorCenterUrl).toContain('noorohio.org');
    expect(component.shahadaAudioUrl).toBe('/audio/shahada.mp3');
  });
});
