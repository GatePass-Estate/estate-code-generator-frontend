import { describe, expect, it } from '@jest/globals';
import {
  EntitlementsDeniedError,
  FREE_PLAN_DESCRIPTION,
  isIdNotApprovedDenial,
  planBannerCopy,
} from '@/src/lib/planAvailability';
import type { BillingTier } from '@/src/types/billing';

// Verbatim `get_current_user` 403 detail (shared/gatepass_auth/gatepass_auth/dependencies.py).
const ID_NOT_APPROVED =
  'Please upload and have your ID card approved before accessing this feature.';

const premium = { name: 'Premium', description: 'Everything included' } as BillingTier;

describe('isIdNotApprovedDenial', () => {
  it('recognises the ID-approval refusal', () => {
    expect(isIdNotApprovedDenial(new EntitlementsDeniedError(ID_NOT_APPROVED))).toBe(true);
  });

  it('is false for other refusals and for ordinary failures', () => {
    expect(isIdNotApprovedDenial(new EntitlementsDeniedError('Not allowed'))).toBe(false);
    expect(isIdNotApprovedDenial(new Error(ID_NOT_APPROVED))).toBe(false);
    expect(isIdNotApprovedDenial(null)).toBe(false);
  });
});

describe('planBannerCopy', () => {
  it('shows the tier when it loaded', () => {
    expect(planBannerCopy({ tier: premium, tierSlug: 'premium', error: null })).toEqual({
      title: 'Premium Plan',
      subtitle: 'Everything included',
    });
  });

  it('falls back to the entitlements slug, then Free, when there is no tier', () => {
    expect(planBannerCopy({ tier: null, tierSlug: 'basic', error: null })).toEqual({
      title: 'Basic Plan',
      subtitle: FREE_PLAN_DESCRIPTION,
    });
    expect(planBannerCopy({ tier: null, tierSlug: null, error: null }).title).toBe('Free Plan');
  });

  it('does not call an unapproved user "Free"', () => {
    const copy = planBannerCopy({
      tier: undefined,
      tierSlug: undefined,
      error: new EntitlementsDeniedError(ID_NOT_APPROVED),
    });
    expect(copy).toEqual({
      title: 'Plan Unavailable',
      subtitle: 'Plan unavailable until your ID is approved.',
    });
  });

  it("shows the server's reason for any other refusal", () => {
    const copy = planBannerCopy({
      tier: undefined,
      tierSlug: undefined,
      error: new EntitlementsDeniedError('Not allowed'),
    });
    expect(copy).toEqual({ title: 'Plan Unavailable', subtitle: 'Not allowed' });
  });

  it('keeps a cached tier over a later refusal, and treats network failures as before', () => {
    expect(
      planBannerCopy({
        tier: premium,
        tierSlug: 'premium',
        error: new EntitlementsDeniedError(ID_NOT_APPROVED),
      }).title
    ).toBe('Premium Plan');
    expect(
      planBannerCopy({ tier: undefined, tierSlug: undefined, error: new Error('Network') }).title
    ).toBe('Free Plan');
  });
});
