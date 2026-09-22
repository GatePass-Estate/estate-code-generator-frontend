import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import images from '@/src/constants/images';
import { AI_SUMMARY_PREVIEW } from './incidentMockData';
import AiSummaryLockSvg from '@/src/assets/icons/ai-summary-lock.svg';
import AiSummaryTimeSvg from '@/src/assets/icons/ai-summary-time.svg';
import AiSummaryThirdPartySvg from '@/src/assets/icons/ai-summary-third-party.svg';

export type InsightMode = 'idle' | 'generated' | 'locked';

type IncidentAISummaryCardProps = {
  mode: InsightMode;
  onPress: () => void;
  /** Figma 6603:2431 — Upgrade Plan CTA when locked. */
  onUpgradePress?: () => void;
  /** Live executive summary when generated; falls back to mock preview. */
  summaryText?: string;
  isLoading?: boolean;
};

function InsightLogo() {
  return (
    <Image
      source={images.insightLogo}
      className="h-[36px] w-[33px]"
      resizeMode="contain"
    />
  );
}

function LockedSummaryCard({ onUpgradePress }: { onUpgradePress?: () => void }) {
  return (
    /* Figma 6603:2431 — locked AI Summary paywall */
    <View className="mt-4 w-full overflow-hidden rounded-[16px] bg-white px-5 pb-5 pt-6">
      <Text
        allowFontScaling={false}
        className="text-[17.5px] font-inter-regular leading-[17.5px] text-[#0A1F29]"
      >
        AI Summary
      </Text>

      <View className="mt-2 flex-row items-center gap-1">
        <View className="h-5 flex-row items-center gap-1 rounded-lg bg-[#FFF8F5] p-1">
          <AiSummaryTimeSvg width={12} height={12} />
          <Text
            allowFontScaling={false}
            className="text-[8.96px] font-inter-medium text-[#F46036]"
          >
            2 mins Read
          </Text>
        </View>
        <View className="h-5 flex-row items-center gap-1 rounded-lg bg-[#F4FFFE] p-1">
          <AiSummaryThirdPartySvg width={12} height={12} />
          <Text
            allowFontScaling={false}
            className="text-[8.96px] font-inter-medium text-[#167A6F]"
          >
            Third Party
          </Text>
        </View>
      </View>

      {/* Exact Figma 6603:2433 blurred copy — full card width */}
      <View className="relative mt-[17px] h-[70px] w-full overflow-hidden">
        <Image
          source={images.aiSummaryBlurredCopy}
          className="h-[70px] w-full"
          resizeMode="stretch"
        />
        <View
          pointerEvents="none"
          className="absolute inset-0 items-center justify-center"
        >
          <AiSummaryLockSvg width={36} height={50} />
        </View>
      </View>

      <Pressable
        onPress={onUpgradePress}
        className="mt-5 h-11 w-full max-w-[278px] self-center items-center justify-center rounded-3xl bg-[#E5F6FF] px-6"
        hitSlop={8}
      >
        <Text
          allowFontScaling={false}
          className="text-center text-sm font-ubuntu-semibold tracking-[-0.24px] text-[#113E55]"
        >
          Upgrade Plan
        </Text>
      </Pressable>
    </View>
  );
}

export default function IncidentAISummaryCard({
  mode,
  onPress,
  onUpgradePress,
  summaryText,
  isLoading = false,
}: IncidentAISummaryCardProps) {
  const preview = summaryText?.trim() || AI_SUMMARY_PREVIEW;

  if (mode === 'locked' && !isLoading) {
    return <LockedSummaryCard onUpgradePress={onUpgradePress} />;
  }

  return (
    <Pressable
      onPress={isLoading ? undefined : onPress}
      disabled={isLoading}
      className="mx-auto mt-4 w-full items-center px-4"
    >
      <View className="h-[232px] w-full items-center justify-center overflow-hidden rounded-[16px] bg-[#F6F7F7]">
        {isLoading ? (
          <View className="w-[281px] items-center gap-3">
            <ActivityIndicator size="large" color="#113E55" />
            <Text className="text-center text-[11.2px] font-inter-regular leading-[16px] text-[#878686]">
              Generating AI insight…
            </Text>
          </View>
        ) : mode === 'generated' ? (
          <View className="w-[281px] items-center">
            <InsightLogo />
            <Text className="mt-4 text-center text-[11.2px] font-inter-regular leading-[16px] text-[#878686]">
              {preview}
            </Text>
            <Text className="mt-3 text-center text-[11.2px] font-inter-semibold text-[#113E55]">
              Tap to expand
            </Text>
          </View>
        ) : (
          <View className="w-[281px] items-center">
            <InsightLogo />
            <Text className="mt-3 text-center text-[11.2px] font-inter-regular leading-[16px] text-[#878686]">
              Tap to generate AI Insight on{'\n'}your report
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
