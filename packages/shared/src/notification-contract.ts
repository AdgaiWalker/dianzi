import type { SiteContext } from './site';

export type NotificationChannel = 'in_app' | 'email';
export type NotificationDomain = 'campus' | 'compass' | 'system';
export type NotificationType =
  | 'auth_invite'
  | 'feedback'
  | 'changed'
  | 'expiry'
  | 'claim'
  | 'reply'
  | 'trust'
  | 'application_result'
  | 'invite_code'
  | 'solution_feedback'
  | 'content_review_result'
  | 'quota_billing_notice';

export interface NotificationInboxItem {
  id: string;
  site: Exclude<SiteContext, 'all'>;
  domain: NotificationDomain;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationInboxResponse {
  notifications: NotificationInboxItem[];
}

export interface MarkNotificationReadResponse {
  notification: NotificationInboxItem;
}
