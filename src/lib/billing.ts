/** Pure billing helpers (no React) shared by the billing screens. */
import { UserRolesType } from '@/src/types/general';
import {
  BillingTier,
  CheckoutQuoteRequest,
  EstateSubscription,
  PendingRequest,
  PeriodMonths,
  TierFeatureRow,
} from '@/src/types/billing';

export type { PeriodMonths } from '@/src/types/billing';

export const PLAN_DURATIONS: readonly {
  months: PeriodMonths;
  label: string;
  shortLabel: string;
}[] = [
  { months: 1, label: 'One month plan (30 days)', shortLabel: '30days' },
  { months: 3, label: 'Three months plan (90 days)', shortLabel: '90days' },
  { months: 6, label: 'Six months plan (180days)', shortLabel: '180days' },
  { months: 12, label: 'Twelve months plan (360 days)', shortLabel: '360days' },
];

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Catalog order (`display_order`), then name. Returns a new array. */
export function sortTiers(tiers: readonly BillingTier[]): BillingTier[] {
  return [...tiers].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name)
  );
}

/** A plan ranked above the current one is an upgrade; no current plan counts as an upgrade. */
export function getPlanDirection(
  currentOrder: number | null,
  targetOrder: number
): 'upgrade' | 'downgrade' | 'same' {
  if (currentOrder === null || currentOrder === undefined) return 'upgrade';
  if (targetOrder > currentOrder) return 'upgrade';
  if (targetOrder < currentOrder) return 'downgrade';
  return 'same';
}

/** Nearest of 1/3/6/12 months for a billing period; 1 when the dates are missing or invalid. */
export function inferPeriodMonths(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): PeriodMonths {
  const from = parseDate(start);
  const to = parseDate(end);
  if (!from || !to || to <= from) return 1;
  const days = (to.getTime() - from.getTime()) / DAY_MS;
  let best = PLAN_DURATIONS[0];
  for (const option of PLAN_DURATIONS) {
    if (Math.abs(days - option.months * 30) < Math.abs(days - best.months * 30)) best = option;
  }
  return best.months;
}

/** Share of the billing period elapsed, clamped to 0..1; 0 when the dates are missing. */
export function getCycleProgress(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined,
  now: Date = new Date()
): number {
  const from = parseDate(start);
  const to = parseDate(end);
  if (!from || !to || to <= from) return 0;
  const progress = (now.getTime() - from.getTime()) / (to.getTime() - from.getTime());
  return Math.min(1, Math.max(0, progress));
}

const CURRENCY_SYMBOLS: Record<string, string> = { NGN: '₦', USD: '$' };

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * NGN → '₦199,999.50', USD → '$1,200', unknown → 'GHS 1,200', no currency → '1,200'.
 * Whole amounts drop the decimals. Returns '' when the amount is missing or not a number.
 */
export function formatMoney(
  amount: number | string | null | undefined,
  currency?: string | null
): string {
  if (amount === null || amount === undefined || amount === '') return '';
  const value = Number(amount);
  if (!Number.isFinite(value)) return '';

  const cents = Math.round(Math.abs(value) * 100);
  const whole = groupThousands(String(Math.floor(cents / 100)));
  const fraction = cents % 100;
  const number = fraction ? `${whole}.${String(fraction).padStart(2, '0')}` : whole;

  const code = currency?.trim().toUpperCase() ?? '';
  const prefix = code ? (CURRENCY_SYMBOLS[code] ?? `${code} `) : '';
  return `${value < 0 && cents > 0 ? '-' : ''}${prefix}${number}`;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function ordinal(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

/** long: 'May 23rd, 2026'; short: 'October 20'. '' for null/invalid. Uses the device's local date. */
export function formatBillingDate(
  iso: string | Date | null | undefined,
  style: 'long' | 'short' = 'long'
): string {
  const date = parseDate(iso);
  if (!date) return '';
  const month = MONTHS[date.getMonth()];
  if (style === 'short') return `${month} ${date.getDate()}`;
  return `${month} ${ordinal(date.getDate())}, ${date.getFullYear()}`;
}

const TIER_CHANGE_COPY = {
  upgrade: {
    title: 'Plan Upgrade Request',
    description: 'This charge will be added to your next billing payment',
  },
  downgrade: {
    title: 'Plan Downgrade Request',
    description: 'This change will be applied on your next billing payment',
  },
} as const;

/**
 * Scheduled changes on the subscription (0–2 items): a pending tier change and/or a pending seat
 * reduction. Both take effect at `period_end`. The current tier is found via `subscription.tier_id`
 * (or `currentTier` when given).
 */
export function buildPendingRequests({
  subscription,
  tiers,
  currentTier,
}: {
  subscription: EstateSubscription | null | undefined;
  tiers: readonly BillingTier[] | null | undefined;
  currentTier?: BillingTier | null;
}): PendingRequest[] {
  if (!subscription) return [];
  const requests: PendingRequest[] = [];
  const effectiveFrom = subscription.period_end ?? null;
  const catalog = tiers ?? [];

  if (subscription.pending_tier_slug) {
    const target = catalog.find((tier) => tier.slug === subscription.pending_tier_slug);
    const current = currentTier ?? catalog.find((tier) => tier.id === subscription.tier_id);
    const direction =
      target && current
        ? getPlanDirection(current.display_order, target.display_order)
        : 'downgrade';
    const resolved = direction === 'upgrade' ? 'upgrade' : 'downgrade';
    requests.push({
      kind: 'tier_change',
      ...TIER_CHANGE_COPY[resolved],
      effectiveFrom,
      direction: resolved,
      targetTierSlug: subscription.pending_tier_slug,
      targetTierName: target?.name ?? humaniseFeatureKey(subscription.pending_tier_slug),
    });
  }

  const pendingSeats = subscription.pending_covered_users;
  if (pendingSeats !== null && pendingSeats !== undefined) {
    if (pendingSeats !== subscription.covered_users) {
      requests.push({
        kind: 'seat_reduction',
        title: 'Seat Reduction Request',
        description: 'This charge will be subtracted from your next billing payment',
        effectiveFrom,
        seats: pendingSeats,
      });
    }
  }

  return requests;
}

const BILLING_VIEW_ROLES: readonly UserRolesType[] = ['admin', 'primary_admin', 'root'];
const BILLING_MANAGE_ROLES: readonly UserRolesType[] = ['primary_admin', 'root'];

/** Admins, primary admins and root can see the billing screens. */
export function canViewBilling(role: UserRolesType | undefined): boolean {
  return !!role && BILLING_VIEW_ROLES.includes(role);
}

/** Only primary admins and root can subscribe, change plan/seats or cancel pending changes. */
export function canManageBilling(role: UserRolesType | undefined): boolean {
  return !!role && BILLING_MANAGE_ROLES.includes(role);
}

/**
 * A subscription that is still running on a paid tier: not expired, not cancelled past its end,
 * and not the free `access` tier.
 */
export function isPaidActiveSubscription(
  subscription: EstateSubscription | null | undefined,
  tier: BillingTier | null | undefined,
  now: Date = new Date()
): boolean {
  if (!subscription || !tier || tier.slug === 'access') return false;
  if (subscription.status === 'expired') return false;
  if (subscription.status === 'cancelled') {
    const end = parseDate(subscription.period_end);
    if (!end || end <= now) return false;
  }
  return true;
}

/**
 * Plan card footnote for the current plan: 'Renews on May 23rd, 2026.' while auto-renew is on,
 * else 'Expires on …'. `null` when there is no end date.
 */
export function getPlanRenewalFootnote(
  subscription: EstateSubscription | null | undefined
): string | null {
  const endDate = formatBillingDate(subscription?.period_end);
  if (!subscription || !endDate) return null;
  const renews = subscription.auto_renew && subscription.status !== 'cancelled';
  return `${renews ? 'Renews' : 'Expires'} on ${endDate}.`;
}

/** Shown on billing screens to admins who can view but not change the subscription. */
export const BILLING_VIEW_ONLY_NOTE = 'Only the primary admin can change the subscription.';

/** Which billing screen to open: 'choose' (pick a plan) or 'current' (Your Current Plan). */
export function getBillingEntry(
  subscription: EstateSubscription | null | undefined,
  tier: BillingTier | null | undefined,
  now: Date = new Date()
): 'choose' | 'current' {
  return isPaidActiveSubscription(subscription, tier, now) ? 'current' : 'choose';
}

/** `access_anomaly_detection_tier_1` → 'Access Anomaly Detection'. */
export function humaniseFeatureKey(key: string | null | undefined): string {
  if (!key) return '';
  return key
    .replace(/[_-]?tier[_-]?\d+$/i, '')
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Catalog services whose entitlement is a number of days (`limit_type: duration_days`) rather than
 * a boolean; the API rejects `true` for them. Custom plans get the longest window offered by the
 * paid tiers (Command: 365 days). Pricing is per included key, not per day.
 */
const CUSTOM_DURATION_ENTITLEMENTS: Record<string, number> = {
  extended_historical_record: 365,
};

/** Custom-plan entitlements for quotes/checkout: every selected service on + `administrative_fee`. */
export function buildCustomEntitlements(
  selectedServiceKeys: readonly string[]
): Record<string, boolean | number> {
  const entitlements: Record<string, boolean | number> = {};
  for (const key of selectedServiceKeys) {
    entitlements[key] = CUSTOM_DURATION_ENTITLEMENTS[key] ?? true;
  }
  entitlements.administrative_fee = true;
  return entitlements;
}

/** Included rows (free, paid, AI available) then locked rows (the unavailable lists), deduped by key. */
export function getTierFeatureRows(tier: BillingTier | null | undefined): TierFeatureRow[] {
  if (!tier) return [];
  const rows: TierFeatureRow[] = [];
  const seen = new Set<string>();
  const add = (key: string, label: string, state: TierFeatureRow['state']) => {
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push({ key, label, state });
  };

  for (const f of tier.free_features?.available ?? []) add(f.service_key, f.label, 'included');
  for (const f of tier.paid_non_ai_features?.available ?? []) {
    add(f.service_key, f.label, 'included');
  }
  for (const f of tier.paid_ai_features?.available ?? []) add(f.feature_key, f.label, 'included');
  for (const f of tier.free_features?.unavailable ?? []) add(f.service_key, f.label, 'locked');
  for (const f of tier.paid_non_ai_features?.unavailable ?? []) {
    add(f.service_key, f.label, 'locked');
  }
  for (const f of tier.paid_ai_features?.unavailable ?? []) add(f.feature_key, f.label, 'locked');

  return rows;
}

/**
 * Unique key for the `Idempotency-Key` header. Uses `crypto.randomUUID` when the runtime has it
 * (Hermes does not; `expo-crypto` is not installed), else a timestamp + random v4-style id.
 */
export function createIdempotencyKey(): string {
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
  const random = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const r = Math.floor(Math.random() * 16);
    return (char === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return `${Date.now().toString(36)}-${random}`;
}

/**
 * Quote body (minus `estate_id`) that prices the estate's current plan at `seats` for `months`.
 * Custom plans are priced from the subscription's entitlements snapshot. `null` when there is no
 * paid plan to price (no subscription/tier, or the free Access tier).
 */
export function getCurrentPlanQuoteParams(
  subscription: EstateSubscription | null | undefined,
  tier: BillingTier | null | undefined,
  seats: number,
  months: PeriodMonths = 1
): Omit<CheckoutQuoteRequest, 'estate_id'> | null {
  if (!subscription || !tier || tier.slug === 'access' || seats < 1) return null;
  const base = { covered_users: seats, period_months: months };
  if (!tier.is_custom) return { ...base, tier_slug: tier.slug };
  const entitlements: Record<string, boolean | number> = {};
  for (const [key, value] of Object.entries(subscription.entitlements ?? {})) {
    if (typeof value === 'boolean' || typeof value === 'number') entitlements[key] = value;
  }
  return {
    ...base,
    tier_slug: 'custom',
    entitlements: { ...entitlements, administrative_fee: true },
  };
}
