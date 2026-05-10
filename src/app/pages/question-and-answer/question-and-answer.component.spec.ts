import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionAndAnswerComponent } from './question-and-answer.component';

describe('QuestionAndAnswerComponent', () => {
  let component: QuestionAndAnswerComponent;
  let fixture: ComponentFixture<QuestionAndAnswerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionAndAnswerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionAndAnswerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
