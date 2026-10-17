import type { ReactNode } from 'react';
import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
import { cn } from '@/src/lib/cn';

export type PlanCardSlug = 'access' | 'watch' | 'sentinel' | 'command' | 'custom';

type PlanCardTheme = {
  fill: LinearGradientProps['colors'];
  fillLocations?: LinearGradientProps['locations'];
  /** Optional gradient stroke (Custom only), drawn as an outer gradient ring. */
  stroke?: {
    colors: LinearGradientProps['colors'];
    locations: LinearGradientProps['locations'];
    start: { x: number; y: number };
    end: { x: number; y: number };
    width: number;
  };
  image: ImageSourcePropType;
  /** Illustration size/offset inside the 110x110 slot (Figma overflows it slightly). */
  imageBox: { size: number; left: number; top: number };
};

// Figma gradientHandlePositions shared by every plan fill: from (0.01, 0.62) to (1.02, 0.32).
const FILL_START = { x: 0.01, y: 0.62 };
const FILL_END = { x: 1.02, y: 0.32 };
const FILL_LOCATIONS = [0.33, 0.99] as const;

const CARD_RADIUS = 16;
const CARD_PADDING = 16;
const IMAGE_SLOT = 110;

const PLAN_CARD_THEMES: Record<PlanCardSlug, PlanCardTheme> = {
  access: {
    fill: ['#113E55', '#113E55'],
    image: require('@/src/assets/images/plans/plan-access.png'),
    imageBox: { size: 130, left: -10, top: -5 },
  },
  watch: {
    fill: ['#113E55', '#19719D'],
    fillLocations: FILL_LOCATIONS,
    image: require('@/src/assets/images/plans/plan-watch.png'),
    imageBox: { size: 120, left: -10, top: 0 },
  },
  sentinel: {
    fill: ['#F46036', '#F68C6E'],
    fillLocations: FILL_LOCATIONS,
    image: require('@/src/assets/images/plans/plan-sentinel.png'),
    imageBox: { size: 120, left: -5, top: 0 },
  },
  command: {
    fill: ['#1C9A8C', '#49C8BA'],
    fillLocations: FILL_LOCATIONS,
    image: require('@/src/assets/images/plans/plan-command.png'),
    imageBox: { size: IMAGE_SLOT, left: 0, top: 0 },
  },
  custom: {
    fill: ['#1C8E81', '#49C8BA'],
    fillLocations: FILL_LOCATIONS,
    stroke: {
      colors: ['#D8691B', '#FFC882', '#F6A000'],
      locations: [0, 0.57, 1],
      start: { x: 0.97, y: 0.32 },
      end: { x: 0.16, y: 0.14 },
      width: 1.5,
    },
    image: require('@/src/assets/images/plans/plan-custom.png'),
    imageBox: { size: IMAGE_SLOT, left: 0, top: 0 },
  },
};

function getTheme(slug: string): PlanCardTheme {
  const key = slug.toLowerCase() as PlanCardSlug;
  return PLAN_CARD_THEMES[key] ?? PLAN_CARD_THEMES.watch;
}

export type PlanCardProps = {
  /** Tier slug (`access | watch | sentinel | command | custom`); unknown slugs use Watch styling. */
  slug: string;
  name: string;
  /** Already-formatted price, e.g. '₦9,999' or 'Free'. Hidden when empty. */
  priceLabel?: string | null;
  /** Light-weight suffix after the price, e.g. '/month'. */
  unitLabel?: string;
  /** Small line under the price, e.g. 'Renews on May 23rd, 2026.'. */
  footnote?: string | null;
  /** Small line above the name, e.g. 'Your Current Plan'. */
  eyebrow?: string | null;
  onPress?: () => void;
  className?: string;
};

/**
 * Gradient plan banner from the "plan-card-variants" component set: copy on the
 * left, plan illustration on the right. Presentational only.
 */
export default function PlanCard({
  slug,
  name,
  priceLabel,
  unitLabel,
  footnote,
  eyebrow,
  onPress,
  className,
}: PlanCardProps) {
  const theme = getTheme(slug);
  const strokeWidth = theme.stroke?.width ?? 0;
  const inset = CARD_PADDING - strokeWidth;

  const body: ReactNode = (
    <LinearGradient
      colors={theme.fill}
      locations={theme.fillLocations ?? null}
      start={FILL_START}
      end={FILL_END}
      style={{
        borderRadius: CARD_RADIUS - strokeWidth,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        paddingVertical: inset,
        paddingLeft: inset,
        // Figma: 16 padding + 16 of free space to the right of the 110pt illustration.
        paddingRight: inset + 16,
        gap: 28,
      }}
    >
      <View className="flex-1 gap-2">
        {eyebrow ? (
          <Text
            className="font-inter-medium text-[9px] leading-[10.8px] text-[#F6F7F7]"
            numberOfLines={1}
          >
            {eyebrow}
          </Text>
        ) : null}
        <View className="gap-1">
          <View className="gap-1">
            <Text
              className="font-ubuntu-medium text-[27px] leading-[32.8px] text-[#F6F7F7]"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {name}
            </Text>
            {priceLabel ? (
              // Wraps '/month' under long prices on narrow (320pt) screens instead of clipping.
              <View className="flex-row flex-wrap items-baseline gap-[2px]">
                <Text className="font-inter-medium text-[14px] leading-[16.9px] text-[#F6F7F7]">
                  {priceLabel}
                </Text>
                {unitLabel ? (
                  <Text className="font-inter-light text-[14px] leading-[16.9px] text-[#F6F7F7]">
                    {unitLabel}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
          {footnote ? (
            <Text
              className="font-inter-medium text-[9px] leading-[10.8px] text-[#F6F7F7]"
              numberOfLines={2}
            >
              {footnote}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ width: IMAGE_SLOT, height: IMAGE_SLOT }}>
        <Image
          source={theme.image}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{
            position: 'absolute',
            width: theme.imageBox.size,
            height: theme.imageBox.size,
            left: theme.imageBox.left,
            top: theme.imageBox.top,
          }}
        />
      </View>
    </LinearGradient>
  );

  const card = theme.stroke ? (
    // Gradient stroke: an outer gradient ring, the fill inset by the stroke width.
    <LinearGradient
      colors={theme.stroke.colors}
      locations={theme.stroke.locations}
      start={theme.stroke.start}
      end={theme.stroke.end}
      style={{ borderRadius: CARD_RADIUS, padding: strokeWidth }}
    >
      {body}
    </LinearGradient>
  ) : (
    body
  );

  const label = [eyebrow, name, priceLabel, unitLabel, footnote].filter(Boolean).join(', ');

  if (!onPress) {
    return (
      <View className={cn('w-full', className)} accessible accessibilityLabel={label}>
        {card}
      </View>
    );
  }

  return (
    <View className={cn('w-full', className)}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
      >
        {card}
      </Pressable>
    </View>
  );
}
