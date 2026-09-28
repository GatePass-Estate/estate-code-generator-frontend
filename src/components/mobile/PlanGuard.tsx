import UpgradePlanModal from './UpgradePlanModal';
import { FloatingPlanNotice } from './FreePlanNotice';
import { useContactAdminNoticeStore, useUpgradePromptStore } from '@/src/hooks/usePlan';

/**
 * Mount once in the protected layout. Shows the Upgrade Plan modal (primary admin) and the floating
 * "Contact Admin" notice (everyone else) requested through `useFeatureGate`.
 */
export default function PlanGuard() {
  const feature = useUpgradePromptStore((s) => s.feature);
  const visible = useUpgradePromptStore((s) => s.visible);
  const dismiss = useUpgradePromptStore((s) => s.dismiss);
  const noticeFeature = useContactAdminNoticeStore((s) => s.feature);
  const noticeMessage = useContactAdminNoticeStore((s) => s.message);
  const noticeVisible = useContactAdminNoticeStore((s) => s.visible);

  return (
    <>
      {feature && <UpgradePlanModal visible={visible} feature={feature} onClose={dismiss} />}
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
