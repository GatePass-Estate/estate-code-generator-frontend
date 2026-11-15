import type { MarketplaceTier } from '@/src/features/marketplace/types/aiMarketplace';
import {
  hasFeatureEntitlement,
  hasSummaryResultAccess,
  isAlreadyCancelledError,
  isTierActive,
  isTierNumberInstalled,
  isTierSubscribed,
  resultDeniedMessage,
  tierNumber,
  tierOneState,
} from '@/src/features/ai/utils/aiTierState';

const tier = (overrides: Partial<MarketplaceTier> = {}): MarketplaceTier => ({
  tier: 'tier_1',
  ai_feature_id: 'feature',
  status: 'available',
  ...overrides,
});

const messages = {
  notLinked: 'not linked',
  installTierOne: 'install',
  subscribeTierOne: 'subscribe',
};

describe('tierNumber', () => {
  it('reads the digits of a tier name, 0 when there are none', () => {
    expect(tierNumber('tier_2')).toBe(2);
    expect(tierNumber('Tier 3')).toBe(3);
    expect(tierNumber('basic')).toBe(0);
  });
});

describe('isTierActive / isTierSubscribed', () => {
  it('treats installed, purchased and paid statuses as active', () => {
    expect(isTierActive(tier({ is_installed: true }))).toBe(true);
    expect(isTierActive(tier({ purchased: true }))).toBe(true);
    expect(isTierActive(tier({ status: 'subscribed' }))).toBe(true);
    expect(isTierActive(tier())).toBe(false);
  });

  it('ignores the installed flag and honours a cancellation made here', () => {
    expect(isTierSubscribed(tier({ is_installed: true }))).toBe(false);
    expect(isTierSubscribed(tier({ status: 'active' }))).toBe(true);
    expect(isTierSubscribed(tier({ status: 'active' }), { tier_1: true })).toBe(false);
    expect(isTierSubscribed(undefined)).toBe(false);
  });
});

describe('tierOneState', () => {
  it('is undefined until the product loads', () => {
    expect(tierOneState(tier(), false, {})).toEqual({
      tierOneInstalled: undefined,
      tierOneSubscribed: undefined,
    });
  });

  it('counts a just-purchased tier as not installed yet', () => {
    const installed = tier({ is_installed: true, status: 'installed' });
    expect(tierOneState(installed, true, {})).toEqual({
      tierOneInstalled: true,
      tierOneSubscribed: true,
    });
    expect(tierOneState(installed, true, { tier_1: true }).tierOneInstalled).toBe(false);
  });

  it('reports a missing Tier One as neither installed nor subscribed', () => {
    expect(tierOneState(undefined, true, {})).toEqual({
      tierOneInstalled: false,
      tierOneSubscribed: false,
    });
  });
});

describe('hasFeatureEntitlement', () => {
  it('allows rating with Tier One installed or any held tier', () => {
    expect(hasFeatureEntitlement(true, [], {})).toBe(true);
    expect(hasFeatureEntitlement(false, [tier({ tier: 'tier_2', status: 'active' })], {})).toBe(
      true
    );
  });

  it('drops tiers cancelled on this device', () => {
    const held = tier({ tier: 'tier_2', is_installed: true });
    expect(hasFeatureEntitlement(undefined, [held], { tier_2: true })).toBe(false);
  });
});

describe('resultDeniedMessage', () => {
  it('explains why Result is blocked', () => {
    expect(resultDeniedMessage(true, true, messages)).toBe('not linked');
    expect(resultDeniedMessage(false, true, messages)).toBe('install');
    expect(resultDeniedMessage(false, false, messages)).toBe('subscribe');
    expect(resultDeniedMessage(undefined, undefined, messages)).toBe('subscribe');
  });
});

describe('isAlreadyCancelledError', () => {
  it('recognises Paystack refusing to cancel twice', () => {
    expect(isAlreadyCancelledError('Disable subscription failed')).toBe(true);
    expect(isAlreadyCancelledError('Subscription ALREADY cancelled')).toBe(true);
    expect(isAlreadyCancelledError('Network error')).toBe(false);
  });
});

describe('isTierNumberInstalled', () => {
  const tiers = [tier({ tier: 'tier_2', status: 'installed' }), tier({ tier: 'tier_3' })];

  it('is undefined until the product loads', () => {
    expect(isTierNumberInstalled(tiers, false, 2)).toBeUndefined();
  });

  it('matches the tier by number', () => {
    expect(isTierNumberInstalled(tiers, true, 2)).toBe(true);
    expect(isTierNumberInstalled(tiers, true, 3)).toBe(false);
  });
});

describe('hasSummaryResultAccess', () => {
  const base = { planSlug: 'basic', hasPaidTierEntitlement: false, sortedTiers: [] };

  it('opens for plans that include results or a paid-tier entitlement', () => {
    expect(hasSummaryResultAccess({ ...base, planSlug: 'sentinel' })).toBe(true);
    expect(hasSummaryResultAccess({ ...base, planSlug: 'command' })).toBe(true);
    expect(hasSummaryResultAccess({ ...base, hasPaidTierEntitlement: true })).toBe(true);
    expect(hasSummaryResultAccess(base)).toBe(false);
  });

  it('opens when the second or third tier is bought, not the first', () => {
    const one = tier({ status: 'active' });
    const two = tier({ tier: 'tier_2' });
    expect(hasSummaryResultAccess({ ...base, sortedTiers: [one, two] })).toBe(false);
    expect(
      hasSummaryResultAccess({
        ...base,
        sortedTiers: [one, tier({ tier: 'tier_2', purchased: true })],
      })
    ).toBe(true);
    expect(
      hasSummaryResultAccess({
        ...base,
        sortedTiers: [one, two, tier({ tier: 'tier_3', status: 'purchased' })],
      })
    ).toBe(true);
  });
});
