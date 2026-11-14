import { useEffect } from 'react';
import { router } from 'expo-router';
import { CrownIcon } from '@/src/assets/svgs';
import ActionConfirmModal from '@/src/shared/components/feedback/ActionConfirmModal';
import PromptModal from '@/src/shared/components/feedback/PromptModal';
import { FloatingPlanNotice } from '@/src/features/billing/components/FreePlanNotice';
import { usePrimaryAdminNoticeStore } from '@/src/features/billing/hooks/billing';
import {
  useContactAdminNoticeStore,
  useFeatureAccess,
  useUpgradePromptStore,
} from '@/src/features/billing/hooks/usePlan';
import {
  canViewBilling,
  PRIMARY_ADMIN_FEATURE_ACTION_MESSAGE,
  PRIMARY_ADMIN_REQUIRED_TITLE,
} from '@/src/features/billing/utils/billing';
import { useUserStore } from '@/src/store/userStore';
import { getUpgradeCopy, type PlanFeature } from '@/src/features/billing/utils/plans';

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
        <PromptModal
          visible={visible}
          icon={<CrownIcon width={40} height={40} />}
          title="Upgrade Plan"
          message={upgradeMessage || getUpgradeCopy(feature)}
          confirmLabel="Upgrade Your Plan"
          onClose={dismiss}
          onConfirm={() => {
            handleUpgrade?.();
            dismiss();
          }}
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
