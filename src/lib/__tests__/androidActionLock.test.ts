import { describe, expect, it } from '@jest/globals';

describe('allowAndroidAction', () => {
  it('allows the first call and blocks a repeat of the same key inside the window on Android', () => {
    jest.resetModules();
    jest.doMock('react-native', () => ({ Platform: { OS: 'android' } }));
    jest.doMock('expo-router', () => ({
      router: { push: jest.fn(), replace: jest.fn(), navigate: jest.fn() },
    }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { allowAndroidAction } =
      require('../androidActionLock') as typeof import('../androidActionLock');
    expect(allowAndroidAction('open:/settings', 700)).toBe(true);
    expect(allowAndroidAction('open:/settings', 700)).toBe(false);
    expect(allowAndroidAction('open:/profile', 700)).toBe(true);
  });
});
