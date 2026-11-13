import { QueryClient } from '@tanstack/react-query';
import { errorStatus } from '@/src/shared/services/api/errors';

const MAX_RETRIES = 2;

/**
 * Retry only what can succeed on a second try: no response (network/timeout), request timeout,
 * rate limiting, and server errors. A 4xx (bad input, forbidden, not found, expired session)
 * gives the same answer every time, so retrying only delays the error state.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  const status = errorStatus(error);
  if (status === undefined) return true;
  return status === 408 || status === 429 || status >= 500;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 5,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false, // often better for mobile
    },
  },
});

/**
 * Drops every cached server response and cancels in-flight fetches. Call whenever the signed-in
 * account changes (sign-out, a different account adopted from another tab): with a 5-minute
 * staleTime, anything left behind would be served to the next account without a refetch.
 */
export function clearQueryCache() {
  void queryClient.cancelQueries();
  queryClient.clear();
}
