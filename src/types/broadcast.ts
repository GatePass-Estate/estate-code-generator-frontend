export interface BroadcastFormData {
  userType: 'residents' | 'admin' | 'security' | 'users';
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  duration: '1_hour' | '6_hours' | '24_hours' | '7_days';
  subjectLine: string;
  bodyText: string;
}

export interface BroadcastFormErrors {
  userType?: string;
  priorityLevel?: string;
  duration?: string;
  subjectLine?: string;
  bodyText?: string;
}

export const USER_TYPES = [
  { label: 'Residents Only', value: 'residents' },
  { label: 'Admins Only', value: 'admins' },
  { label: 'Security Personnel Only', value: 'security' },
  { label: 'All Users', value: 'users' },
];

export const PRIORITY_LEVELS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

export const DURATIONS = [
  { label: '24 Hours', value: '24_hours' },
  { label: '3 Days', value: '3_days' },
  { label: '7 Days', value: '7_days' },
  { label: '14 Days', value: '14_days' },
  { label: '30 Days', value: '30_days' },
];

/* ------------------------------------------------------------------ */
/* API shapes                                                          */
/* ------------------------------------------------------------------ */

export type BroadcastPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type BroadcastCategory = 'BROADCAST' | 'AD';
/** Roles the API accepts as a broadcast audience. Note: 'guest' is rejected. */
export type BroadcastAudienceRole = 'root' | 'primary_admin' | 'admin' | 'resident' | 'security';

export type BroadcastItem = {
  id: string;
  estate_id?: string | null;
  sender_id: string;
  title: string;
  message: string;
  audience: BroadcastAudienceRole[];
  category: BroadcastCategory;
  priority: BroadcastPriority;
  sender_name?: string | null;
  attachment_url?: string | null;
  status: boolean;
  expires_at?: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
};

export type BroadcastListResponse = {
  total: number;
  page: number;
  limit: number;
  items: BroadcastItem[];
};

export type CreateBroadcastPayload = {
  title: string;
  message: string;
  audience: BroadcastAudienceRole[];
  category?: BroadcastCategory;
  priority?: BroadcastPriority;
  expires_at?: string | null;
};
