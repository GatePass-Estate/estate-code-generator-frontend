import type { BillingTier } from '@/src/features/billing/types/billing';

/**
 * The revenue service refused to share the estate's plan with this user (403) — e.g. their ID
 * isn't approved yet. `message` is the server's reason, worth showing as-is: unlike a network
 * failure, this says nothing about what the plan includes.
 */
export class EntitlementsDeniedError extends Error {}

/**
 * The refusal is the "approve your ID first" gate (`get_current_user` in gatepass_auth), which every
 * role except primary_admin and root hits until their ID card is approved.
 */
export function isIdNotApprovedDenial(error: unknown): boolean {
  return error instanceof EntitlementsDeniedError && /\bID\b/.test(error.message);
}

export const FREE_PLAN_DESCRIPTION =
  'Upgrade your account plan to get exclusive features including Freeze, Scheduling and more';

export type PlanBannerState = 'known' | 'denied' | 'loading' | 'failed';

/**
 * Title and subtitle of the More-menu plan banner, plus what it is showing (so the screen can
 * offer a retry on `failed`).
 *
 * "Free Plan" only when the server answered that the estate has no paid plan (`tier === null`).
 * A plan that hasn't loaded yet, failed to load, or was refused is unknown, not free: showing
 * "Free" then is how a member's account looked free after the estate had been upgraded.
 */
export function planBannerCopy({
  tier,
  tierSlug,
  error,
}: {
  /** `undefined` until the tier request has succeeded; `null` when there is no paid plan. */
  tier: BillingTier | null | undefined;
  tierSlug: string | null | undefined;
  /** The first failure of the tier or entitlements request, if any. */
  error: unknown;
}): { title: string; subtitle: string; state: PlanBannerState } {
  if (tier) {
    return {
      title: `${tier.name} Plan`,
      subtitle: tier.description || FREE_PLAN_DESCRIPTION,
      state: 'known',
    };
  }
  if (tierSlug) {
    const name = tierSlug.charAt(0).toUpperCase() + tierSlug.slice(1);
    return { title: `${name} Plan`, subtitle: FREE_PLAN_DESCRIPTION, state: 'known' };
  }
  if (error instanceof EntitlementsDeniedError) {
    return {
      title: 'Plan Unavailable',
      subtitle: isIdNotApprovedDenial(error)
        ? 'Plan unavailable until your ID is approved.'
        : error.message,
      state: 'denied',
    };
  }
  if (tier === null) {
    return { title: 'Free Plan', subtitle: FREE_PLAN_DESCRIPTION, state: 'known' };
  }
  if (error) {
    return {
      title: 'Your Plan',
      subtitle: "Couldn't load your estate's plan. Tap to try again.",
      state: 'failed',
    };
  }
  return { title: 'Your Plan', subtitle: "Checking your estate's plan…", state: 'loading' };
}
