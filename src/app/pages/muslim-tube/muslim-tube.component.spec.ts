import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MuslimTubeComponent } from './muslim-tube.component';

describe('MuslimTubeComponent', () => {
  let component: MuslimTubeComponent;
  let fixture: ComponentFixture<MuslimTubeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MuslimTubeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MuslimTubeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
