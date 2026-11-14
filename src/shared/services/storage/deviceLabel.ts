import { Platform } from 'react-native';
import * as Device from 'expo-device';

/**
 * Human-readable name for this device, sent to the API as `X-Device-Name`.
 *
 * Without the header the user service names a session from the User-Agent
 * (`get_device_name` in user_profile_service/app/libs/auth_helpers.py), which
 * gives "iOS device", "Android device" or "Chrome on Mac OS X". The header
 * value wins when present: it is URL-decoded, stripped of unprintable
 * characters and capped at 100 characters, then shown in Linked Devices and in
 * the new-login / 2FA security emails.
 *
 * The phone's user-assigned name (`Device.deviceName`, e.g. "Ada's iPhone") is
 * deliberately not used: it often contains a person's name, and iOS 16+
 * returns a generic "iPhone" for it anyway.
 */

export type DeviceInfo = {
  platform: string;
  manufacturer?: string | null;
  modelName?: string | null;
  osName?: string | null;
  userAgent?: string | null;
};

const MAX_LENGTH = 100;

// Order matters: Edge and Opera also say "Chrome", and Chrome also says "Safari".
const BROWSERS: { label: string; test: RegExp }[] = [
  { label: 'Edge', test: /edg(e|a|ios)?\//i },
  { label: 'Opera', test: /opr\/|opera/i },
  { label: 'Samsung Internet', test: /samsungbrowser/i },
  { label: 'Firefox', test: /firefox|fxios/i },
  { label: 'Chrome', test: /chrome|crios|chromium/i },
  { label: 'Safari', test: /safari/i },
];

const OS_LABELS: Record<string, string> = {
  'mac os': 'macOS',
  macos: 'macOS',
  ios: 'iOS',
  ipados: 'iPadOS',
  android: 'Android',
  windows: 'Windows',
  linux: 'Linux',
  'chrome os': 'ChromeOS',
  chromeos: 'ChromeOS',
  ubuntu: 'Ubuntu',
};

const clean = (value?: string | null) => (value ?? '').replace(/\s+/g, ' ').trim();

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

function browserName(userAgent: string): string | null {
  return BROWSERS.find(({ test }) => test.test(userAgent))?.label ?? null;
}

function osLabel(osName: string): string {
  return OS_LABELS[osName.toLowerCase()] ?? osName;
}

/** "Samsung SM-S911B", "Google Pixel 8", "iPhone 15 Pro", "Chrome on macOS". */
export function buildDeviceLabel(info: DeviceInfo): string {
  const model = clean(info.modelName);
  const manufacturer = clean(info.manufacturer);
  const os = clean(info.osName);
  let label = '';

  if (info.platform === 'web') {
    const browser = browserName(info.userAgent ?? '');
    const system = os ? osLabel(os) : '';
    if (browser && system) label = `${browser} on ${system}`;
    else label = browser || system;
  } else if (info.platform === 'ios') {
    // Apple models already read naturally ("iPhone 15 Pro", "iPad Air").
    label = model || (os ? `${osLabel(os)} device` : 'iPhone');
  } else {
    // Android models are often bare codes ("SM-S911B"), so lead with the maker
    // unless the model already names it ("Pixel 8" from Google does not).
    const maker = manufacturer ? capitalize(manufacturer) : '';
    if (model && maker && !model.toLowerCase().startsWith(maker.toLowerCase())) {
      label = `${maker} ${model}`;
    } else {
      label = model || maker;
    }
    if (!label && os) label = `${osLabel(os)} device`;
  }

  return label.slice(0, MAX_LENGTH);
}

let cached: string | null | undefined;

/** This device's label, or null when nothing useful is known (the backend then falls back to the UA). */
export function getDeviceLabel(): string | null {
  if (cached !== undefined) return cached;
  try {
    const label = buildDeviceLabel({
      platform: Platform.OS,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      osName: Device.osName,
      userAgent:
        Platform.OS === 'web' && typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });
    cached = label || null;
  } catch {
    cached = null;
  }
  return cached;
}
