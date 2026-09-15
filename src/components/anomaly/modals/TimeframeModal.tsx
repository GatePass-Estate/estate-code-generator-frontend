import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type TimeframeModalProps = {
  visible: boolean;
  onClose: () => void;
  onCustomSelect: () => void;
};

export default function TimeframeModal({ visible, onClose, onCustomSelect }: TimeframeModalProps) {
  if (!visible) return null;

  const options = ['Last Week', 'Last Month', 'Last Quarter', 'Custom'];
  const selected = 'Custom';

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
        style={{ backgroundColor: '#F6F7F7', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }}
      >
        <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />
        
        <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 20, color: '#113E55', marginBottom: 24 }}>Set Timeframe</Text>

        <View style={{ gap: 12 }}>
          {options.map((opt) => {
            const isSelected = opt === selected;
            return (
              <Pressable
                key={opt}
                onPress={opt === 'Custom' ? onCustomSelect : onClose}
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
