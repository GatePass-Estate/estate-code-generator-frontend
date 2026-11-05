import { useEffect } from 'react';
import { router } from 'expo-router';
import UpgradePlanModal from './UpgradePlanModal';
import { FloatingPlanNotice } from './FreePlanNotice';
import {
  useContactAdminNoticeStore,
  useFeatureAccess,
  useUpgradePromptStore,
} from '@/src/hooks/usePlan';
import { canViewBilling } from '@/src/lib/billing';
import { useUserStore } from '@/src/lib/stores/userStore';
import type { PlanFeature } from '@/src/lib/plans';

/**
 * Mount once in the protected layout. Shows the Upgrade Plan modal (primary admin) and the floating
 * "Contact Admin" notice (everyone else) requested through `useFeatureGate`.
 */
function PromptAccessWatcher({
  feature,
  visible,
  dismiss,
}: {
  feature: PlanFeature;
  visible: boolean;
  dismiss: () => void;
}) {
  const access = useFeatureAccess(feature);
  useEffect(() => {
    if (visible && access === 'granted') dismiss();
  }, [access, dismiss, visible]);
  return null;
}

export default function PlanGuard() {
  const feature = useUpgradePromptStore((s) => s.feature);
  const visible = useUpgradePromptStore((s) => s.visible);
  const dismiss = useUpgradePromptStore((s) => s.dismiss);
  const customUpgrade = useUpgradePromptStore((s) => s.onUpgrade);
  const upgradeMessage = useUpgradePromptStore((s) => s.message);
  const role = useUserStore((s) => s.role);
  const noticeFeature = useContactAdminNoticeStore((s) => s.feature);
  const noticeMessage = useContactAdminNoticeStore((s) => s.message);
  const noticeVisible = useContactAdminNoticeStore((s) => s.visible);

  // A feature can send the upgrade elsewhere (e.g. the AI store). Otherwise billing viewers go
  // straight to "Choose your plan" and anyone else just closes the modal.
  const handleUpgrade = customUpgrade
    ? () => {
        dismiss();
        customUpgrade();
      }
    : canViewBilling(role)
      ? () => {
          dismiss();
          router.push('/billing/choose-plan');
        }
      : undefined;

  return (
    <>
      {feature && <PromptAccessWatcher feature={feature} visible={visible} dismiss={dismiss} />}
      {feature && (
        <UpgradePlanModal
          visible={visible}
          feature={feature}
          message={upgradeMessage}
          onClose={dismiss}
          onUpgrade={handleUpgrade}
        />
      )}
      {noticeFeature && (
        <FloatingPlanNotice
          visible={noticeVisible}
          feature={noticeFeature}
          message={noticeMessage}
        />
      )}
    </>
  );
}
