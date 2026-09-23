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
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  CategoryExpandIcon,
  CategorySecurityIcon,
  CategoryMedicalIcon,
  CategoryMaintenanceIcon,
  CategoryAccessIcon,
  CategoryPropertyIcon,
  NarrativeSnippetIcon,
} from '@/src/assets/svgs';
import { type IncidentCategory, type IncidentCategoryId } from './incidentTypes';
import { mapCategoryEdaToUi } from './mapIncidentApi';

type CategoryDistributionProps = {
  selectedId: IncidentCategoryId;
  onSelect: (id: IncidentCategoryId) => void;
  categories: IncidentCategory[];
  totalReports?: number;
};

const FADE_MS = 180;

/** Soft opacity pulse when selection changes — no layout enter/exit */
function useSelectionFade(selectedId: string) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = 0.4;
    opacity.value = withTiming(1, { duration: FADE_MS });
  }, [selectedId, opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
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
  icon,
  color,
  size,
  filled = false,
}: {
  icon: IncidentCategory['icon'];
  color: string;
  size: number;
  filled?: boolean;
}) {
  if (icon === 'lock') return <CategorySecurityIcon color={color} size={size} filled={filled} />;
  if (icon === 'medical') return <CategoryMedicalIcon color={color} size={size} filled={filled} />;
  if (icon === 'wrench')
    return <CategoryMaintenanceIcon color={color} size={size} filled={filled} />;
  if (icon === 'home') return <CategoryPropertyIcon color={color} size={size} filled={filled} />;
  if (icon === 'access') return <CategoryAccessIcon color={color} size={size} filled={filled} />;
  return <MoreDotsIcon color={color} size={size} />;
}

/** Three dots geometrically centered in a square (avoids Text baseline offset). */
function MoreDotsIcon({ color, size = 25 }: { color: string; size?: number }) {
  const r = Math.max(1.1, size * 0.06);
  const gap = size * 0.18;
  const cy = size / 2;
  const cx = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={cx - gap} cy={cy} r={r} fill={color} />
      <Circle cx={cx} cy={cy} r={r} fill={color} />
      <Circle cx={cx + gap} cy={cy} r={r} fill={color} />
    </Svg>
  );
}

const BUBBLES: {
  id: IncidentCategoryId;
  size: number;
  left: number;
  top: number;
}[] = [
  { id: 'security', size: 62, left: 102, top: 0 },
  { id: 'medical', size: 62, left: 165, top: 41 },
  { id: 'maintenance', size: 54, left: 153, top: 113 },
  { id: 'access', size: 43, left: 101, top: 137 },
  { id: 'property', size: 28, left: 64, top: 117 },
  { id: 'others', size: 25, left: 51, top: 80 },
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

function iconSizeForBubble(size: number, icon: IncidentCategory['icon']) {
  if (icon === 'lock') return 24;
  if (icon === 'medical' || icon === 'wrench') return 16;
  if (icon === 'home' || icon === 'access') return 12;
  if (size >= 54) return 24;
  if (size >= 40) return 16;
  return 12;
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
  const fadeStyle = useSelectionFade(selectedId);

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
      className="mt-[21px]"
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
              <Animated.View style={cat.id === selectedId ? fadeStyle : undefined}>
                <NarrativeCard text={cat.narrative} />
              </Animated.View>
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
  fullWidth = false,
}: {
  name: string;
  pct: number;
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
        <View style={{ transform: [{ rotate: '42.51deg' }] }}>
          <CategoryExpandIcon size={24} bg="#EFF1F1" color="#113E55" />
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
  const thresholdCopy = category.thresholdLabel.startsWith('>')
    ? 'Category more than 5%'
    : 'Category less than 5%';

  const goPrev = () => {
    const next = (index - 1 + categories.length) % categories.length;
    onChangeCategory(categories[next].id);
  };
  const goNext = () => {
    const next = (index + 1) % categories.length;
    onChangeCategory(categories[next].id);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/80" onPress={onClose}>
                <Pressable className="h-[561px] rounded-t-[40px] bg-[#F6F7F7]" onPress={() => {}}>
          <View className="h-[34px] items-center justify-center">
            <View className="h-[7px] w-[134px] rounded-[4px] bg-[#9B9797]" />
          </View>

          <View className="mt-[50px] flex-row items-start justify-between px-6">
            <View className="mr-3 min-w-0 flex-1 gap-1 pr-2">
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
            </View>
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

          <View className="mt-[43px] flex-row gap-1 px-6">
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
          </View>

          <ScrollView
            className="mt-4 flex-1 px-6"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-4 pb-10"
          >
            {category.narrative?.trim() ? <NarrativeCard text={category.narrative} /> : null}
            {category.detail?.trim() ? <NarrativeCard text={category.detail} /> : null}
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
  const selected = catalog.find((item) => item.id === selectedId) ?? catalog[0];
  const selectedIndex = catalog.findIndex((c) => c.id === selectedId);
  const showSubcategories = selectedId === 'others' && (selected.subcategories?.length ?? 0) > 0;
  const metricsFade = useSelectionFade(selectedId);
  const subcategoryCount = selected.subcategories?.length ?? 0;
  const othersStackHeight =
    subcategoryCount > 0
      ? subcategoryCount * SUBCATEGORY_CARD_HEIGHT + (subcategoryCount - 1) * SUBCATEGORY_GAP
      : 0;
  const chartAreaHeight = showSubcategories
    ? Math.max(CHART_AREA_HEIGHT, othersStackHeight)
    : CHART_AREA_HEIGHT;

  return (
    <View className="-mx-5 mt-4">
      <View className="mb-[33px] flex-row items-center justify-between px-[26px]">
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

            <View className="relative w-full" style={{ height: chartAreaHeight }}>
        {BUBBLES.map((bubble) => {
          const category = catalog.find((item) => item.id === bubble.id);
          if (!category) return null;
          const isSelected = selectedId === bubble.id;
          const iconColor = isSelected ? '#F6F7F7' : '#113E55';
          const showPct = isSelected && category.icon !== 'more';
          const iconSz = iconSizeForBubble(bubble.size, category.icon);

          return (
            <Pressable
              key={bubble.id}
              onPress={() => onSelect(bubble.id)}
              className="absolute items-center justify-center"
              style={{
                left: bubble.left - 2,
                top: bubble.top - 2,
                width: bubble.size + 4,
                height: bubble.size + 4,
                overflow: 'visible',
              }}
            >
              {isSelected ? (
                <ActiveBubbleRing size={bubble.size} id={bubble.id} />
              ) : (
                <View
                  className="absolute rounded-full bg-white"
                  style={{
                    width: bubble.size,
                    height: bubble.size,
                    left: 2,
                    top: 2,
                  }}
                />
              )}

              {category.icon === 'more' ? (
                                <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
                  <MoreDotsIcon color={iconColor} size={bubble.size} />
                </View>
              ) : showPct && bubble.size >= 54 ? (
                                <View className="items-center gap-1">
                  <CategoryIcon icon={category.icon} color={iconColor} size={iconSz} filled />
                  <Text
                    allowFontScaling={false}
                    numberOfLines={1}
                    className="text-[11.2px] font-inter-semibold leading-[14px] text-[#F6F7F7]"
                  >
                    {formatBubbleShare(category.share)}%
                  </Text>
                </View>
              ) : showPct && bubble.size >= 40 ? (
                                <View className="items-center justify-center gap-0.5 px-0.5">
                  <CategoryIcon icon={category.icon} color="#F6F7F7" size={12} filled />
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
              ) : showPct ? (
                                <View className="items-center justify-center gap-0.5 px-0.5">
                  <CategoryIcon icon={category.icon} color="#F6F7F7" size={iconSz} filled />
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
              ) : (
                /* Inactive — filled icons on white (security stays outline) */
                <CategoryIcon
                  icon={category.icon}
                  color={iconColor}
                  size={iconSz}
                  filled={category.icon !== 'lock'}
                />
              )}
            </Pressable>
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
              <SubcategoryCard key={`${sub.name}-${i}`} name={sub.name} pct={sub.pct} />
            ))}
          </Animated.View>
        ) : (
          /* Side metrics — same width as Others subcategory cards */
          <Animated.View
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
      </View>

      <NarrativeSnippetSlider selectedId={selectedId} onSelect={onSelect} categories={catalog} />

      <View className="mt-8 flex-row items-center justify-center gap-[4px]">
        {catalog.map((cat, i) => (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            hitSlop={6}
            className={`h-[5px] w-[5px] rounded-full ${
              i === selectedIndex ? 'bg-[#113E55]' : 'bg-[#D3D3D3]'
            }`}
          />
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
