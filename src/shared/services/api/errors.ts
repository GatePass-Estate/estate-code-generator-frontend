import { isAxiosError } from 'axios';
import { getErrorMessage } from '@/src/shared/utils/helpers';

export type ApiErrorKind = 'timeout' | 'network' | 'unauthorized' | 'http' | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(message: string, options: { kind: ApiErrorKind; status?: number; cause?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.kind = options.kind;
    this.status = options.status;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

function kindFor(error: unknown): { kind: ApiErrorKind; status?: number } {
  if (!isAxiosError(error)) return { kind: 'unknown' };

  const status = error.response?.status;
  const message = error.message ?? '';
  if (
    error.code === 'ECONNABORTED' ||
    message.includes('timeout') ||
    message.includes('timed out')
  ) {
    return { kind: 'timeout', status };
  }
  if (message === 'Network Error' || !error.response) return { kind: 'network', status };
  if (status === 401) return { kind: 'unauthorized', status };
  if (status) return { kind: 'http', status };
  return { kind: 'unknown', status };
}

/**
 * Same message the service used to throw. `trailingSpace` keeps the historical trailing space
 * on calls that built the message with a template literal.
 */
export function toApiError(
  error: unknown,
  fallback = 'An error occured',
  trailingSpace = true
): ApiError {
  if (error instanceof ApiError) return error;

  const generic = error instanceof Error ? error.message : 'An unknown error occurred';
  let resolved = fallback || generic;
  try {
    resolved = getErrorMessage(error) || fallback || generic;
  } catch {
    resolved = fallback || generic;
  }
  const message = `${resolved}${trailingSpace ? ' ' : ''}`;
  const { kind, status } = kindFor(error);
  return new ApiError(message, { kind, status, cause: error });
}

export function raiseApiError(error: unknown, fallback: string, trailingSpace = false): never {
  throw toApiError(error, fallback, trailingSpace);
}

const TECHNICAL_AXIOS_MESSAGE = /^Request failed with status code \d+$/;

/**
 * Message safe to show in the UI. Server `detail` text is kept. Axios status lines, an empty
 * message, and the generic "unknown error" string are replaced with `fallback`.
 */
export function userFacingError(error: unknown, fallback: string): string {
  const message = getErrorMessage(error).trim();
  if (!message || message === 'An unknown error occurred' || TECHNICAL_AXIOS_MESSAGE.test(message)) {
    return fallback;
  }
  return message;
}

/** Raw thrown message, without the friendlier mapping in getErrorMessage. */
export function errorMessage(error: unknown): string | undefined {
  if (isAxiosError(error)) return error.message || undefined;
  if (error instanceof Error) return error.message || undefined;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message || undefined;
  }
  return undefined;
}

/** HTTP status from an Axios error or an error object that already carries one. */
export function errorStatus(error: unknown): number | undefined {
  if (isAxiosError(error) && typeof error.response?.status === 'number') {
    return error.response.status;
  }
  if (!error || typeof error !== 'object') return undefined;
  if ('status' in error && typeof error.status === 'number') return error.status;
  if ('response' in error && error.response && typeof error.response === 'object') {
    const status = (error.response as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  return undefined;
}
