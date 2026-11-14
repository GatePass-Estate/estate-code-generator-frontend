import { type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import TotalUsersSvg from '@/src/assets/icons/totalusers.svg';
import AnomalyDonutChart from '@/src/features/ai/components/shared/AnomalyDonutChart';
import {
  IncidentReporterHomeIcon,
  IncidentRowChevronIcon,
  ShareBarHomeIcon,
  ShareBarSecurityIcon,
} from '@/src/assets/svgs';
import { cacheIncidentDetailFromRow } from '@/src/features/ai/components/incidents/incidentDetailCache';
import { type IncidentRow } from '@/src/features/ai/components/incidents/incidentTypes';

export function ShareBar({
  pct,
  color,
  fill,
  icon,
}: {
  pct: number;
  color: string;
  fill: string;
  icon: ReactNode;
}) {
  const BAR_HEIGHT = 170;
  const ICON_SIZE = 20;
  const BOTTOM_PAD = 14;
  const pctClamped = Math.min(100, Math.max(0, pct));
  // Fluid only — 0% empties to the tank floor; 100% fills to the brim.
  const fillHeight = Math.round((pctClamped / 100) * BAR_HEIGHT);
  // Icon rides the top of the fluid; when empty, sit just above the bottom number.
  const iconBottom =
    fillHeight <= ICON_SIZE + BOTTOM_PAD + 22
      ? BOTTOM_PAD + 22
      : Math.max(BOTTOM_PAD + 22, fillHeight - ICON_SIZE - 4);

  return (
    <View className="relative h-[170px] w-12 overflow-hidden rounded-[16px] bg-white">
      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 right-0 rounded-b-[16px]"
        style={{ height: fillHeight, backgroundColor: fill }}
      />
      <View className="absolute left-0 right-0 items-center" style={{ bottom: iconBottom }}>
        <View className="h-5 w-5 items-center justify-center">{icon}</View>
      </View>
      <View className="absolute bottom-0 left-0 right-0 items-center pb-[14px]">
        <Text allowFontScaling={false} className="text-sm font-inter-medium" style={{ color }}>
          {pct}
          <Text className="text-caption font-inter-regular">%</Text>
        </Text>
      </View>
    </View>
  );
}

/** Donut plus resident and security bars. Incident report is the layout both results use. */
export function ResultOverview({
  countText,
  totalLabel = 'TOTAL REPORT',
  residentPct,
  securityPct,
  isActive = true,
}: {
  countText: string;
  totalLabel?: string;
  residentPct: number;
  securityPct: number;
  isActive?: boolean;
}) {
  return (
    <View className="flex-row items-stretch gap-[9px]">
      <View className="h-[170px] flex-1 items-center overflow-hidden rounded-[16px] bg-white pb-[14px] pt-[15px]">
        <View className="w-full flex-row items-center gap-5 px-3">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-[#F6F7F7]">
            <TotalUsersSvg width={13} height={13} />
          </View>
          <Text allowFontScaling={false} className="text-sm font-inter-medium text-primary">
            Overview
          </Text>
        </View>

        <View className="mt-1 flex-1 items-center justify-between">
          <AnomalyDonutChart
            size={99}
            totalText={totalLabel}
            countText={countText}
            countColor="#04162D"
            isActive={isActive}
            guestPercentage={residentPct}
            securityPercentage={securityPct}
            residentPercentage={0}
          />
          <View className="flex-row items-center gap-[7px]">
            <LegendDot color="#F46036" label="Residents" />
            <LegendDot color="#1B998B" label="Security" />
          </View>
        </View>
      </View>

      <ShareBar
        pct={securityPct}
        color="#167A6F"
        fill="#F4FFFE"
        icon={<ShareBarSecurityIcon color="#1B998B" />}
      />
      <ShareBar
        pct={residentPct}
        color="#F46036"
        fill="#FFF8F5"
        icon={<ShareBarHomeIcon color="#F46036" />}
      />
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-[3px]">
      <View style={{ width: 4, height: 4, borderRadius: 8, backgroundColor: color }} />
      <Text
        allowFontScaling={false}
        style={{ fontFamily: 'Inter_18pt-Light', fontSize: 6.8, color: '#878686' }}
      >
        {label}
      </Text>
    </View>
  );
}

export function TrendCard({
  title,
  valueLabel,
  unitLabel,
  body,
  icon,
}: {
  title: string;
  valueLabel: string;
  unitLabel: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <View className="w-[211px] rounded-[16px] bg-primary px-4 pb-[22px] pt-2">
      <View className="w-full flex-row items-start justify-between">
        <Text
          allowFontScaling={false}
          className="pt-2 text-left text-caption font-inter-regular leading-[14px] text-accent"
        >
          {title}
        </Text>
        <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#315A73]">
          {icon}
        </View>
      </View>

      <View className="mt-3 w-full">
        {valueLabel ? (
          <View className="flex-row items-end gap-1.5">
            <Text
              allowFontScaling={false}
              className="text-left text-[34.18px] font-ubuntu-medium leading-[normal] text-accent"
            >
              {valueLabel}
            </Text>
            {unitLabel ? (
              <Text
                allowFontScaling={false}
                className="mb-2 text-left text-caption font-inter-regular text-accent"
              >
                {unitLabel}
              </Text>
            ) : null}
          </View>
        ) : null}
        <Text
          allowFontScaling={false}
          className="w-[181px] text-left text-caption font-inter-regular leading-[normal] text-accent"
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

/** Same pager marks under the trend cards and the anomaly evidence cards. */
export function CarouselDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count <= 1) return <View className="mt-[56px]" />;

  return (
    <View
      className="mt-[56px] h-[6px] flex-row self-center"
      style={{ gap: 3, width: count * 6 + (count - 1) * 3 }}
    >
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          className="h-[6px] w-[6px] rounded-full"
          style={{
            backgroundColor: activeIndex === index ? '#113E55' : 'rgba(17, 62, 85, 0.6)',
          }}
        />
      ))}
    </View>
  );
}

export function IncidentListRow({ row }: { row: IncidentRow }) {
  const reportedBySecurity = row.reporter === 'Security';

  return (
    <Pressable
      onPress={() => {
        cacheIncidentDetailFromRow(row);
        router.push({
          pathname: '/(protected)/(shared-screens)/ai-store/incident-report/[id]',
          params: { id: row.id },
        });
      }}
      className="w-full flex-row items-center gap-[15px] py-2"
    >
      <View className="w-[126px] flex-row items-start">
        <View
          className={`mt-[5px] h-6 w-6 items-center justify-center rounded-full ${
            reportedBySecurity ? 'bg-light-teal' : 'bg-light-orange'
          }`}
        >
          {reportedBySecurity ? (
            <ShareBarSecurityIcon width={14} height={14} />
          ) : (
            <IncidentReporterHomeIcon size={14} color="#F46036" />
          )}
        </View>
        <View className="ml-2 flex-1 gap-1">
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            className="text-caption font-inter-regular text-[#878686]"
          >
            {row.reporter}
          </Text>
          <Text allowFontScaling={false} className="text-2xs font-inter-medium text-[#878686]">
            {row.reportedAt}
          </Text>
        </View>
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1 self-start bg-light-teal px-1 py-0.5">
          <Text allowFontScaling={false} className="text-[6.8px] font-inter-light text-dark-teal">
            {row.category}
          </Text>
        </View>
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="mt-0.5 text-sm font-inter-light text-[#878686]"
        >
          {row.title}
        </Text>
      </View>

      <View style={{ transform: [{ rotate: '-90deg' }] }}>
        <IncidentRowChevronIcon color="#113E55" size={20} />
      </View>
    </Pressable>
  );
}
