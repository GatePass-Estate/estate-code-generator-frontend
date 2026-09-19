import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeDown } from './useSwipeDown';

interface OrderModalProps {
  visible: boolean;
  onClose: () => void;
  sortAscending: boolean;
  setSortAscending: (val: boolean) => void;
}

export default function OrderModal({ visible, onClose, sortAscending, setSortAscending }: OrderModalProps) {
  const { panGesture, animatedStyle, translateY } = useSwipeDown(onClose);
  React.useEffect(() => {
    if (visible) translateY.value = 0;
  }, [visible]);
  const Option = ({ label, isSelected, onPress }: { label: string, isSelected: boolean, onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F6F7F7',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 12,
      }}
    >
      <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 15, color: '#113E55' }}>
        {label}
      </Text>
      {isSelected && (
        <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#D2E7ED', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark-sharp" size={12} color="#113E55" />
        </View>
      )}
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <Animated.View
          entering={SlideInDown.springify().damping(25).stiffness(200)}
          style={[
            animatedStyle,
            {
              backgroundColor: '#F9FAFA',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 24,
              paddingTop: 12,
              paddingBottom: 40,
              width: '100%',
            }
          ]}
        >
          {/* Draggable Handle Area */}
          <GestureDetector gesture={panGesture}>
            <View style={{ paddingVertical: 12 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#EFF1F3', borderRadius: 2, alignSelf: 'center' }} />
            </View>
          </GestureDetector>

          <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 24, color: '#113E55', marginBottom: 24 }}>
            Select Order
          </Text>

          <Option
            label="Ascending Order"
            isSelected={sortAscending}
            onPress={() => {
              setSortAscending(true);
              onClose();
            }}
          />

          <Option
            label="Descending Order"
            isSelected={!sortAscending}
            onPress={() => {
              setSortAscending(false);
              onClose();
            }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}
