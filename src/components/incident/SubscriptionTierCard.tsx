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

const DEFAULT_BENEFIT =
  'Spot peak times and repeat locations before they become patterns.';

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
  /** How many of the 5 benefit rows are active (highlighted). Default 3. */
  activeBenefitCount?: number;
  benefitText?: string;
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
  activeBenefitCount = 3,
  benefitText = DEFAULT_BENEFIT,
  subtitleUppercase = false,
}: SubscriptionTierCardProps) {
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
      className={`bg-white rounded-[16px] flex-col px-4 py-8 ${
        expanded ? 'border border-[#113E55]' : ''
      }`}
    >
      <View className="flex-col gap-4">
        <Text
          allowFontScaling={false}
          className="text-[17.5px] font-inter-regular text-[#113E55] leading-[17.5px]"
        >
          {tierLabel}
        </Text>

        <Text
          allowFontScaling={false}
          className={`text-sm font-inter-medium text-[#113E55] leading-[17.5px] ${
            subtitleUppercase ? 'uppercase' : ''
          }`}
        >
          {subtitle}
        </Text>

        <Text
          allowFontScaling={false}
          className="text-[11.2px] font-inter-normal text-[#878686] text-justify"
        >
          {description}
        </Text>

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
      </View>

      <Animated.View style={bodyStyle}>
        <View
          className="gap-3 absolute left-0 right-0 top-0"
          onLayout={onContentLayout}
          pointerEvents={expanded ? 'auto' : 'none'}
        >
          {[0, 1, 2, 3, 4].map((index) => {
            const isActive = index < activeBenefitCount;
            return (
              <View key={index} className="flex-row items-start gap-2">
                <View
                  className={`rounded-full p-[2px] mt-[2px] ${
                    isActive ? 'bg-[#CEE5ED]' : 'bg-[#EFF1F3]'
                  }`}
                >
                  <MaterialIcons
                    name="check"
                    size={12}
                    color={isActive ? '#113E55' : '#A0AAB0'}
                  />
                </View>
                <Text
                  allowFontScaling={false}
                  className={`text-[11.2px] font-inter-regular flex-1 leading-[16px] text-justify ${
                    isActive ? 'text-[#8A9A9D]' : 'text-[#B5BFC4]'
                  }`}
                >
                  {benefitText}
                </Text>
              </View>
            );
          })}

          <Pressable
            disabled={isSubscribing || !expanded}
            onPress={onActivate}
            className="w-full h-[48px] bg-[#113E55] rounded-full items-center justify-center mt-1"
          >
            {isSubscribing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text
                allowFontScaling={false}
                className="text-[14px] font-inter-medium text-white"
              >
                {isInstalled ? 'Installed' : 'Activate'}
              </Text>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
