import { useEffect, useMemo, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, View } from 'react-native';

export const WHEEL_ITEM_H = 28;
export const WHEEL_VISIBLE = 5;
const WHEEL_PAD = WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2);
const LOOPS = 15;

const pad2 = (n: number) => String(n).padStart(2, '0');

type TimeWheelColumnProps = {
  value: number;
  length: number;
  onChange: (next: number) => void;
};

export default function TimeWheelColumn({ value, length, onChange }: TimeWheelColumnProps) {
  const scrollRef = useRef<ScrollView>(null);
  const values = useMemo(
    () => Array.from({ length: length * LOOPS }, (_, i) => i % length),
    [length]
  );
  const mid = Math.floor(LOOPS / 2) * length;

  const offsetFor = (v: number) => (mid + (((v % length) + length) % length)) * WHEEL_ITEM_H;

  const scrollToValue = (v: number, animated: boolean) => {
    scrollRef.current?.scrollTo({ y: offsetFor(v), animated });
  };

  useEffect(() => {
    requestAnimationFrame(() => scrollToValue(value, false));
  }, [length, value]);

  const snap = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(event.nativeEvent.contentOffset.y / WHEEL_ITEM_H);
    const next = ((idx % length) + length) % length;
    onChange(next);
    scrollRef.current?.scrollTo({ y: offsetFor(next), animated: false });
  };

  return (
    <View style={{ height: WHEEL_ITEM_H * WHEEL_VISIBLE, width: 38, overflow: 'hidden' }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        onLayout={() => scrollToValue(value, false)}
        onMomentumScrollEnd={snap}
        nestedScrollEnabled
      >
        <View style={{ height: WHEEL_PAD }} />
        {values.map((n, i) => {
          const selected = n === value;
          return (
            <View
              key={i}
              style={{ height: WHEEL_ITEM_H, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text
                className={`text-center text-base ${
                  selected
                    ? 'font-inter-semibold text-[#113E55]'
                    : 'font-inter-medium text-[#D3D3D3]'
                }`}
              >
                {pad2(n)}
              </Text>
            </View>
          );
        })}
        <View style={{ height: WHEEL_PAD }} />
      </ScrollView>
    </View>
  );
}
