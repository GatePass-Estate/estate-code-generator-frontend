import { type ReactNode } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Pf1Svg from '@/src/assets/icons/pf_1.svg';
import Pf2Svg from '@/src/assets/icons/pf_2.svg';
import Pf3Svg from '@/src/assets/icons/pf_3.svg';
import { FeatureDownloadIcon, FeatureUsersIcon, RatingStarIcon } from '@/src/assets/svgs';

const PRODUCT_FEATURE_ICONS = [Pf1Svg, Pf2Svg, Pf3Svg];

type MarketplaceProductInfoCardProps = {
  name: string;
  rating: number;
  description?: string | null;
  installedCount: number;
  ratingCount: number;
  onPressRating: () => void;
  onLayout?: (e: LayoutChangeEvent) => void;
};

/** Hero card under the product illustration (incident Preview is the source). */
export function MarketplaceProductInfoCard({
  name,
  rating,
  description,
  installedCount,
  ratingCount,
  onPressRating,
  onLayout,
}: MarketplaceProductInfoCardProps) {
  return (
    <View
      onLayout={onLayout}
      className="justify-between gap-2 rounded-[16px] bg-white p-4"
      style={{ minHeight: 118, marginTop: 36, marginHorizontal: 20 }}
    >
      <View className="flex-row items-center">
        <Text
          allowFontScaling={false}
          className="min-w-0 flex-1 pr-2 text-heading-sm font-ubuntu-semibold leading-[21.88px] text-primary"
        >
          {name}
        </Text>
        <Pressable onPress={onPressRating} className="shrink-0 flex-row items-center gap-1">
          <RatingStarIcon width={17} height={16} />
          <Text
            allowFontScaling={false}
            className="w-[39px] text-center text-heading-sm font-ubuntu-semibold leading-[26px] text-[#6B7280]"
          >
            {rating.toFixed(1)}
          </Text>
        </Pressable>
      </View>

      {!!description?.trim() && (
        <Text allowFontScaling={false} className="text-caption font-inter-regular text-[#878686]">
          {description}
        </Text>
      )}

      <View className="mt-1 flex-row items-center gap-2">
        <View className="flex-row items-center">
          <FeatureDownloadIcon width={13} height={13} />
          <Text allowFontScaling={false} className="px-1 text-2xs font-inter-medium text-[#878686]">
            {installedCount}
          </Text>
        </View>
        <View className="flex-row items-center">
          <FeatureUsersIcon width={16} height={16} />
          <Text allowFontScaling={false} className="px-1 text-2xs font-inter-medium text-[#878686]">
            {ratingCount}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function MarketplaceProductFeatureList({ features }: { features: string[] }) {
  const rows = features.map((text) => text.trim()).filter(Boolean);
  if (rows.length === 0) return null;

  return (
    <>
      <View className="px-[17px]">
        <Text
          allowFontScaling={false}
          className="mb-4 text-[14px] font-inter-medium leading-[14px] text-primary"
        >
          Product Feature
        </Text>
      </View>

      <View className="mb-[44px] gap-2">
        {rows.map((text, index) => {
          const Icon = PRODUCT_FEATURE_ICONS[index % PRODUCT_FEATURE_ICONS.length];
          return (
            <View
              key={`${index}-${text.slice(0, 24)}`}
              className="w-full flex-row items-start gap-3 rounded-[16px] bg-white px-4 py-2"
            >
              <View className="mt-0.5 h-4 w-4 shrink-0 items-center justify-center">
                <Icon width={16} height={16} />
              </View>
              <Text
                allowFontScaling={false}
                className="min-w-0 flex-1 text-caption font-inter-regular leading-[18px] text-[#878686]"
              >
                {text}
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
}

export function MarketplaceSectionTitle({ children }: { children: ReactNode }) {
  return (
    <View className="px-[17px]">
      <Text
        allowFontScaling={false}
        className="mb-4 text-[14px] font-inter-medium leading-[14px] text-primary"
      >
        {children}
      </Text>
    </View>
  );
}
