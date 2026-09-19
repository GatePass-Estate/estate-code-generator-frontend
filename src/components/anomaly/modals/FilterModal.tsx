import React, { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeDown } from './useSwipeDown';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

type Severity = 'Low' | 'Medium' | 'High' | null;
type Gender = 'Female' | 'Male' | 'Prefer not to say' | null;
type UserType = 'Guest' | 'Resident' | 'Security' | null;

export default function FilterModal({ visible, onClose }: FilterModalProps) {
  const { panGesture, animatedStyle, translateY } = useSwipeDown(onClose);
  React.useEffect(() => {
    if (visible) translateY.value = 0;
  }, [visible]);
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>('High');
  const [selectedGender, setSelectedGender] = useState<Gender>('Prefer not to say');
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);

  const severities: Severity[] = ['Low', 'Medium', 'High'];
  const genders: Gender[] = ['Female', 'Male', 'Prefer not to say'];
  const userTypes: UserType[] = ['Guest', 'Resident', 'Security'];

  const Pill = ({ label, isSelected, onPress }: { label: string, isSelected: boolean, onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: isSelected ? '#CEE5ED' : '#F6F7F7',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 24,
        marginRight: 10,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter_18pt-Regular',
          fontSize: 13,
          color: isSelected ? '#113E55' : '#8A9A9D',
        }}
      >
        {label}
      </Text>
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
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: 24,
              paddingBottom: 40,
            }
          ]}
        >
          {/* Handle */}
          <GestureDetector gesture={panGesture}>
            <View style={{ marginBottom: 32 }}>
              <View
                style={{
                  width: 50,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: '#A3A3A3',
                  alignSelf: 'center',
                }}
              />
            </View>
          </GestureDetector>

          {/* Severity */}
          <View style={{ marginBottom: 16 }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 16, color: '#8A9A9D', marginBottom: 16 }}>
              Severity
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {severities.map(s => (
                <Pill
                  key={s}
                  label={s!}
                  isSelected={selectedSeverity === s}
                  onPress={() => setSelectedSeverity(s)}
                />
              ))}
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 24 }} />

          {/* Gender */}
          <View style={{ marginBottom: 16 }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 16, color: '#8A9A9D', marginBottom: 16 }}>
              Gender
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {genders.map(g => (
                <Pill
                  key={g}
                  label={g!}
                  isSelected={selectedGender === g}
                  onPress={() => setSelectedGender(g)}
                />
              ))}
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: '#E5E7EB', marginBottom: 24 }} />

          {/* User Type */}
          <View style={{ marginBottom: 32 }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 16, color: '#8A9A9D', marginBottom: 16 }}>
              User Type
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {userTypes.map(u => (
                <Pill
                  key={u}
                  label={u!}
                  isSelected={selectedUserType === u}
                  onPress={() => setSelectedUserType(u)}
                />
              ))}
            </View>
          </View>

          {/* Confirm Button */}
          <Pressable
            onPress={onClose}
            style={{
              width: '100%',
              height: 56,
              backgroundColor: '#113E55',
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#FFFFFF' }}>
              Confirm
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
