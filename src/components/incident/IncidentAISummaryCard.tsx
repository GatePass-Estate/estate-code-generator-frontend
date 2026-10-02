import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  LayoutAnimationConfig,
} from 'react-native-reanimated';
import type { AISummaryVariant } from '@/src/components/incident/IncidentAISummaryModal';
import images from '@/src/constants/images';
import AiSummaryLockSvg from '@/src/assets/icons/ai-summary-lock.svg';
import AiSummaryExpandSvg from '@/src/assets/icons/ai-summary-expand.svg';
import MetaChips from './AISummaryMetaChips';

export type InsightMode = 'idle' | 'generated' | 'locked';

const EASE_OUT = Easing.bezier(0.25, 0.1, 0.25, 1);
const CONTENT_FADE_IN = FadeIn.duration(260).easing(EASE_OUT);
const CARD_RISE_IN = FadeInDown.duration(380).easing(EASE_OUT);

export type AISummarySlide = {
  variant: AISummaryVariant;
  text?: string;
  readTimeLabel?: string | null;
  sourceLabel: string;
};

type IncidentAISummaryCardProps = {
  mode: InsightMode;
  /** Idle → generate / view. */
  onPress: () => void;
  onUpgradePress?: () => void;
  /** Generated → one swipeable card per summary source. */
  slides?: AISummarySlide[];
  onOpenSlide?: (variant: AISummaryVariant) => void;
  /** Chip labels for the locked card. */
  readTimeLabel?: string | null;
  sourceLabel?: string | null;
  isLoading?: boolean;
  /** Overview says a summary already exists for this window → "Tap to view". */
  alreadyGenerated?: boolean;
};

function InsightLogo() {
  return <Image source={images.insightLogo} className="h-[36px] w-[33px]" resizeMode="contain" />;
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
  readTimeLabel?: string | null;
  sourceLabel?: string | null;
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
  readTimeLabel?: string | null;
  sourceLabel?: string | null;
}) {
  const preview = summaryText?.trim() || '';

  return (
    <Pressable
      onPress={onExpand}
      accessibilityRole="button"
      accessibilityLabel={`Open ${sourceLabel ?? ''} AI Summary`}
      className="w-full grow overflow-hidden rounded-[16px] bg-white px-5 pb-5 pt-6"
    >
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

      {!!preview && (
        <Text
          allowFontScaling={false}
          numberOfLines={5}
          ellipsizeMode="tail"
          className="mt-[7px] text-[12px] font-inter-regular leading-5 text-[#8A9A9D]"
        >
          {preview}
        </Text>
      )}
    </Pressable>
  );
}

const SLIDE_GAP = 12;

function SummarySlider({
  slides,
  onOpen,
}: {
  slides: AISummarySlide[];
  onOpen: (variant: AISummaryVariant) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const interval = width + SLIDE_GAP;

  return (
    <View
      className="mt-4 w-full"
      onLayout={(e) => setWidth(Math.round(e.nativeEvent.layout.width))}
    >
      {width > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          nestedScrollEnabled
          directionalLockEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={interval}
          decelerationRate="fast"
          disableIntervalMomentum
          scrollEventThrottle={16}
          contentContainerStyle={{ gap: SLIDE_GAP }}
          onScroll={(e) => {
            const next = Math.round(e.nativeEvent.contentOffset.x / interval);
            setIndex((prev) => (prev === next ? prev : next));
          }}
        >
          {slides.map((slide) => (
            <View key={slide.variant} style={{ width }}>
              <LoadedSummaryCard
                summaryText={slide.text}
                onExpand={() => onOpen(slide.variant)}
                readTimeLabel={slide.readTimeLabel?.trim() || '2 mins Read'}
                sourceLabel={slide.sourceLabel}
              />
            </View>
          ))}
        </ScrollView>
      ) : null}

      {slides.length > 1 ? (
        <View className="mt-3 flex-row items-center justify-center gap-1.5">
          {slides.map((slide, i) => (
            <Pressable
              key={slide.variant}
              onPress={() => {
                setIndex(i);
                scrollRef.current?.scrollTo({ x: i * interval, animated: true });
              }}
              hitSlop={8}
              className={`h-1.5 rounded-full ${
                i === index ? 'w-4 bg-[#113E55]' : 'w-1.5 bg-[#C4CDD0]'
              }`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function EmptyGenerateCard({
  onPress,
  isLoading,
  alreadyGenerated,
}: {
  onPress: () => void;
  isLoading: boolean;
  alreadyGenerated: boolean;
}) {
  return (
    <Pressable
      onPress={isLoading ? undefined : onPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={alreadyGenerated ? 'View AI insight' : 'Generate AI insight'}
      className="mt-4 h-[232px] w-full items-center justify-center overflow-hidden rounded-[16px] bg-[#F6F7F7]"
    >
      {isLoading ? (
        <Animated.View
          key="loading"
          entering={CONTENT_FADE_IN}
          className="w-[281px] items-center gap-3"
        >
          <ActivityIndicator size="large" color="#113E55" />
          <Text
            allowFontScaling={false}
            className="text-center text-[11.2px] font-inter-regular leading-[normal] text-[#878686]"
          >
            {alreadyGenerated ? 'Loading AI insight…' : 'Generating AI insight…'}
          </Text>
        </Animated.View>
      ) : (
        <Animated.View key="idle" entering={CONTENT_FADE_IN} className="w-[281px] items-center">
          <InsightLogo />
          <Text
            allowFontScaling={false}
            className="mt-2.5 text-center text-[11.2px] font-inter-regular leading-[normal] text-[#878686]"
          >
            {alreadyGenerated ? 'Tap to view' : 'Tap to generate'} AI Insight on{'\n'}your report
          </Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

export default function IncidentAISummaryCard({
  mode,
  onPress,
  onUpgradePress,
  slides = [],
  onOpenSlide,
  readTimeLabel,
  sourceLabel,
  isLoading = false,
  alreadyGenerated = false,
}: IncidentAISummaryCardProps) {
  // Figma AI Summary meta chips (6592:7367) — use API labels when present.
  const resolvedReadTime = readTimeLabel?.trim() || '2 mins Read';
  const resolvedSource = sourceLabel?.trim() || 'Third Party';

  const state =
    mode === 'locked' && !isLoading
      ? 'locked'
      : mode === 'generated' && !isLoading && slides.length
        ? 'generated'
        : 'empty';

  return (
    // Skip the entrance on first paint; animate only when the card changes state.
    <LayoutAnimationConfig skipEntering>
      <Animated.View key={state} entering={state === 'empty' ? CONTENT_FADE_IN : CARD_RISE_IN}>
        {state === 'locked' ? (
          <LockedSummaryCard
            onUpgradePress={onUpgradePress}
            readTimeLabel={resolvedReadTime}
            sourceLabel={resolvedSource}
          />
        ) : state === 'generated' ? (
          <SummarySlider slides={slides} onOpen={onOpenSlide ?? (() => onPress())} />
        ) : (
          <EmptyGenerateCard
            onPress={onPress}
            isLoading={isLoading}
            alreadyGenerated={alreadyGenerated}
          />
        )}
      </Animated.View>
    </LayoutAnimationConfig>
  );
}
