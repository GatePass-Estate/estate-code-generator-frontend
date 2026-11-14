import { logger } from '@/src/shared/utils/logger';

type ErrorUtilsShape = {
  getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
};

/**
 * Log uncaught JS exceptions and unhandled promise rejections. Does not replace a crash
 * reporter (Sentry/Crashlytics) — wire that in separately when a vendor is chosen.
 */
export function installGlobalErrorHandlers(): void {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;
  if (errorUtils?.getGlobalHandler && errorUtils?.setGlobalHandler) {
    const previous = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error, isFatal) => {
      logger.error(isFatal ? 'Fatal JS exception' : 'JS exception', error);
      previous?.(error, isFatal);
    });
  }

  if (typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = 'reason' in event ? event.reason : undefined;
      logger.error('Unhandled promise rejection', reason instanceof Error ? reason : undefined);
    });
  }
}
