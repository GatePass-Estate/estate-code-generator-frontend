import { AxiosError } from 'axios';
import { ApiError, toApiError, userFacingError } from '@/src/shared/services/api/errors';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

describe('toApiError', () => {
  it('keeps the existing network message and marks the failure', () => {
    const error = toApiError(new AxiosError('Network Error'));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('network');
    expect(error.message).toBe('Network error - please check your internet connection. ');
  });

  it('keeps a server detail string', () => {
    const axiosError = new AxiosError('Request failed with status code 400');
    axiosError.response = {
      data: { detail: 'Guest already exists' },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} } as never,
    };

    const error = toApiError(axiosError);

    expect(error.kind).toBe('http');
    expect(error.status).toBe(400);
    expect(error.message).toBe('Guest already exists ');
  });

  it('marks a timeout separately from a generic HTTP error', () => {
    const error = toApiError(new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED'));

    expect(error.kind).toBe('timeout');
    expect(error.message).toBe(
      'Request timed out - please check your network connection and try again. '
    );
  });

  it('returns the same ApiError instance', () => {
    const original = new ApiError('Already normalized ', { kind: 'unknown' });
    expect(toApiError(original)).toBe(original);
  });
});

describe('userFacingError', () => {
  it('keeps a server detail and a network explanation', () => {
    const axiosError = new AxiosError('Request failed with status code 409');
    axiosError.response = {
      data: { detail: 'A household with this name already exists' },
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: {} } as never,
    };

    expect(userFacingError(axiosError, 'Could not save')).toBe(
      'A household with this name already exists'
    );
    expect(userFacingError(new AxiosError('Network Error'), 'Could not save')).toBe(
      'Network error - please check your internet connection.'
    );
  });

  it('replaces an unmapped status line and an unknown failure with the fallback', () => {
    expect(
      userFacingError(new Error('Request failed with status code 500'), 'Could not load users')
    ).toBe('Server error - please try again later.');
    expect(
      userFacingError(new Error('Request failed with status code 418'), 'Could not load users')
    ).toBe('Could not load users');
    expect(userFacingError(undefined, 'Could not load users')).toBe('Could not load users');
  });
});
