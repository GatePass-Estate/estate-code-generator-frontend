/** Pure billing helpers (no React) shared by the billing screens. */
import * as Crypto from 'expo-crypto';
import { UserRolesType } from '@/src/types/general';
import type { AllUsers } from '@/src/types/user';
import {
  BillingTier,
  CheckoutQuoteRequest,
  EstateSubscription,
  PendingRequest,
  PeriodMonths,
  RenewalEligibility,
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

/** The paid period is over (`period_end` reached). Free Access rows have no end date. */
export function hasPeriodEnded(
  subscription: EstateSubscription | null | undefined,
  now: Date = new Date()
): boolean {
  const end = parseDate(subscription?.period_end);
  return Boolean(end && end <= now);
}

/**
 * A subscription that is still running on a paid tier: not expired, inside its billing period,
 * and not the free `access` tier. A plan past `period_end` is not running even while the backend
 * still reports it `active` (renewal grace period), so no next-cycle changes are offered on it.
 */
export function isPaidActiveSubscription(
  subscription: EstateSubscription | null | undefined,
  tier: BillingTier | null | undefined,
  now: Date = new Date()
): boolean {
  if (!subscription || !tier || tier.slug === 'access') return false;
  if (subscription.status === 'expired') return false;
  if (subscription.status === 'cancelled' && !subscription.period_end) return false;
  return !hasPeriodEnded(subscription, now);
}

/**
 * The period has ended but auto-renew is still on: Paystack keeps retrying the saved card during
 * the backend's grace period, and a new purchase is refused until the plan actually expires.
 */
export function isRenewalRetrying(
  subscription: EstateSubscription | null | undefined,
  now: Date = new Date()
): boolean {
  if (!subscription || !subscription.auto_renew) return false;
  const running = subscription.status === 'active' || subscription.status === 'trialing';
  return running && hasPeriodEnded(subscription, now);
}

/**
 * Whether POST /cancel will accept the plan: an `active`/`trialing` paid tier, whatever its end
 * date (the backend's `require_paid_subscription`). That includes the renewal grace period, where
 * cancelling also ends the plan at once: cancelled plans get no grace, so the estate drops to Access.
 */
export function canCancelSubscription(
  subscription: EstateSubscription | null | undefined,
  tier: BillingTier | null | undefined
): boolean {
  if (!subscription || !tier || tier.slug === 'access') return false;
  return subscription.status === 'active' || subscription.status === 'trialing';
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

export const PRIMARY_ADMIN_REQUIRED_TITLE = 'Primary admin required';

/** Pay, install, and uninstall are estate-owner actions. */
export const PRIMARY_ADMIN_FEATURE_ACTION_MESSAGE =
  'Only the primary admin can pay for, install, or uninstall features. Please ask your estate’s primary admin to complete this.';

export function isPermissionDeniedMessage(message: string | undefined): boolean {
  if (!message) return false;
  const text = message.toLowerCase();
  return (
    text.includes('forbidden') ||
    text.includes('permission') ||
    text.includes('not allowed') ||
    text.includes('primary admin') ||
    text.includes('only the owner')
  );
}

/** Prefer a clear primary-admin explanation over a raw 403 for view-only admins. */
export function featureActionErrorForRole(
  role: UserRolesType | undefined,
  err: { message?: string } | undefined,
  fallback: string
): string {
  if (!canManageBilling(role) && isPermissionDeniedMessage(err?.message)) {
    return PRIMARY_ADMIN_FEATURE_ACTION_MESSAGE;
  }
  return err?.message || fallback;
}

/** Which billing screen to open: 'choose' (pick a plan) or 'current' (Your Current Plan). */
export function getBillingEntry(
  subscription: EstateSubscription | null | undefined,
  tier: BillingTier | null | undefined,
  now: Date = new Date()
): 'choose' | 'current' {
  return isPaidActiveSubscription(subscription, tier, now) ? 'current' : 'choose';
}

/**
 * How "Your Current Plan" renders: 'paid' (a running paid plan), 'free' (the Access tier, or no
 * subscription/tier at all) or 'expired' (a paid tier that is expired or cancelled past its end).
 */
export type CurrentPlanState = 'paid' | 'free' | 'expired';

export function getCurrentPlanState(
  subscription: EstateSubscription | null | undefined,
  tier: BillingTier | null | undefined,
  now: Date = new Date()
): CurrentPlanState {
  if (!subscription || !tier || tier.slug === 'access') return 'free';
  return isPaidActiveSubscription(subscription, tier, now) ? 'paid' : 'expired';
}

/** Plan card footnote on the free Access plan. */
export const FREE_PLAN_FOOTNOTE = 'Change Plan to Unlock more features';

/** 'Expired on May 23rd, 2026.' for a plan that is no longer running; `null` without an end date. */
export function getPlanExpiredFootnote(
  subscription: EstateSubscription | null | undefined
): string | null {
  const endDate = formatBillingDate(subscription?.period_end);
  return endDate ? `Expired on ${endDate}.` : null;
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
 * Unique UUID v4 key for the `Idempotency-Key` header. Uses `expo-crypto` (`Crypto.randomUUID`),
 * falling back to `globalThis.crypto.randomUUID` or a 36-character RFC 4122 v4 UUID.
 */
export function createIdempotencyKey(): string {
  try {
    if (typeof Crypto.randomUUID === 'function') {
      const uuid = Crypto.randomUUID();
      if (typeof uuid === 'string' && uuid.length === 36) return uuid;
    }
  } catch {
    // Fall through if native module is unavailable in test environment
  }
  const cryptoApi = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof cryptoApi?.randomUUID === 'function') return cryptoApi.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const r = Math.floor(Math.random() * 16);
    return (char === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
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

/**
 * Font size for a big money figure that must stay on one line: `baseSize` while it has at most
 * `fitChars` characters, then scaled down in proportion (never below 65% of `baseSize`). Used
 * instead of `adjustsFontSizeToFit`, which on iOS measures a changed amount against the previous
 * layout and can shrink it to a sliver.
 */
export function getAmountFontSize(amount: string, baseSize: number, fitChars: number): number {
  if (amount.length <= fitChars) return baseSize;
  return Math.max(Math.round((baseSize * fitChars) / amount.length), Math.round(baseSize * 0.65));
}

/** Paystack's own checkout/3-D Secure pages (checkout.paystack.com, standard.paystack.co, …). */
const PAYSTACK_HOST = /(^|\.)paystack\.(com|co)$/i;

/**
 * What a navigation inside the Paystack checkout WebView means:
 * - `'return'`: Paystack is sending the user back to our callback (it appends `reference`/`trxref`,
 *   and the backend's callback lives on app.gatepassng.com) — close the sheet and verify payment.
 * - `'cancel'`: the user cancelled on Paystack's page (its "close"/"cancel" routes).
 * - `null`: keep browsing (payment pages, bank 3-D Secure pages).
 */
export function classifyCheckoutNavigation(
  url: string,
  reference?: string | null
): 'return' | 'cancel' | null {
  const match = /^https?:\/\/([^/?#]+)([^?#]*)(\?[^#]*)?/i.exec(url);
  if (!match) return null;
  const host = match[1].toLowerCase().replace(/:\d+$/, '');
  const path = (match[2] || '').toLowerCase();
  const query = match[3] || '';

  if (PAYSTACK_HOST.test(host)) {
    return /\/(close|cancel)/.test(path) ? 'cancel' : null;
  }
  const hasReference =
    /[?&]trxref=/i.test(query) ||
    (reference
      ? query.includes(`reference=${encodeURIComponent(reference)}`)
      : /[?&]reference=/i.test(query));
  if (hasReference || host.endsWith('gatepassng.com') || path.includes('/payment/callback')) {
    return 'return';
  }
  return null;
}

/** The revenue service sends money as integer kobo (since backend PR #106); 100 kobo = ₦1. */
export function koboToNaira(kobo: number): number {
  return Math.round(kobo) / 100;
}

export type SeatOccupancy = {
  residents: number;
  /** admins + primary admins */
  admins: number;
  security: number;
  /** residents + admins */
  seatResidents: number;
  /** Seats in use: residents + admins + security personnel. */
  occupied: number;
};

/**
 * Seats in use, counted the way the admin dashboard does: from the users list's `role_summary`,
 * falling back to counting the loaded items per role.
 */
export function getSeatOccupancy(users: Pick<AllUsers, 'items' | 'role_summary'>): SeatOccupancy {
  const summary = users.role_summary;
  const countRole = (...roles: string[]) =>
    users.items.filter((user) => roles.includes(user.role ?? '')).length;
  const security = summary?.security ?? countRole('security');
  const residents = summary?.resident ?? countRole('resident');
  const admins =
    (summary?.admin ?? 0) + (summary?.primary_admin ?? 0) || countRole('admin', 'primary_admin');
  const seatResidents = residents + admins;
  return { residents, admins, security, seatResidents, occupied: seatResidents + security };
}

const DAY_MS_RENEW = 24 * 60 * 60 * 1000;

/**
 * Why a manual renewal is unavailable, worded for the user (shown when the greyed-out Renew Plan
 * button is tapped). `null` when renewal is allowed.
 */
export function getRenewalBlockMessage(
  eligibility: RenewalEligibility | null | undefined,
  now: Date = new Date()
): { title: string; message: string } | null {
  if (!eligibility) {
    return { title: 'Renewal unavailable', message: 'Please try again in a moment.' };
  }
  if (eligibility.can_renew) return null;
  const end = parseDate(eligibility.period_end);
  const endLabel = end ? formatBillingDate(end.toISOString()) : '';
  if (eligibility.auto_renew && end && end <= now) {
    return {
      title: 'Auto-renewal is on',
      message:
        "We're retrying your saved card automatically. You don't need to do anything; your plan continues once the payment goes through.",
    };
  }
  if (eligibility.auto_renew) {
    return {
      title: 'Auto-renewal is on',
      message: endLabel
        ? `Your plan renews automatically on ${endLabel}. You don't need to do anything.`
        : "Your plan renews automatically. You don't need to do anything.",
    };
  }
  if (end && eligibility.grace_days > 0) {
    const opensAt = new Date(end.getTime() - eligibility.grace_days * DAY_MS_RENEW);
    if (opensAt > now) {
      return {
        title: 'Not time to renew yet',
        message: `You can renew from ${formatBillingDate(opensAt.toISOString())}, ${eligibility.grace_days} days before your plan ends on ${endLabel}.`,
      };
    }
  }
  return {
    title: 'Renewal unavailable',
    message: eligibility.reason || 'This plan cannot be renewed. Choose a plan to subscribe again.',
  };
}

/** A failed billing request; `status` is the HTTP status when the server answered (e.g. 409, 422). */
export class BillingApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'BillingApiError';
    this.status = status;
  }
}

function extractApiErrorDetail(error: any): string | null {
  const data = error?.response?.data;
  if (!data) return null;

  if (Array.isArray(data.detail)) {
    const messages = data.detail
      .map((item: any) => (typeof item === 'string' ? item : item?.msg))
      .filter((msg: unknown): msg is string => typeof msg === 'string' && msg.trim().length > 0);
    if (messages.length > 0) return messages.join('. ');
  }

  if (typeof data.detail === 'string' && data.detail.trim().length > 0) {
    return data.detail;
  }

  if (data.detail && typeof data.detail === 'object' && typeof data.detail.message === 'string') {
    return data.detail.message;
  }

  if (typeof data.message === 'string' && data.message.trim().length > 0) {
    return data.message;
  }

  return null;
}

export function toBillingError(error: unknown, fallback: string): BillingApiError {
  const err = error as any;
  const status: number | undefined =
    typeof err?.response?.status === 'number'
      ? err.response.status
      : typeof err?.status === 'number'
        ? err.status
        : undefined;

  // 5xx details describe internal services (e.g. "Upstream returned HTTP 500 for GET
  // http://db-service…"): show the plain fallback instead. 4xx messages are meant for the user.
  if (status !== undefined && status >= 500) {
    return new BillingApiError(`${fallback}. Please try again.`, status);
  }

  const detail = extractApiErrorDetail(err);

  if (status === 409) {
    return new BillingApiError(
      detail ||
        'A conflicting checkout or subscription request already exists. Please refresh and try again.',
      409
    );
  }

  if (status === 422) {
    return new BillingApiError(
      detail || 'Invalid checkout details. Please check your selection and try again.',
      422
    );
  }

  if (detail) {
    return new BillingApiError(detail, status);
  }

  if (typeof err?.message === 'string' && err.message.trim().length > 0) {
    if (err.message === 'Network Error') {
      return new BillingApiError('Network error - please check your internet connection.', status);
    }
    if (
      err.message.includes('timeout') ||
      err.message.includes('timed out') ||
      err.message.includes('exceeded')
    ) {
      return new BillingApiError(
        'Request timed out - please check your network connection and try again.',
        status
      );
    }
    if (!err.message.startsWith('Request failed with status code ')) {
      return new BillingApiError(err.message, status);
    }
  }

  return new BillingApiError(fallback, status);
}
