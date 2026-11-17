import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { IncidentCategoryIcon } from '@/src/features/ai/components/incidents/categoryIcons';
import {
  SIDE_METRIC_CARD_WIDTH,
  SUBCATEGORY_CARD_HEIGHT,
  SUBCATEGORY_CARD_WIDTH,
} from '@/src/features/ai/components/incidents/result/categoryLayout';

export function ThresholdBadge({ label }: { label: string }) {
  return (
    <View className="h-[15px] items-center justify-center bg-[#FBFBEE] px-0.5">
      <Text allowFontScaling={false} className="text-2xs font-inter-medium text-[#B17000]">
        {label}
      </Text>
    </View>
  );
}

export function MetricCard({
  label,
  value,
  badge,
  className,
  style,
}: {
  label: string;
  value: ReactNode;
  badge?: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className={`gap-1 rounded border border-[#EFF1F3] bg-white p-2 ${className ?? ''}`}
      style={[{ width: SIDE_METRIC_CARD_WIDTH }, style]}
    >
      <View className="flex-row items-center gap-1">
        <Text allowFontScaling={false} className="text-2xs font-inter-medium text-[#878686]">
          {label}
        </Text>
        {badge}
      </View>
      {value}
    </View>
  );
}

export function SubcategoryCard({
  name,
  pct,
  apiCategory,
  fullWidth = false,
}: {
  name: string;
  pct: number;
  apiCategory: string;
  fullWidth?: boolean;
}) {
  const fillRatio = Math.min(1, Math.max(0, (pct / 5) * (37 / 43)));
  const pctLabel = Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;

  return (
    <View
      style={{
        minHeight: SUBCATEGORY_CARD_HEIGHT,
        width: fullWidth ? '100%' : SUBCATEGORY_CARD_WIDTH,
      }}
      className="justify-center rounded-lg bg-white px-2 py-2"
    >
      <View className="w-full flex-row items-start gap-1.5">
        <View className="h-6 w-6 items-center justify-center rounded-md bg-[#EFF1F1]">
          <IncidentCategoryIcon category={apiCategory} color="#113E55" size={14} filled />
        </View>
        <Text
          allowFontScaling={false}
          className="min-w-0 flex-1 text-caption font-inter-medium leading-[14px] text-[#0A1F29]"
        >
          {name}
        </Text>
      </View>

      <View className="mt-1.5 flex-row items-center gap-1 pl-7">
        <Text
          allowFontScaling={false}
          className="text-2xs font-inter-medium leading-[11px] text-[#878686]"
        >
          {pctLabel}
        </Text>
        <View className="h-[5px] flex-1 justify-center overflow-hidden rounded-full bg-[#D3D3D3]">
          <View
            className="h-[5px] rounded-full bg-teal"
            style={{ width: `${Math.round(fillRatio * 100)}%` }}
          />
        </View>
      </View>
    </View>
  );
}
