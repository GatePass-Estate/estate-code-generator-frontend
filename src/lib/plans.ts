import { User } from '@/src/types/user';
import { UserRolesType } from '@/src/types/general';

/**
 * GatePass Service Catalog keys we currently enforce on Free.
 * GPF1 visitor_access_code stays free (1-hour guest codes).
 * GPPF5 / E15 advanced_code_management is paid.
 * GPPF2 guest_management is paid (save guest).
 */
export const PLAN_FEATURES = {
  /** Catalogue GPPF5 / E15 */
  advanced_code_management: 'advanced_code_management',
  /** Catalogue GPPF2 */
  save_guest_contact: 'save_guest_contact',
} as const;

export type PlanFeature = (typeof PLAN_FEATURES)[keyof typeof PLAN_FEATURES];

export type PlanTier = 'free' | 'paid';

export type PlanFields = Pick<User, 'plan' | 'subscription_plan' | 'tier' | 'plan_name'>;

export const CATALOGUE_FEATURES = {
  GPF1: { id: 'visitor_access_code', feature: null, free: true },
  GPPF5: {
    id: 'advanced_code_management',
    feature: PLAN_FEATURES.advanced_code_management,
    free: false,
    row: 'E15',
  },
  GPPF2: {
    id: 'guest_management',
    feature: PLAN_FEATURES.save_guest_contact,
    free: false,
  },
} as const;

export const UPGRADE_COPY: Record<PlanFeature, string> = {
  advanced_code_management:
    'Unlock the flexibility to schedule your access code beyond the standard one-hour window.',
  save_guest_contact: 'Unlock Save Guest Profile to quickly reuse guest details for future visits.',
};

const FREE_FEATURES: Record<PlanFeature, boolean> = {
  advanced_code_management: false,
  save_guest_contact: false,
};

const PLAN_KEYS = [
  'plan',
  'subscription_plan',
  'tier',
  'plan_name',
  'estate_plan',
  'billing_plan',
  'current_plan',
];

/** Pull plan/tier fields out of login or `/users/profile/me`, including nested estate/subscription objects. */
export function extractPlanFields(payload: unknown): PlanFields {
  const found: Record<string, string> = {};

  const walk = (value: unknown, depth: number) => {
    if (!value || typeof value !== 'object' || depth > 4) return;
    if (Array.isArray(value)) {
      value.slice(0, 8).forEach((item) => walk(item, depth + 1));
      return;
    }
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      const normalized = key.toLowerCase();
      if (
        PLAN_KEYS.includes(normalized) &&
        (typeof nested === 'string' || typeof nested === 'number') &&
        !found[normalized]
      ) {
        found[normalized] = String(nested);
      } else if (nested && typeof nested === 'object') {
        walk(nested, depth + 1);
      }
    }
  };

  walk(payload, 0);

  return {
    plan: found.plan ?? found.current_plan ?? found.estate_plan ?? found.billing_plan ?? null,
    subscription_plan: found.subscription_plan ?? null,
    tier: found.tier ?? null,
    plan_name: found.plan_name ?? null,
  };
}

export function resolvePlanTier(user: PlanFields): PlanTier {
  const raw = user.plan ?? user.subscription_plan ?? user.tier ?? user.plan_name;
  if (!raw) return 'free';
  const value = String(raw).toLowerCase();
  if (value.includes('free') || value === 'starter' || value === 'basic') return 'free';
  return 'paid';
}

export function canUsePlanFeature(tier: PlanTier, feature: PlanFeature): boolean {
  // TODO: re-enable plan locks after testing
  return true;
  // if (tier === 'paid') return true;
  // return FREE_FEATURES[feature];
}

export function canManagePlan(role: UserRolesType): boolean {
  return role === 'primary_admin' || role === 'admin';
}

export function planDisplayName(user: PlanFields, tier: PlanTier): string {
  const raw = user.plan ?? user.subscription_plan ?? user.tier ?? user.plan_name;
  if (raw && String(raw).trim()) {
    const value = String(raw).trim();
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return tier === 'paid' ? 'Paid' : 'Free';
}

export function planLabel(tier: PlanTier): string {
  return planDisplayName({}, tier);
}
