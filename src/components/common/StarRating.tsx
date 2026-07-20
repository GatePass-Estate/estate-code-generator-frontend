import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  maxStars?: number;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  disabled?: boolean;
}

const RoundedStar = ({ size, color, filled }: { size: number, color: string, filled: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2.5}>
    <Path 
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
      strokeLinejoin="round" 
      strokeLinecap="round"
    />
  </Svg>
);

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  maxStars = 5,
  size = 32,
  activeColor = '#F46036',
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxStars }).map((_, index) => {
        const starValue = index + 1;
        const isActive = starValue <= rating;

        return (
          <Pressable
            key={index}
            onPress={() => !disabled && onRatingChange?.(starValue)}
            disabled={disabled}
            style={styles.starButton}
          >
            <RoundedStar
              size={size}
              color={activeColor}
              filled={isActive}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
});

export default StarRating;
