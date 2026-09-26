import { Pressable, type PressableProps } from 'react-native';
import { useFeatureGate } from '@/src/hooks/usePlan';
import { PlanFeature } from '@/src/lib/plans';

type PlanPressableProps = Omit<PressableProps, 'onPress'> & {
  feature: PlanFeature;
  onPress?: PressableProps['onPress'];
};

/** Pressable that checks a catalogue feature and lets PlanGuard show the right lock UI. */
export default function PlanPressable({ feature, onPress, ...props }: PlanPressableProps) {
  const { requestAccess } = useFeatureGate(feature);

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
