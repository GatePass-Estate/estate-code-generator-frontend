import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import type { MarketplaceDataInsight } from '@/src/features/marketplace/types/aiMarketplace';

const PAGE_DURATION = 6000;
const BUBBLE_MS = 2000;
/** Figma frames are 375 wide; the status bar in them is 44 tall. */
const FRAME_STATUS_BAR = 44;

const cleanLines = (lines?: string[]) => (lines ?? []).map((line) => line.trim()).filter(Boolean);

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
      <Animated.View className="h-full bg-primary" style={fillStyle} />
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
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      animationType="fade"
      statusBarTranslucent
      scrimClassName="flex-1 justify-end bg-black/50"
      panelStyle={{
        backgroundColor: '#F6F7F7',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
        paddingHorizontal: 24,
        paddingBottom: 40,
      }}
    >
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
  const progress = useSharedValue(0);
  const lastPageRef = useRef(-1);
  const elapsedMsRef = useRef(0);
  const openedAtRef = useRef(0);
  const pressInAtRef = useRef(0);

  const goToNextPage = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
    elapsedMsRef.current = 0;
    setCurrentPage((prev) => {
      if (prev < pageCount - 1) return prev + 1;
      setShowList(true);
      return prev;
    });
  }, [pageCount, progress]);

  const goToPrevPage = useCallback(() => {
    cancelAnimation(progress);
    progress.value = 0;
    elapsedMsRef.current = 0;
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
  }, [progress]);

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
    elapsedMsRef.current = 0;
    setCurrentPage(0);
    setIsPaused(false);
    setShowList(false);
    lastPageRef.current = -1;
    cancelAnimation(progress);
    progress.value = 0;
  }, [visible, progress]);

  useEffect(() => {
    if (!visible || showList) return;

    if (lastPageRef.current !== currentPage) {
      lastPageRef.current = currentPage;
      elapsedMsRef.current = 0;
      cancelAnimation(progress);
      progress.value = 0;
    }

    if (isPaused) {
      cancelAnimation(progress);
      return;
    }

    const from = Math.min(1, Math.max(0, elapsedMsRef.current / PAGE_DURATION));
    const remainingDuration = Math.max(100, PAGE_DURATION - elapsedMsRef.current);
    cancelAnimation(progress);
    progress.value = from;
    progress.value = withTiming(1, {
      duration: remainingDuration,
      easing: Easing.linear,
      reduceMotion: ReduceMotion.Never,
    });

    let lastTick = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      elapsedMsRef.current += Math.max(0, now - lastTick);
      lastTick = now;
      progress.value = Math.min(1, elapsedMsRef.current / PAGE_DURATION);
      if (elapsedMsRef.current >= PAGE_DURATION) {
        clearInterval(interval);
        goToNextPage();
      }
    }, 50);

    return () => {
      clearInterval(interval);
      cancelAnimation(progress);
    };
  }, [visible, showList, isPaused, currentPage, goToNextPage, progress]);

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
        <View
          className="absolute left-0 right-0 flex-row justify-center gap-[5px]"
          style={{ top: barTop }}
          pointerEvents="none"
        >
          {Array.from({ length: pageCount }, (_, index) => (
            <ProgressBar key={index} index={index} currentIndex={currentPage} progress={progress} />
          ))}
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
