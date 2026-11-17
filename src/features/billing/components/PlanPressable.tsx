import { Pressable, type PressableProps } from 'react-native';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';
import { PlanFeature } from '@/src/features/billing/utils/plans';

type PlanPressableProps = Omit<PressableProps, 'onPress'> & {
  feature: PlanFeature;
  onPress?: PressableProps['onPress'];
};

/** Pressable that checks a catalogue feature and lets PlanGuard show the right lock UI. */
export default function PlanPressable({ feature, onPress, ...props }: PlanPressableProps) {
  const { requestAccess } = useFeatureGate(feature, { notice: 'floating' });

  return (
    <Pressable
      {...props}
      onPress={
        onPress
          ? (event) => {
              if (!requestAccess()) return;
              onPress(event);
            }
          : undefined
      }
    />
  );
}
