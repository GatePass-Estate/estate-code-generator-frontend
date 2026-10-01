import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { MarketplaceDataInsight } from '@/src/types/aiMarketplace';

const PAGE_DURATION = 6000;
const BUBBLE_MS = 2000;
/** Figma frames are 375 wide; the status bar in them is 44 tall. */
const FRAME_WIDTH = 375;
const FRAME_STATUS_BAR = 44;
const IMAGE_HEIGHT = 250;

type Box = { left: number; top: number; width?: number };

type StoryPage = {
  step: number;
  title?: { top: number; text: string };
  subtitle: Box & { text: string };
  /** `gapBelowImage` pins the body under the image (whose height scales with width). */
  body: Box & { text: string; gapBelowImage?: number };
  badge: Box;
  image: { top: number; source: ImageSourcePropType };
};

/** Positions are the Figma frame coordinates (nodes 8322:2952 … 8322:3013). */
const PAGES: StoryPage[] = [
  {
    step: 1,
    title: { top: 174, text: 'How Incident Report Scan Works' },
    badge: { left: 24, top: 316 },
    subtitle: { left: 70, top: 318, width: 181, text: 'What happens ?' },
    body: {
      left: 70,
      top: 343,
      width: 273,
      text: 'When an estate asks for an incident report summary, the system reviews the incidents in that period — titles, categories, and what people wrote — and turns a long list of separate reports into one clear overview.',
    },
    image: { top: 415, source: require('@/src/assets/images/incident-info-1.jpg') },
  },
  {
    step: 2,
    badge: { left: 21, top: 236 },
    subtitle: { left: 67, top: 237, width: 181, text: 'Why it exists ?' },
    body: {
      left: 67,
      top: 262,
      width: 268,
      text: 'Estates often have many incidents over weeks or months. This helps admins and security see what keeps coming up — recurring issues, busy times, or themes — without reading every report one by one.',
    },
    image: { top: 413, source: require('@/src/assets/images/incident-info-2.jpg') },
  },
  {
    step: 3,
    badge: { left: 24, top: 300 },
    subtitle: { left: 73, top: 296, width: 181, text: 'What it looks at ?' },
    body: {
      left: 74,
      top: 320,
      width: 273,
      text: 'It only uses incident reports for that estate in the chosen date range. It looks for patterns across those reports: similar wording, shared categories, and when things tend to happen. It does not pull in unrelated data from outside the estate.',
    },
    image: { top: 413, source: require('@/src/assets/images/incident-info-3.jpg') },
  },
  {
    step: 4,
    badge: { left: 21, top: 203 },
    subtitle: { left: 66, top: 213, width: 181, text: 'What you get ?' },
    body: {
      left: 21,
      top: 479,
      gapBelowImage: 16,
      width: 314,
      text: 'Everyone gets a theme-style overview: the main kinds of incidents that showed up, how common each theme was, and a plain-language summary of timing (for example, weekends or certain times of day). Where the estate has the paid capability, they also get a deeper written summary — key patterns, a severity-style read, suggested follow-ups, and honest notes on what the data can and cannot tell you.',
    },
    image: { top: 213, source: require('@/src/assets/images/incident-info-4.jpg') },
  },
  {
    step: 5,
    badge: { left: 16, top: 193 },
    subtitle: { left: 67, top: 198, width: 181, text: 'What it does not do?' },
    body: {
      left: 66,
      top: 223,
      width: 273,
      text: 'It does not decide guilt, assign blame, or replace a formal investigation. It does not invent incidents or facts that were not in the reports. It supports decision-making by highlighting what the reports collectively suggest — humans still own the final call.',
    },
    image: { top: 329, source: require('@/src/assets/images/incident-info-5.jpg') },
  },
];

const cleanLines = (lines?: string[]) => (lines ?? []).map((l) => l.trim()).filter(Boolean);

function ProgressBar({
  index,
  currentIndex,
  progress,
}: {
  index: number;
  currentIndex: number;
  progress: SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => ({
    width:
      index < currentIndex ? '100%' : index === currentIndex ? `${progress.value * 100}%` : '0%',
  }));

  return (
    <View className="h-1 w-[65px] overflow-hidden rounded-lg bg-[#D3D3D3]">
      <Animated.View className="h-full bg-[#113E55]" style={fillStyle} />
    </View>
  );
}

/**
 * One story page laid out at fixed Figma coordinates. `offsetY` maps the
 * Figma status bar onto the device's, so every page lines up identically.
 */
function StoryPageView({
  page,
  offsetY,
  screenWidth,
}: {
  page: StoryPage;
  offsetY: number;
  screenWidth: number;
}) {
  const y = (top: number) => top + offsetY;
  const imageHeight = (screenWidth / FRAME_WIDTH) * IMAGE_HEIGHT;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={page.image.source}
        resizeMode="cover"
        style={{
          position: 'absolute',
          left: 0,
          top: y(page.image.top),
          width: screenWidth,
          height: imageHeight,
        }}
      />

      {page.title ? (
        <Text
          allowFontScaling={false}
          className="absolute text-center text-[34.18px] font-ubuntu-bold text-[#113E55]"
          style={{ top: y(page.title.top), width: 313, left: (screenWidth - 313) / 2 }}
        >
          {page.title.text}
        </Text>
      ) : null}

      <View
        className="absolute w-[37px] items-center justify-center rounded-full bg-[#CEE5ED] p-2.5"
        style={{ left: page.badge.left, top: y(page.badge.top) }}
      >
        <Text
          allowFontScaling={false}
          className="w-full text-center text-sm font-inter-medium text-[#113E55]"
        >
          {page.step}
        </Text>
      </View>

      <Text
        allowFontScaling={false}
        className="absolute text-sm font-inter-medium text-[#0A1F29]"
        style={{ left: page.subtitle.left, top: y(page.subtitle.top), width: page.subtitle.width }}
      >
        {page.subtitle.text}
      </Text>

      <Text
        allowFontScaling={false}
        className="absolute text-sm font-inter-light text-[#0A1F29]"
        style={{
          left: page.body.left,
          top:
            page.body.gapBelowImage != null
              ? y(page.image.top) + imageHeight + page.body.gapBelowImage
              : y(page.body.top),
          width: page.body.width,
        }}
      >
        {page.body.text}
      </Text>
    </View>
  );
}

function InsightRow({ text, label, symbol }: { text: string; label: string; symbol: string }) {
  const [showBubble, setShowBubble] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  const flashBubble = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowBubble(true);
    hideTimer.current = setTimeout(() => setShowBubble(false), BUBBLE_MS);
  };

  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        {showBubble ? (
          <Animated.View
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(180)}
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: -12,
              bottom: '100%',
              marginBottom: 4,
              maxWidth: '85%',
              alignItems: 'flex-end',
              zIndex: 10,
              elevation: 4,
            }}
          >
            <View
              style={{
                backgroundColor: '#113E55',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#FFFFFF' }}
              >
                {label}
              </Text>
            </View>
            <View
              style={{
                width: 10,
                height: 10,
                marginTop: -5,
                marginRight: 16,
                borderBottomRightRadius: 2,
                backgroundColor: '#113E55',
                transform: [{ rotate: '45deg' }],
              }}
            />
          </Animated.View>
        ) : null}
        <Text
          allowFontScaling={false}
          style={{
            flex: 1,
            fontFamily: 'Inter_18pt-Regular',
            fontSize: 13,
            color: '#8A9A9D',
            lineHeight: 18,
          }}
        >
          {text}
        </Text>
        <Pressable
          onPress={flashBubble}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#113E55',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            allowFontScaling={false}
            style={{ color: '#FFFFFF', fontSize: 11, fontFamily: 'UbuntuSans-Bold' }}
          >
            {symbol}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function InsightListSheet({
  dataLines,
  legalLines,
  onClose,
}: {
  dataLines: string[];
  legalLines: string[];
  onClose: () => void;
}) {
  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <View style={{ flex: 1 }} />
      <View
        style={{
          backgroundColor: '#F6F7F7',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          maxHeight: '90%',
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 40,
        }}
      >
        <View style={{ paddingBottom: 24 }}>
          <View
            style={{
              width: 60,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#D9D9D9',
              alignSelf: 'center',
            }}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'UbuntuSans-Medium',
              fontSize: 32,
              color: '#113E55',
              marginBottom: 12,
            }}
          >
            Data Insight
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Inter_18pt-Regular',
              fontSize: 13,
              color: '#8A9A9D',
              marginBottom: 24,
              lineHeight: 18,
            }}
          >
            No complicated reports. Get simple insights that help you understand what&apos;s
            happening and why.
          </Text>

          <View style={{ gap: 16 }}>
            {dataLines.map((text, index) => (
              <InsightRow key={`data-${index}`} text={text} label="Data Collected" symbol="?" />
            ))}
            {legalLines.map((text, index) => (
              <InsightRow key={`legal-${index}`} text={text} label="Legal Context" symbol="§" />
            ))}
          </View>
        </ScrollView>

        <Pressable
          onPress={onClose}
          style={{
            backgroundColor: '#113E55',
            paddingVertical: 16,
            borderRadius: 32,
            alignItems: 'center',
            marginTop: 24,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#FFFFFF' }}
          >
            I understand
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function IncidentDataInsightModal({
  visible,
  onClose,
  dataInsight,
}: {
  visible: boolean;
  onClose: () => void;
  dataInsight?: MarketplaceDataInsight | null;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const offsetY = insets.top - FRAME_STATUS_BAR;
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showList, setShowList] = useState(false);
  const progress = useSharedValue(0);

  const dataLines = cleanLines(dataInsight?.data);
  const legalLines = cleanLines(dataInsight?.legal);

  const goToNextPage = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (currentPage < PAGES.length - 1) setCurrentPage((p) => p + 1);
    else setShowList(true);
  }, [currentPage, progress]);

  const goToPrevPage = () => {
    cancelAnimation(progress);
    progress.value = 0;
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  };

  useEffect(() => {
    if (!visible) return;
    setCurrentPage(0);
    setIsPaused(false);
    setShowList(false);
    progress.value = 0;
  }, [visible, progress]);

  useEffect(() => {
    if (!visible || showList) return;
    if (isPaused) {
      cancelAnimation(progress);
      return;
    }
    const from = progress.value >= 1 ? 0 : progress.value;
    progress.value = from;
    progress.value = withTiming(
      1,
      { duration: PAGE_DURATION * (1 - from), easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(goToNextPage)();
      }
    );
    return () => cancelAnimation(progress);
  }, [visible, showList, isPaused, currentPage, goToNextPage, progress]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      // Only "I understand" dismisses; Android back is ignored.
      onRequestClose={() => {}}
    >
      {showList ? (
        <InsightListSheet dataLines={dataLines} legalLines={legalLines} onClose={onClose} />
      ) : (
        <View className="flex-1 overflow-hidden bg-[#F6F7F7]">
          <StoryPageView page={PAGES[currentPage]} offsetY={offsetY} screenWidth={width} />

          <View
            className="absolute left-0 right-0 flex-row justify-center gap-[5px]"
            style={{ top: offsetY + 83.86 }}
            pointerEvents="none"
          >
            {PAGES.map((page, i) => (
              <ProgressBar
                key={page.step}
                index={i}
                currentIndex={currentPage}
                progress={progress}
              />
            ))}
          </View>

          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
            <Pressable
              style={{ flex: 0.3 }}
              onPress={goToPrevPage}
              onPressIn={() => setIsPaused(true)}
              onPressOut={() => setIsPaused(false)}
            />
            <Pressable
              style={{ flex: 0.7 }}
              onPress={goToNextPage}
              onPressIn={() => setIsPaused(true)}
              onPressOut={() => setIsPaused(false)}
            />
          </View>
        </View>
      )}
    </Modal>
  );
}
