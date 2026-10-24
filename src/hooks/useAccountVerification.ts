import { useCallback } from 'react';
import { create } from 'zustand';
import { useUserStore } from '@/src/lib/stores/userStore';
import { IdApproval, useProfileDocumentsStore } from '@/src/lib/stores/profileDocumentsStore';

/**
 * Roles that must have an approved ID before using the app. Only the primary admin is exempt,
 * since they approve everyone else's ID.
 */
const VERIFICATION_REQUIRED_ROLES = ['resident', 'security', 'admin'];

/**
 * Screens an unverified user can still open: home, notifications (they may carry the "verify your
 * ID" message), their profile (to upload the photo and ID), account settings and the Terms of
 * Service / Privacy Policy. Every other screen sends them back home with the verify prompt.
 */
const VERIFICATION_FREE_PATHS = [
  '/user',
  '/security',
  '/security/more',
  '/info-board',
  '/profile',
  '/profile/edit',
  '/profile/edit/password',
  '/settings',
  '/account-security',
  '/account-security/two-factor',
  '/account-security/recovery-codes',
  '/linked-devices',
  '/delete-account',
  '/auth/tos',
  '/auth/data-protection-policy',
];

/** Where a blocked user lands: their role's home screen. */
export function verificationHomeFor(role: string | null) {
  return role === 'security' ? '/security' : '/user';
}

export function isVerificationFreePath(pathname: string) {
  return VERIFICATION_FREE_PATHS.includes(pathname.replace(/\/+$/, '') || '/');
}

type VerifyAccountPromptStore = {
  visible: boolean;
  show: () => void;
  dismiss: () => void;
};

/** Drives the single app-wide Verify Account modal rendered by `VerifyAccountGuard`. */
export const useVerifyAccountPromptStore = create<VerifyAccountPromptStore>((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  dismiss: () => set({ visible: false }),
}));

/**
 * Where the signed-in user stands on ID verification. `blocked` is true only once the documents
 * have loaded and show no admin-approved ID, so nobody is locked out while they load or offline.
 */
export function useAccountVerification(): { approval: IdApproval; blocked: boolean } {
  const role = useUserStore((s) => s.role);
  const approval = useProfileDocumentsStore((s) => s.idApproval);
  const required = !!role && VERIFICATION_REQUIRED_ROLES.includes(role);
  return { approval, blocked: required && approval !== null && approval !== 'approved' };
}

/**
 * Gate a user action behind an approved ID. `requireVerified()` returns `true` when the user may
 * go ahead; otherwise it opens the Verify Account modal and returns `false`.
 */
export function useVerificationGate() {
  const { blocked } = useAccountVerification();
  const show = useVerifyAccountPromptStore((s) => s.show);

  const requireVerified = useCallback(() => {
    if (!blocked) return true;
    show();
    // The admin may have approved the ID since the last check: refresh so the next tap goes through.
    const userId = useUserStore.getState().user_id;
    if (userId) void useProfileDocumentsStore.getState().syncDocuments(userId);
    return false;
  }, [blocked, show]);

  return { blocked, requireVerified };
}
