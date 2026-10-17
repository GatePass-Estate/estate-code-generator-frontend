import { describe, expect, it } from '@jest/globals';
import {
  buildCustomEntitlements,
  buildPendingRequests,
  canManageBilling,
  canViewBilling,
  createIdempotencyKey,
  formatBillingDate,
  formatMoney,
  getBillingEntry,
  getCurrentPlanQuoteParams,
  getCycleProgress,
  getPlanDirection,
  getPlanRenewalFootnote,
  getTierFeatureRows,
  humaniseFeatureKey,
  inferPeriodMonths,
  isPaidActiveSubscription,
  sortTiers,
} from '@/src/lib/billing';
import { BillingTier, EstateSubscription } from '@/src/types/billing';

const tier = (
  slug: string,
  display_order: number,
  extra: Partial<BillingTier> = {}
): BillingTier => ({
  id: `tier-${slug}`,
  slug,
  name: slug.charAt(0).toUpperCase() + slug.slice(1),
  description: '',
  display_order,
  entitlements: {},
  included_ai_features: [],
  is_custom: slug === 'custom',
  is_active: true,
  billing_unit_hint: null,
  free_features: { available: [], unavailable: [] },
  paid_non_ai_features: { available: [], unavailable: [] },
  paid_ai_features: { available: [], unavailable: [] },
  ...extra,
});

const TIERS = [
  tier('access', 0),
  tier('watch', 1),
  tier('sentinel', 2),
  tier('command', 3),
  tier('custom', 4),
];

const subscription = (extra: Partial<EstateSubscription> = {}): EstateSubscription => ({
  id: 'sub-1',
  estate_id: 'estate-1',
  tier_id: 'tier-sentinel',
  status: 'active',
  period_start: '2026-10-01T12:00:00Z',
  period_end: '2026-10-31T12:00:00Z',
  auto_renew: true,
  covered_users: 50,
  over_cap_locked: false,
  entitlements: null,
  pending_tier_slug: null,
  pending_covered_users: null,
  cancelled_at: null,
  created_at: '2026-10-01T12:00:00Z',
  updated_at: '2026-10-01T12:00:00Z',
  ...extra,
});

describe('formatMoney', () => {
  it('formats NGN with ₦ and thousands separators', () => {
    expect(formatMoney(199999.5, 'NGN')).toBe('₦199,999.50');
    expect(formatMoney(1200, 'NGN')).toBe('₦1,200');
    expect(formatMoney(1234567.891, 'ngn')).toBe('₦1,234,567.89');
  });

  it('drops .00 and accepts numeric strings', () => {
    expect(formatMoney('9999.00', 'NGN')).toBe('₦9,999');
    expect(formatMoney('0', 'NGN')).toBe('₦0');
  });

  it('uses $ for USD and the ISO code otherwise', () => {
    expect(formatMoney(5.06, 'USD')).toBe('$5.06');
    expect(formatMoney(1200, 'GHS')).toBe('GHS 1,200');
    expect(formatMoney(1200)).toBe('1,200');
  });

  it('handles negatives and invalid input', () => {
    expect(formatMoney(-1200, 'NGN')).toBe('-₦1,200');
    expect(formatMoney(null, 'NGN')).toBe('');
    expect(formatMoney(undefined)).toBe('');
    expect(formatMoney('abc', 'NGN')).toBe('');
  });
});

describe('formatBillingDate', () => {
  it('formats long dates with ordinal suffixes', () => {
    expect(formatBillingDate('2026-05-23T12:00:00Z')).toBe('May 23rd, 2026');
    expect(formatBillingDate('2026-05-01T12:00:00Z', 'long')).toBe('May 1st, 2026');
    expect(formatBillingDate('2026-05-02T12:00:00Z')).toBe('May 2nd, 2026');
    expect(formatBillingDate('2026-05-04T12:00:00Z')).toBe('May 4th, 2026');
    expect(formatBillingDate('2026-05-11T12:00:00Z')).toBe('May 11th, 2026');
    expect(formatBillingDate('2026-05-12T12:00:00Z')).toBe('May 12th, 2026');
    expect(formatBillingDate('2026-05-13T12:00:00Z')).toBe('May 13th, 2026');
    expect(formatBillingDate('2026-05-21T12:00:00Z')).toBe('May 21st, 2026');
    expect(formatBillingDate('2026-05-22T12:00:00Z')).toBe('May 22nd, 2026');
    expect(formatBillingDate('2026-05-31T12:00:00Z')).toBe('May 31st, 2026');
  });

  it('formats short dates', () => {
    expect(formatBillingDate('2026-10-20T12:00:00Z', 'short')).toBe('October 20');
  });

  it('returns an empty string for missing or invalid dates', () => {
    expect(formatBillingDate(null)).toBe('');
    expect(formatBillingDate(undefined)).toBe('');
    expect(formatBillingDate('not a date')).toBe('');
  });
});

describe('getPlanDirection', () => {
  it('compares display orders', () => {
    expect(getPlanDirection(1, 2)).toBe('upgrade');
    expect(getPlanDirection(3, 1)).toBe('downgrade');
    expect(getPlanDirection(2, 2)).toBe('same');
  });

  it('treats no current plan as an upgrade', () => {
    expect(getPlanDirection(null, 0)).toBe('upgrade');
  });
});

describe('inferPeriodMonths', () => {
  const start = new Date('2026-01-01T00:00:00Z');
  const plusDays = (days: number) => new Date(start.getTime() + days * 86_400_000).toISOString();

  it('maps 30/90/180/360-day periods to 1/3/6/12 months', () => {
    expect(inferPeriodMonths(start.toISOString(), plusDays(30))).toBe(1);
    expect(inferPeriodMonths(start.toISOString(), plusDays(90))).toBe(3);
    expect(inferPeriodMonths(start.toISOString(), plusDays(180))).toBe(6);
    expect(inferPeriodMonths(start.toISOString(), plusDays(360))).toBe(12);
  });

  it('tolerates calendar-month lengths', () => {
    expect(inferPeriodMonths('2026-02-01T00:00:00Z', '2026-03-01T00:00:00Z')).toBe(1);
    expect(inferPeriodMonths('2026-01-01T00:00:00Z', '2027-01-01T00:00:00Z')).toBe(12);
  });

  it('falls back to 1 month for missing or invalid dates', () => {
    expect(inferPeriodMonths(null, plusDays(90))).toBe(1);
    expect(inferPeriodMonths(start.toISOString(), null)).toBe(1);
    expect(inferPeriodMonths('bad', 'worse')).toBe(1);
  });
});

describe('getCycleProgress', () => {
  const start = '2026-10-01T00:00:00Z';
  const end = '2026-10-11T00:00:00Z';

  it('returns the elapsed share of the period', () => {
    expect(getCycleProgress(start, end, new Date('2026-10-06T00:00:00Z'))).toBeCloseTo(0.5);
  });

  it('clamps to 0..1', () => {
    expect(getCycleProgress(start, end, new Date('2026-09-01T00:00:00Z'))).toBe(0);
    expect(getCycleProgress(start, end, new Date('2026-12-01T00:00:00Z'))).toBe(1);
  });

  it('returns 0 when start or end is missing', () => {
    expect(getCycleProgress(null, end)).toBe(0);
    expect(getCycleProgress(start, null)).toBe(0);
  });
});

describe('buildPendingRequests', () => {
  it('returns nothing without pending changes or a subscription', () => {
    expect(buildPendingRequests({ subscription: subscription(), tiers: TIERS })).toEqual([]);
    expect(buildPendingRequests({ subscription: null, tiers: TIERS })).toEqual([]);
  });

  it('describes a scheduled tier upgrade', () => {
    const [request] = buildPendingRequests({
      subscription: subscription({ pending_tier_slug: 'command' }),
      tiers: TIERS,
    });
    expect(request).toEqual({
      kind: 'tier_change',
      title: 'Plan Upgrade Request',
      description: 'This charge will be added to your next billing payment',
      effectiveFrom: '2026-10-31T12:00:00Z',
      direction: 'upgrade',
      targetTierSlug: 'command',
      targetTierName: 'Command',
    });
  });

  it('describes a scheduled tier downgrade', () => {
    const requests = buildPendingRequests({
      subscription: subscription({ pending_tier_slug: 'watch' }),
      tiers: TIERS,
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      kind: 'tier_change',
      title: 'Plan Downgrade Request',
      description: 'This change will be applied on your next billing payment',
      direction: 'downgrade',
    });
  });

  it('describes a scheduled seat reduction', () => {
    const requests = buildPendingRequests({
      subscription: subscription({ pending_covered_users: 30 }),
      tiers: TIERS,
    });
    expect(requests).toEqual([
      {
        kind: 'seat_reduction',
        title: 'Seat Reduction Request',
        description: 'This charge will be subtracted from your next billing payment',
        effectiveFrom: '2026-10-31T12:00:00Z',
        seats: 30,
      },
    ]);
  });

  it('lists a tier change and a seat reduction together', () => {
    const requests = buildPendingRequests({
      subscription: subscription({ pending_tier_slug: 'watch', pending_covered_users: 30 }),
      tiers: TIERS,
    });
    expect(requests.map((r) => r.kind)).toEqual(['tier_change', 'seat_reduction']);
  });

  it('ignores a pending seat count equal to the current one', () => {
    expect(
      buildPendingRequests({
        subscription: subscription({ pending_covered_users: 50 }),
        tiers: TIERS,
      })
    ).toEqual([]);
  });
});

describe('getTierFeatureRows', () => {
  it('lists included then locked features, deduped by key', () => {
    const rows = getTierFeatureRows(
      tier('watch', 1, {
        free_features: {
          available: [{ service_key: 'gate_codes', label: 'Gate codes' }],
          unavailable: [],
        },
        paid_non_ai_features: {
          available: [
            { service_key: 'broadcasts', label: 'Broadcasts' },
            { service_key: 'gate_codes', label: 'Gate codes (dup)' },
          ],
          unavailable: [{ service_key: 'reports', label: 'Reports' }],
        },
        paid_ai_features: {
          available: [],
          unavailable: [
            { feature_key: 'anomaly_tier_1', label: 'Anomaly detection' },
            { feature_key: 'broadcasts', label: 'Broadcasts (dup)' },
          ],
        },
      })
    );
    expect(rows).toEqual([
      { key: 'gate_codes', label: 'Gate codes', state: 'included' },
      { key: 'broadcasts', label: 'Broadcasts', state: 'included' },
      { key: 'reports', label: 'Reports', state: 'locked' },
      { key: 'anomaly_tier_1', label: 'Anomaly detection', state: 'locked' },
    ]);
  });

  it('returns no rows without a tier', () => {
    expect(getTierFeatureRows(null)).toEqual([]);
  });
});

describe('buildCustomEntitlements', () => {
  it('turns on every selected service plus the administrative fee', () => {
    expect(buildCustomEntitlements(['gate_codes', 'broadcasts'])).toEqual({
      gate_codes: true,
      broadcasts: true,
      administrative_fee: true,
    });
    expect(buildCustomEntitlements([])).toEqual({ administrative_fee: true });
  });

  it('sends day counts for duration-typed services', () => {
    expect(buildCustomEntitlements(['extended_historical_record', 'guest_management'])).toEqual({
      extended_historical_record: 365,
      guest_management: true,
      administrative_fee: true,
    });
  });
});

describe('getBillingEntry', () => {
  const now = new Date('2026-10-16T12:00:00Z');
  const sentinel = TIERS[2];

  it('chooses a plan when there is no paid, running subscription', () => {
    expect(getBillingEntry(null, null, now)).toBe('choose');
    expect(getBillingEntry(subscription(), null, now)).toBe('choose');
    expect(getBillingEntry(subscription(), TIERS[0], now)).toBe('choose');
    expect(getBillingEntry(subscription({ status: 'expired' }), sentinel, now)).toBe('choose');
    expect(
      getBillingEntry(
        subscription({ status: 'cancelled', period_end: '2026-10-01T00:00:00Z' }),
        sentinel,
        now
      )
    ).toBe('choose');
  });

  it('shows the current plan for a running paid subscription', () => {
    expect(getBillingEntry(subscription(), sentinel, now)).toBe('current');
    expect(getBillingEntry(subscription({ status: 'past_due' }), sentinel, now)).toBe('current');
    expect(getBillingEntry(subscription({ status: 'cancelled' }), sentinel, now)).toBe('current');
    expect(isPaidActiveSubscription(subscription({ status: 'trialing' }), sentinel, now)).toBe(
      true
    );
  });
});

describe('billing roles', () => {
  it('lets only primary admins and root manage billing', () => {
    expect(canManageBilling('primary_admin')).toBe(true);
    expect(canManageBilling('root')).toBe(true);
    expect(canManageBilling('admin')).toBe(false);
    expect(canManageBilling('resident')).toBe(false);
    expect(canManageBilling('security')).toBe(false);
    expect(canManageBilling(null)).toBe(false);
  });

  it('lets admins view billing but not residents or security', () => {
    expect(canViewBilling('admin')).toBe(true);
    expect(canViewBilling('primary_admin')).toBe(true);
    expect(canViewBilling('root')).toBe(true);
    expect(canViewBilling('resident')).toBe(false);
    expect(canViewBilling('security')).toBe(false);
    expect(canViewBilling(undefined)).toBe(false);
  });
});

describe('misc helpers', () => {
  it('humanises feature keys', () => {
    expect(humaniseFeatureKey('access_anomaly_detection_tier_1')).toBe('Access Anomaly Detection');
    expect(humaniseFeatureKey('incident_report')).toBe('Incident Report');
    expect(humaniseFeatureKey(null)).toBe('');
  });

  it('sorts tiers by display order', () => {
    const shuffled = [TIERS[3], TIERS[0], TIERS[4], TIERS[1], TIERS[2]];
    expect(sortTiers(shuffled).map((t) => t.slug)).toEqual([
      'access',
      'watch',
      'sentinel',
      'command',
      'custom',
    ]);
  });

  it('creates distinct idempotency keys', () => {
    const a = createIdempotencyKey();
    const b = createIdempotencyKey();
    expect(a).toEqual(expect.any(String));
    expect(a.length).toBeGreaterThan(16);
    expect(a).not.toBe(b);
  });
});

describe('getCurrentPlanQuoteParams', () => {
  const baseSub = {
    id: 's1',
    estate_id: 'e1',
    tier_id: 't1',
    status: 'active',
    period_start: '2026-01-01T00:00:00Z',
    period_end: '2026-01-30T00:00:00Z',
    auto_renew: true,
    covered_users: 50,
    over_cap_locked: false,
    entitlements: null,
    pending_tier_slug: null,
    pending_covered_users: null,
    cancelled_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  } as EstateSubscription;
  const tier = (slug: string, isCustom = false) =>
    ({ slug, name: slug, display_order: 1, is_custom: isCustom }) as unknown as BillingTier;

  it('returns null for missing or free plans', () => {
    expect(getCurrentPlanQuoteParams(null, tier('watch'), 10)).toBeNull();
    expect(getCurrentPlanQuoteParams(baseSub, null, 10)).toBeNull();
    expect(getCurrentPlanQuoteParams(baseSub, tier('access'), 10)).toBeNull();
    expect(getCurrentPlanQuoteParams(baseSub, tier('watch'), 0)).toBeNull();
  });

  it('prices a standard tier by slug', () => {
    expect(getCurrentPlanQuoteParams(baseSub, tier('watch'), 20, 3)).toEqual({
      tier_slug: 'watch',
      covered_users: 20,
      period_months: 3,
    });
  });

  it('prices a custom plan from the entitlements snapshot with the admin fee', () => {
    const sub = {
      ...baseSub,
      entitlements: { guest_management: true, extended_historical_record: 90, note: 'x' },
    } as EstateSubscription;
    expect(getCurrentPlanQuoteParams(sub, tier('custom', true), 5)).toEqual({
      tier_slug: 'custom',
      covered_users: 5,
      period_months: 1,
      entitlements: {
        guest_management: true,
        extended_historical_record: 90,
        administrative_fee: true,
      },
    });
  });
});

describe('getPlanRenewalFootnote', () => {
  const end = new Date(2026, 4, 23, 12).toISOString();

  it('says Renews while auto-renew is on', () => {
    expect(getPlanRenewalFootnote(subscription({ period_end: end, auto_renew: true }))).toBe(
      'Renews on May 23rd, 2026.'
    );
  });

  it('says Expires when auto-renew is off or the plan is cancelled', () => {
    expect(getPlanRenewalFootnote(subscription({ period_end: end, auto_renew: false }))).toBe(
      'Expires on May 23rd, 2026.'
    );
    expect(
      getPlanRenewalFootnote(
        subscription({ period_end: end, auto_renew: true, status: 'cancelled' })
      )
    ).toBe('Expires on May 23rd, 2026.');
  });

  it('is null without a subscription or end date', () => {
    expect(getPlanRenewalFootnote(null)).toBeNull();
    expect(getPlanRenewalFootnote(subscription({ period_end: null }))).toBeNull();
  });
});
