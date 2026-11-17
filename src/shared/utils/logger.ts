/**
 * App logging. Messages only — never tokens, request headers, or response bodies.
 * `warn` is for development misconfiguration. `error` is a failure the screen does not already show.
 */
function detail(error: unknown): string | undefined {
  if (error instanceof Error && error.message.trim()) return error.message;
  return undefined;
}

function devOnly(): boolean {
  return typeof __DEV__ === 'undefined' || __DEV__;
}

export const logger = {
  error(message: string, error?: unknown) {
    const extra = detail(error);
    console.error(extra ? `${message}: ${extra}` : message);
  },
  warn(message: string) {
    if (!devOnly()) return;
    console.warn(message);
  },
};
