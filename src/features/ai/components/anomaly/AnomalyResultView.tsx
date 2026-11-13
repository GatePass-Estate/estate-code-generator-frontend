import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
} from 'react-native';
import ScreenLoading from '@/src/shared/components/feedback/ScreenLoading';
import Animated, { FadeIn } from 'react-native-reanimated';
import ActionConfirmModal from '@/src/shared/components/feedback/ActionConfirmModal';
import { isAxiosError } from 'axios';

import { router, useFocusEffect } from 'expo-router';
import FilterModal, {
  Severity,
  Gender,
  UserType,
} from '@/src/features/ai/components/anomaly/modals/FilterModal';
import OrderModal from '@/src/features/ai/components/anomaly/modals/OrderModal';
import GaugeDetailModal, {
  GaugeData,
} from '@/src/features/ai/components/anomaly/modals/GaugeDetailModal';
import DateRangePickerModal from '@/src/features/ai/components/shared/DateRangePickerModal';
import TimeframeRangeModal from '@/src/features/ai/components/shared/TimeframeRangeModal';
import { useUserStore } from '@/src/store/userStore';
import { useAnomalyOverview, useAnomalyPredictions } from '@/src/features/ai/hooks/anomaly';
import {
  buildOverviewGauges,
  unwrapAnomalyPayload,
  type AnomalyOverviewView,
} from '@/src/features/ai/utils/anomalyShapes';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';
import { AnomalyEvidenceSection } from '@/src/features/ai/components/anomaly/result/AnomalyEvidenceSection';
import { AnomalyOverviewSection } from '@/src/features/ai/components/anomaly/result/AnomalyOverviewSection';
import { AnomalySummaryCards } from '@/src/features/ai/components/anomaly/result/AnomalySummaryCards';
import { AnomalyUserTable } from '@/src/features/ai/components/anomaly/result/AnomalyUserTable';

/** True when the server refused because the estate's plan doesn't include the feature. */
function isEntitlementDenied(err: unknown): boolean {
  if (!isAxiosError(err)) return false;
  if ([402, 403].includes(err.response?.status ?? 0)) return true;
  const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail;
  return typeof detail === 'string' && /not entitled/i.test(detail);
}

export default function AnomalyResultView({
  isActive = true,
  onAccessDenied,
}: {
  isActive?: boolean;
  onAccessDenied?: () => void;
}) {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [timeframeVisible, setTimeframeVisible] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last Week');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  });
  const [activeEvidenceDot, setActiveEvidenceDot] = useState(0);
  const [sortAscending, setSortAscending] = useState(false);
  const [gaugesInView, setGaugesInView] = useState(false);
  const [gaugeSectionLayout, setGaugeSectionLayout] = useState<{
    y: number;
    height: number;
  } | null>(null);
  const [selectedGaugeIndex, setSelectedGaugeIndex] = React.useState<number | null>(null);
  const [paginationLimit, setPaginationLimit] = useState(5);
  const [gaugeLimit, setGaugeLimit] = useState(2);

  const [filterSeverity, setFilterSeverity] = useState<Severity[]>([]);
  const [filterGender, setFilterGender] = useState<Gender[]>([]);
  const [filterUserType, setFilterUserType] = useState<UserType[]>([]);

  const estate_id = useUserStore((state) => state.estate_id) || '';
  const userEstateName = useUserStore((state) => state.estate_name);
  const userHomeAddress = useUserStore((state) => state.home_address);

  const getShortLocation = () => {
    if (overview?.demographic?.state) return overview.demographic.state;
    if (!userHomeAddress) return 'N/A';
    let addr = userHomeAddress;
    if (userEstateName) {
      const regex = new RegExp(userEstateName, 'gi');
      addr = addr.replace(regex, '');
    }
    const parts = addr
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    return parts.length > 0 ? parts[0] : 'N/A';
  };
  const isCustomTimeframe = selectedTimeframe === 'Custom';
  const effectiveToDate =
    isCustomTimeframe && endDate
      ? new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString()
      : undefined;
  const effectiveFromDate = startDate
    ? new Date(new Date(startDate).setHours(0, 0, 0, 0)).toISOString()
    : undefined;

  const {
    data: rawOverview,
    isLoading: overviewLoading,
    isError: overviewError,
    error: overviewErr,
    refetch: refetchOverview,
  } = useAnomalyOverview(estate_id, effectiveFromDate, effectiveToDate);

  const {
    data: predictionsData,
    isLoading: predictionsLoading,
    isFetching: predictionsFetching,
    isError: predictionsError,
    error: predictionsErr,
    refetch: refetchPredictions,
  } = useAnomalyPredictions(estate_id, {
    from_date: effectiveFromDate,
    to_date: effectiveToDate,
    severity: filterSeverity.length > 0 ? filterSeverity.map((s) => s.toLowerCase()) : undefined,
    gender: filterGender.length > 0 ? filterGender.map((g) => g.toLowerCase()) : undefined,
    user_type: filterUserType.length > 0 ? filterUserType.map((u) => u.toLowerCase()) : undefined,
    sort_order: sortAscending ? 'asc' : 'desc',
    limit: paginationLimit,
    page: 1,
  });

  const { showDenied: showAnomalyDenied } = useFeatureGate('access_anomaly_detection_tier_1', {
    notice: 'floating',
    onUpgrade: () =>
      router.push({
        pathname: '/(protected)/(shared-screens)/ai-store/anomaly-detection',
        params: { tab: 'Overview' },
      }),
  });

  const onAccessDeniedRef = useRef(onAccessDenied);
  onAccessDeniedRef.current = onAccessDenied;

  const bootEntitlementDenied =
    !!estate_id &&
    (overviewError || predictionsError) &&
    !rawOverview &&
    !predictionsData &&
    (isEntitlementDenied(overviewErr) || isEntitlementDenied(predictionsErr));

  React.useEffect(() => {
    if (!bootEntitlementDenied || !isActive) return;
    if (onAccessDeniedRef.current) onAccessDeniedRef.current();
    else showAnomalyDenied();
  }, [bootEntitlementDenied, isActive, showAnomalyDenied]);

  React.useEffect(() => {
    if (isActive && estate_id) {
      void refetchOverview();
      void refetchPredictions();
    }
  }, [isActive, estate_id, refetchOverview, refetchPredictions]);

  useFocusEffect(
    React.useCallback(() => {
      if (isActive && estate_id) {
        void refetchOverview();
        void refetchPredictions();
      }
    }, [isActive, estate_id, refetchOverview, refetchPredictions])
  );

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchOverview(), refetchPredictions()]);
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = overviewLoading || predictionsLoading;
  const overview = unwrapAnomalyPayload(rawOverview as AnomalyOverviewView | undefined);

  const selectedDays = React.useMemo(() => {
    if (startDate && endDate) {
      const d1 = startDate.getTime();
      const d2 = endDate.getTime();
      if (!isNaN(d1) && !isNaN(d2)) {
        return Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
      }
    }
    return 7;
  }, [startDate, endDate]);

  const totalRecords = overview?.demographic?.total_anomalous_instances || 0;

  // Generate dynamic gauge data from API, safely handling null percentages
  const gaugeList: GaugeData[] = React.useMemo(
    () => buildOverviewGauges(overview, totalRecords, selectedDays),
    [overview, totalRecords, selectedDays]
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const viewportHeight = event.nativeEvent.layoutMeasurement.height;

    if (!gaugesInView && gaugeSectionLayout) {
      const bottomOfViewport = y + viewportHeight;
      // Trigger when 80% of the gauge section is visible to ensure it fires smoothly even on smaller screens
      const targetY = gaugeSectionLayout.y + gaugeSectionLayout.height * 0.8;

      if (bottomOfViewport >= targetY) {
        setGaugesInView(true);
      }
    }
  };

  const handleExport = () => {
    setShowComingSoon(true);
  };

  const handleCycleRange = () => {
    setTimeframeVisible(true);
  };

  const selectedRangeText =
    selectedTimeframe === 'Custom' && startDate && endDate
      ? `${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
      : selectedTimeframe;

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#F6F7F7',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ScreenLoading />
      </View>
    );
  }

  const predictionsArray = predictionsData?.predictionsArray || [];
  const totalPredictionsCount = predictionsData?.totalPredictionsCount || 0;

  const predictions = predictionsArray.slice(0, paginationLimit);

  return (
    <Animated.View entering={FadeIn.duration(260)} style={{ flex: 1, backgroundColor: '#F6F7F7' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 61, paddingBottom: 100 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#113E55"
            colors={['#113E55']}
          />
        }
      >
        <AnomalySummaryCards
          overview={overview}
          userEstateName={userEstateName}
          selectedRangeText={selectedRangeText}
          getShortLocation={getShortLocation}
          handleCycleRange={handleCycleRange}
          handleExport={handleExport}
          isActive={isActive}
        />
        <AnomalyUserTable
          predictions={predictions}
          totalPredictionsCount={totalPredictionsCount}
          startDate={startDate}
          endDate={endDate}
          setPaginationLimit={setPaginationLimit}
          setFilterModalVisible={setFilterModalVisible}
          setOrderModalVisible={setOrderModalVisible}
          predictionsFetching={predictionsFetching}
        />
        <AnomalyOverviewSection
          overview={overview}
          gaugeList={gaugeList}
          gaugeLimit={gaugeLimit}
          gaugesInView={gaugesInView}
          setGaugeLimit={setGaugeLimit}
          setSelectedGaugeIndex={setSelectedGaugeIndex}
          setGaugeSectionLayout={setGaugeSectionLayout}
        />
        <AnomalyEvidenceSection
          overview={overview}
          activeEvidenceDot={activeEvidenceDot}
          setActiveEvidenceDot={setActiveEvidenceDot}
        />
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={(severity, gender, userType) => {
          setFilterSeverity(severity);
          setFilterGender(gender);
          setFilterUserType(userType);
          setPaginationLimit(5); // Reset pagination when filter changes
        }}
        currentSeverity={filterSeverity}
        currentGender={filterGender}
        currentUserType={filterUserType}
      />

      {/* Order Modal */}
      <OrderModal
        visible={orderModalVisible}
        onClose={() => setOrderModalVisible(false)}
        sortAscending={sortAscending}
        setSortAscending={setSortAscending}
      />

      {/* Timeframe Modal */}
      <TimeframeRangeModal
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

      {/* Date Picker Modal */}
      <DateRangePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        initialStart={startDate}
        initialEnd={endDate}
        onApply={(start, end) => {
          setStartDate(start);
          setEndDate(end);
          setDatePickerVisible(false);
        }}
      />

      {/* Gauge Detail Modal */}
      <GaugeDetailModal
        visible={selectedGaugeIndex !== null}
        onClose={() => setSelectedGaugeIndex(null)}
        gaugeData={selectedGaugeIndex !== null ? gaugeList[selectedGaugeIndex] : null}
        onNext={() =>
          selectedGaugeIndex !== null &&
          setSelectedGaugeIndex((selectedGaugeIndex + 1) % gaugeList.length)
        }
        onPrev={() =>
          selectedGaugeIndex !== null &&
          setSelectedGaugeIndex((selectedGaugeIndex - 1 + gaugeList.length) % gaugeList.length)
        }
      />

      <ActionConfirmModal
        visible={showComingSoon}
        title="Coming Soon"
        message="This feature is not yet active. We are working hard to bring it to you soon!"
        confirmLabel="Got it"
        hideCancel
        onConfirm={() => setShowComingSoon(false)}
        onCancel={() => setShowComingSoon(false)}
      />
    </Animated.View>
  );
}
