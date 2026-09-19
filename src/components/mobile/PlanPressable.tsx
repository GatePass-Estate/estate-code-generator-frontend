import { Pressable, type PressableProps } from 'react-native';
import { useRequirePlan } from '@/src/hooks/usePlan';
import { PlanFeature } from '@/src/lib/plans';

type PlanPressableProps = Omit<PressableProps, 'onPress'> & {
  feature: PlanFeature;
  onPress?: PressableProps['onPress'];
};

/** Pressable that checks a catalogue feature and lets PlanGuard show the right lock UI. */
export default function PlanPressable({ feature, onPress, ...props }: PlanPressableProps) {
  const requirePlan = useRequirePlan(feature);

  return <Pressable {...props} onPress={onPress ? requirePlan(onPress) : undefined} />;
}
