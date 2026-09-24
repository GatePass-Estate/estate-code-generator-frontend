import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Modal, StyleSheet, Platform } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import AiSummaryTimeSvg from '@/src/assets/icons/ai-summary-time.svg';
import AiSummaryThirdPartySvg from '@/src/assets/icons/ai-summary-third-party.svg';
import AiSummaryCaretDownSvg from '@/src/assets/icons/ai-summary-caret-down.svg';
import type { ThemeCardModel } from '@/src/components/incident/mapIncidentApi';
import type { IncidentLlmSummary } from '@/src/lib/api/incidentReports';

export type AISummaryVariant = 'third_party' | 'in_house';

type AISummaryModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Defaults to third_party (LLM accordion). */
  variant?: AISummaryVariant;
  llmSummary?: IncidentLlmSummary | null;
  /** Chip labels from API. */
  readTimeLabel?: string | null;
  sourceLabel?: string | null;
  /** In-house / tier1 */
  timelineSummary?: string;
  themes?: ThemeCardModel[];
};

/** Meta / nested fields that are not accordion copy. */
const LLM_SECTION_SKIP = new Set(['category_eda', 'read_time', 'source_label', 'detailed_insight']);

function formatSectionTitle(key: string): string {
  return key.replace(/_/g, ' ').toUpperCase();
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function sectionsFromLlmSummary(payload: IncidentLlmSummary | null | undefined) {
  if (!payload || typeof payload !== 'object') return [];

  return Object.entries(payload).flatMap(([key, value]) => {
    if (LLM_SECTION_SKIP.has(key)) return [];

    if (typeof value === 'string') {
      const text = value.trim();
      if (!text) return [];
      return [{ key, title: formatSectionTitle(key), kind: 'text' as const, text }];
    }

    const items = stringList(value);
    if (items.length) {
      return [{ key, title: formatSectionTitle(key), kind: 'list' as const, items }];
    }

    return [];
  });
}

function MetaChips({ readTimeLabel, sourceLabel }: { readTimeLabel: string; sourceLabel: string }) {
  return (
    <View className="mb-6 flex-row items-center gap-1">
      <View className="h-5 flex-row items-center gap-1 rounded-lg bg-light-orange p-1">
        <AiSummaryTimeSvg width={12} height={12} />
        <Text allowFontScaling={false} className="text-2xs font-inter-medium text-orange">
          {readTimeLabel}
        </Text>
      </View>
      <View className="h-5 flex-row items-center gap-1 rounded-lg bg-light-teal p-1">
        <AiSummaryThirdPartySvg width={12} height={12} />
        <Text allowFontScaling={false} className="text-2xs font-inter-medium text-dark-teal">
          {sourceLabel}
        </Text>
      </View>
    </View>
  );
}

function TimelineAccordion({
  sections,
  openSections,
  onToggle,
}: {
  sections: { key: string; title: string; body: string | string[] }[];
  openSections: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <View className="pl-1">
      {sections.map((section, index) => {
        const open = !!openSections[section.key];
        const isLast = index === sections.length - 1;
        return (
          <View key={section.key} className="min-h-7 flex-row">
            <View className="w-4 items-center">
              <View className="z-[1] mt-[5px] h-1.5 w-1.5 rounded-full bg-[#D9D9D9]" />
              {!isLast ? <View className="mb-0.5 mt-0.5 w-[0.4px] flex-1 bg-[#9B9797]" /> : null}
            </View>

            <View className={`flex-1 pl-3 ${isLast ? 'pb-0' : 'pb-5'}`}>
              <Pressable
                onPress={() => onToggle(section.key)}
                className="flex-row items-center justify-between"
                hitSlop={8}
              >
                <Text
                  allowFontScaling={false}
                  className="h-[19px] text-sm font-inter-light text-[#0A1F29]"
                >
                  {section.title}
                </Text>
                <View style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}>
                  <AiSummaryCaretDownSvg width={24} height={25} />
                </View>
              </Pressable>
              {open ? (
                <View className="mt-[8.96px]">
                  {Array.isArray(section.body) ? (
                    <View className="gap-2">
                      {section.body.map((item, itemIndex) => (
                        <View key={`${itemIndex}-${item.slice(0, 24)}`} className="flex-row gap-2">
                          <View className="mt-2 h-1 w-1 rounded-full bg-[#878686]" />
                          <Text
                            allowFontScaling={false}
                            className="flex-1 text-caption font-inter-regular leading-4 text-[#878686]"
                          >
                            {item}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text className="text-caption font-inter-regular leading-4 text-[#878686]">
                      {section.body}
                    </Text>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ThemeReport({ themes }: { themes: ThemeCardModel[] }) {
  if (!themes.length) {
    return (
      <Text
        allowFontScaling={false}
        className="text-caption font-inter-regular leading-5 text-[#878686]"
      >
        No themes discovered for this window.
      </Text>
    );
  }

  return (
    <View className="mt-2">
      {themes.map((theme, index) => {
        const isLast = index === themes.length - 1;
        return (
          <View key={`${theme.label}-${theme.title}`} className="flex-row">
            <View className="w-[52px] items-end pr-2">
              <Text
                allowFontScaling={false}
                className="mt-[18px] text-xs font-inter-medium"
                style={{ color: theme.color }}
              >
                {theme.pct}%
              </Text>
            </View>

            <View className="w-4 items-center">
              <View
                className="z-[1] mt-[22px] h-2 w-2 rounded-full"
                style={{ backgroundColor: theme.color }}
              />
              {!isLast ? (
                <View className="mt-0.5 w-[1.5px] flex-1 bg-[#E8D9C8]" />
              ) : (
                <View className="h-3" />
              )}
            </View>

            <View
              className={`ml-2.5 flex-1 rounded-2xl border border-[#EFF1F3] bg-white px-3.5 py-3 ${
                isLast ? 'mb-0' : 'mb-3.5'
              }`}
            >
              <Text
                allowFontScaling={false}
                className="mb-1 text-[10px] font-inter-regular text-[#878686]"
              >
                {theme.label}
              </Text>
              <Text
                allowFontScaling={false}
                className="mb-1.5 text-sm font-inter-medium text-primary"
              >
                {theme.title}
              </Text>
              <Text className="text-caption font-inter-regular leading-[18px] text-[#878686]">
                {theme.body}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ThirdPartyBody({ llmSummary }: { llmSummary?: IncidentLlmSummary | null }) {
  const apiSections = useMemo(() => sectionsFromLlmSummary(llmSummary), [llmSummary]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const sections = useMemo(
    () =>
      apiSections.map((section, index) => ({
        key: section.key,
        title: section.title,
        body: section.kind === 'list' ? section.items : section.text,
        defaultOpen: index < 2,
      })),
    [apiSections]
  );

  if (!sections.length) {
    return (
      <Text
        allowFontScaling={false}
        className="text-caption font-inter-regular leading-5 text-[#878686]"
      >
        Summary is not available for this window.
      </Text>
    );
  }

  return (
    <TimelineAccordion
      sections={sections}
      openSections={Object.fromEntries(
        sections.map((section) => [section.key, openSections[section.key] ?? section.defaultOpen])
      )}
      onToggle={(key) =>
        setOpenSections((prev) => {
          const current = prev[key] ?? sections.find((s) => s.key === key)?.defaultOpen ?? false;
          return { ...prev, [key]: !current };
        })
      }
    />
  );
}

function InHouseBody({
  timelineSummary,
  themes,
}: {
  timelineSummary?: string;
  themes: ThemeCardModel[];
}) {
  return (
    <View className="gap-7">
      <View>
        <Text
          allowFontScaling={false}
          className="mb-[8.96px] text-sm font-inter-light text-[#0A1F29]"
        >
          TIMELINE SUMMARY
        </Text>
        <Text
          allowFontScaling={false}
          className="text-caption font-inter-regular leading-5 text-[#878686]"
        >
          {timelineSummary?.trim() || 'No timeline summary for this window.'}
        </Text>
      </View>

      <View>
        <Text
          allowFontScaling={false}
          className="mb-[8.96px] text-sm font-inter-light text-[#0A1F29]"
        >
          THEME REPORT
        </Text>
        <ThemeReport themes={themes} />
      </View>
    </View>
  );
}

export default function AISummaryModal({
  visible,
  onClose,
  variant = 'third_party',
  llmSummary,
  readTimeLabel,
  sourceLabel,
  timelineSummary,
  themes = [],
}: AISummaryModalProps) {
  if (!visible) return null;

  const isInHouse = variant === 'in_house';
  const resolvedReadTime = readTimeLabel?.trim() || '2 mins Read';
  const resolvedSource = sourceLabel?.trim() || (isInHouse ? 'In house' : 'Third Party');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        {Platform.OS === 'ios' ? (
          <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View
          entering={SlideInDown.duration(250)}
          exiting={SlideOutDown}
          className="w-full max-h-[90%] rounded-t-[32px] bg-[#F6F7F7] px-6 pb-10 pt-4"
        >
          <View className="pb-4">
            <View className="h-1.5 w-[100px] self-center rounded-[3px] bg-[#A0A0A0]" />
          </View>

          <Text
            allowFontScaling={false}
            className={`mb-3 font-ubuntu-medium text-primary ${
              isInHouse ? 'text-[22px]' : 'text-xl uppercase'
            }`}
          >
            {isInHouse ? 'AI Summary' : 'AI SUMMARY'}
          </Text>

          <MetaChips readTimeLabel={resolvedReadTime} sourceLabel={resolvedSource} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6">
            {isInHouse ? (
              <InHouseBody timelineSummary={timelineSummary} themes={themes} />
            ) : (
              <ThirdPartyBody llmSummary={llmSummary} />
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
