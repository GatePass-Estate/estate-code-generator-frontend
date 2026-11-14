import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  ReduceMotion,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import type { MarketplaceDataInsight } from '@/src/features/marketplace/types/aiMarketplace';

const PAGE_DURATION = 6000;
const BUBBLE_MS = 2000;
const SEGMENT_WIDTH = 65;
/** Figma frames are 375 wide; the status bar in them is 44 tall. */
const FRAME_STATUS_BAR = 44;

const cleanLines = (lines?: string[]) => (lines ?? []).map((line) => line.trim()).filter(Boolean);

/**
 * Instagram-style segment: past = full, active = animated 0→1, future = empty.
 * Pixel width (not %) so Android doesn't jump when the active index changes.
 */
function ProgressSegment({
  index,
  activeIndex,
  progress,
}: {
  index: number;
  activeIndex: number;
  progress: SharedValue<number>;
}) {
  const fillStyle = useAnimatedStyle(() => {
    const fill = index < activeIndex ? 1 : index === activeIndex ? progress.value : 0;
    return { width: SEGMENT_WIDTH * fill };
  });

  return (
    <View
      style={{
        width: SEGMENT_WIDTH,
        height: 4,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#D3D3D3',
      }}
    >
      <Animated.View style={[{ height: '100%', backgroundColor: '#113E55' }, fillStyle]} />
    </View>
  );
}

/**
 * Single driver for stories progress (same approach as common RN story viewers):
 * one withTiming per segment, pause cancels in place, resume continues from progress.value.
 * No layout-effect reset + timer fighting the animation (that caused Android speed-ups).
 */
function StoriesProgress({
  count,
  activeIndex,
  paused,
  running,
  durationMs,
  onSegmentComplete,
}: {
  count: number;
  activeIndex: number;
  paused: boolean;
  running: boolean;
  durationMs: number;
  onSegmentComplete: () => void;
}) {
  const progress = useSharedValue(0);
  const activeRef = useRef(-1);
  const wasRunningRef = useRef(false);
  const completeRef = useRef(onSegmentComplete);
  completeRef.current = onSegmentComplete;

  const finishSegment = useCallback(() => {
    completeRef.current();
  }, []);

  useEffect(() => {
    if (!running) {
      cancelAnimation(progress);
      progress.value = 0;
      activeRef.current = -1;
      wasRunningRef.current = false;
      return;
    }

    const justOpened = !wasRunningRef.current;
    wasRunningRef.current = true;

    const segmentChanged = activeRef.current !== activeIndex;
    if (justOpened || segmentChanged) {
      activeRef.current = activeIndex;
      cancelAnimation(progress);
      progress.value = 0;
    }

    if (paused) {
      cancelAnimation(progress);
      return;
    }

    const start = justOpened || segmentChanged ? 0 : progress.value;
    if (start >= 0.999) {
      finishSegment();
      return;
    }

    const remaining = Math.max(32, (1 - start) * durationMs);
    progress.value = start;
    progress.value = withTiming(
      1,
      {
        duration: remaining,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      },
      (finished) => {
        if (finished) runOnJS(finishSegment)();
      }
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [running, activeIndex, paused, durationMs, finishSegment, progress]);

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
      {Array.from({ length: count }, (_, index) => (
        <ProgressSegment key={index} index={index} activeIndex={activeIndex} progress={progress} />
      ))}
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

function InsightList({
  visible,
  dataLines,
  legalLines,
  onClose,
}: {
  visible: boolean;
  dataLines: string[];
  legalLines: string[];
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 16) + 16;
  const sheetMaxHeight = Math.round(windowHeight * 0.9);
  // Grabber (~34) + button block (~56 + 24 margin) + bottom pad — scroll the list only.
  const scrollMaxHeight = Math.max(180, sheetMaxHeight - 34 - 80 - bottomPad);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      dismissible={false}
      // Appear as soon as the story sequence ends — no slide/fade delay.
      animationType="none"
      statusBarTranslucent
      scrimClassName="flex-1 justify-end"
      backdrop={
        <>
          {/* Same thick stack as other AI sheets + dimezis so Android actually blurs. */}
          <BlurView
            intensity={40}
            tint="dark"
            blurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
          <BlurView
            intensity={40}
            tint="dark"
            blurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
        </>
      }
      panelStyle={{
        backgroundColor: '#F6F7F7',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: sheetMaxHeight,
        paddingHorizontal: 24,
        paddingBottom: bottomPad,
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        nestedScrollEnabled
        style={{ maxHeight: scrollMaxHeight }}
        contentContainerStyle={{ paddingBottom: 8 }}
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
          No complicated reports. Get simple insights that help you understand what&apos;s happening
          and why.
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
        accessibilityRole="button"
        accessibilityLabel="I understand"
        style={{
          backgroundColor: '#113E55',
          minHeight: 56,
          paddingVertical: 16,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
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
    </BottomSheet>
  );
}

export default function DataInsightModal({
  visible,
  onClose,
  dataInsight,
  pageCount,
  renderPage,
}: {
  visible: boolean;
  onClose: () => void;
  dataInsight?: MarketplaceDataInsight | null;
  pageCount: number;
  renderPage: (index: number) => ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showList, setShowList] = useState(false);
  const openedAtRef = useRef(0);
  const pressInAtRef = useRef(0);
  const advanceLockRef = useRef(false);
  const currentPageRef = useRef(0);
  currentPageRef.current = currentPage;

  const goToNextPage = useCallback(() => {
    if (advanceLockRef.current) return;
    const page = currentPageRef.current;
    if (page >= pageCount - 1) {
      // Last story finished — open the insight sheet immediately.
      setShowList(true);
      return;
    }
    advanceLockRef.current = true;
    setCurrentPage(page + 1);
    requestAnimationFrame(() => {
      advanceLockRef.current = false;
    });
  }, [pageCount]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleTapPrev = useCallback(() => {
    const now = Date.now();
    if (now - openedAtRef.current < 300) return;
    if (pressInAtRef.current > 0 && now - pressInAtRef.current > 250) return;
    goToPrevPage();
  }, [goToPrevPage]);

  const handleTapNext = useCallback(() => {
    const now = Date.now();
    if (now - openedAtRef.current < 300) return;
    if (pressInAtRef.current > 0 && now - pressInAtRef.current > 250) return;
    goToNextPage();
  }, [goToNextPage]);

  useEffect(() => {
    if (!visible) return;
    openedAtRef.current = Date.now();
    pressInAtRef.current = 0;
    advanceLockRef.current = false;
    setCurrentPage(0);
    setIsPaused(false);
    setShowList(false);
  }, [visible]);

  if (!visible) return null;

  if (showList) {
    return (
      <InsightList
        visible={visible}
        dataLines={cleanLines(dataInsight?.data)}
        legalLines={cleanLines(dataInsight?.legal)}
        onClose={onClose}
      />
    );
  }

  const barTop = insets.top - FRAME_STATUS_BAR + 83.86;

  return (
    <Modal visible transparent statusBarTranslucent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 overflow-hidden bg-[#F6F7F7]">
        {renderPage(currentPage)}
        <View style={{ position: 'absolute', left: 0, right: 0, top: barTop }} pointerEvents="none">
          <StoriesProgress
            count={pageCount}
            activeIndex={currentPage}
            paused={isPaused}
            running={visible && !showList}
            durationMs={PAGE_DURATION}
            onSegmentComplete={goToNextPage}
          />
        </View>
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
          <Pressable
            style={{ flex: 0.3 }}
            onPress={handleTapPrev}
            onPressIn={() => {
              pressInAtRef.current = Date.now();
              setIsPaused(true);
            }}
            onPressOut={() => setIsPaused(false)}
          />
          <Pressable
            style={{ flex: 0.7 }}
            onPress={handleTapNext}
            onPressIn={() => {
              pressInAtRef.current = Date.now();
              setIsPaused(true);
            }}
            onPressOut={() => setIsPaused(false)}
          />
        </View>
      </View>
    </Modal>
  );
}
