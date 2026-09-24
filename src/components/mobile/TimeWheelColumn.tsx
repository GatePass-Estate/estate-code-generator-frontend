import { memo, useCallback, useEffect, useRef, useState } from 'react';
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
/** Rows mounted on each side of the centre row; the rest of the track is empty space. */
const RENDER_RADIUS = 20;
/** Re-window once the centre drifts this many rows from the last window centre. */
const RECENTER_AT = 8;
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
    <View
      style={{
        position: 'absolute',
        top: WHEEL_PAD + index * WHEEL_ITEM_H,
        left: 0,
        right: 0,
        height: WHEEL_ITEM_H,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.Text style={textStyle}>{label}</Animated.Text>
    </View>
  );
});

export default function TimeWheelColumn({ value, length, onChange }: TimeWheelColumnProps) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const draggingRef = useRef(false);
  const mid = Math.floor(LOOPS / 2) * length;
  const total = length * LOOPS;
  const initialIndex = mid + (((value % length) + length) % length);
  const scrollY = useSharedValue(initialIndex * WHEEL_ITEM_H);
  const windowCenter = useSharedValue(initialIndex);
  const [renderCenter, setRenderCenter] = useState(initialIndex);

  const moveWindow = useCallback(
    (idx: number) => {
      windowCenter.value = idx;
      setRenderCenter(idx);
    },
    [windowCenter]
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
      moveWindow(y / WHEEL_ITEM_H);
      scrollRef.current?.scrollTo({ y, animated });
    },
    [moveWindow, offsetFor, scrollY]
  );

  const setDragging = useCallback((dragging: boolean) => {
    draggingRef.current = dragging;
  }, []);

  useEffect(() => {
    if (draggingRef.current) return;
    if (scrollY.value === offsetFor(value)) return;
    requestAnimationFrame(() => scrollToValue(value, false));
  }, [length, offsetFor, scrollToValue, scrollY, value]);

  const commitOffset = useCallback(
    (y: number) => {
      const next = valueAtOffset(y);
      onChange(next);
      const settled = offsetFor(next);
      scrollY.value = settled;
      moveWindow(settled / WHEEL_ITEM_H);
      scrollRef.current?.scrollTo({ y: settled, animated: false });
      draggingRef.current = false;
    },
    [moveWindow, offsetFor, onChange, scrollY, valueAtOffset]
  );

  const onScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      runOnJS(setDragging)(true);
    },
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      const idx = Math.round(event.contentOffset.y / WHEEL_ITEM_H);
      if (Math.abs(idx - windowCenter.value) >= RECENTER_AT) {
        windowCenter.value = idx;
        runOnJS(setRenderCenter)(idx);
      }
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

  // Rows around the incoming value mount in the same commit as the value change, so a
  // programmatic jump (presets) never lands on an empty stretch of track.
  const rowIndexes = new Set<number>();
  for (const center of [renderCenter, initialIndex]) {
    const first = Math.max(0, center - RENDER_RADIUS);
    const last = Math.min(total - 1, center + RENDER_RADIUS);
    for (let i = first; i <= last; i += 1) rowIndexes.add(i);
  }
  const rows = [...rowIndexes].map((i) => (
    <WheelItem key={i} index={i} label={pad2(i % length)} scrollY={scrollY} />
  ));

  return (
    <View style={{ height: WHEEL_ITEM_H * WHEEL_VISIBLE, width: 38, overflow: 'hidden' }}>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentOffset={{ x: 0, y: initialIndex * WHEEL_ITEM_H }}
        onLayout={() => scrollToValue(value, false)}
        onScroll={onScroll}
        nestedScrollEnabled
      >
        <View style={{ height: WHEEL_PAD * 2 + total * WHEEL_ITEM_H }}>{rows}</View>
      </Animated.ScrollView>
    </View>
  );
}
