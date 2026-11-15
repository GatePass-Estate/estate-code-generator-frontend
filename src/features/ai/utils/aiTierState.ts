import type { MarketplaceTier } from '@/src/features/marketplace/types/aiMarketplace';

/**
 * Pure tier bookkeeping shared by the Anomaly Detection and Incident Report product screens
 * (and their Result summaries). No React, no I/O.
 */

/** Per-tier flags keyed by the tier name (`tier_1`, …). */
export type TierFlags = Record<string, boolean>;

const SUBSCRIBED_STATUSES = ['active', 'purchased', 'subscribed', 'installed'];

/** `tier_2` / `Tier 2` → 2; 0 when the name has no number. */
export function tierNumber(tierName: string): number {
  return Number.parseInt(tierName.replace(/\D/g, ''), 10) || 0;
}

/** Installed, purchased, or in a paid/active status. */
export function isTierActive(tier: MarketplaceTier): boolean {
  return !!tier.is_installed || !!tier.purchased || SUBSCRIBED_STATUSES.includes(tier.status ?? '');
}

/** Paid for (by status or the purchased flag), unless the user just cancelled it here. */
export function isTierSubscribed(
  tier: MarketplaceTier | null | undefined,
  justCancelledTiers: TierFlags = {}
): boolean {
  if (!tier) return false;
  if (justCancelledTiers[tier.tier]) return false;
  return SUBSCRIBED_STATUSES.includes(tier.status ?? '') || Boolean(tier.purchased);
}

/**
 * Tier One is the base product; Tiers Two and Three are add-ons that need it installed. Paying
 * makes a tier "installed" on the server before the user has chosen to install it, so a tier
 * just purchased still counts as not installed (as the Install / Uninstall button does). Until
 * the tiers load (`loaded` false) there is nothing to judge, so both values are undefined.
 */
export function tierOneState(
  tierOne: MarketplaceTier | undefined,
  loaded: boolean,
  justPurchasedTiers: TierFlags
): { tierOneInstalled: boolean | undefined; tierOneSubscribed: boolean | undefined } {
  if (!loaded) return { tierOneInstalled: undefined, tierOneSubscribed: undefined };
  return {
    tierOneInstalled:
      !!tierOne &&
      (!!tierOne.is_installed || tierOne.status === 'installed') &&
      !justPurchasedTiers[tierOne.tier],
    tierOneSubscribed: !!tierOne && isTierActive(tierOne),
  };
}

/** Whether the user may rate the product: Tier One installed or any tier still held. */
export function hasFeatureEntitlement(
  tierOneInstalled: boolean | undefined,
  tiers: MarketplaceTier[],
  justCancelledTiers: TierFlags
): boolean {
  return (
    Boolean(tierOneInstalled) ||
    tiers.some(
      (tier) =>
        (Boolean(tier.is_installed) || isTierSubscribed(tier, justCancelledTiers)) &&
        !justCancelledTiers[tier.tier]
    )
  );
}

/** Which message explains a blocked Result tab. */
export function resultDeniedMessage(
  tierOneInstalled: boolean | undefined,
  tierOneSubscribed: boolean | undefined,
  messages: { notLinked: string; installTierOne: string; subscribeTierOne: string }
): string {
  // With a tier active, upgrading isn't the fix: the server hasn't linked the subscription.
  if (tierOneInstalled) return messages.notLinked;
  return tierOneSubscribed ? messages.installTierOne : messages.subscribeTierOne;
}

/** Paystack refuses to disable a subscription that is already cancelled. */
export function isAlreadyCancelledError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('disable subscription failed') || lower.includes('already');
}

/** Whether a tier with this number is installed; undefined until the tiers load. */
export function isTierNumberInstalled(
  tiers: MarketplaceTier[],
  loaded: boolean,
  num: number
): boolean | undefined {
  if (!loaded) return undefined;
  return tiers.some(
    (tier) => (tier.is_installed || tier.status === 'installed') && tierNumber(tier.tier) === num
  );
}

/**
 * Result access on the standalone summary screens: a plan that includes results, a paid-tier
 * entitlement, or Tier Two / Three (2nd and 3rd in sorted order) bought from the marketplace.
 */
export function hasSummaryResultAccess({
  planSlug,
  hasPaidTierEntitlement,
  sortedTiers,
}: {
  planSlug: string | null | undefined;
  hasPaidTierEntitlement: boolean;
  sortedTiers: MarketplaceTier[];
}): boolean {
  const isPlanIncludingResults = planSlug === 'sentinel' || planSlug === 'command';
  return (
    isPlanIncludingResults ||
    hasPaidTierEntitlement ||
    isTierSubscribed(sortedTiers[1]) ||
    isTierSubscribed(sortedTiers[2])
  );
}
