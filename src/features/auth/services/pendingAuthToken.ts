/**
 * Holds one-time activation / password-reset tokens so they are not kept in route params
 * (which leak into history, screenshots of URLs, and analytics). Deep-link query strings
 * still arrive with `?token=`; we move them here before navigating to the form screen.
 */
let pendingToken: string | null = null;
let pendingEmail: string | null = null;

export function stashPendingAuthToken(token: string, email?: string | null): void {
  pendingToken = token;
  pendingEmail = email ?? null;
}

export function takePendingAuthToken(): { token: string | null; email: string | null } {
  const token = pendingToken;
  const email = pendingEmail;
  pendingToken = null;
  pendingEmail = null;
  return { token, email };
}

export function peekPendingAuthToken(): string | null {
  return pendingToken;
}
