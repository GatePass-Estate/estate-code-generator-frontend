import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
} from 'react-native';
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
  /** Greyscale copy of `image` for an expired plan (Figma: saturation -100). */
  mutedImage: ImageSourcePropType;
  /**
   * Illustration size/offset inside the slot, in pt for the regular 150pt slot (scaled down with
   * the slot on narrow screens). Tuned so the art overflows the slot like the Figma frames but
   * never overlaps the copy column and its feet sit close to the card's bottom edge.
   */
  imageBox: { size: number; left: number; top: number };
};

// Figma gradientHandlePositions shared by every plan fill: from (0.01, 0.62) to (1.02, 0.32).
const FILL_START = { x: 0.01, y: 0.62 };
const FILL_END = { x: 1.02, y: 0.32 };
const FILL_LOCATIONS = [0.33, 0.99] as const;

const CARD_RADIUS = 16;
const CARD_PADDING = 16;
// Review feedback: the 110pt Figma illustrations were too small to read, so the slot is 150pt
// (130pt on <360pt-wide screens). Gap + right padding shrink from 28 + 32 to 10 + 10 so the copy
// column keeps Figma's ~149pt on a 375pt screen (and ~114pt at 320pt).
const IMAGE_SLOT = 150;
const IMAGE_SLOT_NARROW = 130;
const NARROW_SCREEN = 360;
const COLUMN_GAP = 10;
const RIGHT_PADDING = 10;
// The slot bleeds 6pt into the card's vertical padding (the card clips), keeping the card at
// ~170pt tall instead of 182pt.
const IMAGE_BLEED = 6;

const PLAN_CARD_THEMES: Record<PlanCardSlug, PlanCardTheme> = {
  access: {
    fill: ['#113E55', '#113E55'],
    image: require('@/src/assets/images/plans/plan-access.png'),
    mutedImage: require('@/src/assets/images/plans/plan-access-muted.png'),
    imageBox: { size: 168, left: -8, top: -8 },
  },
  watch: {
    fill: ['#113E55', '#19719D'],
    fillLocations: FILL_LOCATIONS,
    image: require('@/src/assets/images/plans/plan-watch.png'),
    mutedImage: require('@/src/assets/images/plans/plan-watch-muted.png'),
    imageBox: { size: 164, left: -4, top: -8 },
  },
  sentinel: {
    fill: ['#F46036', '#F68C6E'],
    fillLocations: FILL_LOCATIONS,
    image: require('@/src/assets/images/plans/plan-sentinel.png'),
    mutedImage: require('@/src/assets/images/plans/plan-sentinel-muted.png'),
    imageBox: { size: 164, left: -4, top: -4 },
  },
  command: {
    fill: ['#1C9A8C', '#49C8BA'],
    fillLocations: FILL_LOCATIONS,
    image: require('@/src/assets/images/plans/plan-command.png'),
    mutedImage: require('@/src/assets/images/plans/plan-command-muted.png'),
    imageBox: { size: IMAGE_SLOT, left: 0, top: 2 },
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
    mutedImage: require('@/src/assets/images/plans/plan-custom-muted.png'),
    imageBox: { size: IMAGE_SLOT, left: 0, top: 0 },
  },
};

// Expired plan ("Your Previous Plan"): grey fill, greyscale art, no Custom gold ring.
const EXPIRED_FILL = ['#5E6061', '#A5A5A6'] as const;

function getTheme(slug: string, expired: boolean): PlanCardTheme {
  const key = slug.toLowerCase() as PlanCardSlug;
  const theme = PLAN_CARD_THEMES[key] ?? PLAN_CARD_THEMES.watch;
  if (!expired) return theme;
  return {
    ...theme,
    fill: EXPIRED_FILL,
    fillLocations: FILL_LOCATIONS,
    stroke: undefined,
    image: theme.mutedImage,
  };
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
  /** Greyed-out "Your Previous Plan" look for a plan that has ended. */
  expired?: boolean;
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
  expired = false,
  onPress,
  className,
}: PlanCardProps) {
  const theme = getTheme(slug, expired);
  const { width: screenWidth } = useWindowDimensions();
  const slot = screenWidth < NARROW_SCREEN ? IMAGE_SLOT_NARROW : IMAGE_SLOT;
  const scale = slot / IMAGE_SLOT;
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
        paddingRight: RIGHT_PADDING - strokeWidth,
        gap: COLUMN_GAP,
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

      <View style={{ width: slot, height: slot, marginVertical: -IMAGE_BLEED }}>
        <Image
          source={theme.image}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          style={{
            position: 'absolute',
            width: theme.imageBox.size * scale,
            height: theme.imageBox.size * scale,
            left: theme.imageBox.left * scale,
            top: theme.imageBox.top * scale,
          }}
        />
      </View>
    </LinearGradient>
  );

  const card = theme.stroke ? (
    // Gradient stroke: an outer gradient ring, the fill inset by the stroke width. `overflow:
    // 'hidden'` is required: on iOS the gradient layer ignores borderRadius unless clipped, which
    // drew the ring with square corners.
    <LinearGradient
      colors={theme.stroke.colors}
      locations={theme.stroke.locations}
      start={theme.stroke.start}
      end={theme.stroke.end}
      style={{ borderRadius: CARD_RADIUS, padding: strokeWidth, overflow: 'hidden' }}
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
