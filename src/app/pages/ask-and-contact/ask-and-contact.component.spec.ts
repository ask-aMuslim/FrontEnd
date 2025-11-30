import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AskAndContactComponent } from './ask-and-contact.component';

describe('AskAndContactComponent', () => {
  let component: AskAndContactComponent;
  let fixture: ComponentFixture<AskAndContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AskAndContactComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AskAndContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
