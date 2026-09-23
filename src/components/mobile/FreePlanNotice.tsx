import { useEffect, useRef, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { WarningLineIcon } from '@/src/assets/svgs';
import { PlanFeature, getFreePlanNoticeCopy } from '@/src/lib/plans';

const FADE_IN = { duration: 360, easing: Easing.bezier(0.33, 0, 0.2, 1) };
const FADE_OUT = { duration: 200, easing: Easing.out(Easing.cubic) };
const SPACE = { duration: 320, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const SPACE_IN = { duration: 360, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const NOTICE_FALLBACK_HEIGHT = 126;

export default function FreePlanNotice({ feature }: { feature: PlanFeature }) {
  return (
    <View
      className="items-center justify-center self-center rounded-[24px] bg-[#E5F6FF] p-2.5"
      style={{ gap: 10 }}
    >
      <WarningLineIcon width={24} height={24} color="#113E55" />
      <Text
        className="text-center font-inter-medium text-[#113E55] mb-0.5"
        style={{ maxWidth: 297, fontSize: 14, lineHeight: 18 }}
      >
        {getFreePlanNoticeCopy(feature)}
      </Text>
    </View>
  );
}

function NoticeCard({ feature }: { feature: PlanFeature }) {
  return (
    <View className="mb-6 items-center">
      <FreePlanNotice feature={feature} />
    </View>
  );
}

/** Hide: fade to 0, then buttons ease up. Show: fade in immediately while buttons ease down. */
export function PlanNoticeSlot({
  visible,
  feature,
  children,
}: {
  visible: boolean;
  feature: PlanFeature;
  children: ReactNode;
}) {
  const opacity = useSharedValue(0);
  const open = useSharedValue(0);
  const blockHeight = useSharedValue(NOTICE_FALLBACK_HEIGHT);
  const shown = useSharedValue(0);
  const hasMounted = useRef(false);

  useEffect(() => {
    shown.value = visible ? 1 : 0;

    if (!hasMounted.current) {
      hasMounted.current = true;
      if (visible) {
        open.value = 1;
        opacity.value = 1;
      }
      return;
    }

    cancelAnimation(opacity);
    cancelAnimation(open);

    if (visible) {
      opacity.value = withTiming(1, FADE_IN);
      open.value = withTiming(1, SPACE_IN);
      return;
    }

    opacity.value = withTiming(0, FADE_OUT, (finished) => {
      if (finished && shown.value === 0) {
        open.value = withTiming(0, SPACE);
      }
    });
  }, [visible, opacity, open, shown]);

  const spacerStyle = useAnimatedStyle(() => ({
    height: interpolate(open.value, [0, 1], [0, blockHeight.value]),
  }));

  const noticeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: interpolate(opacity.value, [0, 1], [10, 0]) }],
  }));

  return (
    <View>
      <View>
        <View
          pointerEvents="none"
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            if (nextHeight > 0) blockHeight.set(nextHeight);
          }}
          style={{ position: 'absolute', opacity: 0, left: 0, right: 0 }}
        >
          <NoticeCard feature={feature} />
        </View>
        <Animated.View style={spacerStyle} />
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          accessibilityElementsHidden={!visible}
          importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}
          style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, noticeStyle]}
        >
          <NoticeCard feature={feature} />
        </Animated.View>
      </View>
      {children}
    </View>
  );
}
