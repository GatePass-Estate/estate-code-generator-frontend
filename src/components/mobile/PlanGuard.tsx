import { useEffect } from 'react';
import { router } from 'expo-router';
import ActionConfirmModal from './ActionConfirmModal';
import UpgradePlanModal from './UpgradePlanModal';
import { FloatingPlanNotice } from './FreePlanNotice';
import { usePrimaryAdminNoticeStore } from '@/src/hooks/useBillingQueries';
import {
  useContactAdminNoticeStore,
  useFeatureAccess,
  useUpgradePromptStore,
} from '@/src/hooks/usePlan';
import {
  canViewBilling,
  PRIMARY_ADMIN_FEATURE_ACTION_MESSAGE,
  PRIMARY_ADMIN_REQUIRED_TITLE,
} from '@/src/lib/billing';
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
  const primaryAdminNoticeVisible = usePrimaryAdminNoticeStore((s) => s.visible);
  const dismissPrimaryAdminNotice = usePrimaryAdminNoticeStore((s) => s.dismiss);

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
      <ActionConfirmModal
        visible={primaryAdminNoticeVisible}
        title={PRIMARY_ADMIN_REQUIRED_TITLE}
        message={PRIMARY_ADMIN_FEATURE_ACTION_MESSAGE}
        confirmLabel="OK"
        hideCancel
        onConfirm={dismissPrimaryAdminNotice}
        onCancel={dismissPrimaryAdminNotice}
      />
    </>
  );
}
