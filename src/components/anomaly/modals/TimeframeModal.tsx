import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeDown } from './useSwipeDown';

type TimeframeModalProps = {
  visible: boolean;
  onClose: () => void;
  onCustomSelect: () => void;
  selectedLabel: string;
  onSelect: (label: string, start: Date, end: Date) => void;
};

export default function TimeframeModal({ visible, onClose, onCustomSelect, selectedLabel, onSelect }: TimeframeModalProps) {
  const { panGesture, animatedStyle, translateY } = useSwipeDown(onClose);
  React.useEffect(() => {
    if (visible) translateY.value = 0;
  }, [visible]);
  if (!visible) return null;

  const options = ['Last Week', 'Last Month', 'Last Quarter', 'Custom'];
  const selected = selectedLabel;

  const handleSelect = (opt: string) => {
    if (opt === 'Custom') {
      onCustomSelect();
      return;
    }

    const end = new Date();
    const start = new Date();

    if (opt === 'Last Week') {
      start.setDate(end.getDate() - 7);
    } else if (opt === 'Last Month') {
      start.setMonth(end.getMonth() - 1);
    } else if (opt === 'Last Quarter') {
      start.setMonth(end.getMonth() - 3);
    }

    onSelect(opt, start, end);
    onClose();
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'flex-end' }}
    >
      <BlurView intensity={20} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </BlurView>

      <Animated.View
        entering={SlideInDown.springify().damping(20).stiffness(90)}
        exiting={SlideOutDown}
        style={[
          animatedStyle,
          { backgroundColor: '#F6F7F7', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <View style={{ paddingBottom: 24 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center' }} />
          </View>
        </GestureDetector>
        
        <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 20, color: '#113E55', marginBottom: 24 }}>Set Timeframe</Text>

        <View style={{ gap: 12 }}>
          {options.map((opt) => {
            const isSelected = opt === selected;
            return (
              <Pressable
                key={opt}
                onPress={() => handleSelect(opt)}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: isSelected ? '#D2E7ED' : '#F6F7F7',
                  borderWidth: 1,
                  borderColor: isSelected ? '#A2C0C6' : '#EFF1F3',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderRadius: 16
                }}
              >
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 13, color: isSelected ? '#113E55' : '#8A9A9D' }}>{opt}</Text>
                {isSelected ? (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#113E55', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="check" size={12} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#EFF1F3', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="check" size={12} color="#113E55" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
