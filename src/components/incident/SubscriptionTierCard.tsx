import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { BenefitsChevronIcon, CheckRingIcon } from '@/src/assets/svgs';

const EXPAND = {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

/** Purchased card mint wash */
const PURCHASED_CARD_BG = '#EDF3F3';
/** ACTIVE badge fill */
const ACTIVE_BADGE_BG = '#CEE5ED';
/** Secondary Uninstall button */
const UNINSTALL_BTN_BG = '#CEE5ED';

type SubscriptionTierCardProps = {
  tierLabel: string;
  subtitle: string;
  description: string;
  expanded: boolean;
  onToggle: () => void;
  onActivate: () => void;
  onCancelSubscription?: () => void;
  onUninstall?: () => void;
  onInstall?: () => void;
  isSubscribing?: boolean;
  isInstalling?: boolean;
  isUninstalling?: boolean;
  isCanceling?: boolean;
  isInstalled?: boolean;
  isSubscribed?: boolean;
  /** Benefit rows from the API (`tier.benefits` / `tier_benefits`). */
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
  onCancelSubscription,
  onUninstall,
  onInstall,
  isSubscribing = false,
  isInstalling = false,
  isUninstalling = false,
  isCanceling = false,
  isInstalled = false,
  isSubscribed = false,
  benefits,
  subtitleUppercase = false,
}: SubscriptionTierCardProps) {
  const benefitRows = (benefits ?? []).map((text) => text.trim()).filter(Boolean);
  const canExpand = benefitRows.length > 0 || isInstalled;
  /** Green text and mint wash while the card is open, paid or not. */
  const highlighted = expanded;
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

  const showActivate = !isSubscribed;
  const showCancel = isSubscribed;
  const showInstall = isSubscribed && !isInstalled;
  const showUninstall = isInstalled;

  const buttons = (
    <View className="gap-4">
      {showActivate && (
        <Pressable
          disabled={isSubscribing || !expanded}
          onPress={onActivate}
          className="h-[48px] w-full items-center justify-center rounded-full bg-[#113E55]"
        >
          {isSubscribing ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text allowFontScaling={false} className="text-[14px] font-ubuntu-semibold text-white">
              Activate
            </Text>
          )}
        </Pressable>
      )}

      {showCancel && (
        <Pressable
          disabled={isCanceling || !expanded}
          onPress={onCancelSubscription}
          className="h-[48px] w-full items-center justify-center rounded-full bg-[#113E55]"
        >
          {isCanceling ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text allowFontScaling={false} className="text-[14px] font-ubuntu-semibold text-white">
              Cancel Subscription
            </Text>
          )}
        </Pressable>
      )}

      {showInstall && (
        <Pressable
          disabled={isInstalling || !expanded}
          onPress={onInstall}
          className="h-[48px] w-full items-center justify-center rounded-full bg-[#E5F6FF]"
        >
          {isInstalling ? (
            <ActivityIndicator size="small" color="#113E55" />
          ) : (
            <Text className="text-[14px] font-ubuntu-semibold text-[#113E55]">Install</Text>
          )}
        </Pressable>
      )}

      {showUninstall && (
        <Pressable
          disabled={isUninstalling || !expanded}
          onPress={onUninstall}
          className="h-[48px] w-full items-center justify-center rounded-full bg-[#E5F6FF]"
        >
          {isUninstalling ? (
            <ActivityIndicator size="small" color="#113E55" />
          ) : (
            <Text className="text-[14px] font-ubuntu-semibold text-[#113E55]">Uninstall</Text>
          )}
        </Pressable>
      )}
    </View>
  );

  return (
    <View
      className="flex-col rounded-[16px] px-4 py-8"
      style={{
        backgroundColor: highlighted ? PURCHASED_CARD_BG : '#FFFFFF',
        ...(highlighted ? { borderWidth: 0.6, borderColor: '#1B998B' } : null),
      }}
    >
      <View className="flex-col gap-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 flex-col justify-center gap-3">
            <Text
              allowFontScaling={false}
              className={`text-[17.5px] font-inter-regular leading-[18px] ${
                highlighted ? 'text-[#1B998B]' : 'text-[#113E55]'
              }`}
            >
              {tierLabel}
            </Text>
            {subtitle ? (
              <Text
                allowFontScaling={false}
                className={`text-sm font-inter-medium leading-[18px] ${
                  highlighted ? 'text-[#1B998B]' : 'text-[#113E55]'
                } ${subtitleUppercase ? 'uppercase' : ''}`}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          {isInstalled && expanded ? (
            <View className="shrink-0 items-center justify-center self-center rounded-[16px] bg-[#1B998B1F] px-8 py-4">
              <Text
                allowFontScaling={false}
                className="text-center text-sm font-ubuntu-semibold uppercase tracking-[-0.24px] text-[#1B998B]"
              >
                Active
              </Text>
            </View>
          ) : null}
        </View>

        {description ? (
          <Text
            allowFontScaling={false}
            className="text-justify text-[11.2px] font-inter-normal text-[#878686]"
          >
            {description}
          </Text>
        ) : null}

        {canExpand ? (
          <Pressable onPress={onToggle} className="flex-row items-center gap-1.5">
            <Text
              allowFontScaling={false}
              className={`text-[11.2px] font-inter-normal ${
                highlighted ? 'text-[#878686]' : 'text-[#113E55]'
              }`}
            >
              See benefits
            </Text>
            <Animated.View style={chevronStyle}>
              <BenefitsChevronIcon
                width={21}
                height={20}
                color={highlighted ? '#878686' : '#113E55'}
              />
            </Animated.View>
          </Pressable>
        ) : (
          buttons
        )}
      </View>

      {canExpand ? (
        <Animated.View style={bodyStyle}>
          <View
            className="absolute left-0 right-0 top-0 gap-3"
            onLayout={onContentLayout}
            pointerEvents={expanded ? 'auto' : 'none'}
          >
            {benefitRows.map((text, index) => (
              <View key={`${index}-${text.slice(0, 24)}`} className="flex-row items-start gap-2">
                <View className="mt-[2px]">
                  <CheckRingIcon
                    width={16}
                    height={16}
                    ringColor="#DFEEEA"
                    color={highlighted ? '#1B998B' : '#113E55'}
                  />
                </View>
                <Text
                  allowFontScaling={false}
                  className="flex-1 text-justify text-[11.2px] font-inter-regular leading-[16px] text-[#878686]"
                >
                  {text}
                </Text>
              </View>
            ))}

            <View className={benefitRows.length > 0 ? 'mt-10 px-3' : ''}>
              {buttons}
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
