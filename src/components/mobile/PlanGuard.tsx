import UpgradePlanModal from './UpgradePlanModal';
import { useUpgradePromptStore } from '@/src/hooks/usePlan';

/** Mount once in the protected layout. Shown by `useFeatureGate().requestAccess()` for admins. */
export default function PlanGuard() {
  const feature = useUpgradePromptStore((s) => s.feature);
  const visible = useUpgradePromptStore((s) => s.visible);
  const dismiss = useUpgradePromptStore((s) => s.dismiss);

  if (!feature) return null;

  return <UpgradePlanModal visible={visible} feature={feature} onClose={dismiss} />;
}
