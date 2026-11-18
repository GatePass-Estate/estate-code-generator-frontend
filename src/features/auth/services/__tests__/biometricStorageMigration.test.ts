import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockStore = new Map<string, string>();

const mockDeleteItem = jest.fn<(key: string, options?: Record<string, unknown>) => Promise<void>>();
const mockGetItem = jest.fn<(key: string) => Promise<string | null>>();
const mockSetItem =
  jest.fn<(key: string, value: string, options?: Record<string, unknown>) => Promise<void>>();

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  deleteItemAsync: (key: string, options?: Record<string, unknown>) => mockDeleteItem(key, options),
  getItemAsync: (key: string) => mockGetItem(key),
  setItemAsync: (key: string, value: string, options?: Record<string, unknown>) =>
    mockSetItem(key, value, options),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => mockStore.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      mockStore.set(key, value);
    },
  },
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: async () => true,
  isEnrolledAsync: async () => true,
  authenticateAsync: async () => ({ success: true }),
}));

jest.mock('@/src/shared/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

const TOKEN_KEY = 'gatepass-biometric-auth-token';
const USER_KEY = 'gatepass-biometric-auth-user';
const ESTATE_KEY = `${USER_KEY}-estate`;
const PREFERENCE_KEY = 'gatepass-biometric-auth-preferences';
const MIGRATION_FLAG = 'gatepass-biometric-storage-v2';

type BiometricModule = typeof import('@/src/features/auth/services/biometricAuth');

function loadFreshModule(): BiometricModule {
  let loaded!: BiometricModule;
  jest.isolateModules(() => {
    loaded = require('@/src/features/auth/services/biometricAuth');
  });
  return loaded;
}

beforeEach(() => {
  mockStore.clear();
  jest.resetAllMocks();
  mockDeleteItem.mockResolvedValue(undefined);
  mockGetItem.mockResolvedValue(null);
  mockSetItem.mockResolvedValue(undefined);
});

describe('biometric storage migration', () => {
  it('removes the old protected token and the stored binding once, keeping the preference', async () => {
    mockStore.set(PREFERENCE_KEY, JSON.stringify({ 'user-1:estate-1': true }));

    await loadFreshModule().ensureBiometricStorageMigrated();

    const deletedKeys = mockDeleteItem.mock.calls.map(([key]) => key);
    expect(deletedKeys).toEqual(expect.arrayContaining([TOKEN_KEY, USER_KEY, ESTATE_KEY]));

    // The old entry was written with requireAuthentication, so it must be deleted that way too.
    const legacyDelete = mockDeleteItem.mock.calls.find(
      ([key, options]) => key === TOKEN_KEY && options?.requireAuthentication === true
    );
    expect(legacyDelete).toBeDefined();

    expect(mockStore.get(MIGRATION_FLAG)).toBe('true');
    expect(mockStore.get(PREFERENCE_KEY)).toBe(JSON.stringify({ 'user-1:estate-1': true }));
  });

  it('does not run again once the flag is set', async () => {
    mockStore.set(MIGRATION_FLAG, 'true');

    await loadFreshModule().ensureBiometricStorageMigrated();

    expect(mockDeleteItem).not.toHaveBeenCalled();
  });

  it('runs before the first credential save, so new tokens are never wiped', async () => {
    const biometric = loadFreshModule();

    await biometric.saveBiometricCredentials('biometric-token', 'user-1', 'estate-1');

    const calls = [
      ...mockDeleteItem.mock.invocationCallOrder.map((order) => ({ order, kind: 'delete' })),
      ...mockSetItem.mock.invocationCallOrder.map((order) => ({ order, kind: 'set' })),
    ].sort((a, b) => a.order - b.order);
    const firstSet = calls.findIndex((call) => call.kind === 'set');
    expect(calls.slice(0, firstSet).every((call) => call.kind === 'delete')).toBe(true);
    expect(mockSetItem).toHaveBeenCalledWith(TOKEN_KEY, 'biometric-token', expect.anything());
  });

  it('saves the token without OS-level authentication (so re-binding is silent)', async () => {
    const biometric = loadFreshModule();

    await biometric.saveBiometricCredentials('biometric-token', 'user-1', 'estate-1');

    const tokenWrite = mockSetItem.mock.calls.find(([key]) => key === TOKEN_KEY);
    expect(tokenWrite).toBeDefined();
    expect(tokenWrite?.[2]?.requireAuthentication).toBeFalsy();
  });
});
