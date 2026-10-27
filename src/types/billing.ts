/** Billing & subscription types — mirrors the revenue service (`/subscriptions`, `/checkout`, `/ai-features`). */

export type PeriodMonths = 1 | 3 | 6 | 12;

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';

export type ServiceFeatureLabel = { service_key: string; label: string };
export type AiFeatureLabel = { feature_key: string; label: string };

export type ServiceFeatureAvailability = {
  available: ServiceFeatureLabel[];
  unavailable: ServiceFeatureLabel[];
};

export type AiFeatureAvailability = {
  available: AiFeatureLabel[];
  unavailable: AiFeatureLabel[];
};

/** Slugs: access(0), watch(1), sentinel(2), command(3), custom(4, is_custom). No price on the tier. */
export type BillingTier = {
  id: string;
  slug: string;
  name: string;
  description: string;
  display_order: number;
  entitlements: Record<string, unknown>;
  included_ai_features: string[];
  is_custom: boolean;
  is_active: boolean;
  billing_unit_hint: string | null;
  free_features: ServiceFeatureAvailability;
  paid_non_ai_features: ServiceFeatureAvailability;
  paid_ai_features: AiFeatureAvailability;
};

export type BillingTierListResponse = {
  items: BillingTier[];
  total: number | null;
  page: number;
  limit: number;
};

export type BillingTierListParams = {
  page?: number;
  limit?: number;
  is_active?: boolean;
};

export type EstateSubscription = {
  id: string;
  estate_id: string;
  tier_id: string;
  status: SubscriptionStatus;
  period_start: string;
  period_end: string | null;
  auto_renew: boolean;
  covered_users: number;
  over_cap_locked: boolean;
  entitlements: Record<string, unknown> | null;
  pending_tier_slug: string | null;
  pending_covered_users: number | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export type EstateSubscriptionResponse = {
  estate_id: string;
  subscription: EstateSubscription | null;
  tier: BillingTier | null;
  effective_entitlements: Record<string, unknown>;
  covered_users: number | null;
  pending_covered_users: number | null;
  effective_covered_users: number | null;
};

/** Only `estate_id` is present when the estate has no subscription. */
export type BillingCycleResponse = {
  estate_id: string;
  period_end?: string | null;
  covered_users?: number | null;
  auto_renew?: boolean;
  current_tier_slug?: string | null;
  next_renewal_date?: string | null;
  tier_change_scheduled?: boolean;
  next_tier_slug?: string | null;
  next_tier?: BillingTier | null;
  seat_reduction_scheduled?: boolean;
  next_covered_users?: number | null;
  next_billing_amount?: number | null;
  next_billing_currency?: string | null;
};

/** `tier_slug` or `entitlements` is required. Custom: send `tier_slug: 'custom'` + `entitlements`. */
export type CheckoutQuoteRequest = {
  estate_id: string;
  tier_slug?: string;
  entitlements?: Record<string, boolean | number>;
  ai_feature_keys?: string[];
  covered_users: number;
  period_months: PeriodMonths;
};

export type QuoteLineItemKind = 'service' | 'administrative_fee' | 'ai' | 'vat';

export type QuoteLineItem = {
  key: string;
  kind: QuoteLineItemKind;
  unit_price: number;
};

/** Normalised quote: every money field coerced to `number` (the API may send numeric strings). */
export type CheckoutQuote = {
  estate_id: string;
  country_code: string;
  currency_code: string;
  price_per_seat: number;
  seats: number;
  ai_price_per_month: number;
  monthly_subtotal: number;
  period_months: number;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  client_total: number;
  administrative_fee: number;
  sum_of_included_features: number;
  line_items: QuoteLineItem[];
  tier_slug: string | null;
};

export type SeatReductionEligibility = {
  estate_id: string;
  can_reduce: boolean;
  current_seats: number;
  active_users: number;
  min_allowed_seats: number;
};

export type ScheduleSeatReductionResponse = {
  estate_id: string;
  pending_covered_users: number | null;
  effective_from: string | null;
};

/** POST /subscriptions/estate/{id}/cancel: the plan is now `cancelled` with auto-renew off. */
export type CancelSubscriptionResponse = {
  estate_id: string;
  subscription: EstateSubscription | null;
};

export type ScheduleTierChangeResponse = {
  estate_id: string;
  pending_tier_slug: string | null;
  effective_from: string | null;
};

export type SeatProrateRequest = {
  estate_id: string;
  seats_added: number;
};

/** Normalised seat proration: money fields coerced to `number`. */
export type SeatProrate = {
  estate_id: string;
  subscription_id: string;
  current_covered_users: number;
  seats_added: number;
  country_code: string;
  currency_code: string;
  price_per_seat: number;
  period_months: number;
  period_seat_price: number;
  period_days: number;
  remaining_days: number;
  daily_seat_rate: number;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  prorated_charge: number;
  period_start: string;
  period_end: string;
};

export type CheckoutKind =
  | 'tier'
  | 'custom'
  | 'seat_add'
  | 'ai_only'
  | 'tier_upgrade_immediate'
  /** Manual renewal of the current plan and seats; only `period_months` may be sent. */
  | 'renew';

/**
 * Fields per kind — tier: covered_users + tier_slug (+period_months); custom: covered_users +
 * entitlements, NO tier_slug (+period_months); seat_add: seats_added only, NO period_months;
 * tier_upgrade_immediate: tier_slug only, NO period_months.
 */
export type InitializeCheckoutRequest = {
  estate_id: string;
  customer_email: string;
  checkout_kind: CheckoutKind;
  tier_slug?: string;
  entitlements?: Record<string, boolean | number>;
  ai_feature_keys?: string[];
  covered_users?: number;
  seats_added?: number;
  period_months?: PeriodMonths;
};

export type InitializeCheckoutResponse = {
  checkout_session_id: string;
  paystack_reference: string;
  authorization_url: string;
  checkout_token: string;
};

export type CheckoutSessionStatus = 'pending' | 'paid' | 'failed' | 'expired';

export type CheckoutStatusResponse = {
  paystack_reference: string;
  status: CheckoutSessionStatus;
  checkout_kind: CheckoutKind;
  paid_at: string | null;
  estate_id_masked: string;
};

export type AiFeatureGrantStatus = 'active' | 'expired' | 'cancelled' | 'past_due';

export type AiFeatureGrant = {
  id: string;
  ai_feature_id: string;
  feature_key: string | null;
  source: string;
  status: AiFeatureGrantStatus;
  is_installed: boolean;
  is_free: boolean;
  auto_renew: boolean;
  starts_at: string | null;
  expires_at: string | null;
  catalog_deleted: boolean;
  created_at: string;
};

export type EstateAiGrantsResponse = {
  estate_id: string;
  features: AiFeatureGrant[];
};

/** An estate AI grant joined with its marketplace product name. */
export type EstateAiTool = {
  featureKey: string;
  name: string;
  status: AiFeatureGrantStatus;
  startsAt: string | null;
  expiresAt: string | null;
};

export type PendingRequest = {
  kind: 'tier_change' | 'seat_reduction';
  title: string;
  description: string;
  effectiveFrom: string | null;
  direction?: 'upgrade' | 'downgrade';
  /** tier_change only. */
  targetTierSlug?: string;
  targetTierName?: string;
  /** seat_reduction only: the seat count that takes effect. */
  seats?: number;
};

export type TierFeatureRow = {
  key: string;
  label: string;
  state: 'included' | 'locked';
};

export type TierSeatPrice = { pricePerSeat: number; currency: string };

/** GET /subscriptions/estate/{id}/renewal-eligibility */
export type RenewalEligibility = {
  estate_id: string;
  can_renew: boolean;
  reason: string | null;
  current_tier_slug: string | null;
  covered_users: number | null;
  period_end: string | null;
  auto_renew: boolean;
  /** Renewal opens this many days before `period_end` (backend RENEWAL_GRACE_PERIOD_DAYS). */
  grace_days: number;
};
