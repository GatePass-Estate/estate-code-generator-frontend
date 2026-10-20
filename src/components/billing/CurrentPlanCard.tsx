import PlanCard from '@/src/components/billing/PlanCard';
import { useBillingQuote } from '@/src/hooks/useBillingQueries';
import {
  FREE_PLAN_FOOTNOTE,
  formatMoney,
  getCurrentPlanQuoteParams,
  getCurrentPlanState,
  getPlanExpiredFootnote,
  getPlanRenewalFootnote,
} from '@/src/lib/billing';
import type { BillingTier, EstateSubscription } from '@/src/types/billing';

const EYEBROW = 'Your Current Plan';

/**
 * "Your Current Plan" banner (Current Plan + Manage Seats).
 * - Running paid plan: per-seat monthly price (1-seat, 1-month quote of the current plan) and the
 *   renew/expiry date.
 * - Free Access plan (or no plan at all): the Access card, 'Free', and an upgrade hint.
 * - Paid plan that has stopped: the tier's card with its expiry date and no price.
 */
export default function CurrentPlanCard({
  subscription,
  tier,
  className,
}: {
  subscription: EstateSubscription | null;
  tier: BillingTier | null;
  className?: string;
}) {
  const state = getCurrentPlanState(subscription, tier);
  // Only a running paid plan has a price to quote.
  const { data: quote } = useBillingQuote(
    state === 'paid' ? getCurrentPlanQuoteParams(subscription, tier, 1, 1) : null
  );

  if (state === 'free') {
    return (
      <PlanCard
        className={className}
        slug="access"
        name={tier?.slug === 'access' ? tier.name : 'Access'}
        eyebrow={EYEBROW}
        priceLabel="Free"
        footnote={FREE_PLAN_FOOTNOTE}
      />
    );
  }

  // 'paid' and 'expired' always have a tier; the fallbacks only satisfy the types.
  const slug = tier?.slug ?? 'access';
  const name = tier?.name ?? 'Access';

  if (state === 'expired') {
    return (
      <PlanCard
        className={className}
        slug={slug}
        name={name}
        eyebrow={EYEBROW}
        footnote={getPlanExpiredFootnote(subscription)}
      />
    );
  }

  return (
    <PlanCard
      className={className}
      slug={slug}
      name={name}
      eyebrow={EYEBROW}
      priceLabel={quote ? formatMoney(quote.price_per_seat, quote.currency_code) : null}
      unitLabel="/month"
      footnote={getPlanRenewalFootnote(subscription)}
    />
  );
}
