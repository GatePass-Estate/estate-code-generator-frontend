import { describe, expect, it } from '@jest/globals';
import { formatKoboAmount, getCurrencySymbol } from '../currency';

describe('currency utilities', () => {
  describe('getCurrencySymbol', () => {
    it('returns Naira symbol for NGN or default', () => {
      expect(getCurrencySymbol('NGN')).toBe('₦');
      expect(getCurrencySymbol('ngn')).toBe('₦');
      expect(getCurrencySymbol()).toBe('₦');
      expect(getCurrencySymbol(null)).toBe('₦');
    });

    it('returns Dollar symbol for USD', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('usd')).toBe('$');
    });

    it('returns Euro symbol for EUR and Pound for GBP', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
    });

    it('returns uppercase currency code with space for other currencies', () => {
      expect(getCurrencySymbol('CAD')).toBe('CAD ');
    });
  });

  describe('formatKoboAmount', () => {
    it('formats kobo to whole naira with comma separators', () => {
      expect(formatKoboAmount(500000)).toBe('₦5,000');
      expect(formatKoboAmount(10000000)).toBe('₦100,000');
      expect(formatKoboAmount(100)).toBe('₦1');
      expect(formatKoboAmount(0)).toBe('₦0');
    });

    it('formats fractional kobo with 2 decimal places', () => {
      expect(formatKoboAmount(500050)).toBe('₦5,000.50');
      expect(formatKoboAmount(125)).toBe('₦1.25');
      expect(formatKoboAmount(50)).toBe('₦0.50');
    });

    it('respects fixedDecimals option', () => {
      expect(formatKoboAmount(500000, { fixedDecimals: true })).toBe('₦5,000.00');
      expect(formatKoboAmount(0, { fixedDecimals: true })).toBe('₦0.00');
    });

    it('handles custom currency string or object', () => {
      expect(formatKoboAmount(250000, 'USD')).toBe('$2,500');
      expect(formatKoboAmount(250050, { currency: 'USD' })).toBe('$2,500.50');
      expect(formatKoboAmount(250000, { currency: 'EUR' })).toBe('€2,500');
    });

    it('handles null and undefined gracefully', () => {
      expect(formatKoboAmount(null)).toBe('--');
      expect(formatKoboAmount(undefined)).toBe('--');
      expect(formatKoboAmount(null, { fallback: 'FREE' })).toBe('FREE');
    });
  });
});
