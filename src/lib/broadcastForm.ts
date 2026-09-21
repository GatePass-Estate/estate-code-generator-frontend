import type {
  BroadcastAudienceRole,
  BroadcastFormData,
  BroadcastPriority,
  CreateBroadcastPayload,
} from '@/src/types/broadcast';

/**
 * Maps the admin compose form onto the API payload.
 *
 * The form's vocabulary predates the API's, so each field is translated here
 * rather than at the call site.
 */

// USER_TYPES ships 'admins' while BroadcastFormData types it as 'admin', so
// both spellings are accepted to keep the picker and the type in sync.
const ALL_ROLES: BroadcastAudienceRole[] = ['primary_admin', 'admin', 'resident', 'security'];

const AUDIENCE_BY_USER_TYPE: Record<string, BroadcastAudienceRole[]> = {
  // Mobile compose vocabulary.
  residents: ['resident'],
  admin: ['primary_admin', 'admin'],
  admins: ['primary_admin', 'admin'],
  security: ['security'],
  users: ALL_ROLES,
  // Web compose vocabulary.
  resident: ['resident'],
  all: ALL_ROLES,
};

const PRIORITY_BY_LEVEL: Record<string, BroadcastPriority> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
  // The form offers "urgent" but the API tops out at HIGH.
  urgent: 'HIGH',
};

const DURATION_HOURS: Record<string, number> = {
  '1_hour': 1,
  '6_hours': 6,
  '24_hours': 24,
  '3_days': 72,
  '7_days': 168,
  '14_days': 336,
  '30_days': 720,
};

export function audienceForUserType(userType: string): BroadcastAudienceRole[] {
  return AUDIENCE_BY_USER_TYPE[userType] ?? AUDIENCE_BY_USER_TYPE.residents;
}

export function priorityForLevel(level: string): BroadcastPriority {
  return PRIORITY_BY_LEVEL[level] ?? 'MEDIUM';
}

/** Turns a relative duration choice into the absolute UTC expiry the API wants. */
export function expiryForDuration(duration: string): string {
  const hours = DURATION_HOURS[duration] ?? 24;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

export function toCreateBroadcastPayload(form: BroadcastFormData): CreateBroadcastPayload {
  return {
    title: form.subjectLine.trim(),
    message: form.bodyText.trim(),
    audience: audienceForUserType(form.userType),
    category: 'BROADCAST',
    priority: priorityForLevel(form.priorityLevel),
    expires_at: expiryForDuration(form.duration),
  };
}
