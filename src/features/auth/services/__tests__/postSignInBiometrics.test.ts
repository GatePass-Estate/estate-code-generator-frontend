import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockEnableBiometricLogin = jest.fn<(token: string, estateId?: string) => Promise<unknown>>();
const mockIsBiometricAvailable = jest.fn<() => Promise<boolean>>();
const mockIsPreferenceEnabled = jest.fn<(id?: string, estate?: string) => Promise<boolean>>();
const mockTokenMatchesUser = jest.fn<(id: string, estate?: string) => Promise<boolean>>();
const mockPromptDismissed = jest.fn<(id: string) => Promise<boolean>>();
const mockDismissPrompt = jest.fn<(id: string) => Promise<void>>();
const mockPromptBiometrics = jest.fn<(reason?: string) => Promise<boolean>>();
const mockSaveCredentials = jest.fn<(t: string, u: string, e?: string) => Promise<void>>();

jest.mock('@/src/features/auth/services/auth', () => ({
  enableBiometricLogin: (token: string, estateId?: string) =>
    mockEnableBiometricLogin(token, estateId),
}));

jest.mock('@/src/features/auth/services/biometricAuth', () => ({
  isBiometricAvailable: () => mockIsBiometricAvailable(),
  isBiometricPreferenceEnabled: (id?: string, estate?: string) =>
    mockIsPreferenceEnabled(id, estate),
  biometricTokenMatchesUser: (id: string, estate?: string) => mockTokenMatchesUser(id, estate),
  hasBiometricPromptBeenDismissed: (id: string) => mockPromptDismissed(id),
  dismissBiometricPrompt: (id: string) => mockDismissPrompt(id),
  promptBiometrics: (reason?: string) => mockPromptBiometrics(reason),
  saveBiometricCredentials: (t: string, u: string, e?: string) => mockSaveCredentials(t, u, e),
}));

import {
  enableBiometricsFromPrompt,
  runPostSignInBiometrics,
} from '@/src/features/auth/services/postSignInBiometrics';

const USER = { user_id: 'user-1', estate_id: 'estate-1' };
const ACCESS_TOKEN = 'access-token';
const BIOMETRIC_TOKEN = 'biometric-token';

beforeEach(() => {
  jest.resetAllMocks();
  mockIsBiometricAvailable.mockResolvedValue(true);
  mockIsPreferenceEnabled.mockResolvedValue(false);
  mockTokenMatchesUser.mockResolvedValue(false);
  mockPromptDismissed.mockResolvedValue(false);
  mockDismissPrompt.mockResolvedValue(undefined);
  mockPromptBiometrics.mockResolvedValue(true);
  mockSaveCredentials.mockResolvedValue(undefined);
  mockEnableBiometricLogin.mockResolvedValue({ biometric_token: BIOMETRIC_TOKEN });
});

describe('runPostSignInBiometrics', () => {
  it('does nothing when the device has no usable biometrics', async () => {
    mockIsBiometricAvailable.mockResolvedValue(false);

    await expect(runPostSignInBiometrics(ACCESS_TOKEN, USER)).resolves.toBe('none');
    expect(mockEnableBiometricLogin).not.toHaveBeenCalled();
  });

  it('silently re-binds when the preference is on (no Face ID prompt, no modal)', async () => {
    mockIsPreferenceEnabled.mockResolvedValue(true);

    await expect(runPostSignInBiometrics(ACCESS_TOKEN, USER)).resolves.toBe('none');

    expect(mockPromptBiometrics).not.toHaveBeenCalled();
    expect(mockEnableBiometricLogin).toHaveBeenCalledWith(ACCESS_TOKEN, 'estate-1');
    // The biometric token is saved, never the short-lived access token.
    expect(mockSaveCredentials).toHaveBeenCalledWith(BIOMETRIC_TOKEN, 'user-1', 'estate-1');
  });

  it('keeps the sign-in working when the silent re-bind fails', async () => {
    mockIsPreferenceEnabled.mockResolvedValue(true);
    mockEnableBiometricLogin.mockRejectedValue(new Error('network down'));

    await expect(runPostSignInBiometrics(ACCESS_TOKEN, USER)).resolves.toBe('none');
    expect(mockSaveCredentials).not.toHaveBeenCalled();
  });

  it('asks to enable on first login', async () => {
    await expect(runPostSignInBiometrics(ACCESS_TOKEN, USER)).resolves.toBe('prompt');

    expect(mockEnableBiometricLogin).not.toHaveBeenCalled();
    expect(mockPromptBiometrics).not.toHaveBeenCalled();
  });

  it('does not ask again once the user dismissed the prompt', async () => {
    mockPromptDismissed.mockResolvedValue(true);

    await expect(runPostSignInBiometrics(ACCESS_TOKEN, USER)).resolves.toBe('none');
  });

  it('does not ask when credentials for this user are already saved', async () => {
    mockTokenMatchesUser.mockResolvedValue(true);

    await expect(runPostSignInBiometrics(ACCESS_TOKEN, USER)).resolves.toBe('none');
  });
});

describe('enableBiometricsFromPrompt', () => {
  it('confirms with Face ID, then saves the biometric token', async () => {
    await expect(enableBiometricsFromPrompt(ACCESS_TOKEN, USER)).resolves.toBe(true);

    expect(mockPromptBiometrics).toHaveBeenCalledTimes(1);
    expect(mockEnableBiometricLogin).toHaveBeenCalledWith(ACCESS_TOKEN, 'estate-1');
    expect(mockSaveCredentials).toHaveBeenCalledWith(BIOMETRIC_TOKEN, 'user-1', 'estate-1');
  });

  it('treats a cancelled Face ID prompt as a dismissal', async () => {
    mockPromptBiometrics.mockResolvedValue(false);

    await expect(enableBiometricsFromPrompt(ACCESS_TOKEN, USER)).resolves.toBe(false);

    expect(mockEnableBiometricLogin).not.toHaveBeenCalled();
    expect(mockSaveCredentials).not.toHaveBeenCalled();
    expect(mockDismissPrompt).toHaveBeenCalledWith('user-1');
  });

  it('treats a server failure as a dismissal', async () => {
    mockEnableBiometricLogin.mockRejectedValue(new Error('boom'));

    await expect(enableBiometricsFromPrompt(ACCESS_TOKEN, USER)).resolves.toBe(false);
    expect(mockDismissPrompt).toHaveBeenCalledWith('user-1');
  });
});
