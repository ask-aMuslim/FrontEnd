import { Id } from './base.model';

export interface NotificationFilter {
  userId: Id;
  unreadOnly?: boolean;
}

export interface SendNotificationRequest {
  userId: Id;
  title: string;
  message: string;
}

export default SendNotificationRequest;
