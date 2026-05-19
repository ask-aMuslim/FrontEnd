import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { InquiryRequestsService } from '../../../core/services/inquiry-requests.service';
import { StudentFacade } from '../../../api/facades/student.facade';
import { MyInquiriesComponent } from './my-inquiries.component';

describe('MyInquiriesComponent', () => {
  let component: MyInquiriesComponent;
  let fixture: ComponentFixture<MyInquiriesComponent>;
  let studentFacadeSpy: jasmine.SpyObj<StudentFacade>;
  let inquiryRequestsServiceSpy: jasmine.SpyObj<InquiryRequestsService>;

  beforeEach(async () => {
    studentFacadeSpy = jasmine.createSpyObj<StudentFacade>('StudentFacade', ['me']);
    inquiryRequestsServiceSpy = jasmine.createSpyObj<InquiryRequestsService>('InquiryRequestsService', ['getByRequester']);

    studentFacadeSpy.me.and.returnValue(
      of({
        studentId: 'student-123',
        id: 'profile-456',
        userId: 'user-789',
      }),
    );
    inquiryRequestsServiceSpy.getByRequester.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MyInquiriesComponent],
      providers: [
        { provide: StudentFacade, useValue: studentFacadeSpy },
        { provide: InquiryRequestsService, useValue: inquiryRequestsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyInquiriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('prefers the student profile id when loading inquiries', () => {
    expect(inquiryRequestsServiceSpy.getByRequester).toHaveBeenCalledWith('student-123');
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });
});
