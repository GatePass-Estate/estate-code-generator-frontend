import { isAxiosError } from 'axios';
import Api from '.';
import { getErrorMessage } from '../helpers';
import {
  BillingCycleResponse,
  BillingTierListParams,
  BillingTierListResponse,
  CheckoutQuote,
  CheckoutQuoteRequest,
  CheckoutStatusResponse,
  EstateAiGrantsResponse,
  EstateSubscriptionResponse,
  InitializeCheckoutRequest,
  InitializeCheckoutResponse,
  QuoteLineItem,
  ScheduleSeatReductionResponse,
  ScheduleTierChangeResponse,
  SeatProrate,
  SeatProrateRequest,
  SeatReductionEligibility,
} from '@/src/types/billing';

/** A failed billing request; `status` is the HTTP status when the server answered (e.g. 409). */
export class BillingApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'BillingApiError';
    this.status = status;
  }
}

function toBillingError(error: unknown, fallback: string): BillingApiError {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return new BillingApiError(getErrorMessage(error) || fallback, status);
}

const estatePath = (estateId: string) => `/subscriptions/estate/${encodeURIComponent(estateId)}`;

/** Money fields may arrive as numbers or numeric strings. */
const num = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

function normaliseQuote(raw: Record<string, any>): CheckoutQuote {
  return {
    estate_id: String(raw.estate_id ?? ''),
    country_code: String(raw.country_code ?? ''),
    currency_code: String(raw.currency_code ?? ''),
    price_per_seat: num(raw.price_per_seat),
    seats: num(raw.seats),
    ai_price_per_month: num(raw.ai_price_per_month),
    monthly_subtotal: num(raw.monthly_subtotal),
    period_months: num(raw.period_months),
    subtotal: num(raw.subtotal),
    vat_rate: num(raw.vat_rate),
    vat_amount: num(raw.vat_amount),
    client_total: num(raw.client_total),
    administrative_fee: num(raw.administrative_fee),
    sum_of_included_features: num(raw.sum_of_included_features),
    line_items: Array.isArray(raw.line_items)
      ? raw.line_items.map(
          (item: Record<string, any>): QuoteLineItem => ({
            key: String(item.key ?? ''),
            kind: item.kind,
            unit_price: num(item.unit_price),
          })
        )
      : [],
    tier_slug: raw.tier_slug ?? null,
  };
}

function normaliseProrate(raw: Record<string, any>): SeatProrate {
  return {
    estate_id: String(raw.estate_id ?? ''),
    subscription_id: String(raw.subscription_id ?? ''),
    current_covered_users: num(raw.current_covered_users),
    seats_added: num(raw.seats_added),
    country_code: String(raw.country_code ?? ''),
    currency_code: String(raw.currency_code ?? ''),
    price_per_seat: num(raw.price_per_seat),
    period_months: num(raw.period_months),
    period_seat_price: num(raw.period_seat_price),
    period_days: num(raw.period_days),
    remaining_days: num(raw.remaining_days),
    daily_seat_rate: num(raw.daily_seat_rate),
    subtotal: num(raw.subtotal),
    vat_rate: num(raw.vat_rate),
    vat_amount: num(raw.vat_amount),
    prorated_charge: num(raw.prorated_charge),
    period_start: String(raw.period_start ?? ''),
    period_end: String(raw.period_end ?? ''),
  };
}

/** GET /subscriptions/tiers — tier catalog (no prices). */
export async function getSubscriptionTiers(
  params: BillingTierListParams = {}
): Promise<BillingTierListResponse> {
  try {
    const { data } = await Api('revenue').get<BillingTierListResponse>('/subscriptions/tiers', {
      params: { page: 1, limit: 20, is_active: true, ...params },
    });
    return data;
  } catch (error) {
    throw toBillingError(error, 'Could not load plans');
  }
}

/** GET /subscriptions/estate/{estateId} — current subscription + tier (both null when none). */
export async function getEstateSubscription(estateId: string): Promise<EstateSubscriptionResponse> {
  try {
    const { data } = await Api('revenue').get<EstateSubscriptionResponse>(estatePath(estateId));
    return data;
  } catch (error) {
    throw toBillingError(error, 'Could not load your subscription');
  }
}

/** GET /subscriptions/estate/{estateId}/billing-cycle — next renewal projection. */
export async function getBillingCycle(estateId: string): Promise<BillingCycleResponse> {
  try {
    const { data } = await Api('revenue').get<BillingCycleResponse>(
      `${estatePath(estateId)}/billing-cycle`
    );
    return data;
  } catch (error) {
    throw toBillingError(error, 'Could not load your billing cycle');
  }
}

/** POST /checkout/quote — numbers coerced with Number(). */
export async function getCheckoutQuote(body: CheckoutQuoteRequest): Promise<CheckoutQuote> {
  try {
    const { data } = await Api('revenue').post('/checkout/quote', body);
    return normaliseQuote(data);
  } catch (error) {
    throw toBillingError(error, 'Could not get a price for this plan');
  }
}

/**
 * GET /subscriptions/estate/{estateId}/seat-reduction-eligibility.
 * Resolves `null` on 404 (the subscription is not active/trialing) instead of throwing.
 */
export async function getSeatReductionEligibility(
  estateId: string
): Promise<SeatReductionEligibility | null> {
  try {
    const { data } = await Api('revenue').get<SeatReductionEligibility>(
      `${estatePath(estateId)}/seat-reduction-eligibility`
    );
    return data;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null;
    throw toBillingError(error, 'Could not check seat reduction');
  }
}

/** POST /subscriptions/estate/{estateId}/schedule-seat-reduction (primary_admin/root). */
export async function scheduleSeatReduction(
  estateId: string,
  seats: number
): Promise<ScheduleSeatReductionResponse> {
  try {
    const { data } = await Api('revenue').post<ScheduleSeatReductionResponse>(
      `${estatePath(estateId)}/schedule-seat-reduction`,
      { seats }
    );
    return data;
  } catch (error) {
    throw toBillingError(error, 'Could not schedule the seat reduction');
  }
}

/** DELETE /subscriptions/estate/{estateId}/schedule-seat-reduction (primary_admin/root). */
export async function cancelSeatReduction(
  estateId: string
): Promise<ScheduleSeatReductionResponse> {
  try {
    const { data } = await Api('revenue').delete<ScheduleSeatReductionResponse>(
      `${estatePath(estateId)}/schedule-seat-reduction`
    );
    return data;
  } catch (error) {
    throw toBillingError(error, 'Could not cancel the seat reduction');
  }
}

/** POST /checkout/seats/prorate — prorated charge for adding seats mid-period. */
export async function getSeatProrate(body: SeatProrateRequest): Promise<SeatProrate> {
  try {
    const { data } = await Api('revenue').post('/checkout/seats/prorate', body);
    return normaliseProrate(data);
  } catch (error) {
    throw toBillingError(error, 'Could not price the extra seats');
  }
}

/** POST /subscriptions/estate/{estateId}/schedule-tier-change — no custom; needs auto_renew. */
export async function scheduleTierChange(
  estateId: string,
  tierSlug: string
): Promise<ScheduleTierChangeResponse> {
  try {
    const { data } = await Api('revenue').post<ScheduleTierChangeResponse>(
      `${estatePath(estateId)}/schedule-tier-change`,
      { tier_slug: tierSlug }
    );
    return data;
  } catch (error) {
    throw toBillingError(error, 'Could not schedule the plan change');
  }
}

/** DELETE /subscriptions/estate/{estateId}/schedule-tier-change. */
export async function cancelTierChange(estateId: string): Promise<ScheduleTierChangeResponse> {
  try {
    const { data } = await Api('revenue').delete<ScheduleTierChangeResponse>(
      `${estatePath(estateId)}/schedule-tier-change`
    );
    return data;
  } catch (error) {
    throw toBillingError(error, 'Could not cancel the plan change');
  }
}

/** POST /checkout/initialize — starts a Paystack checkout. `idempotencyKey` is required by the API. */
export async function initializeCheckout(
  body: InitializeCheckoutRequest,
  idempotencyKey: string
): Promise<InitializeCheckoutResponse> {
  try {
    const { data } = await Api('revenue').post<InitializeCheckoutResponse>(
      '/checkout/initialize',
      body,
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
    return data;
  } catch (error) {
    throw toBillingError(error, 'Could not start checkout');
  }
}

/** GET /checkout/status/{reference} with the `checkout_token` from initialize. */
export async function getCheckoutStatus(
  reference: string,
  checkoutToken: string
): Promise<CheckoutStatusResponse> {
  try {
    const { data } = await Api('revenue').get<CheckoutStatusResponse>(
      `/checkout/status/${encodeURIComponent(reference)}`,
      { headers: { 'X-Checkout-Token': checkoutToken } }
    );
    return data;
  } catch (error) {
    throw toBillingError(error, 'Could not check the payment status');
  }
}

/** GET /ai-features/estate/{estateId} — the estate's AI grants (keys only, no names). */
export async function getEstateAiGrants(estateId: string): Promise<EstateAiGrantsResponse> {
  try {
    const { data } = await Api('revenue').get<EstateAiGrantsResponse>(
      `/ai-features/estate/${encodeURIComponent(estateId)}`
    );
    return data;
  } catch (error) {
    throw toBillingError(error, 'Could not load your AI tools');
  }
}
