import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Dimensions, Platform, ScrollView } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';

interface DataInsightModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DataInsightModal({ visible, onClose }: DataInsightModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <View style={StyleSheet.absoluteFill} />
        
        <Animated.View
          entering={SlideInDown.springify().damping(25).stiffness(200)}
          exiting={SlideOutDown}
          style={[
            {
              backgroundColor: '#F9FAFA',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: 40,
              width: '100%',
              maxHeight: '90%',
            }
          ]}
        >
          <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 24, color: '#113E55', marginBottom: 8 }}>
            Data Insight
          </Text>
          <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D', marginBottom: 24, lineHeight: 18 }}>
            No complicated reports. Get simple insights that help you understand what's happening and why.
          </Text>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 20, marginBottom: 24 }}>
            {[1, 2, 3, 4, 5].map((item, index) => (
              <View key={index} style={{ flexDirection: 'row', gap: 12 }}>
                <MaterialIcons name="help" size={18} color="#113E55" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 14, color: '#4A6B7C', marginBottom: 4 }}>
                    Financial Info
                  </Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#8A9A9D', lineHeight: 16 }}>
                    No complicated reports. Get simple insights that help you understand what's happening and why.
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            onPress={onClose}
            style={{
              backgroundColor: '#113E55',
              borderRadius: 30,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#FFFFFF' }}>
              I understand
            </Text>
          </Pressable>
        </Animated.View>
      </View>
      </View>
    </Modal>
  );
}
