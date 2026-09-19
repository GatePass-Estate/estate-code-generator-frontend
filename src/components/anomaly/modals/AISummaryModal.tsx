import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, {
  SlideInDown,
  SlideOutDown,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeDown } from './useSwipeDown';

type AISummaryModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AISummaryModal({ visible, onClose }: AISummaryModalProps) {
  const { panGesture, animatedStyle, translateY } = useSwipeDown(onClose);
  React.useEffect(() => {
    if (visible) translateY.value = 0;
  }, [visible]);
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        justifyContent: 'flex-end',
      }}
    >
      <BlurView
        intensity={20}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </BlurView>

      <Animated.View
        entering={SlideInDown.springify().damping(20).stiffness(90)}
        exiting={SlideOutDown}
        style={[
          animatedStyle,
          {
            backgroundColor: '#F6F7F7',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: '90%',
            padding: 24,
          }
        ]}
      >
        {/* Draggable Handle Area */}
        <GestureDetector gesture={panGesture}>
          <View style={{ paddingBottom: 16 }}>
            {/* Handle */}
            <View
              style={{
                width: 100,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#A0A0A0',
                alignSelf: 'center',
              }}
            />
          </View>
        </GestureDetector>
        
        <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 20, color: '#113E55', marginBottom: 16 }}>
          AI SUMMARY
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
           <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
             <MaterialIcons name="schedule" size={12} color="#F46036" />
             <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 10, color: '#F46036' }}>2 mins Read</Text>
           </View>
           <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
             <MaterialIcons name="security" size={12} color="#1B998B" />
             <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 10, color: '#1B998B' }}>Read Fully</Text>
           </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
          {/* Accordion Item 1 */}
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#113E55' }}>EXECUTIVE SUMMARY</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#113E55" />
            </View>
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#8A9A9D', lineHeight: 20 }}>
              You are receiving this email because you are subscribed to calendar notifications. To stop receiving these emails, go to your this calendar, and change "Other notifications". You are receiving this email because you are subscribed to calendar notifications. To stop receiving these emails, go to your this calendar, and change "Other notifications".
            </Text>
          </View>
          
          {/* Accordion Item 2 */}
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#113E55' }}>KEY PATTERNS</Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color="#113E55" />
            </View>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#8A9A9D', marginTop: 8 }} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#8A9A9D', flex: 1, lineHeight: 20 }}>
                  You are receiving this email because you are subscribed.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#8A9A9D', marginTop: 8 }} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#8A9A9D', flex: 1, lineHeight: 20 }}>
                  You are receiving this email because you are subscribed.
                </Text>
              </View>
            </View>
          </View>

          {/* Accordion Item 3 */}
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#113E55' }}>RECOMMENDED ACTIONS</Text>
              <MaterialIcons name="keyboard-arrow-right" size={20} color="#113E55" />
            </View>
          </View>

          {/* Accordion Item 4 */}
          <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#113E55' }}>DATA LIMITATIONS</Text>
              <MaterialIcons name="keyboard-arrow-right" size={20} color="#113E55" />
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}
