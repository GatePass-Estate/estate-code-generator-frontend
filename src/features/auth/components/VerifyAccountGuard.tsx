import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { CompleteKycIcon } from '@/src/assets/svgs';
import PromptModal from '@/src/shared/components/feedback/PromptModal';
import {
  isVerificationFreePath,
  useAccountVerification,
  useVerifyAccountPromptStore,
  verificationHomeFor,
} from '@/src/features/auth/hooks/useAccountVerification';
import { useUserStore } from '@/src/store/userStore';

/**
 * Mount once in the protected layout. Until an admin approves the user's ID, opening any screen
 * other than home, profile and settings goes back and shows the Complete KYC modal. Its button opens
 * the profile, which shows the user's current step from their documents: photo (1/2), then ID (2/2),
 * then "Waiting Approval". No step is passed in, so the photo can never be skipped.
 */
export default function VerifyAccountGuard() {
  const goBack = useGoBack();
  const pathname = usePathname();
  const role = useUserStore((s) => s.role);
  const { blocked } = useAccountVerification();
  const visible = useVerifyAccountPromptStore((s) => s.visible);
  const show = useVerifyAccountPromptStore((s) => s.show);
  const dismiss = useVerifyAccountPromptStore((s) => s.dismiss);

  useEffect(() => {
    if (Platform.OS === 'web' || !blocked || isVerificationFreePath(pathname)) return;
    show();
    if (router.canGoBack()) goBack();
    else router.replace(verificationHomeFor(role));
  }, [blocked, goBack, pathname, role, show]);

  if (Platform.OS === 'web') return null;

  return (
    <PromptModal
      visible={visible && blocked}
      icon={<CompleteKycIcon />}
      title="Complete KYC"
      message="Complete your verification process to access this feature."
      confirmLabel="Got It !"
      onClose={dismiss}
      onConfirm={() => {
        dismiss();
        router.push('/profile');
      }}
    />
  );
}
