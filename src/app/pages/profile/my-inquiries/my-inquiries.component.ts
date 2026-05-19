import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { map, Observable } from 'rxjs';

import { StudentFacade } from '../../../api/facades/student.facade';
import { InquiryRequest } from '../../../api/fn/inquiry-requests';
import { InquiryRequestsService } from '../../../core/services/inquiry-requests.service';
import { PageHeaderComponent } from '../../../components/atoms/page-header/page-header.component';
import { InquiryCardComponent } from '../../../components/molecules/inquiry-card/inquiry-card.component';

@Component({
  selector: 'app-my-inquiries',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, InquiryCardComponent],
  templateUrl: './my-inquiries.component.html',
  styleUrls: ['./my-inquiries.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyInquiriesComponent implements OnInit {
  inquiries$: Observable<InquiryRequest[]> | null = null;

  constructor(
    private studentFacade: StudentFacade,
    private inquiryRequestsService: InquiryRequestsService,
  ) {}

  ngOnInit(): void {
    this.inquiries$ = this.studentFacade.me().pipe(
      map((profile) => this.resolveRequesterId(profile)),
      map((requesterId) => {
        if (!requesterId) {
          return [];
        }
        return this.inquiryRequestsService.getByRequester(requesterId);
      }),
    );
  }

  private resolveRequesterId(profile: { studentId?: unknown; id?: unknown; userId?: unknown } | null): string | null {
    if (!profile) {
      return null;
    }

    if (typeof profile.studentId === 'string' && profile.studentId.length > 0) {
      return profile.studentId;
    }

    if (typeof profile.id === 'string' && profile.id.length > 0) {
      return profile.id;
    }

    if (typeof profile.userId === 'string' && profile.userId.length > 0) {
      return profile.userId;
    }

    return null;
  }
    private formatDate(value: string | null): string {
        if (!value) {
            return 'Unknown date';
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return value;
        }

        return parsed.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    private resolveRequesterId(profile: { studentId?: unknown; id?: unknown; userId?: unknown } | null): string | null {
        if (!profile) {
            return null;
        }

        if (typeof profile.studentId === 'string' && profile.studentId.length > 0) {
            return profile.studentId;
        }

        if (typeof profile.id === 'string' && profile.id.length > 0) {
            return profile.id;
        }

        if (typeof profile.userId === 'string' && profile.userId.length > 0) {
            return profile.userId;
        }

        return null;
    }
}
