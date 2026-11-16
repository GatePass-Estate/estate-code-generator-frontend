import type { MarketplaceTier } from '@/src/features/marketplace/types/aiMarketplace';

/**
 * Pure tier bookkeeping shared by the Anomaly Detection and Incident Report product screens
 * (and their Result summaries). No React, no I/O.
 */

/** Per-tier flags keyed by the tier name (`tier_1`, …). */
export type TierFlags = Record<string, boolean>;

/**
 * Marketplace / entitlement `status` is purchase state only; install is `is_installed`.
 *
 * Standardized values: `not_purchased | purchased | cancelled | past_due`
 * (`active→purchased`, `expired→not_purchased`). Legacy aliases still accepted.
 */
const PURCHASED_STATUSES = ['purchased', 'active', 'subscribed', 'installed'];
const CANCELLED_STATUSES = ['cancelled'];
const PAST_DUE_STATUSES = ['past_due'];
/** Fully ended grants — treat like not purchased (Activate / checkout). */
const NOT_PURCHASED_STATUSES = ['not_purchased', 'expired', 'available'];

/** Audit matrix purchase column (matches AI Marketplace Status Standardization). */
export type TierPurchaseState = 'not_purchased' | 'purchased' | 'cancelled' | 'past_due';

/** Which CTAs the tier card shows (audit matrix × install state). */
export type TierCardButtons = {
  activate: boolean;
  cancel: boolean;
  reactivate: boolean;
  install: boolean;
  uninstall: boolean;
};

/** `tier_2` / `Tier 2` → 2; 0 when the name has no number. */
export function tierNumber(tierName: string): number {
  return Number.parseInt(tierName.replace(/\D/g, ''), 10) || 0;
}

/**
 * Map marketplace tier + local cancel bookkeeping → audit Purchase State.
 * Local cancel wins while the API still reports a purchased status.
 */
export function tierPurchaseState(
  tier: MarketplaceTier | null | undefined,
  justCancelledTiers: TierFlags = {}
): TierPurchaseState {
  if (!tier) return 'not_purchased';
  const status = (tier.status ?? '').toLowerCase();
  if (justCancelledTiers[tier.tier] || CANCELLED_STATUSES.includes(status)) return 'cancelled';
  if (PAST_DUE_STATUSES.includes(status)) return 'past_due';
  if (PURCHASED_STATUSES.includes(status) || Boolean(tier.purchased)) return 'purchased';
  if (NOT_PURCHASED_STATUSES.includes(status)) return 'not_purchased';
  return 'not_purchased';
}

/**
 * Install State for tier cards. Local overrides win until marketplace detail refetches.
 * `justPurchasedTiers` means paid but not installed yet (show Install).
 */
export function resolveTierInstalled(
  tier: Pick<MarketplaceTier, 'tier' | 'is_installed'>,
  justPurchasedTiers: TierFlags = {},
  installOverrides: TierFlags = {}
): boolean {
  if (Object.prototype.hasOwnProperty.call(installOverrides, tier.tier)) {
    return !!installOverrides[tier.tier];
  }
  return !!tier.is_installed && !justPurchasedTiers[tier.tier];
}

/**
 * Audit matrix: Purchase State × Install State → buttons.
 * Free tiers never show Cancel Subscription (nothing to cancel).
 * `cancelled` and `past_due` share Re-activate + Install/Uninstall; callers route
 * cancelled → reactivate API and past_due → checkout.
 */
export function tierCardButtons(
  purchase: TierPurchaseState,
  installed: boolean,
  isFree = false
): TierCardButtons {
  if (purchase === 'not_purchased') {
    return {
      activate: true,
      cancel: false,
      reactivate: false,
      install: false,
      uninstall: false,
    };
  }
  if (purchase === 'purchased') {
    return {
      activate: false,
      cancel: !isFree,
      reactivate: false,
      install: !installed,
      uninstall: installed,
    };
  }
  // cancelled | past_due
  return {
    activate: false,
    cancel: false,
    reactivate: true,
    install: !installed,
    uninstall: installed,
  };
}

/** Purchased / held, or currently installed. */
export function isTierActive(tier: MarketplaceTier): boolean {
  return !!tier.is_installed || !!tier.purchased || PURCHASED_STATUSES.includes(tier.status ?? '');
}

/**
 * Paid for (marketplace `status` / `purchased`), unless cancelled/past_due here.
 */
export function isTierSubscribed(
  tier: MarketplaceTier | null | undefined,
  justCancelledTiers: TierFlags = {}
): boolean {
  return tierPurchaseState(tier, justCancelledTiers) === 'purchased';
}

/**
 * Tier One unlocks Result. `is_installed` is the only install signal; `status` means purchase.
 * Paid + not installed → Install modal. Until tiers load, both values are undefined.
 */
export function tierOneState(
  tierOne: MarketplaceTier | undefined,
  loaded: boolean,
  justPurchasedTiers: TierFlags,
  installOverrides: TierFlags = {}
): { tierOneInstalled: boolean | undefined; tierOneSubscribed: boolean | undefined } {
  if (!loaded) return { tierOneInstalled: undefined, tierOneSubscribed: undefined };
  return {
    tierOneInstalled:
      !!tierOne && resolveTierInstalled(tierOne, justPurchasedTiers, installOverrides),
    tierOneSubscribed: !!tierOne && isTierSubscribed(tierOne),
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
  return (
    lower.includes('disable subscription failed') ||
    lower.includes('already cancelled') ||
    lower.includes('already canceled')
  );
}

/** Install/uninstall when the grant is already in that state. */
export function isAlreadyInstalledError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('already installed') ||
    lower.includes('already active') ||
    (lower.includes('already') && lower.includes('install'))
  );
}

export function isAlreadyUninstalledError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('already uninstalled') ||
    lower.includes('not installed') ||
    (lower.includes('already') && lower.includes('uninstall'))
  );
}

/** Whether a tier with this number is installed; undefined until the tiers load. */
export function isTierNumberInstalled(
  tiers: MarketplaceTier[],
  loaded: boolean,
  num: number
): boolean | undefined {
  if (!loaded) return undefined;
  return tiers.some((tier) => !!tier.is_installed && tierNumber(tier.tier) === num);
}

/** Whether a tier with this number is paid/held (`status` / purchased); undefined until loaded. */
export function isTierNumberSubscribed(
  tiers: MarketplaceTier[],
  loaded: boolean,
  num: number,
  justCancelledTiers: TierFlags = {}
): boolean | undefined {
  if (!loaded) return undefined;
  return tiers.some(
    (tier) => tierNumber(tier.tier) === num && isTierSubscribed(tier, justCancelledTiers)
  );
}

/**
 * Result access on the standalone summary screens: plan catalog includes the paid AI keys
 * (`included_ai_features` / entitlements), or Tier Two / Three bought from the marketplace.
 */
export function hasSummaryResultAccess({
  hasPaidTierEntitlement,
  sortedTiers,
  planIncludesPaidAi = false,
}: {
  hasPaidTierEntitlement: boolean;
  sortedTiers: MarketplaceTier[];
  /** True when the current subscription tier's `included_ai_features` covers paid summary keys. */
  planIncludesPaidAi?: boolean;
}): boolean {
  return (
    planIncludesPaidAi ||
    hasPaidTierEntitlement ||
    isTierSubscribed(sortedTiers[1]) ||
    isTierSubscribed(sortedTiers[2])
  );
}
