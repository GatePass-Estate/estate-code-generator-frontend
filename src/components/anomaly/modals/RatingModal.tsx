import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => Promise<void>;
}

const Star = ({ size = 32, filled, color = '#F46036' }: { size?: number, filled: boolean, color?: string }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={color}
    strokeWidth={1.5}
  >
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </Svg>
);

export default function RatingModal({ visible, onClose, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(rating);
      setRating(0);
      onClose();
    } catch (err) {
      console.log('Failed to submit rating', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-center items-center">
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} disabled={isSubmitting} />
        
        <View className="bg-white rounded-[24px] p-6 items-center w-[320px] shadow-lg">
          <Text allowFontScaling={false} className="text-[13px] font-inter-medium text-[#113E55] mb-4">
            Tap To Rate
          </Text>
          
          <View className="flex-row items-center gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)}>
                <Star filled={star <= rating} size={36} />
              </Pressable>
            ))}
          </View>
          
          <Pressable 
            disabled={rating === 0 || isSubmitting}
            onPress={handleSubmit}
            className={`w-full py-[14px] rounded-[24px] items-center justify-center ${
              rating === 0 ? 'bg-[#A0AAB0]' : 'bg-[#113E55]'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text allowFontScaling={false} className="text-[15px] font-inter-medium text-white">
                Submit
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
