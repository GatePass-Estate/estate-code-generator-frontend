import { View } from 'react-native';
import FreePlanNotice from './FreePlanNotice';
import { usePlan } from '@/src/hooks/usePlan';
import { PlanFeature } from '@/src/lib/plans';

/** Inline resident banner. Use on screens that should always show the Figma free-plan notice. */
export default function PlanNotice({
  feature,
  className,
}: {
  feature: PlanFeature;
  className?: string;
}) {
  const { isAdmin, canUse } = usePlan();
  if (isAdmin || canUse(feature)) return null;
  return (
    <View className={className ? `${className} items-center` : 'items-center'}>
      <FreePlanNotice />
    </View>
  );
}
