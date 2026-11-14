import { describe, expect, it } from '@jest/globals';
import { buildDeviceLabel } from '@/src/shared/services/storage/deviceLabel';
import { friendlyDeviceName } from '@/src/shared/services/storage/deviceName';

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const EDGE_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0';

describe('buildDeviceLabel', () => {
  it('uses the Apple model name on iOS', () => {
    expect(
      buildDeviceLabel({
        platform: 'ios',
        manufacturer: 'Apple',
        modelName: 'iPhone 15 Pro',
        osName: 'iOS',
      })
    ).toBe('iPhone 15 Pro');
  });

  it('leads Android model codes with the manufacturer', () => {
    expect(
      buildDeviceLabel({ platform: 'android', manufacturer: 'samsung', modelName: 'SM-S911B' })
    ).toBe('Samsung SM-S911B');
    expect(
      buildDeviceLabel({ platform: 'android', manufacturer: 'Google', modelName: 'Pixel 8' })
    ).toBe('Google Pixel 8');
  });

  it('does not repeat a manufacturer the model already names', () => {
    expect(
      buildDeviceLabel({ platform: 'android', manufacturer: 'OnePlus', modelName: 'OnePlus 12' })
    ).toBe('OnePlus 12');
  });

  it('names the browser and OS on web', () => {
    expect(buildDeviceLabel({ platform: 'web', osName: 'Mac OS', userAgent: CHROME_MAC })).toBe(
      'Chrome on macOS'
    );
    expect(buildDeviceLabel({ platform: 'web', osName: 'Windows', userAgent: EDGE_WIN })).toBe(
      'Edge on Windows'
    );
    expect(buildDeviceLabel({ platform: 'web', osName: 'iOS', userAgent: SAFARI_IPHONE })).toBe(
      'Safari on iOS'
    );
    expect(buildDeviceLabel({ platform: 'web', osName: 'Linux', userAgent: FIREFOX_LINUX })).toBe(
      'Firefox on Linux'
    );
  });

  it('falls back gracefully when details are missing', () => {
    expect(buildDeviceLabel({ platform: 'android', osName: 'Android' })).toBe('Android device');
    expect(buildDeviceLabel({ platform: 'web', osName: '', userAgent: '' })).toBe('');
    expect(buildDeviceLabel({ platform: 'ios' })).toBe('iPhone');
  });

  it('stays within the backend limit', () => {
    const long = 'x'.repeat(150);
    expect(buildDeviceLabel({ platform: 'ios', modelName: long })).toHaveLength(100);
  });
});

describe('friendlyDeviceName', () => {
  it('shows names the app sent as they are', () => {
    expect(friendlyDeviceName('iPhone 15 Pro')).toBe('iPhone 15 Pro');
    expect(friendlyDeviceName('Samsung SM-S911B')).toBe('Samsung SM-S911B');
    expect(friendlyDeviceName('Chrome on macOS')).toBe('Chrome on macOS');
  });

  it('still reduces raw User-Agents from older sessions', () => {
    expect(friendlyDeviceName(CHROME_MAC)).toBe('Mac');
    expect(friendlyDeviceName('okhttp/4.12.0')).toBe('Android');
    expect(friendlyDeviceName(SAFARI_IPHONE)).toBe('iPhone');
  });

  it('handles empty and overlong names', () => {
    expect(friendlyDeviceName('')).toBe('Unknown device');
    expect(friendlyDeviceName(null)).toBe('Unknown device');
    expect(friendlyDeviceName('A'.repeat(60))).toHaveLength(40);
  });
});
