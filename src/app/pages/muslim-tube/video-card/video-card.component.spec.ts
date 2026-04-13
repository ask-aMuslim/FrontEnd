import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VideoCardComponent } from './video-card.component';

const TEST_IMAGE_DATA_URI =
  'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';

describe('VideoCardComponent', () => {
  let component: VideoCardComponent;
  let fixture: ComponentFixture<VideoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoCardComponent);
    component = fixture.componentInstance;
    component.video = {
      id: 'video-1',
      image: TEST_IMAGE_DATA_URI,
      duration: '10:00',
      title: 'Test Video',
      channelLogo: TEST_IMAGE_DATA_URI,
      channelTitle: 'Test Channel',
      date: 'Apr 11, 2026',
      likes: 1200,
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
