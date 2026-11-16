/**
 * Currency utilities for handling amounts in Kobo (minor currency unit: 100 Kobo = ₦1).
 */

export function getCurrencySymbol(currency?: string | null): string {
  const clean = (currency || 'NGN').toUpperCase().trim();
  if (clean === 'NGN') return '₦';
  if (clean === 'USD') return '$';
  if (clean === 'EUR') return '€';
  if (clean === 'GBP') return '£';
  return clean ? `${clean} ` : '₦';
}

export interface FormatKoboOptions {
  currency?: string | null;
  /** Force 2 decimal places (e.g. ₦5,000.00 instead of ₦5,000). Default is false unless fractional. */
  fixedDecimals?: boolean;
  /** Fallback string if amount is null or undefined. Defaults to '--'. */
  fallback?: string;
}

/**
 * Formats an amount in Kobo into formatted Naira (or target currency) with appropriate symbol and commas.
 *
 * Example:
 *   formatKoboAmount(500000) => "₦5,000"
 *   formatKoboAmount(500050) => "₦5,000.50"
 *   formatKoboAmount(500000, { fixedDecimals: true }) => "₦5,000.00"
 *   formatKoboAmount(0) => "₦0"
 *   formatKoboAmount(null) => "--"
 */
export function formatKoboAmount(
  amountInKobo?: number | null,
  options?: FormatKoboOptions | string
): string {
  if (amountInKobo == null || Number.isNaN(amountInKobo)) {
    if (typeof options === 'object' && options?.fallback !== undefined) {
      return options.fallback;
    }
    return '--';
  }

  const opts: FormatKoboOptions =
    typeof options === 'string' ? { currency: options } : options || {};

  const symbol = getCurrencySymbol(opts.currency);
  const major = amountInKobo / 100;
  const isWhole = major % 1 === 0;

  const formattedNumber = major.toLocaleString('en-US', {
    minimumFractionDigits: opts.fixedDecimals ? 2 : isWhole ? 0 : 2,
    maximumFractionDigits: opts.fixedDecimals ? 2 : isWhole ? 0 : 2,
  });

  return `${symbol}${formattedNumber}`;
}
