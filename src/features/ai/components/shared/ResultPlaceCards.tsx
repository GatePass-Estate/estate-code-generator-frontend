import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import EstateSvg from '@/src/assets/icons/estate.svg';
import LocationSvg from '@/src/assets/icons/location.svg';
import { cn } from '@/src/shared/utils/cn';

function PlaceCard({
  label,
  value,
  valueClassName,
  icon,
}: {
  label: string;
  value: string;
  valueClassName: string;
  icon: ReactNode;
}) {
  return (
    <View className="min-h-[61px] flex-1 flex-row items-center gap-[7px] rounded-[16px] bg-white px-2.5 py-4">
      {icon}
      <View className="flex-1 shrink">
        <Text allowFontScaling={false} className="text-2xs font-inter-medium text-[#878686]">
          {label}
        </Text>
        <Text
          allowFontScaling={false}
          numberOfLines={2}
          className={cn('mt-1 text-caption font-inter-regular', valueClassName)}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

/** Name and location chips from the incident result page. Both result pages use this. */
export function ResultPlaceCards({
  name,
  location,
  className,
}: {
  name: string;
  location: string;
  className?: string;
}) {
  return (
    <View className={cn('mb-[7px] flex-row gap-[13px]', className)}>
      <PlaceCard
        label="NAME"
        value={name}
        valueClassName="text-[#0A1F29]"
        icon={<EstateSvg width={28} height={28} />}
      />
      <PlaceCard
        label="LOCATION"
        value={location}
        valueClassName="text-[#04162D]"
        icon={<LocationSvg width={28} height={28} />}
      />
    </View>
  );
}
