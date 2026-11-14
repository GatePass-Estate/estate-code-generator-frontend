import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const TRACK_W = 59;
const TRACK_H = 24;
const KNOB = 20;
const KNOB_INSET = 3;
const KNOB_OFF = KNOB_INSET;
const KNOB_ON = TRACK_W - KNOB - KNOB_INSET;

type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
};

/** 59×24 pill. ON is #1B998B with 20% black overlay; knob 20×20 #EFF1F1. */
export default function ToggleSwitch({ value, onValueChange }: ToggleSwitchProps) {
  const knobX = useSharedValue(value ? KNOB_ON : KNOB_OFF);

  useEffect(() => {
    knobX.value = withTiming(value ? KNOB_ON : KNOB_OFF, { duration: 180 });
  }, [knobX, value]);

  const knobStyle = useAnimatedStyle(() => ({
    left: knobX.value,
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={{
        width: TRACK_W,
        height: TRACK_H,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: value ? '#1B998B' : '#9B9797',
      }}
    >
      {value ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        />
      ) : null}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: (TRACK_H - KNOB) / 2,
            width: KNOB,
            height: KNOB,
            borderRadius: 24,
            backgroundColor: '#EFF1F1',
          },
          knobStyle,
        ]}
      />
    </Pressable>
  );
}
