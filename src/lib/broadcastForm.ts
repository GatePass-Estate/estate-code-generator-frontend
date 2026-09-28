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

/**
 * Audience choice -> API roles.
 *
 * 'admins' covers both admin roles: a primary admin is an admin, and leaving
 * them out would drop the estate owner from a broadcast addressed to admins.
 * 'root' is never targeted — that is the platform owner, not estate staff.
 */
const AUDIENCE_BY_USER_TYPE: Record<string, BroadcastAudienceRole[]> = {
  residents: ['resident'],
  security: ['security'],
  admins: ['primary_admin', 'admin'],
  all: ALL_ROLES,
  // Accepted aliases from the older single-select form and the web screen.
  resident: ['resident'],
  admin: ['primary_admin', 'admin'],
  users: ALL_ROLES,
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

/**
 * Resolves one or several audience choices to a deduplicated role list.
 *
 * Overlapping choices are expected — picking "Admins only" and "All Users"
 * together must not send `primary_admin` twice.
 */
export function audienceForUserType(userType: string | string[]): BroadcastAudienceRole[] {
  const choices = Array.isArray(userType) ? userType : [userType];
  const roles = new Set<BroadcastAudienceRole>();

  for (const choice of choices) {
    for (const role of AUDIENCE_BY_USER_TYPE[choice] ?? []) {
      roles.add(role);
    }
  }

  // An empty or unrecognised selection would be rejected by the API, so fall
  // back to the safest non-empty audience rather than sending nothing.
  if (roles.size === 0) return ['resident'];

  return Array.from(roles);
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
