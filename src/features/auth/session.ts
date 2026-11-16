export { useAuthStore } from '@/src/features/auth/store/authStore';
export type { AuthState } from '@/src/features/auth/store/authStore';
export {
  handleUnauthorizedResponse,
  setUnauthorizedHandler,
  shouldForceLogoutOn401,
} from '@/src/features/auth/services/session';
export {
  adoptStoredSession,
  getValidAccessToken,
  isOwnAccessToken,
  refreshSession,
  revokeCurrentSession,
} from '@/src/features/auth/services/authRefresh';
export {
  errorDetail,
  signOutReasonFromRequestFailure,
} from '@/src/features/auth/services/signOutReason';
export type { SignOutReason } from '@/src/features/auth/services/signOutReason';
