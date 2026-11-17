import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { IncidentCategoryIcon } from '@/src/features/ai/components/incidents/categoryIcons';
import {
  type IncidentCategory,
  OTHERS_BUCKET_ID,
} from '@/src/features/ai/components/incidents/incidentTypes';
import {
  CATEGORY_EASE_OUT,
  CATEGORY_TRANSITION_MS,
} from '@/src/features/ai/components/incidents/result/categoryMotion';

/** 0 → 1 as `active` toggles, eased. */
function useActiveProgress(active: boolean) {
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, {
      duration: CATEGORY_TRANSITION_MS,
      easing: CATEGORY_EASE_OUT,
    });
  }, [active, progress]);
  return progress;
}

export function PageDot({ active, onPress }: { active: boolean; onPress: () => void }) {
  const progress = useActiveProgress(active);
  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#D3D3D3', '#113E55']),
  }));
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5 }, dotStyle]} />
    </Pressable>
  );
}

function ActiveBubbleRing({ size, id }: { size: number; id: string }) {
  const svgSize = size + 4;
  const center = svgSize / 2;
  const gradId = `activeBubble-${id}`;
  return (
    <Svg width={svgSize} height={svgSize} style={{ position: 'absolute', left: 0, top: 0 }}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0C72A6" stopOpacity={0.44} />
          <Stop offset="1" stopColor="#0783C2" stopOpacity={0.44} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={center}
        cy={center}
        r={size / 2}
        fill="#113E55"
        stroke={`url(#${gradId})`}
        strokeWidth={2}
      />
    </Svg>
  );
}

function formatBubbleShare(share: number): string {
  return String(Math.round(Number(share) || 0));
}

function iconSizeForBubble(size: number) {
  if (size >= 54) return 22;
  if (size >= 40) return 16;
  if (size >= 28) return 12;
  return 10;
}

function BubbleContent({
  category,
  size,
  isSelected,
}: {
  category: IncidentCategory;
  size: number;
  isSelected: boolean;
}) {
  const isOthersBucket = category.id === OTHERS_BUCKET_ID;
  const iconColor = isSelected ? '#F6F7F7' : '#113E55';
  const showPct = isSelected && !isOthersBucket;
  const iconSz = iconSizeForBubble(size);

  if (isOthersBucket) {
    return (
      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <IncidentCategoryIcon
          category={category.apiCategory}
          color={iconColor}
          size={Math.max(12, size * 0.45)}
          filled
        />
      </View>
    );
  }

  if (showPct && size >= 54) {
    return (
      <View className="items-center gap-1">
        <IncidentCategoryIcon
          category={category.apiCategory}
          color={iconColor}
          size={iconSz}
          filled
        />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="text-caption font-inter-semibold leading-[14px] text-[#F6F7F7]"
        >
          {formatBubbleShare(category.share)}%
        </Text>
      </View>
    );
  }

  if (showPct && size >= 40) {
    return (
      <View className="items-center justify-center gap-0.5 px-0.5">
        <IncidentCategoryIcon category={category.apiCategory} color="#F6F7F7" size={12} filled />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          className="text-center text-2xs font-inter-medium leading-[11px] text-[#F6F7F7]"
        >
          {formatBubbleShare(category.share)}%
        </Text>
      </View>
    );
  }

  if (showPct) {
    return (
      <View className="items-center justify-center gap-0.5 px-0.5">
        <IncidentCategoryIcon
          category={category.apiCategory}
          color="#F6F7F7"
          size={iconSz}
          filled
        />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          className="text-center text-[6.8px] font-inter-semibold leading-[8px] text-[#F6F7F7]"
        >
          {formatBubbleShare(category.share)}%
        </Text>
      </View>
    );
  }

  return (
    <IncidentCategoryIcon
      category={category.apiCategory}
      color={iconColor}
      size={iconSz}
      filled={isSelected}
    />
  );
}

export function CategoryBubble({
  category,
  layout,
  isSelected,
  onPress,
}: {
  category: IncidentCategory;
  layout: { size: number; left: number; top: number };
  isSelected: boolean;
  onPress: () => void;
}) {
  const progress = useActiveProgress(isSelected);
  const contentOpacity = useSharedValue(1);
  const didMount = useRef(false);
  const boxSize = layout.size + 4;

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    contentOpacity.value = 0;
    contentOpacity.value = withTiming(1, {
      duration: CATEGORY_TRANSITION_MS,
      easing: CATEGORY_EASE_OUT,
    });
  }, [isSelected, contentOpacity]);

  const ringStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const whiteStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        left: layout.left - 2,
        top: layout.top - 2,
        width: boxSize,
        height: boxSize,
      }}
    >
      <View style={{ width: boxSize, height: boxSize }}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: layout.size,
              height: layout.size,
              left: 2,
              top: 2,
              borderRadius: layout.size / 2,
              backgroundColor: '#FFFFFF',
            },
            whiteStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 0, top: 0, width: boxSize, height: boxSize },
            ringStyle,
          ]}
        >
          <ActiveBubbleRing size={layout.size} id={category.id} />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: 'center',
              justifyContent: 'center',
            },
            contentStyle,
          ]}
        >
          <BubbleContent category={category} size={layout.size} isSelected={isSelected} />
        </Animated.View>
      </View>
    </Pressable>
  );
}
