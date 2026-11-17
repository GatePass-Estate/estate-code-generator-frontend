import { AxiosError, type AxiosResponse } from 'axios';
import { ApiError } from '@/src/shared/services/api/errors';
import {
  clearQueryCache,
  queryClient,
  shouldRetryQuery,
} from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';

const httpError = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_RESPONSE', undefined, undefined, {
    status,
  } as AxiosResponse);

describe('shouldRetryQuery', () => {
  it('retries network failures, timeouts, rate limits and server errors', () => {
    expect(shouldRetryQuery(0, new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(true);
    expect(shouldRetryQuery(0, httpError(408))).toBe(true);
    expect(shouldRetryQuery(0, httpError(429))).toBe(true);
    expect(shouldRetryQuery(1, httpError(503))).toBe(true);
    expect(shouldRetryQuery(0, new ApiError('down', { kind: 'http', status: 500 }))).toBe(true);
  });

  it('does not retry client errors that will fail the same way again', () => {
    for (const status of [400, 401, 403, 404, 422]) {
      expect(shouldRetryQuery(0, httpError(status))).toBe(false);
      expect(shouldRetryQuery(0, new ApiError('no', { kind: 'http', status }))).toBe(false);
    }
  });

  it('stops after two retries', () => {
    expect(shouldRetryQuery(2, httpError(500))).toBe(false);
  });
});

describe('query key prefixes', () => {
  it('invalidating a feature root marks every query under that root stale', async () => {
    const overview = queryKeys.anomaly.overview('estate-1', '2026-01-01', '2026-01-31');
    queryClient.setQueryData(overview, { total: 3 });

    await queryClient.invalidateQueries({ queryKey: queryKeys.anomaly.all });

    expect(queryClient.getQueryState(overview)?.isInvalidated).toBe(true);
    queryClient.clear();
  });
});

describe('clearQueryCache', () => {
  it('drops every cached response, not only billing/entitlement keys', () => {
    queryClient.setQueryData(['access-codes', 'list'], [{ code: '1234' }]);
    queryClient.setQueryData(['notifications'], [{ id: 'n1' }]);
    queryClient.setQueryData(['billing', 'plan'], { tier: 'pro' });

    clearQueryCache();

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(queryClient.getQueryData(['access-codes', 'list'])).toBeUndefined();
  });
});
