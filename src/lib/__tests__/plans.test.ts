import { describe, expect, it } from '@jest/globals';
import {
  getFreePlanNoticeCopy,
  getUpgradeCopy,
  hasEntitlement,
  parseEntitlements,
  resolveFeatureAccess,
} from '@/src/lib/plans';

const ESTATE_ID = 'e7fb4d3b-6418-4729-9454-d34c7f069968';

const entitlementsWith = (
  entitlements: Record<string, unknown>,
  extra: { locked?: boolean; tier_slug?: string } = {}
) => parseEntitlements({ estate_id: ESTATE_ID, entitlements, ...extra });

describe('parseEntitlements', () => {
  it('reads the plan fields', () => {
    const result = parseEntitlements({
      estate_id: ESTATE_ID,
      tier_slug: 'premium',
      subscription_status: 'active',
      locked: false,
      reason: null,
    });
    expect(result).toMatchObject({
      tierSlug: 'premium',
      subscriptionStatus: 'active',
      locked: false,
      reason: null,
    });
  });

  it('accepts boolean and { allowed } entries', () => {
    const { services } = entitlementsWith({
      guest_management: true,
      advanced_code_management: { allowed: true, limit: null },
      admin_broadcast: { allowed: false },
    });
    expect(services.get('guest_management')).toBe(true);
    expect(services.get('advanced_code_management')).toBe(true);
    expect(services.get('admin_broadcast')).toBe(false);
  });

  it('treats malformed entries as denied and ignores unknown keys', () => {
    const { services } = entitlementsWith({
      guest_management: 'yes',
      incident_report: { enabled: true },
      not_a_catalog_key: true,
    });
    expect(services.get('guest_management')).toBe(false);
    expect(services.get('incident_report')).toBe(false);
    expect(services.size).toBe(2);
  });

  it('defaults missing fields', () => {
    expect(parseEntitlements({ estate_id: ESTATE_ID })).toMatchObject({
      tierSlug: null,
      subscriptionStatus: null,
      locked: false,
      reason: null,
    });
  });
});

describe('hasEntitlement', () => {
  it('always allows free catalog features', () => {
    expect(hasEntitlement(undefined, 'visitor_access_code')).toBe(true);
    expect(hasEntitlement(entitlementsWith({}, { locked: true }), 'visitor_access_code')).toBe(
      true
    );
  });

  it('denies paid features until entitlements load', () => {
    expect(hasEntitlement(undefined, 'guest_management')).toBe(false);
  });

  it('follows the revenue service for paid features', () => {
    const entitlements = entitlementsWith({ guest_management: true });
    expect(hasEntitlement(entitlements, 'guest_management')).toBe(true);
    expect(hasEntitlement(entitlements, 'admin_broadcast')).toBe(false);
  });

  it('denies paid features when the subscription is locked', () => {
    const entitlements = entitlementsWith({ guest_management: true }, { locked: true });
    expect(hasEntitlement(entitlements, 'guest_management')).toBe(false);
  });
});

describe('resolveFeatureAccess', () => {
  const free = entitlementsWith({ guest_management: false });
  const paid = entitlementsWith({ guest_management: true });

  it('grants entitled features', () => {
    expect(resolveFeatureAccess(paid, 'resident', 'guest_management')).toBe('granted');
  });

  it.each(['admin', 'primary_admin'] as const)('asks %s to upgrade', (role) => {
    expect(resolveFeatureAccess(free, role, 'guest_management')).toBe('upgrade');
  });

  it.each(['resident', 'security'] as const)('tells %s to contact admin', (role) => {
    expect(resolveFeatureAccess(free, role, 'guest_management')).toBe('contact_admin');
  });
});

describe('getUpgradeCopy', () => {
  it('uses the catalog copy when set', () => {
    expect(getUpgradeCopy('guest_management')).toMatch(/Save Guest Profile/);
  });

  it('falls back to the service label', () => {
    expect(getUpgradeCopy('admin_broadcast')).toBe(
      'Upgrade your plan to unlock Broadcasts and Announcements.'
    );
  });
});

describe('getFreePlanNoticeCopy', () => {
  it('uses the catalog notice copy when set', () => {
    expect(getFreePlanNoticeCopy('guest_management')).toMatch(/Guest Management is not available/);
  });

  it('falls back to the service label', () => {
    expect(getFreePlanNoticeCopy('admin_broadcast')).toBe(
      'Broadcasts and Announcements is not available on the Free Plan. Contact Admin to upgrade.'
    );
  });
});
