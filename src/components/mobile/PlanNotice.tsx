import { View } from 'react-native';
import FreePlanNotice from './FreePlanNotice';
import { useFeatureAccess } from '@/src/hooks/usePlan';
import { PlanFeature } from '@/src/lib/plans';

/** Persistent "Contact Admin" banner, shown only to non-admins whose plan lacks `feature`. */
export default function PlanNotice({
  feature,
  className,
}: {
  feature: PlanFeature;
  className?: string;
}) {
  const access = useFeatureAccess(feature);
  if (access !== 'contact_admin') return null;
  return (
    <View className={className ? `${className} items-center` : 'items-center'}>
      <FreePlanNotice feature={feature} />
    </View>
  );
}
