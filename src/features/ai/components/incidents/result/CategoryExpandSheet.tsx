import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import Animated from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { NarrativeSnippetIcon } from '@/src/assets/svgs';
import {
  type IncidentCategory,
  type IncidentCategoryId,
  OTHERS_BUCKET_ID,
} from '@/src/features/ai/components/incidents/incidentTypes';
import { useSelectionTransition } from '@/src/features/ai/components/incidents/result/categoryMotion';

export function NarrativeCard({ text }: { text: string }) {
  return (
    <View className="w-full gap-[4px] rounded-[4px] bg-white p-[8px]">
      <View className="flex-row items-start gap-[4px]">
        <NarrativeSnippetIcon size={16} color="#F46036" />
        <View className="h-[15px] justify-center">
          <Text
            allowFontScaling={false}
            className="text-2xs font-inter-medium text-[#878686] leading-[15px]"
          >
            Narrative Snippet
          </Text>
        </View>
      </View>
      <Text allowFontScaling={false} className="text-caption font-inter-regular text-[#878686]">
        {text}
      </Text>
    </View>
  );
}

export function CategoryExpandSheet({
  visible,
  categoryId,
  initialSubKey,
  onClose,
  onChangeCategory,
  categories,
  totalReports,
}: {
  visible: boolean;
  categoryId: IncidentCategoryId;
  /** Others only: open straight onto this subcategory (`apiCategory`). */
  initialSubKey?: string | null;
  onClose: () => void;
  onChangeCategory: (id: IncidentCategoryId) => void;
  categories: IncidentCategory[];
  totalReports: number;
}) {
  const index = categories.findIndex((c) => c.id === categoryId);
  const category = categories[index] ?? categories[0];
  const subcategories = category?.id === OTHERS_BUCKET_ID ? (category.subcategories ?? []) : [];
  const [subKey, setSubKey] = useState<string | null>(initialSubKey ?? null);
  const pendingSubKey = useRef<string | null>(null);

  useEffect(() => {
    if (visible) setSubKey(initialSubKey ?? null);
  }, [visible, initialSubKey]);

  useEffect(() => {
    setSubKey(pendingSubKey.current);
    pendingSubKey.current = null;
  }, [categoryId]);

  // Others has no stop of its own — its subcategories are stepped through individually.
  const selectedSub =
    subcategories.find((s) => s.apiCategory === subKey) ?? subcategories[0] ?? null;
  const contentFade = useSelectionTransition(
    `${categoryId}:${selectedSub?.apiCategory ?? ''}`,
    category?.id !== OTHERS_BUCKET_ID
  );
  if (!visible || !category) return null;

  const detail = selectedSub
    ? {
        name: selectedSub.fullName,
        thresholdLabel: selectedSub.thresholdLabel,
        peakTime: selectedSub.peakTime,
        peakPct: 0,
        count: selectedSub.count,
        share: selectedSub.pct,
        narrative: selectedSub.narrative,
        narratives: selectedSub.narratives,
        detail: '',
      }
    : category;

  const thresholdCopy = detail.thresholdLabel.startsWith('>')
    ? 'Category more than 5%'
    : 'Category less than 5%';

  const stops = categories.flatMap((c) =>
    c.id === OTHERS_BUCKET_ID && c.subcategories?.length
      ? c.subcategories.map((sub) => ({
          categoryId: c.id,
          subKey: sub.apiCategory as string | null,
        }))
      : [{ categoryId: c.id, subKey: null as string | null }]
  );
  const stopIndex = Math.max(
    0,
    stops.findIndex(
      (stop) =>
        stop.categoryId === category.id && stop.subKey === (selectedSub?.apiCategory ?? null)
    )
  );
  const goToStop = (offset: number) => {
    if (!stops.length) return;
    const next = stops[(stopIndex + offset + stops.length) % stops.length];
    if (next.categoryId === category.id) {
      setSubKey(next.subKey);
      return;
    }
    pendingSubKey.current = next.subKey;
    onChangeCategory(next.categoryId);
  };
  const goPrev = () => goToStop(-1);
  const goNext = () => goToStop(1);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      scrimClassName="flex-1 justify-end"
      backdrop={
        Platform.OS === 'ios' ? (
          <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        )
      }
      panelClassName="h-[561px] rounded-t-[40px] bg-[#F6F7F7]"
    >
      <View className="mt-[50px] flex-row items-start justify-between px-[24px]">
        <Animated.View className="mr-3 min-w-0 flex-1 gap-[4px] pr-2" style={contentFade}>
          <Text
            allowFontScaling={false}
            className="text-left text-heading-sm font-ubuntu-semibold leading-[23px] text-primary"
          >
            {detail.name}
          </Text>
          <Text
            allowFontScaling={false}
            className="text-left text-caption font-inter-regular leading-[14px] text-[#878686]"
          >
            {thresholdCopy}
          </Text>
        </Animated.View>
        <View className="flex-row gap-[16px]">
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

      <Animated.View className="mt-[43px] flex-row gap-[4px] px-[24px]" style={contentFade}>
        <View className=" min-w-0 shrink grow basis-0 justify-center gap-[4px] rounded-[4px] bg-white p-[8px]">
          <View className="h-[15px] flex-row items-center gap-[4px]">
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              className="text-2xs leading-[15px]   font-inter-medium text-[#878686]"
            >
              Peak Time
            </Text>
            {detail.peakPct > 0 ? (
              <View className="h-[15px] min-w-[24px] items-center justify-center bg-light-teal px-[2.5px]">
                <Text
                  allowFontScaling={false}
                  className="text-2xs font-inter-medium text-dark-teal"
                >
                  {detail.peakPct}%
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            className="text-left text-[14px] font-inter-medium text-[#878686] leading-[17px]"
          >
            {detail.peakTime}
          </Text>
        </View>

        <View className=" min-w-0 shrink grow basis-0 justify-center gap-[4px] rounded-[4px] bg-white p-[8px]">
          <View className="h-[15px] justify-center">
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              className="text-2xs leading-[15px]  font-inter-medium text-[#878686]"
            >
              Incident Count
            </Text>
          </View>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            className="text-left text-[14px] font-inter-medium text-[#878686] leading-[17px]"
          >
            {detail.count}
            <Text className="text-2xs">/{totalReports}</Text>
          </Text>
        </View>

        <View className=" min-w-0 shrink grow basis-0 justify-center gap-[4px] rounded-[4px] bg-white p-[8px]">
          <View className="h-[15px] justify-center">
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              className="text-2xs leading-[15px] font-inter-medium text-[#878686]"
            >
              Incident Share
            </Text>
          </View>
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            className="text-left text-[14px] font-inter-medium text-[#878686] leading-[17px]"
          >
            {detail.share}%
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        className="mt-[16px] flex-1 px-[24px]"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-10"
      >
        <Animated.View className="gap-[16px]" style={contentFade}>
          {(detail.narratives?.length
            ? detail.narratives
            : detail.narrative?.trim()
              ? [detail.narrative]
              : []
          ).map((text, i) => (
            <NarrativeCard key={`narrative-${i}`} text={text} />
          ))}
          {detail.detail?.trim() ? <NarrativeCard text={detail.detail} /> : null}
        </Animated.View>
      </ScrollView>
    </BottomSheet>
  );
}
