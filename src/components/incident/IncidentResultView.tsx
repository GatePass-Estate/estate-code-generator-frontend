import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import AISummaryModal from '@/src/components/anomaly/modals/AISummaryModal';
import AnomalyDonutChart from '@/src/components/anomaly/AnomalyDonutChart';
import EstateSvg from '@/src/assets/icons/estate.svg';
import LocationSvg from '@/src/assets/icons/location.svg';
import TotalUsersSvg from '@/src/assets/icons/totalusers.svg';
import {
  ShareBarHomeIcon,
  ShareBarSecurityIcon,
  IncidentFilterIcon,
  IncidentReporterHomeIcon,
  IncidentSortIcon,
  IncidentRowChevronIcon,
  TrendDayIcon,
} from '@/src/assets/svgs';
import { useUserStore } from '@/src/lib/stores/userStore';
import {
  useIncidentOverview,
  useIncidentReports,
  useIncidentSummary,
} from '@/src/hooks/useIncidentQueries';
import { toIncidentFromDate, toIncidentToDate } from '@/src/lib/api/incidentReports';
import CategoryDistribution from './CategoryDistribution';
import IncidentAISummaryCard, { type InsightMode } from './IncidentAISummaryCard';
import IncidentFilterModal, {
  type IncidentFilterCategory,
  type IncidentFilterUserType,
} from './IncidentFilterModal';
import IncidentOrderModal from './IncidentOrderModal';
import IncidentTimeframeModal from './IncidentTimeframeModal';
import IncidentDatePickerModal from './IncidentDatePickerModal';
import { cacheIncidentDetailFromRow } from './incidentDetailCache';
import { setIncidentReportsListFilters } from './incidentReportsListFilters';
import {
  demographicLocation,
  formatReportCount,
  mapCategoryEdaToUi,
  mapInhouseInsightFromTopics,
  mapListItemToRow,
  mapTrendsFromEda,
  ratioPercentage,
  resolveCategorySection,
} from './mapIncidentApi';
import { type IncidentCategoryId, type IncidentRow } from './incidentTypes';

function ShareBar({
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
      <View
        className="absolute left-0 right-0 items-center"
        style={{ bottom: iconBottom }}
      >
        <View className="h-5 w-5 items-center justify-center">{icon}</View>
      </View>
      <View className="absolute bottom-0 left-0 right-0 items-center pb-[14px]">
        <Text allowFontScaling={false} className="text-sm font-inter-medium" style={{ color }}>
          {pct}
          <Text className="text-[11.2px] font-inter-regular">%</Text>
        </Text>
      </View>
    </View>
  );
}

function TrendCard({
  title,
  pct,
  unitLabel,
  body,
  icon,
}: {
  title: string;
  pct: number;
  unitLabel: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <View className="w-[211px] rounded-[16px] bg-[#113E55] px-4 pb-[22px] pt-2">
      <View className="w-full flex-row items-start justify-between">
        <Text
          allowFontScaling={false}
          className="pt-2 text-left text-[11.2px] font-inter-regular leading-[14px] text-[#CEE5ED]"
        >
          {title}
        </Text>
        <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#315A73]">
          {icon}
        </View>
      </View>

      <View className="relative mt-3 w-full">
        <Text
          allowFontScaling={false}
          className="text-left text-[34.18px] font-ubuntu-medium leading-[normal] text-[#CEE5ED]"
        >
          {pct}%
        </Text>
        <Text
          allowFontScaling={false}
          className="absolute left-[70px] top-[21px] text-left text-[11.2px] font-inter-regular text-[#CEE5ED]"
        >
          {unitLabel}
        </Text>
        <Text
          allowFontScaling={false}
          className="w-[181px] text-left text-[11.2px] font-inter-regular leading-[normal] text-[#CEE5ED]"
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

function IncidentListRow({ row }: { row: IncidentRow }) {
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
        <View className="mt-[5px] h-6 w-6 items-center justify-center rounded-full bg-[#FFF8F5]">
          <IncidentReporterHomeIcon size={14} color="#F46036" />
        </View>
        <View className="ml-2 flex-1 gap-1">
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            className="text-[11.2px] font-inter-regular text-[#878686]"
          >
            {row.reporter}
          </Text>
          <Text allowFontScaling={false} className="text-[8.96px] font-inter-medium text-[#878686]">
            {row.reportedAt}
          </Text>
        </View>
      </View>

      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-1 self-start bg-[#F4FFFE] px-1 py-0.5">
          <Text allowFontScaling={false} className="text-[6.8px] font-inter-light text-[#167A6F]">
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

export default function IncidentResultView({ isActive = true }: { isActive?: boolean }) {
  const estate_id = useUserStore((state) => state.estate_id) || '';
  const estateName = useUserStore((state) => state.estate_name) || 'Hazel Estate';
  const userHomeAddress = useUserStore((state) => state.home_address);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Custom');
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });
  const [timeframeVisible, setTimeframeVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);
  const [insightMode, setInsightMode] = useState<InsightMode>('idle');
  const [fetchSummary, setFetchSummary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategoryId>('');
  const [visibleCount, setVisibleCount] = useState(5);
  const [trendIndex, setTrendIndex] = useState(0);
  const [filterCategories, setFilterCategories] = useState<IncidentFilterCategory[]>([]);
  const [filterUserTypes, setFilterUserTypes] = useState<IncidentFilterUserType[]>([]);

  // OpenAPI: optional `from_date` / `to_date` as date-time on overview, reports, summary.
  const fromDate = startDate ? toIncidentFromDate(startDate) : undefined;
  const toDate = endDate ? toIncidentToDate(endDate) : undefined;

  const reportsQueryParams = useMemo(() => {
    // API user_type: resident | security | all — never send guest.
    const apiUserTypes = filterUserTypes.filter(
      (t): t is 'resident' | 'security' => t === 'resident' || t === 'security'
    );
    return {
      from_date: fromDate,
      to_date: toDate,
      // Empty selection = omit filter (same as category=all / user_type=all).
      category: filterCategories.length ? [...filterCategories] : undefined,
      user_type: apiUserTypes.length ? apiUserTypes : undefined,
      page: 1,
      limit: 20,
    };
  }, [fromDate, toDate, filterCategories, filterUserTypes]);

  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    error: overviewErr,
    refetch: refetchOverview,
  } = useIncidentOverview(estate_id, fromDate, toDate);
  const {
    data: reports,
    isLoading: reportsLoading,
    isFetching: reportsFetching,
    isError: reportsError,
    error: reportsErr,
    refetch: refetchReports,
    isPlaceholderData: reportsPlaceholder,
  } = useIncidentReports(estate_id, reportsQueryParams);
  const {
    data: summary,
    isFetching: summaryLoading,
    isError: summaryError,
  } = useIncidentSummary(estate_id, fromDate, toDate, fetchSummary);

  const demographic = overview?.demographic;
  const displayEstateName = demographic?.estate_name || estateName;
  const location = useMemo(() => {
    const fromApi = demographicLocation(demographic);
    if (fromApi !== 'N/A') return fromApi;
    if (!userHomeAddress) return 'N/A';
    const parts = userHomeAddress
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.slice(-2).join(', ') || userHomeAddress;
  }, [demographic, userHomeAddress]);

  const residentPct = ratioPercentage(demographic?.ratio, 'resident');
  const securityPct = ratioPercentage(demographic?.ratio, 'security');
  const totalReports = demographic?.total_reports ?? reports?.total ?? 0;
  const displayResidentPct = demographic ? residentPct : 0;
  const displaySecurityPct = demographic ? securityPct : 0;

  const categories = useMemo(
    () =>
      mapCategoryEdaToUi(
        resolveCategorySection(overview?.eda),
        demographic?.total_reports ?? reports?.total
      ),
    [overview?.eda, demographic?.total_reports, reports?.total]
  );

  useEffect(() => {
    if (!categories.length) return;
    if (!categories.some((c) => c.id === selectedCategory)) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  const selectedRangeText =
    selectedTimeframe === 'Custom' && startDate && endDate
      ? `${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
      : selectedTimeframe;

  const rows = useMemo(() => {
    const apiRows = (reports?.items ?? []).map(mapListItemToRow);
    const sorted = [...apiRows];
    if (sortAscending) sorted.reverse();
    return sorted;
  }, [reports?.items, sortAscending]);

  const reportsListLoading = reportsFetching && (reportsLoading || reportsPlaceholder);
  const trendCards = useMemo(() => mapTrendsFromEda(overview?.eda), [overview?.eda]);
  const summaryVariant =
    summary?.entitled_tier === 'tier1' && summary.tier1
      ? ('in_house' as const)
      : summary?.tier2
        ? ('third_party' as const)
        : summary?.tier1
          ? ('in_house' as const)
          : ('third_party' as const);
  const executiveSummary =
    summary?.tier2?.executive_summary || summary?.tier1?.executive_summary || undefined;
  const summaryReadTime =
    summary?.read_time?.trim() ||
    summary?.tier2?.read_time?.trim() ||
    summary?.tier1?.read_time?.trim() ||
    null;
  const summarySourceLabel =
    summary?.source_label?.trim() || (summaryVariant === 'in_house' ? 'In house' : 'Third Party');
  const inhouseInsight = useMemo(() => {
    const timelineFallback =
      mapTrendsFromEda(overview?.eda)[0]?.body || summary?.tier1?.executive_summary || '';
    return mapInhouseInsightFromTopics(
      (summary?.tier1?.topics as Record<string, unknown> | undefined) ?? null,
      timelineFallback
    );
  }, [summary?.tier1?.topics, summary?.tier1?.executive_summary, overview?.eda]);

  const hasSummaryPayload = !!(summary?.tier1 || summary?.tier2);
  const cardMode: InsightMode = hasSummaryPayload
    ? 'generated'
    : insightMode === 'locked'
      ? 'locked'
      : insightMode;

  const handleInsightPress = () => {
    if (cardMode === 'locked') return;
    if (hasSummaryPayload || cardMode === 'generated') {
      setSummaryOpen(true);
      return;
    }
    if (cardMode === 'idle') {
      if (!estate_id) {
        Alert.alert('Unavailable', 'Switch to an estate to generate AI insight.');
        return;
      }
      // Don't gate on overview.has_tier*_summary alone — marketplace install status can
      // disagree. Call the summary API and lock only if it returns no tier payload.
      setFetchSummary(true);
    }
  };

  const handleUpgradePress = () => {
    router.push({
      pathname: '/(protected)/(shared-screens)/ai-store/incident-report',
      params: { tab: 'Preview' },
    });
  };

  useEffect(() => {
    setFetchSummary(false);
    setInsightMode('idle');
  }, [estate_id, fromDate, toDate]);

  // Restore View state from cache (e.g. after leaving Result and coming back).
  useEffect(() => {
    if (hasSummaryPayload) {
      setInsightMode('generated');
      setFetchSummary(true);
      return;
    }
    if (!fetchSummary || summaryLoading) return;
    if (summaryError) {
      setFetchSummary(false);
      setInsightMode('idle');
      Alert.alert('Unable to generate insight', 'Please try again in a moment.');
      return;
    }
    if (summary && !summary.tier1 && !summary.tier2) {
      setInsightMode('locked');
    }
  }, [fetchSummary, summary, summaryLoading, summaryError, hasSummaryPayload]);

  useEffect(() => {
    if (!overviewError && !reportsError) return;
    console.warn('[incident-reports] boot query failed', {
      overviewError,
      reportsError,
      overview: overviewErr,
      reports: reportsErr,
    });
  }, [overviewError, reportsError, overviewErr, reportsErr]);

  const isBootLoading = !!estate_id && (overviewLoading || reportsLoading);
  // Only blank the page when both boot queries failed with no usable payload.
  const bootFailed = !!estate_id && overviewError && reportsError && !overview && !reports;

  const bootErrorDetail = (() => {
    const err = (overviewErr || reportsErr) as
      | {
          message?: string;
          code?: string;
          response?: { status?: number; data?: { detail?: unknown } };
        }
      | undefined;
    if (!err) return null;
    if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
      return 'The request timed out while analysing reports. Tap retry.';
    }
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (err.response?.status) return `Server error (${err.response.status}). Tap retry.`;
    return null;
  })();

  if (!estate_id) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F7F7] px-8">
        <Text
          allowFontScaling={false}
          className="text-center text-sm font-inter-medium text-[#113E55]"
        >
          No estate selected
        </Text>
        <Text
          allowFontScaling={false}
          className="mt-2 text-center text-[11.2px] font-inter-regular text-[#878686]"
        >
          Switch to an estate to view incident report insights for that community.
        </Text>
      </View>
    );
  }

  if (isBootLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F7F7]">
        <ActivityIndicator size="large" color="#113E55" />
      </View>
    );
  }

  if (bootFailed) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F6F7F7] px-8">
        <Text
          allowFontScaling={false}
          className="text-center text-sm font-inter-medium text-[#113E55]"
        >
          Couldn’t load incident reports
        </Text>
        <Text
          allowFontScaling={false}
          className="mt-2 text-center text-[11.2px] font-inter-regular text-[#878686]"
        >
          {bootErrorDetail || 'Check your connection and try again.'}
        </Text>
        <Pressable
          onPress={() => {
            void refetchOverview();
            void refetchReports();
          }}
          className="mt-5 h-11 min-w-[120px] items-center justify-center rounded-3xl bg-[#113E55] px-6"
          hitSlop={8}
        >
          <Text allowFontScaling={false} className="text-[13px] font-inter-medium text-white">
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(260)} className="flex-1 bg-[#F6F7F7]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-[61px] pb-[100px]"
      >
        <View className="mb-[11px] flex-row items-start justify-between  pl-2 pr-1">
          <Text
            allowFontScaling={false}
            className="text-[27.34px] leading-[27.34px] font-ubuntu-medium text-[#113E55]"
          >
            Your Incident{'\n'}Report{'\n'}Summary
          </Text>
          <Pressable
            onPress={() => Alert.alert('Coming Soon', 'This feature is not yet active.')}
            className="min-w-20 min-h-11 mt-1.5 rounded-3xl border border-[#113E55] bg-[#113E55] items-center justify-center"
            hitSlop={8}
          >
            <Text allowFontScaling={false} className="text-[13px] font-inter-medium text-white">
              Export
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setTimeframeVisible(true)}
          className=" min-h-7  py-1 px-2 gap-1 flex-row items-center mb-[34px] self-start"
          hitSlop={8}
        >
          <Text allowFontScaling={false} className="text-[12px] font-inter-medium text-[#167A6F]">
            {selectedRangeText}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={16} color="#167A6F" />
        </Pressable>

        <View className="flex-row gap-[13px] mb-[7px]">
          <View className="min-h-[61px] flex-1 flex-row gap-[7px] items-center rounded-[16px] bg-white px-2.5 py-4">
            <EstateSvg width={28} height={28} />
            <View className="flex-1 shrink">
              <Text
                allowFontScaling={false}
                className="text-[8.96px] font-inter-medium text-[#878686]"
              >
                NAME
              </Text>
              <Text
                allowFontScaling={false}
                numberOfLines={2}
                className="mt-1 text-[11.2px] font-inter-regular text-[#0A1F29]"
              >
                {displayEstateName}
              </Text>
            </View>
          </View>
          <View className="min-h-[61px] flex-1 flex-row gap-[7px] items-center rounded-[16px]  bg-white px-[10px] py-4">
            <LocationSvg width={28} height={28} />
            <View className="flex-1 shrink">
              <Text
                allowFontScaling={false}
                className="text-[8.96px] font-inter-medium text-[#878686]"
              >
                LOCATION
              </Text>
              <Text
                allowFontScaling={false}
                numberOfLines={2}
                className="mt-1 text-[11.2px] font-inter-regular text-[#04162D]"
              >
                {location}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-stretch gap-[9px]">
          <View className="h-[170px] flex-1 items-center overflow-hidden rounded-[16px] bg-white pt-[15px] pb-[14px]">
            <View className="w-full flex-row items-center gap-5 px-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-[#F6F7F7]">
                <TotalUsersSvg width={13} height={13} />
              </View>
              <Text allowFontScaling={false} className="text-sm font-inter-medium text-[#113E55]">
                Overview
              </Text>
            </View>

            <View className="mt-1 flex-1 items-center justify-between">
              <AnomalyDonutChart
                size={99}
                totalText="TOTAL REPORT"
                countText={formatReportCount(totalReports)}
                countColor="#04162D"
                isActive={isActive}
                guestPercentage={displayResidentPct}
                securityPercentage={displaySecurityPct}
                residentPercentage={0}
              />
              <View className="flex-row items-center gap-[7px]">
                <View className="flex-row items-center gap-[3px]">
                  <View
                    style={{ width: 4, height: 4, borderRadius: 8, backgroundColor: '#F46036' }}
                  />
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Light',
                      fontSize: 6.8,
                      color: '#878686',
                    }}
                  >
                    Residents
                  </Text>
                </View>
                <View className="flex-row items-center gap-[3px]">
                  <View
                    style={{ width: 4, height: 4, borderRadius: 8, backgroundColor: '#1B998B' }}
                  />
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Light',
                      fontSize: 6.8,
                      color: '#878686',
                    }}
                  >
                    Security
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <ShareBar
            pct={displaySecurityPct}
            color="#167A6F"
            fill="#F4FFFE"
            icon={<ShareBarSecurityIcon color="#1B998B" />}
          />
          <ShareBar
            pct={displayResidentPct}
            color="#F46036"
            fill="#FFF8F5"
            icon={<ShareBarHomeIcon color="#F46036" />}
          />
        </View>

        <IncidentAISummaryCard
          mode={cardMode}
          onPress={handleInsightPress}
          onUpgradePress={handleUpgradePress}
          summaryText={executiveSummary}
          readTimeLabel={hasSummaryPayload ? summaryReadTime : null}
          sourceLabel={hasSummaryPayload ? summarySourceLabel : null}
          isLoading={fetchSummary && summaryLoading && !hasSummaryPayload}
        />

        <CategoryDistribution
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          categories={categories}
          totalReports={totalReports}
        />

        <View className="mt-[30px] flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              setIncidentReportsListFilters({
                from_date: fromDate,
                to_date: toDate,
                category: reportsQueryParams.category,
                user_type: reportsQueryParams.user_type,
              });
              router.push('/(protected)/(shared-screens)/ai-store/incident-report/reports');
            }}
            hitSlop={8}
          >
            <Text
              allowFontScaling={false}
              className="text-[21.88px] font-ubuntu-semibold text-[#0A1F29]"
            >
              Incident Reported
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            className="h-[36px] w-[52px] items-center justify-center rounded-[16px] bg-[#113E55] "
            hitSlop={8}
          >
            <IncidentFilterIcon size={20} color="#F6F7F7" />
          </Pressable>
        </View>

        <View className="mt-3 gap-2 rounded-[16px] bg-white p-4">
          <View className="h-7 w-full flex-row items-center">
            <Text
              allowFontScaling={false}
              className="text-[8.96px] font-inter-medium text-[#878686]"
            >
              REPORTED BY
            </Text>
            <Text
              allowFontScaling={false}
              className="absolute left-[126px] text-[8.96px] font-inter-medium text-[#878686]"
            >
              DESCRIPTION
            </Text>
            <Pressable onPress={() => setOrderModalVisible(true)} hitSlop={8} className="ml-auto">
              <IncidentSortIcon size={25} />
            </Pressable>
          </View>
          {reportsListLoading ? (
            <View className="items-center justify-center py-8">
              <ActivityIndicator size="small" color="#113E55" />
              <Text
                allowFontScaling={false}
                className="mt-2 text-center text-[11.2px] font-inter-regular text-[#878686]"
              >
                Loading reports…
              </Text>
            </View>
          ) : rows.length === 0 ? (
            <Text
              allowFontScaling={false}
              className="py-6 text-center text-[11.2px] font-inter-regular text-[#878686]"
            >
              No incident reports in this window.
            </Text>
          ) : (
            <View className="flex-col gap-2" style={{ opacity: reportsFetching ? 0.55 : 1 }}>
              {rows.slice(0, visibleCount).map((row) => (
                <IncidentListRow key={row.id} row={row} />
              ))}
            </View>
          )}

          {!reportsListLoading && visibleCount < rows.length ? (
            <Pressable
              onPress={() => setVisibleCount((count) => count + 3)}
              className="h-10 items-center justify-center "
            >
              <Text
                allowFontScaling={false}
                className="text-center text-[11.2px] font-inter-semibold text-[#113E55]"
              >
                Load More
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="pt-[60px]">
          <Text
            allowFontScaling={false}
            className="text-[21.88px] font-ubuntu-semibold text-[#0A1F29]"
          >
            TRENDS DETECTED
          </Text>
          <ScrollView
            horizontal
            decelerationRate="fast"
            snapToInterval={227}
            snapToAlignment="start"
            showsHorizontalScrollIndicator={false}
            className="-mx-5 mt-3"
            contentContainerClassName="items-stretch gap-4 pl-5 pr-5"
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const next = Math.round(x / 227);
              const max = Math.max(trendCards.length - 1, 0);
              setTrendIndex(Math.min(Math.max(next, 0), max));
            }}
            scrollEventThrottle={16}
          >
            {trendCards.map((card, index) => (
              <TrendCard
                key={`${card.title}-${index}`}
                title={card.title}
                pct={card.pct}
                unitLabel={card.unitLabel}
                body={card.body}
                icon={
                  index % 2 === 0 ? (
                    <TrendDayIcon size={20} />
                  ) : (
                    <MaterialCommunityIcons name="alert-circle-outline" size={28} color="#CEE5ED" />
                  )
                }
              />
            ))}
          </ScrollView>

          {trendCards.length > 1 ? (
            <View
              className="mt-[56px] h-[6px] flex-row self-center"
              style={{ gap: 3, width: trendCards.length * 6 + (trendCards.length - 1) * 3 }}
            >
              {trendCards.map((_, index) => (
                <View
                  key={`trend-dot-${index}`}
                  className="h-[6px] w-[6px] rounded-full"
                  style={{
                    backgroundColor: trendIndex === index ? '#113E55' : 'rgba(17, 62, 85, 0.6)',
                  }}
                />
              ))}
            </View>
          ) : (
            <View className="mt-[56px]" />
          )}
        </View>
      </ScrollView>

      <IncidentFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        current={{ categories: filterCategories, userTypes: filterUserTypes }}
        onConfirm={({ categories, userTypes }) => {
          setFilterCategories(categories);
          setFilterUserTypes(userTypes);
          setVisibleCount(5);
        }}
      />
      <IncidentOrderModal
        visible={orderModalVisible}
        onClose={() => setOrderModalVisible(false)}
        sortAscending={sortAscending}
        onSelect={setSortAscending}
      />
      <IncidentTimeframeModal
        visible={timeframeVisible}
        onClose={() => setTimeframeVisible(false)}
        selectedLabel={selectedTimeframe}
        onSelect={(label, start, end) => {
          setSelectedTimeframe(label);
          setStartDate(start);
          setEndDate(end);
          setVisibleCount(5);
          setTrendIndex(0);
        }}
        onCustomSelect={() => {
          setSelectedTimeframe('Custom');
          setTimeframeVisible(false);
          setDatePickerVisible(true);
        }}
      />
      <IncidentDatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        initialStart={startDate}
        initialEnd={endDate}
        onApply={(start, end) => {
          setStartDate(start);
          setEndDate(end);
          setSelectedTimeframe('Custom');
          setVisibleCount(5);
          setTrendIndex(0);
          setDatePickerVisible(false);
        }}
      />
      <AISummaryModal
        visible={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        variant={summaryVariant}
        llmSummary={summary?.tier2}
        readTimeLabel={summaryReadTime}
        sourceLabel={summarySourceLabel}
        timelineSummary={inhouseInsight.timelineSummary}
        themes={inhouseInsight.themes}
      />
    </Animated.View>
  );
}
