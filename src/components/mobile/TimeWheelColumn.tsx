import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
export const WHEEL_ITEM_H = 28;
export const WHEEL_VISIBLE = 5;
const WHEEL_PAD = WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2);
const LOOPS = 15;
const FONT_ACTIVE = 'Inter_600SemiBold';
const FONT_IDLE = 'Inter_500Medium';

const pad2 = (n: number) => String(n).padStart(2, '0');

type TimeWheelColumnProps = {
  value: number;
  length: number;
  onChange: (next: number) => void;
};

type WheelItemProps = {
  index: number;
  label: string;
  scrollY: SharedValue<number>;
};

const WheelItem = memo(function WheelItem({ index, label, scrollY }: WheelItemProps) {
  const textStyle = useAnimatedStyle(() => {
    // Only the row currently in the middle slot is active — follows scroll live.
    const centerIndex = scrollY.value / WHEEL_ITEM_H;
    const selected = Math.abs(index - centerIndex) < 0.5;
    return {
      color: selected ? '#113E55' : '#D3D3D3',
      fontFamily: selected ? FONT_ACTIVE : FONT_IDLE,
      fontSize: 16,
      textAlign: 'center' as const,
    };
  });

  return (
    <View style={{ height: WHEEL_ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Text style={textStyle}>{label}</Animated.Text>
    </View>
  );
});

export default function TimeWheelColumn({ value, length, onChange }: TimeWheelColumnProps) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const draggingRef = useRef(false);
  const mid = Math.floor(LOOPS / 2) * length;
  const scrollY = useSharedValue(0);

  const values = useMemo(
    () => Array.from({ length: length * LOOPS }, (_, i) => i % length),
    [length]
  );

  const offsetFor = useCallback(
    (v: number) => (mid + (((v % length) + length) % length)) * WHEEL_ITEM_H,
    [length, mid]
  );

  const valueAtOffset = useCallback(
    (y: number) => {
      const idx = Math.round(y / WHEEL_ITEM_H);
      return ((idx % length) + length) % length;
    },
    [length]
  );

  const scrollToValue = useCallback(
    (v: number, animated: boolean) => {
      const y = offsetFor(v);
      scrollY.value = y;
      scrollRef.current?.scrollTo({ y, animated });
    },
    [offsetFor, scrollY]
  );

  const setDragging = useCallback((dragging: boolean) => {
    draggingRef.current = dragging;
  }, []);

  useEffect(() => {
    if (draggingRef.current) return;
    requestAnimationFrame(() => scrollToValue(value, false));
  }, [length, scrollToValue, value]);

  const commitOffset = useCallback(
    (y: number) => {
      const next = valueAtOffset(y);
      onChange(next);
      const settled = offsetFor(next);
      scrollY.value = settled;
      scrollRef.current?.scrollTo({ y: settled, animated: false });
      draggingRef.current = false;
    },
    [offsetFor, onChange, scrollY, valueAtOffset]
  );

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      runOnJS(setDragging)(true);
    },
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onEndDrag: (event) => {
      const vy = event.velocity?.y ?? 0;
      if (Math.abs(vy) < 0.05) {
        runOnJS(commitOffset)(event.contentOffset.y);
      }
    },
    onMomentumEnd: (event) => {
      runOnJS(commitOffset)(event.contentOffset.y);
    },
  });

  return (
    <View style={{ height: WHEEL_ITEM_H * WHEEL_VISIBLE, width: 38, overflow: 'hidden' }}>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onLayout={() => scrollToValue(value, false)}
        onScroll={onScroll}
        nestedScrollEnabled
      >
        <View style={{ height: WHEEL_PAD }} />
        {values.map((n, i) => (
          <WheelItem key={i} index={i} label={pad2(n)} scrollY={scrollY} />
        ))}
        <View style={{ height: WHEEL_PAD }} />
      </Animated.ScrollView>
    </View>
  );
}
