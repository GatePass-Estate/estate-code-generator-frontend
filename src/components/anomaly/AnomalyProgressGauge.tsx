import React from 'react';
import { View, Text } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';

interface AnomalyProgressGaugeProps {
  label: string;
  percentage: number;
  color: string;
}

export default function AnomalyProgressGauge({ label, percentage, color }: AnomalyProgressGaugeProps) {
  const data = {
    labels: [label], // optional
    data: [percentage / 100],
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => color,
    strokeWidth: 8, // optional, default 3
    barPercentage: 0.5,
    useShadowColorFromDataset: false, // optional
  };

  return (
    <View className="flex-row items-center justify-between mb-4">
      <Text allowFontScaling={false} className="text-[14px] font-inter-regular text-[#113E55] flex-1">
        • {label}
      </Text>
      <View className="flex-row items-center gap-2">
        <Text allowFontScaling={false} className="text-[16px] font-ubuntu-medium text-[#113E55]">
          {percentage}%
        </Text>
        <ProgressChart
          data={data}
          width={40}
          height={40}
          strokeWidth={6}
          radius={14}
          chartConfig={chartConfig}
          hideLegend={true}
          style={{ paddingRight: 0, margin: 0 }}
        />
      </View>
    </View>
  );
}
