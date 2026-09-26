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

type LlmSection =
  | { key: string; title: string; kind: 'text'; text: string }
  | { key: string; title: string; kind: 'list'; items: string[] };

function sectionsFromLlmSummary(payload: IncidentLlmSummary | null | undefined): LlmSection[] {
  if (!payload || typeof payload !== 'object') return [];

  const sections: LlmSection[] = [];
  for (const [key, value] of Object.entries(payload)) {
    if (LLM_SECTION_SKIP.has(key)) continue;

    if (typeof value === 'string') {
      const text = value.trim();
      if (text) sections.push({ key, title: formatSectionTitle(key), kind: 'text', text });
      continue;
    }

    const items = stringList(value);
    if (items.length) {
      sections.push({ key, title: formatSectionTitle(key), kind: 'list', items });
    }
  }
  return sections;
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
              <View className="h-[25px] w-full items-center justify-center">
                <View className="z-[1] h-1.5 w-1.5 rounded-full bg-[#D9D9D9]" />
              </View>
              {!isLast ? <View className="mb-0.5 w-[0.4px] flex-1 bg-[#9B9797]" /> : null}
            </View>

            <View className={`flex-1 pl-3 ${isLast ? 'pb-0' : 'pb-5'}`}>
              <Pressable
                onPress={() => onToggle(section.key)}
                className="h-[25px] flex-row items-center justify-between"
                hitSlop={8}
              >
                <Text
                  allowFontScaling={false}
                  className="text-sm font-inter-light leading-[19px] text-[#0A1F29]"
                >
                  {section.title}
                </Text>
                <View
                  className="h-[25px] w-6 items-center justify-center"
                  style={{ transform: [{ rotate: open ? '0deg' : '-90deg' }] }}
                >
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

function ThemeCard({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <View className="rounded-[8px] bg-white px-4 pb-4 pt-2 flex-col gap-1">
      <Text
        allowFontScaling={false}
        className="text-[11.2px] font-inter-regular leading-[14px] text-[#878686]"
      >
        {label}
      </Text>
      <Text
        allowFontScaling={false}
        className=" text-sm font-inter-medium leading-[18px] text-[#0A1F29]"
      >
        {title}
      </Text>
      <Text allowFontScaling={false} className=" text-[11.2px] font-inter-regular  text-[#0A1F29]">
        {body}
      </Text>
    </View>
  );
}

function ThemeReport({ themes }: { themes: ThemeCardModel[] }) {
  if (!themes.length) {
    return (
      <View>
        <Text allowFontScaling={false} className="mb-3 text-sm font-inter-light text-[#0A1F29]">
          THEME REPORT
        </Text>
        <Text
          allowFontScaling={false}
          className="text-caption font-inter-regular leading-5 text-[#878686]"
        >
          No themes discovered for this window.
        </Text>
      </View>
    );
  }

  /** Break below a card before the next dot (line → top of next dot). */
  const RAIL_GAP = 20;
  /** Break between the bottom of a dot and the start of its line. */
  const DOT_LINE_GAP = 6;

  return (
    <View>
      <Text allowFontScaling={false} className="mb-4 text-sm font-inter-light text-[#0A1F29]">
        THEME REPORT
      </Text>

      {themes.map((theme, index) => {
        const isLast = index === themes.length - 1;
        const color = theme.color;
        return (
          <View key={`${theme.label}-${theme.title}`}>
            <View className="flex-row items-stretch">
              <View className="w-[40px] items-end pr-1.5">
                <Text
                  allowFontScaling={false}
                  className="text-xs font-inter-medium leading-4"
                  style={{ color }}
                >
                  {theme.pct}%
                </Text>
              </View>

              <View className="w-3 items-center">
                <View
                  className="z-[1] rounded-full"
                  style={{ width: 8, height: 8, backgroundColor: color }}
                />
                <View style={{ height: DOT_LINE_GAP }} />
                <View className="flex-1" style={{ width: 0.4, backgroundColor: color }} />
              </View>

              <View className="ml-4 flex-1">
                <ThemeCard label={theme.label} title={theme.title} body={theme.body} />
              </View>
            </View>

            {!isLast ? <View style={{ height: RAIL_GAP }} /> : null}
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
    <View className="gap-6">
      <View className="py-2">
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
          className="w-full max-h-[90%] rounded-t-[40px] bg-[#F6F7F7] px-6 pb-10"
        >
          {/* Same grabber pattern as CodeActionsSheet / IncidentTimeframeModal */}
          <View className="h-[34px] items-center justify-center">
            <View className="h-[7px] w-[134px] rounded-[4px] bg-[#9B9797]" />
          </View>

          <Text
            allowFontScaling={false}
            className={`mt-6 mb-3 font-ubuntu-medium text-primary ${
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
