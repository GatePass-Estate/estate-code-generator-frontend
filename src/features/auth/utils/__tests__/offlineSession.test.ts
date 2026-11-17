import { ApiError } from '@/src/shared/services/api/errors';
import { shouldKeepSessionOffline } from '@/src/features/auth/utils/offlineSession';

describe('shouldKeepSessionOffline', () => {
  it('keeps the session on network and timeout errors', () => {
    expect(shouldKeepSessionOffline(new ApiError('offline', { kind: 'network' }))).toBe(true);
    expect(shouldKeepSessionOffline(new ApiError('slow', { kind: 'timeout' }))).toBe(true);
  });

  it('keeps the session on 5xx', () => {
    expect(shouldKeepSessionOffline(new ApiError('boom', { kind: 'http', status: 503 }))).toBe(
      true
    );
  });

  it('does not keep the session on 401', () => {
    expect(
      shouldKeepSessionOffline(new ApiError('expired', { kind: 'unauthorized', status: 401 }))
    ).toBe(false);
  });
});
