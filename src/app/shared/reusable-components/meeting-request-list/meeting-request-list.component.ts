import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  meetingInquiryRequestStatusLabels,
  meetingInquiryTopicLabels,
} from '../../../core/helpers/enum-labels.helper';
import { meetingStatusClass, type MeetingRequestItem } from '../../../core/helpers/meeting-request.helper';
import {
  MeetingInquiryRequestStatus,
  MeetingInquiryTopic,
} from '../../../core/models/interfaces/enums.model';
import { formatSupportMailTime } from '../../../pages/contact/mails/support-mail-format';

/** The signed-in user's meeting requests as cards: topic, status, schedule, message and the team's response. */
@Component({
  selector: 'app-meeting-request-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './meeting-request-list.component.html',
  styleUrls: ['./meeting-request-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeetingRequestListComponent {
  readonly requests = input.required<readonly MeetingRequestItem[]>();

  statusLabel(status: MeetingInquiryRequestStatus): string {
    return meetingInquiryRequestStatusLabels[status] ?? 'Unknown';
  }

  topicLabel(topic: MeetingInquiryTopic): string {
    return meetingInquiryTopicLabels[topic] ?? 'Meeting';
  }

  statusClass(status: MeetingInquiryRequestStatus): string {
    return meetingStatusClass(status);
  }

  formatTime(value: string): string {
    return formatSupportMailTime(value);
  }
}
