import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import VerifyAccountModal from './VerifyAccountModal';
import {
  isVerificationFreePath,
  useAccountVerification,
  useVerifyAccountPromptStore,
  verificationHomeFor,
} from '@/src/hooks/useAccountVerification';
import { useUserStore } from '@/src/lib/stores/userStore';

/**
 * Mount once in the protected layout. Until an admin approves the user's ID, opening any screen
 * other than home, profile and settings goes back and shows the Complete KYC modal. Its button opens
 * the ID upload on the profile, or just the profile when the ID is already waiting for approval.
 */
export default function VerifyAccountGuard() {
  const pathname = usePathname();
  const role = useUserStore((s) => s.role);
  const { approval, blocked } = useAccountVerification();
  const visible = useVerifyAccountPromptStore((s) => s.visible);
  const show = useVerifyAccountPromptStore((s) => s.show);
  const dismiss = useVerifyAccountPromptStore((s) => s.dismiss);

  useEffect(() => {
    if (Platform.OS === 'web' || !blocked || isVerificationFreePath(pathname)) return;
    show();
    if (router.canGoBack()) router.back();
    else router.replace(verificationHomeFor(role));
  }, [blocked, pathname, role, show]);

  if (Platform.OS === 'web') return null;

  return (
    <VerifyAccountModal
      visible={visible && blocked}
      onClose={dismiss}
      onVerify={() =>
        router.push(
          approval === 'pending' ? '/profile' : { pathname: '/profile', params: { verify: 'id' } }
        )
      }
    />
  );
}
