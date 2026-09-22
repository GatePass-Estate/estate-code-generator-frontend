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
import CategoryDistribution from './CategoryDistribution';
import IncidentAISummaryCard, { type InsightMode } from './IncidentAISummaryCard';
import IncidentFilterModal, {
  type IncidentFilterCategory,
  type IncidentFilterUserType,
} from './IncidentFilterModal';
import IncidentOrderModal from './IncidentOrderModal';
import IncidentTimeframeModal from './IncidentTimeframeModal';
import IncidentDatePickerModal from './IncidentDatePickerModal';
import {
  demographicLocation,
  formatReportCount,
  mapCategoryEdaToUi,
  mapListItemToRow,
  mapTrendsFromEda,
  ratioPercentage,
  resolveCategorySection,
} from './mapIncidentApi';
import {
  TRENDS,
  type IncidentCategoryId,
  type IncidentRow,
} from './incidentMockData';

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
  // Figma 6355:3000 — fill is 116px for 70%; scale other % from that
  const fillHeight = Math.max(Math.round(116 * (pct / 70)), 72);
  return (
    <View className="h-[170px] w-12 overflow-hidden rounded-[16px] bg-white">
      <View className="flex-1" />
      <View
        className="w-full items-center justify-between rounded-b-[16px] pb-[14px]"
        style={{ height: fillHeight, backgroundColor: fill }}
      >
        {/* Icon sits on the top edge of the fill (Figma: icon y=53, fill y=54) */}
        <View className="h-5 w-5 items-center justify-center -mt-px">
          {icon}
        </View>
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
    /* Figma 6531:5871 — 211×152, px-16 py-8, gap-8 */
    <View className="h-[152px] w-[211px] gap-2 rounded-[16px] bg-[#113E55] px-4 py-2">
      <View className="w-full h-11  flex-row items-center justify-between">
        <Text
          allowFontScaling={false}
          className="w-[84px] text-[11.2px] font-inter-regular leading-[normal] text-[#CEE5ED]"
        >
          {title}
        </Text>
        <View className="h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#315A73]">
          {icon}
        </View>
      </View>

      <View className="relative w-full mt-1">
        <Text
          allowFontScaling={false}
          className="text-[34.18px] font-ubuntu-medium leading-[normal] text-[#CEE5ED]"
        >
          {pct}%
        </Text>
        <Text
          allowFontScaling={false}
          className="absolute left-[70px] top-[21px] text-[11.2px] font-inter-regular text-[#CEE5ED]"
        >
          {unitLabel}
        </Text>
        <Text
          allowFontScaling={false}
          className=" w-[181px] text-[11.2px] font-inter-regular leading-[normal] text-[#CEE5ED]"
        >
          {body}
        </Text>
      </View>
    </View>
  );
}

function IncidentListRow({ row }: { row: IncidentRow }) {
  return (
    <View className="w-full flex-row items-center gap-[15px] py-2">
      {/* Figma 6586:3952 — avatar + reporter */}
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

      {/* Figma 6586:3985 — category tag + title */}
      <View className="min-w-0 flex-1">
        <View className="self-start bg-[#F4FFFE] px-1 py-0.5">
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
    </View>
  );
}

export default function IncidentResultView({ isActive = true }: { isActive?: boolean }) {
  const estate_id = useUserStore((state) => state.estate_id) || '';
  const estateName = useUserStore((state) => state.estate_name) || 'Hazel Estate';
  const userHomeAddress = useUserStore((state) => state.home_address);
  // Wider default so staging sample cohorts (Apr–May) still land in window.
  const [selectedTimeframe, setSelectedTimeframe] = useState('Custom');
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => new Date());
  const [timeframeVisible, setTimeframeVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [sortAscending, setSortAscending] = useState(false);
  const [insightMode, setInsightMode] = useState<InsightMode>('idle');
  const [fetchSummary, setFetchSummary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<IncidentCategoryId>('security');
  const [visibleCount, setVisibleCount] = useState(5);
  const [trendIndex, setTrendIndex] = useState(0);
  const [filterCategories, setFilterCategories] = useState<IncidentFilterCategory[]>([]);
  const [filterUserTypes, setFilterUserTypes] = useState<IncidentFilterUserType[]>([]);

  const fromDate = startDate ? startDate.toISOString() : undefined;
  const toDate = endDate ? endDate.toISOString() : undefined;

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
    isError: reportsError,
    error: reportsErr,
    refetch: refetchReports,
  } = useIncidentReports(estate_id, {
      from_date: fromDate,
      to_date: toDate,
      category: filterCategories.length ? filterCategories : undefined,
      user_type: filterUserTypes.length ? filterUserTypes : undefined,
      page: 1,
      limit: 20,
    });
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
    const parts = userHomeAddress.split(',').map((p) => p.trim()).filter(Boolean);
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
    if (!categories.some((c) => c.id === selectedCategory)) {
      setSelectedCategory(categories[0]?.id ?? 'security');
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

  const trendCards = useMemo(
    () => mapTrendsFromEda(overview?.eda, TRENDS, false),
    [overview?.eda]
  );
  const executiveSummary =
    summary?.tier2?.executive_summary ||
    summary?.tier1?.executive_summary ||
    undefined;
  const detailedInsight =
    summary?.tier1?.detailed_insight ||
    summary?.tier2?.severity_assessment ||
    undefined;
  const keyPatterns = summary?.tier2?.key_patterns ?? [];
  const recommendedActions = summary?.tier2?.recommended_actions ?? [];
  const dataLimitations = summary?.tier2?.data_limitations;

  const handleInsightPress = () => {
    if (insightMode === 'locked') return;
    if (insightMode === 'idle') {
      if (!estate_id) {
        setInsightMode('generated');
        return;
      }
      if (
        overview &&
        !overview.has_tier1_summary &&
        !overview.has_tier2_summary
      ) {
        setInsightMode('locked');
        return;
      }
      setFetchSummary(true);
      return;
    }
    setSummaryOpen(true);
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

  useEffect(() => {
    if (!fetchSummary || summaryLoading) return;
    if (summaryError) {
      setFetchSummary(false);
      setInsightMode('idle');
      Alert.alert('Unable to generate insight', 'Please try again in a moment.');
      return;
    }
    if (summary?.tier1 || summary?.tier2) {
      setInsightMode('generated');
      return;
    }
    if (summary && !summary.tier1 && !summary.tier2) {
      setInsightMode('locked');
    }
  }, [fetchSummary, summary, summaryLoading, summaryError]);

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
  const bootFailed =
    !!estate_id && overviewError && reportsError && !overview && !reports;

  const bootErrorDetail = (() => {
    const err = (overviewErr || reportsErr) as
      | { message?: string; code?: string; response?: { status?: number; data?: { detail?: unknown } } }
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
        <Text allowFontScaling={false} className="text-center text-sm font-inter-medium text-[#113E55]">
          No estate selected
        </Text>
        <Text allowFontScaling={false} className="mt-2 text-center text-[11.2px] font-inter-regular text-[#878686]">
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
        <Text allowFontScaling={false} className="text-center text-sm font-inter-medium text-[#113E55]">
          Couldn’t load incident reports
        </Text>
        <Text allowFontScaling={false} className="mt-2 text-center text-[11.2px] font-inter-regular text-[#878686]">
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
              <Text allowFontScaling={false} className="text-[8.96px] font-inter-medium text-[#878686]">
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
          <View className="min-h-[61px] flex-1 flex-row gap-[7px] items-center rounded-[16px] border border-[#EFF1F3] bg-white px-[10px] py-4">
            <LocationSvg width={28} height={28} />
            <View className="flex-1 shrink">
              <Text allowFontScaling={false} className="text-[8.96px] font-inter-medium text-[#878686]">
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
          <View className="h-[170px] flex-1 rounded-[16px] bg-white">
            <View className="mt-[15px] flex-row items-center px-3 gap-5">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-[#F6F7F7]">
                <TotalUsersSvg width={13} height={13} />
              </View>
              <Text allowFontScaling={false} className="text-sm font-inter-medium text-[#113E55]">
                Overview
              </Text>
            </View>
            <View className="mt-2.5 items-center">
              <AnomalyDonutChart
                size={99}
                totalText="TOTAL REPORT"
                countText={formatReportCount(totalReports)}
                countColor="#04162D"
                isActive={isActive}
                guestPercentage={0}
                securityPercentage={displaySecurityPct}
                residentPercentage={displayResidentPct}
              />
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
          mode={insightMode}
          onPress={handleInsightPress}
          onUpgradePress={handleUpgradePress}
          summaryText={executiveSummary}
          isLoading={fetchSummary && summaryLoading}
        />

        <CategoryDistribution
          selectedId={selectedCategory}
          onSelect={setSelectedCategory}
          categories={categories}
          totalReports={totalReports}
        />

        <View className="mt-[65px] flex-row items-center justify-between">
          <Text allowFontScaling={false} className="text-[21.88px] font-ubuntu-semibold text-[#0A1F29]">
            Incident Reported
          </Text>
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            className="h-[36px] w-[52px] items-center justify-center rounded-[16px] bg-[#113E55] "
            hitSlop={8}
          >
            <IncidentFilterIcon size={20} color="#F6F7F7" />
          </Pressable>
        </View>

        <View className="mt-3 gap-2 rounded-[16px] bg-white p-4">
          {/* Figma 6355:2658 — headers + sort */}
          <View className="h-7 w-full flex-row items-center">
            <Text allowFontScaling={false} className="text-[8.96px] font-inter-medium text-[#878686]">
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
          {rows.length === 0 ? (
            <Text
              allowFontScaling={false}
              className="py-6 text-center text-[11.2px] font-inter-regular text-[#878686]"
            >
              No incident reports in this window.
            </Text>
          ) : (
            <View className="flex-col gap-2">
              {rows.slice(0, visibleCount).map((row) => (
                <IncidentListRow key={row.id} row={row} />
              ))}
            </View>
          )}

          {visibleCount < rows.length ? (
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
          <Text allowFontScaling={false} className="text-[21.88px] font-ubuntu-semibold text-[#0A1F29]">
            TRENDS DETECTED
          </Text>
          {/* -mx-5 bleeds past page px-5 so next card peeks off-screen like Figma */}
          <ScrollView
            horizontal
            decelerationRate="fast"
            snapToInterval={227}
            snapToAlignment="start"
            showsHorizontalScrollIndicator={false}
            className="-mx-5 mt-3"
            contentContainerClassName="gap-4 pl-5 pr-5"
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              const next = Math.round(x / 227);
              setTrendIndex(next <= 0 ? 0 : 1);
            }}
            scrollEventThrottle={16}
          >
            <TrendCard
              title={trendCards[0]?.title ?? `DAY\nDISTRIBUTION`}
              pct={trendCards[0]?.pct ?? 0}
              unitLabel={trendCards[0]?.unitLabel ?? 'INCIDENT'}
              body={trendCards[0]?.body ?? 'No trend data for this window.'}
              icon={<TrendDayIcon size={20} />}
            />
            <TrendCard
              title={trendCards[1]?.title ?? `TIME\nDISTRIBUTION`}
              pct={trendCards[1]?.pct ?? 0}
              unitLabel={trendCards[1]?.unitLabel ?? 'INCIDENTS'}
              body={trendCards[1]?.body ?? 'No trend data for this window.'}
              icon={<MaterialCommunityIcons name="alert-circle-outline" size={28} color="#CEE5ED" />}
            />
          </ScrollView>

          {/* Figma 6355:2919 — 6px dots, active #113E55, inactive 60%; 56px below cards */}
          <View className="mt-[56px] h-[6px] w-[15px] flex-row self-center" style={{ gap: 3 }}>
            <View
              className="h-[6px] w-[6px] rounded-full"
              style={{ backgroundColor: trendIndex === 0 ? '#113E55' : 'rgba(17, 62, 85, 0.6)' }}
            />
            <View
              className="h-[6px] w-[6px] rounded-full"
              style={{ backgroundColor: trendIndex === 1 ? '#113E55' : 'rgba(17, 62, 85, 0.6)' }}
            />
          </View>
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
          setDatePickerVisible(false);
        }}
      />
      <AISummaryModal
        visible={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        executiveSummary={executiveSummary}
        detailedInsight={detailedInsight}
        keyPatterns={keyPatterns}
        recommendedActions={recommendedActions}
        dataLimitations={dataLimitations}
      />
    </Animated.View>
  );
}
