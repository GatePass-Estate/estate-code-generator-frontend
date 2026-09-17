import UpgradePlanModal from './UpgradePlanModal';
import { usePlan } from '@/src/hooks/usePlan';

/** Mount once. `requestFeature` opens the admin Upgrade Plan modal. Residents use inline `PlanNotice`. */
export default function PlanGuard() {
  const { isAdmin, lockedFeature, clearLock } = usePlan();

  return (
    <UpgradePlanModal
      visible={Boolean(lockedFeature) && isAdmin}
      feature={lockedFeature}
      onClose={clearLock}
    />
  );
}
