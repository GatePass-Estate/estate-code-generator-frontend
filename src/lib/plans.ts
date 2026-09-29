import { UserRolesType } from '@/src/types/general';
import { EstateEntitlementsResponse } from '@/src/types/entitlements';
import { SERVICE_CATALOG_LIST, ServiceKey, getServiceByKey } from '@/src/lib/serviceCatalog';

/** Any service catalog key. */
export type PlanFeature = ServiceKey;

/**
 * - `granted`: the estate's plan includes the feature.
 * - `upgrade`: the primary admin, whose plan lacks it — prompt them to upgrade.
 * - `contact_admin`: anyone else (including other admins) whose plan lacks it — tell them to ask
 *   their admin.
 * - `blocked`: the server refused to share the estate's plan with this user (e.g. their ID isn't
 *   approved yet), so the plan isn't the problem — show the server's reason instead.
 */
export type FeatureAccess = 'granted' | 'upgrade' | 'contact_admin' | 'blocked';

/** An estate's plan, normalised from the revenue service. */
export type Entitlements = {
  tierSlug: string | null;
  subscriptionStatus: string | null;
  /** Maximum registered users covered by the estate's current plan. */
  coveredUsers: number | null;
  /** The whole subscription is locked (e.g. lapsed); only free features remain. */
  locked: boolean;
  reason: string | null;
  services: ReadonlyMap<PlanFeature, boolean>;
};

/** Set `EXPO_PUBLIC_PLAN_LOCKS=off` to unlock every feature in a build. */
export const PLAN_LOCKS_ENABLED = process.env.EXPO_PUBLIC_PLAN_LOCKS !== 'off';

const CATALOG_KEYS: ReadonlySet<string> = new Set(
  SERVICE_CATALOG_LIST.map((service) => service.serviceKey)
);

function isPlanFeature(key: string): key is PlanFeature {
  return CATALOG_KEYS.has(key);
}

function isFreeFeature(feature: PlanFeature): boolean {
  return getServiceByKey(feature).category === 'free';
}

/**
 * Mirrors the revenue service's `check_service_entitlement`: entries may be a bare boolean, a
 * numeric limit (e.g. `extended_historical_record: 90` days — allowed when above 0), or an object
 * with `allowed`; anything else is treated as denied.
 */
function isGranted(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (value !== null && typeof value === 'object' && 'allowed' in value) {
    return (value as { allowed: unknown }).allowed === true;
  }
  return false;
}

export function parseEntitlements(response: EstateEntitlementsResponse): Entitlements {
  const services = new Map<PlanFeature, boolean>();
  for (const [key, value] of Object.entries(response.entitlements ?? {})) {
    if (isPlanFeature(key)) services.set(key, isGranted(value));
  }

  const maxActiveUsers = response.entitlements?.max_active_users;
  const entitlementUserLimit =
    typeof maxActiveUsers === 'number'
      ? maxActiveUsers
      : maxActiveUsers !== null &&
          typeof maxActiveUsers === 'object' &&
          'limit' in maxActiveUsers &&
          typeof (maxActiveUsers as { limit?: unknown }).limit === 'number'
        ? (maxActiveUsers as { limit: number }).limit
        : null;

  return {
    tierSlug: response.tier_slug ?? null,
    subscriptionStatus: response.subscription_status ?? null,
    coveredUsers: response.covered_users ?? entitlementUserLimit,
    locked: response.locked ?? false,
    reason: response.reason ?? null,
    services,
  };
}

/** Only the primary admin owns the estate's subscription, so only they are asked to upgrade. */
export function canManagePlan(role: UserRolesType): boolean {
  return role === 'primary_admin';
}

/**
 * Whether the estate may use `feature`. Until entitlements load (or if the request fails), and for
 * services the revenue service doesn't list, only free catalog features are allowed.
 */
export function hasEntitlement(
  entitlements: Entitlements | undefined,
  feature: PlanFeature
): boolean {
  if (!PLAN_LOCKS_ENABLED || isFreeFeature(feature)) return true;
  if (!entitlements || entitlements.locked) return false;
  return entitlements.services.get(feature) ?? false;
}

/**
 * `blockedReason` is the server's message when it refused the entitlements request; a denial is
 * then reported as `blocked` rather than blamed on the plan.
 */
export function resolveFeatureAccess(
  entitlements: Entitlements | undefined,
  role: UserRolesType,
  feature: PlanFeature,
  blockedReason?: string | null
): FeatureAccess {
  if (hasEntitlement(entitlements, feature)) return 'granted';
  if (blockedReason) return 'blocked';
  return canManagePlan(role) ? 'upgrade' : 'contact_admin';
}

export function getFeatureLabel(feature: PlanFeature): string {
  return getServiceByKey(feature).label;
}

/** Admin Upgrade Plan modal body for this feature. */
export function getUpgradeCopy(feature: PlanFeature): string {
  const service = getServiceByKey(feature);
  return service.upgradeCopy ?? `Upgrade your plan to unlock ${service.label}.`;
}

/** Resident free-plan notice body for this feature. */
export function getFreePlanNoticeCopy(feature: PlanFeature): string {
  const service = getServiceByKey(feature);
  return (
    service.noticeCopy ??
    `${service.label} is not available on the Free Plan. Contact Admin to upgrade.`
  );
}
