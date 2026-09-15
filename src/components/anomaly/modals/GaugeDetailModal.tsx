import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform, ScrollView } from 'react-native';
import Animated, {
  SlideInDown,
  useAnimatedStyle,
  useAnimatedProps,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import VShapeSvg from '@/src/assets/icons/vshape.svg';

export interface GaugeData {
  title: string;
  percentage: number;
  color: string;
  arcColor?: string;
  records: number;
  days: number;
  items: {
    title: string;
    percentage: number;
  }[];
}

interface GaugeDetailModalProps {
  visible: boolean;
  onClose: () => void;
  gaugeData: GaugeData | null;
  onNext: () => void;
  onPrev: () => void;
}

const getMagnitudeColor = (percent: number) => {
  if (percent > 50) return '#E53935'; // Red
  if (percent > 15) return '#D99A29'; // Yellow/Gold
  return '#1B998B'; // Green
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const MotionGauge = ({ percentage, color }: { percentage: number; color: string }) => {
  const radius = 80;
  const strokeWidth = 20;
  const center = radius + strokeWidth;
  const arcRadius = radius;
  
  const circumference = Math.PI * arcRadius;
  
  // Animation state
  const animatedStrokeDashoffset = useSharedValue(circumference);
  
  useEffect(() => {
    // Reset to 0 (empty) initially
    animatedStrokeDashoffset.value = circumference;
    
    // Sprinkle motion: Fill to 100% then revert to actual percentage. Wait 500ms for modal to open.
    animatedStrokeDashoffset.value = withSequence(
      withDelay(500, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })), // Fill completely
      withTiming(circumference - (percentage / 100) * circumference, { duration: 700, easing: Easing.inOut(Easing.cubic) }) // Settle to actual
    );
  }, [percentage, circumference]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedStrokeDashoffset.value,
  }));

  const d = `
    M ${strokeWidth} ${center}
    A ${arcRadius} ${arcRadius} 0 0 1 ${center + arcRadius} ${center}
  `;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 30 }}>
      <View style={{ width: center * 2, height: center + strokeWidth }}>
        <Svg width={center * 2} height={center + strokeWidth}>
          {/* Background Arc */}
          <Path
            d={d}
            stroke="#F6F7F7"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          {/* Foreground Animated Arc */}
          <AnimatedPath
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </Svg>
        
        {/* Percentage Label */}
        <View style={{ position: 'absolute', bottom: 6, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name="arrow-drop-up" size={42} color={color} style={{ marginRight: -6, marginTop: 4 }} />
          <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 34.18, color: color }}>
            {percentage}%
          </Text>
        </View>
      </View>
    </View>
  );
};

const SegmentedProgressBar = ({ percentage }: { percentage: number }) => {
  const totalSegments = 50;
  const targetSegments = Math.round((percentage / 100) * totalSegments);
  const activeColor = getMagnitudeColor(percentage);
  
  const animatedSegments = useSharedValue(0);
  
  useEffect(() => {
    animatedSegments.value = 0;
    // Animate up to the target segment count
    animatedSegments.value = withDelay(
      500,
      withTiming(targetSegments, { duration: 1000, easing: Easing.out(Easing.cubic) })
    );
  }, [targetSegments]);

  const segments = Array.from({ length: totalSegments }, (_, i) => i);

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {segments.map((index) => {
        const animatedStyle = useAnimatedStyle(() => {
          return {
            backgroundColor: animatedSegments.value > index ? activeColor : '#E5E7EB',
          };
        });

        return (
          <Animated.View
            key={index}
            style={[
              {
                flex: 1,
                height: 16,
                borderRadius: 8,
              },
              animatedStyle
            ]}
          />
        );
      })}
    </View>
  );
};

export default function GaugeDetailModal({ visible, onClose, gaugeData, onNext, onPrev }: GaugeDetailModalProps) {
  if (!gaugeData) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <Animated.View
          entering={SlideInDown.springify().damping(25).stiffness(200)}
          style={{
            backgroundColor: '#F9FAFA',
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            paddingHorizontal: 24,
            paddingTop: 16,
            paddingBottom: 40,
            width: '100%',
            maxHeight: '90%',
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 100,
              height: 6,
              borderRadius: 3,
              backgroundColor: '#A0A0A0',
              alignSelf: 'center',
              marginBottom: 32,
            }}
          />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 22, color: '#113E55', marginBottom: 4 }}>
                  {gaugeData.title}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
                  Contributing Percentage
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={onPrev}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF1F3', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialIcons name="keyboard-arrow-left" size={20} color="#113E55" />
                </Pressable>
                <Pressable
                  onPress={onNext}
                  style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF1F3', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialIcons name="keyboard-arrow-right" size={20} color="#113E55" />
                </Pressable>
              </View>
            </View>

            {/* Gauge Area */}
            <MotionGauge percentage={gaugeData.percentage} color={gaugeData.color} />

            {/* Stats Pills */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
              <View style={{ backgroundColor: '#EFF1F3', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="search" size={14} color="#1B998B" />
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 13, color: '#1B998B' }}>
                  {gaugeData.records} records detected
                </Text>
              </View>
              <View style={{ backgroundColor: '#EFF1F3', borderRadius: 24, paddingVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="history" size={14} color="#1B998B" />
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 13, color: '#1B998B' }}>
                  Last {gaugeData.days}days
                </Text>
              </View>
            </View>

            {/* List Items */}
            <View style={{ gap: 12 }}>
              {gaugeData.items.map((item, idx) => (
                <View key={idx} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <VShapeSvg />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 14, color: '#8A9A9D' }}>
                        {item.title}
                      </Text>
                      <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 14, color: '#8A9A9D' }}>
                        {item.percentage}%
                      </Text>
                    </View>
                    <SegmentedProgressBar percentage={item.percentage} />
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
