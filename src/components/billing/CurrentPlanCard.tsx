import PlanCard from '@/src/components/billing/PlanCard';
import { useBillingQuote } from '@/src/hooks/useBillingQueries';
import { formatMoney, getCurrentPlanQuoteParams, getPlanRenewalFootnote } from '@/src/lib/billing';
import type { BillingTier, EstateSubscription } from '@/src/types/billing';

/**
 * "Your Current Plan" banner (Current Plan + Manage Seats): the estate's plan with its per-seat
 * monthly price (1-seat, 1-month quote of the current plan) and the renew/expiry date.
 */
export default function CurrentPlanCard({
  subscription,
  tier,
  className,
}: {
  subscription: EstateSubscription;
  tier: BillingTier;
  className?: string;
}) {
  const { data: quote } = useBillingQuote(getCurrentPlanQuoteParams(subscription, tier, 1, 1));

  return (
    <PlanCard
      className={className}
      slug={tier.slug}
      name={tier.name}
      eyebrow="Your Current Plan"
      priceLabel={quote ? formatMoney(quote.price_per_seat, quote.currency_code) : null}
      unitLabel="/month"
      footnote={getPlanRenewalFootnote(subscription)}
    />
  );
}
