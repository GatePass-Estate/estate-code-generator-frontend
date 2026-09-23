import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import images from '@/src/constants/images';
import AiSummaryLockSvg from '@/src/assets/icons/ai-summary-lock.svg';
import AiSummaryTimeSvg from '@/src/assets/icons/ai-summary-time.svg';
import AiSummaryThirdPartySvg from '@/src/assets/icons/ai-summary-third-party.svg';
import AiSummaryExpandSvg from '@/src/assets/icons/ai-summary-expand.svg';

export type InsightMode = 'idle' | 'generated' | 'locked';

type IncidentAISummaryCardProps = {
  mode: InsightMode;
  /** Idle → generate; generated → expand overlay (also used by primary expand button). */
  onPress: () => void;
  onUpgradePress?: () => void;
  /** Live executive summary when generated. */
  summaryText?: string;
  /** Chip labels from API — only shown when we have a report. */
  readTimeLabel?: string | null;
  sourceLabel?: string | null;
  isLoading?: boolean;
};

function InsightLogo() {
  return <Image source={images.insightLogo} className="h-[36px] w-[33px]" resizeMode="contain" />;
}

function MetaChips({
  readTimeLabel,
  sourceLabel,
  onSourcePress,
}: {
  readTimeLabel: string;
  sourceLabel: string;
  onSourcePress?: () => void;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <View className="h-5 flex-row items-center gap-1 rounded-lg bg-[#FFF8F5] p-1">
        <AiSummaryTimeSvg width={12} height={12} />
        <Text allowFontScaling={false} className="text-[8.96px] font-inter-medium text-[#F46036]">
          {readTimeLabel}
        </Text>
      </View>
      <Pressable
        onPress={onSourcePress}
        disabled={!onSourcePress}
        className="h-5 flex-row items-center gap-1 rounded-lg bg-[#F4FFFE] p-1"
        hitSlop={8}
      >
        <AiSummaryThirdPartySvg width={12} height={12} />
        <Text allowFontScaling={false} className="text-[8.96px] font-inter-medium text-[#167A6F]">
          {sourceLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function ExpandButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Expand AI Summary"
      hitSlop={8}
      className="p-2 bg-[#EFF1F1] rounded-full items-center justify-center"
    >
      <AiSummaryExpandSvg width={16} height={16} />
    </Pressable>
  );
}

function LockedSummaryCard({
  onUpgradePress,
  readTimeLabel,
  sourceLabel,
}: {
  onUpgradePress?: () => void;
  readTimeLabel: string;
  sourceLabel: string;
}) {
  return (
    <View className="mt-4 w-full overflow-hidden rounded-[16px] bg-white px-5 pb-5 pt-6">
      <Text
        allowFontScaling={false}
        className="text-[17.5px] font-inter-regular leading-[17.5px] text-[#0A1F29]"
      >
        AI Summary
      </Text>

      <View className="mt-2">
        <MetaChips readTimeLabel={readTimeLabel} sourceLabel={sourceLabel} />
      </View>

      <View className="relative mt-[17px] h-[70px] w-full overflow-hidden">
        <Image
          source={images.aiSummaryBlurredCopy}
          className="h-[70px] w-full"
          resizeMode="stretch"
        />
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
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

function LoadedSummaryCard({
  summaryText,
  onExpand,
  readTimeLabel,
  sourceLabel,
}: {
  summaryText?: string;
  onExpand: () => void;
  readTimeLabel: string;
  sourceLabel: string;
}) {
  const preview = summaryText?.trim() || 'No summary available for this window.';

  return (
    <View className="mt-4 max-h-[199px] w-full overflow-hidden rounded-[16px] bg-white px-5 pb-5 pt-6">
      <View className="flex-row items-center justify-between">
        <View className="mr-3 flex-1">
          <Text
            allowFontScaling={false}
            className="text-[17.5px] font-inter-regular leading-[17.5px] text-[#0A1F29]"
          >
            AI Summary
          </Text>
          <View className="mt-[7px]">
            <MetaChips
              readTimeLabel={readTimeLabel}
              sourceLabel={sourceLabel}
              onSourcePress={onExpand}
            />
          </View>
        </View>
        <ExpandButton onPress={onExpand} />
      </View>

      <Text
        allowFontScaling={false}
        numberOfLines={5}
        ellipsizeMode="tail"
        className="mt-[7px] text-[12px] font-inter-regular leading-5 text-[#8A9A9D]"
      >
        {preview}
      </Text>
    </View>
  );
}

function EmptyGenerateCard({ onPress, isLoading }: { onPress: () => void; isLoading: boolean }) {
  return (
    <Pressable
      onPress={isLoading ? undefined : onPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel="Generate AI insight"
      className="mt-4 h-[232px] w-full items-center justify-center overflow-hidden rounded-[16px] bg-[#F6F7F7]"
    >
      {isLoading ? (
        <View className="w-[281px] items-center gap-3">
          <ActivityIndicator size="large" color="#113E55" />
          <Text
            allowFontScaling={false}
            className="text-center text-[11.2px] font-inter-regular leading-[normal] text-[#878686]"
          >
            Generating AI insight…
          </Text>
        </View>
      ) : (
        <View className="w-[281px] items-center">
          <InsightLogo />
          <Text
            allowFontScaling={false}
            className="mt-2.5 text-center text-[11.2px] font-inter-regular leading-[normal] text-[#878686]"
          >
            Tap to generate AI Insight on{'\n'}your report
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function IncidentAISummaryCard({
  mode,
  onPress,
  onUpgradePress,
  summaryText,
  readTimeLabel,
  sourceLabel,
  isLoading = false,
}: IncidentAISummaryCardProps) {
  const resolvedReadTime = readTimeLabel?.trim() || '2 mins Read';
  const resolvedSource = sourceLabel?.trim() || 'Third Party';

  if (mode === 'locked' && !isLoading) {
    return (
      <LockedSummaryCard
        onUpgradePress={onUpgradePress}
        readTimeLabel={resolvedReadTime}
        sourceLabel={resolvedSource}
      />
    );
  }

  if (mode === 'generated' && !isLoading) {
    return (
      <LoadedSummaryCard
        summaryText={summaryText}
        onExpand={onPress}
        readTimeLabel={resolvedReadTime}
        sourceLabel={resolvedSource}
      />
    );
  }

  return <EmptyGenerateCard onPress={onPress} isLoading={isLoading} />;
}
