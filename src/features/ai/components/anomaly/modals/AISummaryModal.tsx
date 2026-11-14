import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import { CollapseBody, useCollapse } from '@/src/features/ai/components/shared/AnimatedCollapse';
import AISummaryMetaChips from '@/src/features/ai/components/incidents/AISummaryMetaChips';
import type { AnomalySummaryView } from '@/src/features/ai/utils/anomalyShapes';

type AISummaryModalProps = {
  visible: boolean;
  onClose: () => void;
  summaryData?: AnomalySummaryView;
  initialIndex?: number;
};

function sectionsOf(data: Record<string, unknown>) {
  return Object.entries(data)
    .map(([key, value]) => ({
      title: key.replace(/_/g, ' ').toUpperCase(),
      content: value,
    }))
    .filter((section): section is { title: string; content: string | string[] } =>
      typeof section.content === 'string'
        ? section.content.length > 0
        : Array.isArray(section.content) && section.content.length > 0
    );
}

function AccordionItem({
  title,
  content,
  isLast,
}: {
  title: string;
  content: string | string[];
  isLast: boolean;
}) {
  const [open, setOpen] = useState(true);
  const motion = useCollapse(open);
  const items = Array.isArray(content) ? content : [content];

  return (
    <View className="min-h-10 flex-row">
      <View className="mr-3 w-6 items-center">
        <View className="mt-2 h-2 w-2 rounded-full bg-[#D1D5DB]" />
        {isLast ? null : <View className="my-1 w-px flex-1 bg-[#E5E7EB]" />}
      </View>
      <View className="flex-1 pb-6">
        <Pressable
          onPress={() => setOpen((current) => !current)}
          className="flex-row items-center justify-between py-1"
        >
          <Text
            allowFontScaling={false}
            className="text-sm font-inter-light uppercase text-[#0A1F29]"
          >
            {title}
          </Text>
          <Animated.View style={motion.caretStyle}>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#8A9A9D" />
          </Animated.View>
        </Pressable>
        <CollapseBody open={open} motion={motion}>
          <View className="mt-3 gap-2">
            {items.map((item, index) => (
              <View key={`${index}-${item.slice(0, 16)}`} className="flex-row gap-2">
                {Array.isArray(content) ? (
                  <View className="mt-2 h-1 w-1 rounded-full bg-[#8A9A9D]" />
                ) : null}
                <Text
                  allowFontScaling={false}
                  className="flex-1 text-xs font-inter-regular leading-5 text-[#8A9A9D]"
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </CollapseBody>
      </View>
    </View>
  );
}

export default function AISummaryModal({
  visible,
  onClose,
  summaryData,
  initialIndex = 0,
}: AISummaryModalProps) {
  const scrollRef = useRef<ScrollView>(null);
  const { height } = useWindowDimensions();
  const bodyMaxHeight = Math.round(height * 0.9) - 168;
  const [pageWidth, setPageWidth] = useState(0);
  const tiers = (
    [
      ['tier1', summaryData?.tier1, 'In house'],
      ['tier2', summaryData?.tier2, 'Third Party'],
    ] as const
  ).filter(([, data]) => data);
  const pages = tiers.length ? tiers : ([['tier1', null, 'In house']] as const);
  const canSwipe = pages.length > 1 && pageWidth > 0;

  useEffect(() => {
    if (!visible || !canSwipe) return;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: initialIndex * pageWidth, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, initialIndex, canSwipe, pageWidth]);

  const page = (key: string, data: (typeof pages)[number][1], source: string) => {
    const sections = data ? sectionsOf(data as Record<string, unknown>) : [];
    return (
      <View key={key} style={canSwipe ? { width: pageWidth } : undefined}>
        <Text
          allowFontScaling={false}
          className="mb-3 mt-6 font-ubuntu-medium text-2xl text-[#0A1F29]"
        >
          AI SUMMARY
        </Text>
        <AISummaryMetaChips className="mb-8" readTimeLabel="2 mins Read" sourceLabel={source} />
        <ScrollView
          style={{ maxHeight: bodyMaxHeight }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {sections.length ? (
            sections.map((section, sectionIndex) => (
              <AccordionItem
                key={section.title}
                title={section.title}
                content={section.content}
                isLast={sectionIndex === sections.length - 1}
              />
            ))
          ) : (
            <Text className="font-inter-regular text-[13px] leading-5 text-[#8A9A9D]">
              No summary data available.
            </Text>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      scrimClassName="flex-1 justify-end bg-black/50"
      panelClassName="max-h-[90%] rounded-t-[40px] bg-[#F6F7F7] px-6 pb-10"
    >
      <View onLayout={(event) => setPageWidth(Math.round(event.nativeEvent.layout.width))}>
        {canSwipe ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator={false}
          >
            {pages.map(([key, data, source]) => page(key, data, source))}
          </ScrollView>
        ) : (
          pages.map(([key, data, source]) => page(key, data, source))
        )}
      </View>
    </BottomSheet>
  );
}
