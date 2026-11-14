import { ApiError, errorStatus } from '@/src/shared/services/api/errors';

/**
 * STB-05: cold-start profile fetch failures that should keep the stored session
 * (network/timeout/5xx) vs force login (401).
 */
export function shouldKeepSessionOffline(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.kind === 'unauthorized') return false;
    if (error.kind === 'network' || error.kind === 'timeout') return true;
    if (error.status !== undefined && error.status >= 500) return true;
    return error.status === undefined;
  }
  const status = errorStatus(error);
  if (status === 401) return false;
  if (status !== undefined && status >= 500) return true;
  return status === undefined;
}
