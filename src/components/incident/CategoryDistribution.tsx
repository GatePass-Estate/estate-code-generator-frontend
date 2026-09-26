import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { CategoryExpandIcon, NarrativeSnippetIcon } from '@/src/assets/svgs';
import { IncidentCategoryIcon } from './categoryIcons';
import { type IncidentCategory, type IncidentCategoryId, OTHERS_BUCKET_ID } from './incidentTypes';
import { mapCategoryEdaToUi } from './mapIncidentApi';

type CategoryDistributionProps = {
  selectedId: IncidentCategoryId;
  onSelect: (id: IncidentCategoryId) => void;
  categories: IncidentCategory[];
  totalReports?: number;
};

const TRANSITION_MS = 280;
const EASE_OUT = Easing.bezier(0.25, 0.1, 0.25, 1);

/**
 * Opacity-only fade when the selected category changes. No transforms, so iOS and
 * Android render the same frames.
 */
function useSelectionTransition(selectedId: string) {
  const progress = useSharedValue(1);
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: TRANSITION_MS, easing: EASE_OUT });
  }, [selectedId, progress]);
  return useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
  }));
}

/** 0 → 1 as `active` toggles, eased. */
function useActiveProgress(active: boolean) {
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: TRANSITION_MS, easing: EASE_OUT });
  }, [active, progress]);
  return progress;
}

function PageDot({ active, onPress }: { active: boolean; onPress: () => void }) {
  const progress = useActiveProgress(active);
  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#D3D3D3', '#113E55']),
  }));
  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Animated.View style={[{ width: 5, height: 5, borderRadius: 2.5 }, dotStyle]} />
    </Pressable>
  );
}

function ActiveBubbleRing({ size, id }: { size: number; id: string }) {
  const svgSize = size + 4; // 2px stroke extends outside
  const center = svgSize / 2;
  const gradId = `activeBubble-${id}`;
  return (
    <Svg width={svgSize} height={svgSize} style={{ position: 'absolute', left: 0, top: 0 }}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0C72A6" stopOpacity={0.44} />
          <Stop offset="1" stopColor="#0783C2" stopOpacity={0.44} />
        </LinearGradient>
      </Defs>
      <Circle
        cx={center}
        cy={center}
        r={size / 2}
        fill="#113E55"
        stroke={`url(#${gradId})`}
        strokeWidth={2}
      />
    </Svg>
  );
}

function CategoryIcon({
  apiCategory,
  color,
  size,
  filled = false,
}: {
  apiCategory: string;
  color: string;
  size: number;
  filled?: boolean;
}) {
  return <IncidentCategoryIcon category={apiCategory} color={color} size={size} filled={filled} />;
}

/** Bubble layout slots (size/position). Filled from API category order — not hardcoded ids. */
const BUBBLE_LAYOUT: { size: number; left: number; top: number }[] = [
  { size: 62, left: 102, top: 0 },
  { size: 62, left: 165, top: 41 },
  { size: 54, left: 153, top: 113 },
  { size: 43, left: 101, top: 137 },
  { size: 28, left: 64, top: 117 },
  { size: 25, left: 51, top: 80 },
];

/** Chart + side cards: 3×52+2×16=188; Others stack grows with taller cards */
const CHART_AREA_HEIGHT = 188;
const SIDE_METRIC_CARD_WIDTH = 120;
const SUBCATEGORY_CARD_WIDTH = SIDE_METRIC_CARD_WIDTH;
const SUBCATEGORY_CARD_HEIGHT = 56;
const SUBCATEGORY_GAP = 6;

/** Keep bubble % on one line (avoids "72.7" / "%" wrap inside small circles). */
function formatBubbleShare(share: number): string {
  const rounded = Math.round(Number(share) || 0);
  return String(rounded);
}

function iconSizeForBubble(size: number) {
  if (size >= 54) return 22;
  if (size >= 40) return 16;
  if (size >= 28) return 12;
  return 10;
}

function BubbleContent({
  category,
  size,
  isSelected,
}: {
  category: IncidentCategory;
  size: number;
  isSelected: boolean;
}) {
  const isOthersBucket = category.id === OTHERS_BUCKET_ID;
  const iconColor = isSelected ? '#F6F7F7' : '#113E55';
  const showPct = isSelected && !isOthersBucket;
  const iconSz = iconSizeForBubble(size);

  if (isOthersBucket) {
    return (
      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <CategoryIcon
          apiCategory={category.apiCategory}
          color={iconColor}
          size={Math.max(12, size * 0.45)}
          filled
        />
      </View>
    );
  }

  if (showPct && size >= 54) {
    return (
      <View className="items-center gap-1">
        <CategoryIcon apiCategory={category.apiCategory} color={iconColor} size={iconSz} filled />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="text-[11.2px] font-inter-semibold leading-[14px] text-[#F6F7F7]"
        >
          {formatBubbleShare(category.share)}%
        </Text>
      </View>
    );
  }

  if (showPct && size >= 40) {
    return (
      <View className="items-center justify-center gap-0.5 px-0.5">
        <CategoryIcon apiCategory={category.apiCategory} color="#F6F7F7" size={12} filled />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          className="text-center text-[8.96px] font-inter-medium leading-[11px] text-[#F6F7F7]"
        >
          {formatBubbleShare(category.share)}%
        </Text>
      </View>
    );
  }

  if (showPct) {
    return (
      <View className="items-center justify-center gap-0.5 px-0.5">
        <CategoryIcon apiCategory={category.apiCategory} color="#F6F7F7" size={iconSz} filled />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          className="text-center text-[6.8px] font-inter-semibold leading-[8px] text-[#F6F7F7]"
        >
          {formatBubbleShare(category.share)}%
        </Text>
      </View>
    );
  }

  return (
    <CategoryIcon
      apiCategory={category.apiCategory}
      color={iconColor}
      size={iconSz}
      filled={isSelected}
    />
  );
}

function CategoryBubble({
  category,
  layout,
  isSelected,
  onPress,
}: {
  category: IncidentCategory;
  layout: { size: number; left: number; top: number };
  isSelected: boolean;
  onPress: () => void;
}) {
  const progress = useActiveProgress(isSelected);
  const contentOpacity = useSharedValue(1);
  const didMount = useRef(false);
  const boxSize = layout.size + 4;

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    contentOpacity.value = 0;
    contentOpacity.value = withTiming(1, { duration: TRANSITION_MS, easing: EASE_OUT });
  }, [isSelected, contentOpacity]);

  const ringStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const whiteStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: 'absolute',
        left: layout.left - 2,
        top: layout.top - 2,
        width: boxSize,
        height: boxSize,
      }}
    >
      <View style={{ width: boxSize, height: boxSize }}>
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              width: layout.size,
              height: layout.size,
              left: 2,
              top: 2,
              borderRadius: layout.size / 2,
              backgroundColor: '#FFFFFF',
            },
            whiteStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            { position: 'absolute', left: 0, top: 0, width: boxSize, height: boxSize },
            ringStyle,
          ]}
        >
          <ActiveBubbleRing size={layout.size} id={category.id} />
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: 'center',
              justifyContent: 'center',
            },
            contentStyle,
          ]}
        >
          <BubbleContent category={category} size={layout.size} isSelected={isSelected} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

function ThresholdBadge({ label }: { label: string }) {
  return (
    <View className="h-[15px] items-center justify-center bg-[#FBFBEE] px-0.5">
      <Text allowFontScaling={false} className="text-[8.96px] font-inter-medium text-[#B17000]">
        {label}
      </Text>
    </View>
  );
}

function MetricCard({
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
        <Text allowFontScaling={false} className="text-[8.96px] font-inter-medium text-[#878686]">
          {label}
        </Text>
        {badge}
      </View>
      {value}
    </View>
  );
}

function NarrativeCard({ text }: { text: string }) {
  return (
    <View className="w-full gap-1 rounded border border-[#EFF1F3] bg-white p-2">
      <View className="flex-row items-center gap-1">
        <NarrativeSnippetIcon size={16} color="#F46036" />
        <Text allowFontScaling={false} className="text-[8.96px] font-inter-medium text-[#878686]">
          Narrative Snippet
        </Text>
      </View>
      <Text
        allowFontScaling={false}
        className="text-[11.2px] font-inter-regular leading-[14px] text-[#878686]"
      >
        {text}
      </Text>
    </View>
  );
}

function NarrativeSnippetSlider({
  selectedId,
  onSelect,
  categories,
}: {
  selectedId: IncidentCategoryId;
  onSelect: (id: IncidentCategoryId) => void;
  categories: IncidentCategory[];
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const suppressSelect = useRef(false);
  const selectedIndex = categories.findIndex((c) => c.id === selectedId);
  useEffect(() => {
    if (pageWidth <= 0 || selectedIndex < 0) return;
    suppressSelect.current = true;
    scrollRef.current?.scrollTo({
      x: selectedIndex * pageWidth,
      animated: true,
    });
    const t = setTimeout(() => {
      suppressSelect.current = false;
    }, 350);
    return () => clearTimeout(t);
  }, [selectedId, selectedIndex, pageWidth]);

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (suppressSelect.current || pageWidth <= 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    const cat = categories[next];
    if (cat && cat.id !== selectedId) onSelect(cat.id);
  };

  return (
    <View
      style={{ marginTop: 16 }}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0 && w !== pageWidth) setPageWidth(w);
      }}
    >
      {pageWidth > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
        >
          {categories.map((cat) => (
            <View key={cat.id} style={{ width: pageWidth }} className="px-[26px]">
              <NarrativeCard text={cat.narrative} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className="px-[26px]">
          <NarrativeCard
            text={
              categories.find((c) => c.id === selectedId)?.narrative ??
              categories[0]?.narrative ??
              ''
            }
          />
        </View>
      )}
    </View>
  );
}

function SubcategoryCard({
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
          className="min-w-0 flex-1 text-[11.2px] font-inter-medium leading-[14px] text-[#0A1F29]"
        >
          {name}
        </Text>
      </View>

      <View className="mt-1.5 flex-row items-center gap-1 pl-7">
        <Text
          allowFontScaling={false}
          className="text-[8.96px] font-inter-medium leading-[11px] text-[#878686]"
        >
          {pctLabel}
        </Text>
        <View className="h-[5px] flex-1 justify-center overflow-hidden rounded-full bg-[#D3D3D3]">
          <View
            className="h-[5px] rounded-full bg-[#1B998B]"
            style={{ width: `${Math.round(fillRatio * 100)}%` }}
          />
        </View>
      </View>
    </View>
  );
}

function CategoryExpandSheet({
  visible,
  categoryId,
  onClose,
  onChangeCategory,
  categories,
  totalReports,
}: {
  visible: boolean;
  categoryId: IncidentCategoryId;
  onClose: () => void;
  onChangeCategory: (id: IncidentCategoryId) => void;
  categories: IncidentCategory[];
  totalReports: number;
}) {
  const index = categories.findIndex((c) => c.id === categoryId);
  const category = categories[index] ?? categories[0];
  const contentFade = useSelectionTransition(categoryId);
  if (!visible || !category) return null;

  const thresholdCopy = category.thresholdLabel.startsWith('>')
    ? 'Category more than 5%'
    : 'Category less than 5%';

  const goPrev = () => {
    if (!categories.length) return;
    const next = (index - 1 + categories.length) % categories.length;
    onChangeCategory(categories[next].id);
  };
  const goNext = () => {
    if (!categories.length) return;
    const next = (index + 1) % categories.length;
    onChangeCategory(categories[next].id);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/80" onPress={onClose}>
        <Pressable className="h-[561px] rounded-t-[40px] bg-[#F6F7F7]" onPress={() => {}}>
          <View className="h-[34px] items-center justify-center">
            <View className="h-[7px] w-[134px] rounded-[4px] bg-[#9B9797]" />
          </View>

          <View className="mt-[50px] flex-row items-start justify-between px-6">
            <Animated.View className="mr-3 min-w-0 flex-1 gap-1 pr-2" style={contentFade}>
              <Text
                allowFontScaling={false}
                className="text-left text-[21.88px] font-ubuntu-semibold leading-[26px] text-[#113E55]"
              >
                {category.name}
              </Text>
              <Text
                allowFontScaling={false}
                className="text-left text-[11.2px] font-inter-regular leading-[14px] text-[#878686]"
              >
                {thresholdCopy}
              </Text>
            </Animated.View>
            <View className="flex-row gap-4">
              <Pressable
                onPress={goPrev}
                accessibilityLabel="Previous category"
                className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
                hitSlop={8}
              >
                <MaterialIcons name="chevron-left" size={22} color="#113E55" />
              </Pressable>
              <Pressable
                onPress={goNext}
                accessibilityLabel="Next category"
                className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
                hitSlop={8}
              >
                <MaterialIcons name="chevron-right" size={22} color="#113E55" />
              </Pressable>
            </View>
          </View>

          <Animated.View className="mt-[43px] flex-row gap-1 px-6" style={contentFade}>
            <View className="min-h-[52px] w-[104px] justify-center gap-1 rounded border border-[#EFF1F3] bg-white p-2">
              <View className="flex-row flex-wrap items-center gap-1">
                <Text
                  allowFontScaling={false}
                  className="text-[8.96px] font-inter-medium text-[#878686]"
                >
                  Peak Time
                </Text>
                {category.peakPct > 0 ? (
                  <View className="h-[15px] items-center justify-center bg-[#F4FFFE] px-1">
                    <Text
                      allowFontScaling={false}
                      className="text-[8.96px] font-inter-medium text-[#167A6F]"
                    >
                      {category.peakPct}%
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text
                allowFontScaling={false}
                className="text-left text-sm font-inter-medium leading-[18px] text-[#878686]"
              >
                {category.peakTime}
              </Text>
            </View>

            <View className="min-h-[52px] w-[104px] gap-1 rounded border border-[#EFF1F3] bg-white p-2">
              <Text
                allowFontScaling={false}
                className="text-[8.96px] font-inter-medium text-[#878686]"
              >
                Incident Count
              </Text>
              <Text
                allowFontScaling={false}
                className="text-left text-sm font-inter-medium text-[#878686]"
              >
                {category.count}
                <Text className="text-[8.96px]">/{totalReports}</Text>
              </Text>
            </View>

            <View className="min-h-[52px] w-[104px] gap-1 rounded border border-[#EFF1F3] bg-white p-2">
              <Text
                allowFontScaling={false}
                className="text-[8.96px] font-inter-medium text-[#878686]"
              >
                Incident Share
              </Text>
              <Text
                allowFontScaling={false}
                className="text-left text-sm font-inter-medium text-[#878686]"
              >
                {category.share}%
              </Text>
            </View>
          </Animated.View>

          <ScrollView
            className="mt-4 flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-4 pb-10"
          >
            <Animated.View className="gap-4" style={contentFade}>
              {category.narrative?.trim() ? <NarrativeCard text={category.narrative} /> : null}
              {category.detail?.trim() ? <NarrativeCard text={category.detail} /> : null}
            </Animated.View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function CategoryDistribution({
  selectedId,
  onSelect,
  categories,
  totalReports,
}: CategoryDistributionProps) {
  const catalog = categories.length > 0 ? categories : mapCategoryEdaToUi(null);
  const total = totalReports ?? 0;
  const [expanded, setExpanded] = useState(false);
  const [sideStackHeight, setSideStackHeight] = useState(0);
  const selected = catalog.find((item) => item.id === selectedId) ?? catalog[0];
  const selectedIndex = catalog.findIndex((c) => c.id === selectedId);
  const showSubcategories =
    !!selected && selected.id === OTHERS_BUCKET_ID && (selected.subcategories?.length ?? 0) > 0;
  const metricsFade = useSelectionTransition(selectedId);
  const subcategoryCount = selected?.subcategories?.length ?? 0;
  const othersStackHeight =
    subcategoryCount > 0
      ? subcategoryCount * SUBCATEGORY_CARD_HEIGHT + (subcategoryCount - 1) * SUBCATEGORY_GAP
      : 0;
  /** Grow with side cards / Others stack so Narrative stays 16px below (no absolute overflow). */
  const chartAreaHeight = Math.max(CHART_AREA_HEIGHT, othersStackHeight, sideStackHeight);
  const animatedChartHeight = useSharedValue(chartAreaHeight);
  useEffect(() => {
    animatedChartHeight.value = withTiming(chartAreaHeight, {
      duration: TRANSITION_MS,
      easing: EASE_OUT,
    });
  }, [chartAreaHeight, animatedChartHeight]);
  const chartHeightStyle = useAnimatedStyle(() => ({ height: animatedChartHeight.value }));

  if (!selected) {
    return (
      <View className="-mx-5 mt-4 px-[26px]">
        <Text
          allowFontScaling={false}
          className="text-[21.88px] font-ubuntu-semibold text-[#0A1F29]"
        >
          Category Distribution
        </Text>
        <Text allowFontScaling={false} className="mt-4 text-sm font-inter-medium text-[#878686]">
          No category data for this period.
        </Text>
      </View>
    );
  }

  return (
    <View className="-mx-5 mt-4">
      <View className="mb-[24px] flex-row items-center justify-between px-[26px]">
        <Text
          allowFontScaling={false}
          className="text-[21.88px] font-ubuntu-semibold text-[#0A1F29]"
        >
          Category Distribution
        </Text>
        <Pressable
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel="Expand category details"
          hitSlop={8}
          className="h-[45px] w-[45px] items-center justify-center"
        >
          <View style={{ transform: [{ rotate: '42.51deg' }] }}>
            <CategoryExpandIcon size={32} />
          </View>
        </Pressable>
      </View>

      <Animated.View className="relative w-full" style={chartHeightStyle}>
        {catalog.slice(0, BUBBLE_LAYOUT.length).map((category, index) => {
          const layout = BUBBLE_LAYOUT[index];
          if (!layout) return null;
          return (
            <CategoryBubble
              key={category.id}
              category={category}
              layout={layout}
              isSelected={selectedId === category.id}
              onPress={() => onSelect(category.id)}
            />
          );
        })}

        <View className="absolute left-[107px] top-[77px] w-[48px] items-center">
          <Text
            allowFontScaling={false}
            className="text-center text-[8.96px] font-inter-medium text-[#878686]"
          >
            TOTAL
          </Text>
          <Text
            allowFontScaling={false}
            className="text-center text-[27.34px] font-ubuntu-medium leading-[27.34px] text-[#878686]"
          >
            {total}
          </Text>
        </View>

        {showSubcategories ? (
          <Animated.View
            onLayout={(e) => {
              const h = Math.ceil(e.nativeEvent.layout.height);
              if (h > 0 && h !== sideStackHeight) setSideStackHeight(h);
            }}
            style={[
              metricsFade,
              {
                position: 'absolute',
                right: 26,
                top: 0,
                width: SUBCATEGORY_CARD_WIDTH,
                zIndex: 2,
                gap: SUBCATEGORY_GAP,
              },
            ]}
          >
            {selected.subcategories!.map((sub, i) => (
              <SubcategoryCard
                key={`${sub.name}-${i}`}
                name={sub.name}
                pct={sub.pct}
                apiCategory={sub.apiCategory}
              />
            ))}
          </Animated.View>
        ) : (
          /* Side metrics — same width as Others subcategory cards */
          <Animated.View
            onLayout={(e) => {
              const h = Math.ceil(e.nativeEvent.layout.height);
              if (h > 0 && h !== sideStackHeight) setSideStackHeight(h);
            }}
            style={[
              metricsFade,
              {
                position: 'absolute',
                right: 26,
                top: 0,
                width: SIDE_METRIC_CARD_WIDTH,
                zIndex: 2,
                gap: 16,
              },
            ]}
          >
            <MetricCard
              className="min-h-[52px] justify-center"
              label="Category"
              badge={<ThresholdBadge label={selected.thresholdLabel} />}
              value={
                <Text
                  allowFontScaling={false}
                  className="text-sm font-inter-medium leading-[18px] text-[#878686]"
                >
                  {selected.name}
                </Text>
              }
            />
            <MetricCard
              className="min-h-[52px] justify-center"
              label="Peak Time"
              badge={
                selected.peakPct > 0 ? (
                  <View className="h-[15px] w-6 items-center justify-center bg-[#F4FFFE]">
                    <Text
                      allowFontScaling={false}
                      className="text-[8.96px] font-inter-medium text-[#167A6F]"
                    >
                      {selected.peakPct}%
                    </Text>
                  </View>
                ) : undefined
              }
              value={
                <Text allowFontScaling={false} className="text-sm font-inter-medium text-[#878686]">
                  {selected.peakTime}
                </Text>
              }
            />
            <MetricCard
              className="h-[52px] justify-center"
              label="Incident Count"
              value={
                <Text allowFontScaling={false} className="text-sm font-inter-medium text-[#878686]">
                  {selected.count}
                  <Text className="text-[8.96px]">/{total}</Text>
                </Text>
              }
            />
          </Animated.View>
        )}
      </Animated.View>

      <NarrativeSnippetSlider selectedId={selectedId} onSelect={onSelect} categories={catalog} />

      <View className="mt-8 flex-row items-center justify-center gap-[4px]">
        {catalog.map((cat, i) => (
          <PageDot key={cat.id} active={i === selectedIndex} onPress={() => onSelect(cat.id)} />
        ))}
      </View>

      <CategoryExpandSheet
        visible={expanded}
        categoryId={selectedId}
        onClose={() => setExpanded(false)}
        onChangeCategory={onSelect}
        categories={catalog}
        totalReports={total}
      />
    </View>
  );
}
