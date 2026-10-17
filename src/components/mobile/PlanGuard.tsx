import { router } from 'expo-router';
import UpgradePlanModal from './UpgradePlanModal';
import { FloatingPlanNotice } from './FreePlanNotice';
import { useContactAdminNoticeStore, useUpgradePromptStore } from '@/src/hooks/usePlan';
import { canViewBilling } from '@/src/lib/billing';
import { useUserStore } from '@/src/lib/stores/userStore';

/**
 * Mount once in the protected layout. Shows the Upgrade Plan modal (primary admin) and the floating
 * "Contact Admin" notice (everyone else) requested through `useFeatureGate`.
 */
export default function PlanGuard() {
  const feature = useUpgradePromptStore((s) => s.feature);
  const visible = useUpgradePromptStore((s) => s.visible);
  const dismiss = useUpgradePromptStore((s) => s.dismiss);
  const role = useUserStore((s) => s.role);
  const noticeFeature = useContactAdminNoticeStore((s) => s.feature);
  const noticeMessage = useContactAdminNoticeStore((s) => s.message);
  const noticeVisible = useContactAdminNoticeStore((s) => s.visible);

  // Billing viewers go straight to the billing screens; anyone else just closes the modal.
  const handleUpgrade = canViewBilling(role)
    ? () => {
        dismiss();
        router.push('/billing');
      }
    : undefined;

  return (
    <>
      {feature && (
        <UpgradePlanModal
          visible={visible}
          feature={feature}
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
