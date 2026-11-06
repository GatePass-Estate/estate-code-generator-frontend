import type { BillingTier } from '@/src/types/billing';

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

/**
 * Title and subtitle of the More-menu plan banner. A refused plan request is not the free plan:
 * the server just won't say yet, so the banner says that instead of "Free Plan".
 */
export function planBannerCopy({
  tier,
  tierSlug,
  error,
}: {
  tier: BillingTier | null | undefined;
  tierSlug: string | null | undefined;
  /** The first failure of the tier or entitlements request, if any. */
  error: unknown;
}): { title: string; subtitle: string } {
  if (!tier && error instanceof EntitlementsDeniedError) {
    return {
      title: 'Plan Unavailable',
      subtitle: isIdNotApprovedDenial(error)
        ? 'Plan unavailable until your ID is approved.'
        : error.message,
    };
  }
  const name =
    tier?.name || (tierSlug ? tierSlug.charAt(0).toUpperCase() + tierSlug.slice(1) : 'Free');
  return { title: `${name} Plan`, subtitle: tier?.description || FREE_PLAN_DESCRIPTION };
}
