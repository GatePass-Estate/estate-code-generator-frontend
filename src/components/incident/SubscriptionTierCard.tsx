import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BenefitsChevronIcon } from '@/src/assets/svgs';

const EXPAND = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

type SubscriptionTierCardProps = {
  tierLabel: string;
  subtitle: string;
  description: string;
  expanded: boolean;
  onToggle: () => void;
  onActivate: () => void;
  isSubscribing?: boolean;
  isInstalled?: boolean;
  /** Benefit rows from the API (tier description split). */
  benefits?: string[];
  subtitleUppercase?: boolean;
};

export default function SubscriptionTierCard({
  tierLabel,
  subtitle,
  description,
  expanded,
  onToggle,
  onActivate,
  isSubscribing = false,
  isInstalled = false,
  benefits,
  subtitleUppercase = false,
}: SubscriptionTierCardProps) {
  const benefitRows =
    benefits && benefits.length > 0 ? benefits : description.trim() ? [description.trim()] : [];
  const chevronRotation = useSharedValue(expanded ? 90 : 0);
  const progress = useSharedValue(expanded ? 1 : 0);
  const measuredHeight = useSharedValue(0);

  useEffect(() => {
    chevronRotation.value = withTiming(expanded ? 90 : 0, EXPAND);
    progress.value = withTiming(expanded ? 1 : 0, EXPAND);
  }, [expanded, chevronRotation, progress]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const bodyStyle = useAnimatedStyle(() => ({
    height: measuredHeight.value * progress.value,
    opacity: progress.value,
    overflow: 'hidden' as const,
    marginTop: 16 * progress.value,
  }));

  const onContentLayout = (e: LayoutChangeEvent) => {
    const next = Math.ceil(e.nativeEvent.layout.height);
    if (next > 0 && Math.abs(next - measuredHeight.value) > 1) {
      measuredHeight.value = next;
    }
  };

  return (
    <View
      className={`flex-col rounded-[16px] bg-white px-4 py-8 ${
        expanded ? 'border border-[#113E55]' : ''
      }`}
    >
      <View className="flex-col gap-4">
        <Text
          allowFontScaling={false}
          className="text-[17.5px] font-inter-regular leading-[17.5px] text-[#113E55]"
        >
          {tierLabel}
        </Text>

        {subtitle ? (
          <Text
            allowFontScaling={false}
            className={`text-sm font-inter-medium leading-[17.5px] text-[#113E55] ${
              subtitleUppercase ? 'uppercase' : ''
            }`}
          >
            {subtitle}
          </Text>
        ) : null}

        {description ? (
          <Text
            allowFontScaling={false}
            className="text-justify text-[11.2px] font-inter-normal text-[#878686]"
          >
            {description}
          </Text>
        ) : null}

        {benefitRows.length > 0 ? (
          <Pressable onPress={onToggle} className="flex-row items-center gap-1.5">
            <Text
              allowFontScaling={false}
              className="text-[11.2px] font-inter-normal text-[#113E55]"
            >
              See benefits
            </Text>
            <Animated.View style={chevronStyle}>
              <BenefitsChevronIcon width={21} height={20} />
            </Animated.View>
          </Pressable>
        ) : (
          <Pressable
            disabled={isSubscribing}
            onPress={onActivate}
            className="mt-1 h-[48px] w-full items-center justify-center rounded-full bg-[#113E55]"
          >
            {isSubscribing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-white">
                {isInstalled ? 'Installed' : 'Activate'}
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {benefitRows.length > 0 ? (
        <Animated.View style={bodyStyle}>
          <View
            className="absolute left-0 right-0 top-0 gap-3"
            onLayout={onContentLayout}
            pointerEvents={expanded ? 'auto' : 'none'}
          >
            {benefitRows.map((text, index) => (
              <View key={`${index}-${text.slice(0, 24)}`} className="flex-row items-start gap-2">
                <View className="mt-[2px] rounded-full bg-[#CEE5ED] p-[2px]">
                  <MaterialIcons name="check" size={12} color="#113E55" />
                </View>
                <Text
                  allowFontScaling={false}
                  className="flex-1 text-justify text-[11.2px] font-inter-regular leading-[16px] text-[#8A9A9D]"
                >
                  {text}
                </Text>
              </View>
            ))}

            <Pressable
              disabled={isSubscribing || !expanded}
              onPress={onActivate}
              className="mt-1 h-[48px] w-full items-center justify-center rounded-full bg-[#113E55]"
            >
              {isSubscribing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-white">
                  {isInstalled ? 'Installed' : 'Activate'}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
