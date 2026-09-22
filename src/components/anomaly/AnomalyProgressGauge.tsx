import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface AnomalyProgressGaugeProps {
  label: string;
  percentage: number;
  color: string;
}

export default function AnomalyProgressGauge({ label, percentage, color }: AnomalyProgressGaugeProps) {
  const size = 40;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, percentage)) / 100;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text allowFontScaling={false} className="text-[14px] font-inter-regular text-[#113E55] flex-1">
        • {label}
      </Text>
      <View className="flex-row items-center gap-2">
        <Text allowFontScaling={false} className="text-[16px] font-ubuntu-medium text-[#113E55]">
          {percentage}%
        </Text>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EFF1F3"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
      </View>
    </View>
  );
}
