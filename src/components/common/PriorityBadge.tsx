import { Image, type ImageSourcePropType } from 'react-native';
import type { BroadcastPriority } from '@/src/types/broadcast';

/** Siren artwork per API priority (tinted circle baked into each PNG). */
const BADGES: Record<BroadcastPriority, ImageSourcePropType> = {
  LOW: require('@/src/assets/icons/priority-levels-blue.png'),
  MEDIUM: require('@/src/assets/icons/priority-levels-yellow.png'),
  HIGH: require('@/src/assets/icons/priority-levels-red.png'),
};

export default function PriorityBadge({
  priority,
  size = 31,
}: {
  priority?: BroadcastPriority | null;
  size?: number;
}) {
  return (
    <Image
      source={BADGES[priority ?? 'LOW'] ?? BADGES.LOW}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
