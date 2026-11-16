import { classifyCheckoutNavigation } from '@/src/features/billing/utils/billing';

describe('classifyCheckoutNavigation (strict callback and 3-D Secure cases)', () => {
  const ref = 'GP-123';

  it('treats the configured callback as the end of checkout', () => {
    expect(classifyCheckoutNavigation('https://app.gatepassng.com/payment/callback', ref)).toBe(
      'return'
    );
    expect(classifyCheckoutNavigation('https://staging.example.com/payment/callback/', null)).toBe(
      'return'
    );
  });

  it('matches the callback with Paystack query strings', () => {
    expect(
      classifyCheckoutNavigation(
        'https://app.gatepassng.com/payment/callback?trxref=GP-123&reference=GP-123',
        ref
      )
    ).toBe('return');
    expect(classifyCheckoutNavigation('https://example.com/done?trxref=GP-123#x', ref)).toBe(
      'return'
    );
    expect(classifyCheckoutNavigation('https://example.com/done?trxref=OTHER', ref)).toBeNull();
  });

  it('keeps a 3-D Secure page on another host open even if it mentions callback/cancel/close', () => {
    expect(
      classifyCheckoutNavigation('https://acs.mybank.com/3ds/callback?step=challenge', ref)
    ).toBeNull();
    expect(classifyCheckoutNavigation('https://acs.mybank.com/challenge/cancel', ref)).toBeNull();
    expect(classifyCheckoutNavigation('https://secure.bank.com/close-window', ref)).toBeNull();
    expect(classifyCheckoutNavigation('https://app.gatepassng.com/callback', ref)).toBeNull();
  });

  it('keeps Paystack payment pages open', () => {
    expect(classifyCheckoutNavigation('https://checkout.paystack.com/abc123', ref)).toBeNull();
    expect(classifyCheckoutNavigation('https://standard.paystack.co/charge/3ds', ref)).toBeNull();
    expect(classifyCheckoutNavigation('about:blank', ref)).toBeNull();
  });

  it("detects a cancel on Paystack's own page", () => {
    expect(classifyCheckoutNavigation('https://checkout.paystack.com/cancel?x=1', ref)).toBe(
      'cancel'
    );
    expect(classifyCheckoutNavigation('https://checkout.paystack.com/abc123/cancel', ref)).toBe(
      'cancel'
    );
    expect(classifyCheckoutNavigation('https://standard.paystack.co/close', ref)).toBe('cancel');
  });
});
