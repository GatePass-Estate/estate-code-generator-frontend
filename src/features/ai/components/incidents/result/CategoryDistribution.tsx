import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import TableEmptyState from '@/src/features/ai/components/shared/TableEmptyState';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CategoryExpandIcon } from '@/src/assets/svgs';
import {
  CategoryBubble,
  PageDot,
} from '@/src/features/ai/components/incidents/result/categoryBubbles';
import {
  BUBBLE_CLUSTER_RIGHT,
  BUBBLE_LAYOUT,
  BUBBLE_TO_CARDS_GAP,
  CHART_AREA_HEIGHT,
  MAX_SIDE_SUBCATEGORIES,
  SIDE_METRIC_CARD_WIDTH,
  SIDE_STACK_RIGHT_INSET,
  SUBCATEGORY_CARD_WIDTH,
  SUBCATEGORY_CARD_HEIGHT,
  SUBCATEGORY_GAP,
  TOTAL_LABEL_LEFT,
  TOTAL_LABEL_TOP,
} from '@/src/features/ai/components/incidents/result/categoryLayout';
import {
  MetricCard,
  SubcategoryCard,
  ThresholdBadge,
} from '@/src/features/ai/components/incidents/result/categorySideCards';
import { NarrativeSnippetSlider } from '@/src/features/ai/components/incidents/result/NarrativeSnippetSlider';
import {
  type IncidentCategory,
  type IncidentCategoryId,
  OTHERS_BUCKET_ID,
} from '@/src/features/ai/components/incidents/incidentTypes';
import { mapCategoryEdaToUi } from '@/src/features/ai/components/incidents/mapIncidentApi';
import { CategoryExpandSheet } from '@/src/features/ai/components/incidents/result/CategoryExpandSheet';
import {
  CATEGORY_EASE_OUT,
  CATEGORY_TRANSITION_MS,
  useSelectionTransition,
} from '@/src/features/ai/components/incidents/result/categoryMotion';

type CategoryDistributionProps = {
  selectedId: IncidentCategoryId;
  onSelect: (id: IncidentCategoryId) => void;
  categories: IncidentCategory[];
  totalReports?: number;
};

export default function CategoryDistribution({
  selectedId,
  onSelect,
  categories,
  totalReports,
}: CategoryDistributionProps) {
  const { width: windowWidth } = useWindowDimensions();
  const catalog = categories.length > 0 ? categories : mapCategoryEdaToUi(null);
  const total = totalReports ?? 0;
  const [expanded, setExpanded] = useState(false);
  const [chartWidth, setChartWidth] = useState(windowWidth);
  const [sideStackHeight, setSideStackHeight] = useState(0);
  const [sheetSubKey, setSheetSubKey] = useState<string | null>(null);
  const selected = catalog.find((item) => item.id === selectedId) ?? catalog[0];
  const selectedIndex = catalog.findIndex((c) => c.id === selectedId);
  const showSubcategories =
    !!selected && selected.id === OTHERS_BUCKET_ID && (selected.subcategories?.length ?? 0) > 0;
  const metricsFade = useSelectionTransition(selectedId, selectedId !== OTHERS_BUCKET_ID);
  const visibleSubcategories = selected?.subcategories?.slice(0, MAX_SIDE_SUBCATEGORIES) ?? [];
  const subcategoryCount = visibleSubcategories.length;

  const openSheet = (subKey: string | null = null) => {
    setSheetSubKey(subKey);
    setExpanded(true);
  };
  const othersStackHeight =
    subcategoryCount > 0
      ? subcategoryCount * SUBCATEGORY_CARD_HEIGHT + (subcategoryCount - 1) * SUBCATEGORY_GAP
      : 0;
  const bubbleScale = useMemo(() => {
    const cardsLeft = chartWidth - SIDE_STACK_RIGHT_INSET - SIDE_METRIC_CARD_WIDTH;
    const maxClusterRight = cardsLeft - BUBBLE_TO_CARDS_GAP;
    if (maxClusterRight <= 0) return 1;
    return Math.min(1, Math.max(0.7, maxClusterRight / BUBBLE_CLUSTER_RIGHT));
  }, [chartWidth]);
  const scaledBubbles = useMemo(
    () =>
      BUBBLE_LAYOUT.map((slot) => ({
        size: slot.size * bubbleScale,
        left: slot.left * bubbleScale,
        top: slot.top * bubbleScale,
      })),
    [bubbleScale]
  );
  /** Grow with side cards / Others stack so Narrative stays 16px below (no absolute overflow). */
  const chartAreaHeight = Math.max(
    CHART_AREA_HEIGHT * bubbleScale,
    othersStackHeight,
    sideStackHeight
  );
  const animatedChartHeight = useSharedValue(chartAreaHeight);
  useEffect(() => {
    animatedChartHeight.value = withTiming(chartAreaHeight, {
      duration: CATEGORY_TRANSITION_MS,
      easing: CATEGORY_EASE_OUT,
    });
  }, [chartAreaHeight, animatedChartHeight]);
  const chartHeightStyle = useAnimatedStyle(() => ({ height: animatedChartHeight.value }));

  if (!selected) {
    return (
      <View className="-mx-5 mt-4 px-[26px]">
        <Text
          allowFontScaling={false}
          className="text-heading-sm font-ubuntu-semibold text-[#0A1F29]"
        >
          Category Distribution
        </Text>
        <View className="mt-4 rounded-[16px] bg-white px-4 py-2">
          <TableEmptyState
            icon={<MaterialCommunityIcons name="chart-donut" size={22} color="#878686" />}
            title="No category data"
            subtitle="Nothing was reported in this window. Try another date range."
          />
        </View>
      </View>
    );
  }

  return (
    <View className="-mx-5 mt-4">
      <View className="mb-[24px] flex-row items-center justify-between px-[26px]">
        <Text
          allowFontScaling={false}
          className="text-heading-sm font-ubuntu-semibold text-[#0A1F29]"
        >
          Category Distribution
        </Text>
        <Pressable
          onPress={() => openSheet()}
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

      <Animated.View
        className="relative w-full"
        style={chartHeightStyle}
        onLayout={(e) => {
          const w = Math.round(e.nativeEvent.layout.width);
          if (w > 0 && w !== chartWidth) setChartWidth(w);
        }}
      >
        {catalog.slice(0, scaledBubbles.length).map((category, index) => {
          const layout = scaledBubbles[index];
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

        <View
          className="absolute items-center"
          style={{
            left: TOTAL_LABEL_LEFT * bubbleScale,
            top: TOTAL_LABEL_TOP * bubbleScale,
            width: 48 * bubbleScale,
          }}
        >
          <Text
            allowFontScaling={false}
            className="text-center text-2xs font-inter-medium text-[#878686]"
          >
            TOTAL
          </Text>
          <Text
            allowFontScaling={false}
            className="text-center text-heading font-ubuntu-medium leading-[27.34px] text-[#878686]"
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
            {visibleSubcategories.map((sub) => (
              <Pressable
                key={sub.apiCategory}
                onPress={() => openSheet(sub.apiCategory)}
                accessibilityRole="button"
                accessibilityLabel={`${sub.fullName} details`}
              >
                <SubcategoryCard name={sub.name} pct={sub.pct} apiCategory={sub.apiCategory} />
              </Pressable>
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
                  <View className="h-[15px] w-6 items-center justify-center bg-light-teal">
                    <Text
                      allowFontScaling={false}
                      className="text-2xs font-inter-medium text-dark-teal"
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
                  <Text className="text-2xs">/{total}</Text>
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
        initialSubKey={sheetSubKey}
        onClose={() => setExpanded(false)}
        onChangeCategory={onSelect}
        categories={catalog}
        totalReports={total}
      />
    </View>
  );
}
