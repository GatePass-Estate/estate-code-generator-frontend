import type { MarketplaceTier } from '@/src/features/marketplace/types/aiMarketplace';
import {
  hasFeatureEntitlement,
  hasSummaryResultAccess,
  isAlreadyCancelledError,
  isAlreadyInstalledError,
  isAlreadyUninstalledError,
  resolveTierInstalled,
  isTierActive,
  isTierNumberInstalled,
  isTierNumberSubscribed,
  isTierSubscribed,
  resultDeniedMessage,
  tierCardButtons,
  tierNumber,
  tierOneState,
  tierPurchaseState,
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

  it('treats status cancelled as not subscribed even if still purchased/installed', () => {
    expect(
      isTierSubscribed(tier({ status: 'cancelled', purchased: true, is_installed: true }))
    ).toBe(false);
  });
});

describe('tierPurchaseState / tierCardButtons (audit matrix)', () => {
  it('maps API status + local cancel to purchase state', () => {
    expect(tierPurchaseState(tier())).toBe('not_purchased');
    expect(tierPurchaseState(tier({ status: 'active' }))).toBe('purchased');
    expect(tierPurchaseState(tier({ status: 'installed' }))).toBe('purchased');
    expect(tierPurchaseState(tier({ purchased: true }))).toBe('purchased');
    expect(tierPurchaseState(tier({ status: 'cancelled' }))).toBe('cancelled');
    expect(tierPurchaseState(tier({ status: 'active' }), { tier_1: true })).toBe('cancelled');
    expect(tierPurchaseState(tier({ status: 'expired' }))).toBe('expired');
    expect(tierPurchaseState(tier({ status: 'past_due' }))).toBe('expired');
  });

  it('follows the Purchase × Install button matrix', () => {
    expect(tierCardButtons('not_purchased', false)).toEqual({
      activate: true,
      cancel: false,
      reactivate: false,
      install: false,
      uninstall: false,
    });
    expect(tierCardButtons('purchased', true)).toEqual({
      activate: false,
      cancel: true,
      reactivate: false,
      install: false,
      uninstall: true,
    });
    expect(tierCardButtons('purchased', false)).toEqual({
      activate: false,
      cancel: true,
      reactivate: false,
      install: true,
      uninstall: false,
    });
    expect(tierCardButtons('cancelled', true)).toEqual({
      activate: false,
      cancel: false,
      reactivate: true,
      install: false,
      uninstall: true,
    });
    expect(tierCardButtons('cancelled', false)).toEqual({
      activate: false,
      cancel: false,
      reactivate: true,
      install: true,
      uninstall: false,
    });
    expect(tierCardButtons('expired', true)).toEqual({
      activate: false,
      cancel: false,
      reactivate: true,
      install: false,
      uninstall: true,
    });
    expect(tierCardButtons('expired', false)).toEqual({
      activate: false,
      cancel: false,
      reactivate: true,
      install: true,
      uninstall: false,
    });
  });

  it('hides Cancel on free tiers even when purchased', () => {
    expect(tierCardButtons('purchased', true, true).cancel).toBe(false);
  });
});

describe('tierOneState', () => {
  it('is undefined until the product loads', () => {
    expect(tierOneState(tier(), false, {})).toEqual({
      tierOneInstalled: undefined,
      tierOneSubscribed: undefined,
    });
  });

  it('uses is_installed for install and status for paid', () => {
    const installed = tier({ is_installed: true, status: 'installed' });
    expect(tierOneState(installed, true, {})).toEqual({
      tierOneInstalled: true,
      tierOneSubscribed: true,
    });
    expect(tierOneState(installed, true, { tier_1: true }).tierOneInstalled).toBe(false);

    // Paid (status installed) but uninstalled → Install modal, not Upgrade.
    const paidUninstalled = tier({ is_installed: false, status: 'installed' });
    expect(tierOneState(paidUninstalled, true, {})).toEqual({
      tierOneInstalled: false,
      tierOneSubscribed: true,
    });
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
    expect(isAlreadyCancelledError('Feature already installed')).toBe(false);
  });
});

describe('isAlreadyInstalledError / isAlreadyUninstalledError', () => {
  it('recognises grant already in that state', () => {
    expect(isAlreadyInstalledError('Feature already installed')).toBe(true);
    expect(isAlreadyUninstalledError('Feature already uninstalled')).toBe(true);
    expect(isAlreadyUninstalledError('Feature is not installed')).toBe(true);
    expect(isAlreadyInstalledError('Network error')).toBe(false);
  });
});

describe('resolveTierInstalled', () => {
  it('prefers local install overrides over API / just-purchased flags', () => {
    const paid = tier({ is_installed: false, status: 'installed' });
    expect(resolveTierInstalled(paid, { tier_1: true })).toBe(false);
    expect(resolveTierInstalled(paid, {}, { tier_1: true })).toBe(true);
    expect(resolveTierInstalled(tier({ is_installed: true }), {}, { tier_1: false })).toBe(false);
  });
});

describe('isTierNumberInstalled', () => {
  const tiers = [
    tier({ tier: 'tier_2', status: 'installed', is_installed: true }),
    tier({ tier: 'tier_3', status: 'installed', is_installed: false }),
  ];

  it('is undefined until the product loads', () => {
    expect(isTierNumberInstalled(tiers, false, 2)).toBeUndefined();
  });

  it('matches only by is_installed, not status alone', () => {
    expect(isTierNumberInstalled(tiers, true, 2)).toBe(true);
    expect(isTierNumberInstalled(tiers, true, 3)).toBe(false);
  });
});

describe('isTierNumberSubscribed', () => {
  const tiers = [
    tier({ tier: 'tier_2', status: 'installed', is_installed: false }),
    tier({ tier: 'tier_3' }),
  ];

  it('treats status installed as paid even when uninstalled', () => {
    expect(isTierNumberSubscribed(tiers, true, 2)).toBe(true);
    expect(isTierNumberSubscribed(tiers, true, 3)).toBe(false);
  });
});

describe('hasSummaryResultAccess', () => {
  const base = { hasPaidTierEntitlement: false, sortedTiers: [] };

  it('opens when the plan catalog includes paid AI or a paid-tier entitlement', () => {
    expect(hasSummaryResultAccess({ ...base, planIncludesPaidAi: true })).toBe(true);
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
