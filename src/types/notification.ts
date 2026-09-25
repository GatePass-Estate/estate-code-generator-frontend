export type NotificationType =
  | 'GUEST_CODE_USED'
  | 'RESIDENT_CODE_USED'
  | 'BROADCAST_HIGH'
  | 'BROADCAST_MEDIUM'
  | 'INCIDENT_REPORT_FILED'
  | 'EDIT_REQUEST_PENDING'
  | 'EDIT_REQUEST_REVIEWED'
  | 'LOGIN_NEW_DEVICE'
  | 'SESSION_REVOKED'
  | 'PASSWORD_CHANGED'
  | 'TWO_FA_ENABLED'
  | 'TWO_FA_DISABLED'
  | 'TWO_FA_RECOVERY_USED'
  | 'ROLE_PROMOTED'
  | 'ROLE_DEMOTED'
  | 'HOUSEHOLD_TRANSFERRED'
  | 'FORGOT_PASSWORD'
  | 'EMAIL_VERIFICATION'
  | 'WELCOME'
  | 'PASSWORD_RESET_CONFIRMED'
  | 'ACCOUNT_CLOSED'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_DEACTIVATION_SCHEDULED'
  | 'ESTATE_DEACTIVATED'
  | 'ESTATE_DEACTIVATION_SCHEDULED'
  | 'ESTATE_REACTIVATED'
  | 'HOUSEHOLD_HEAD_ASSIGNED'
  | 'HOUSEHOLD_NEEDS_HEAD'
  | 'SPATIAL_ANOMALY_DETECTED';

export type NotificationItem = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type NotificationListResponse = {
  total: number;
  page: number;
  limit: number;
  items: NotificationItem[];
};

export type UnreadCountResponse = {
  count: number;
};
