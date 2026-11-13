import { useGoBack } from '@/src/shared/hooks/useGoBack';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Animated } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionConfirmModal from '@/src/shared/components/feedback/ActionConfirmModal';
import Back from '@/src/shared/components/navigation/Back';
import { sharedStyles } from '@/src/shared/theme/styles';
import { AnomalyUserActivity } from '@/src/features/ai/components/anomaly/user-details/AnomalyUserActivity';
import { AnomalyUserInsight } from '@/src/features/ai/components/anomaly/user-details/AnomalyUserInsight';
import { AnomalyUserOverview } from '@/src/features/ai/components/anomaly/user-details/AnomalyUserOverview';
import { AnomalyUserProfileCard } from '@/src/features/ai/components/anomaly/user-details/AnomalyUserProfileCard';
import AISummaryModal from '@/src/features/ai/components/anomaly/modals/AISummaryModal';
import ExportSvg from '@/src/assets/images/export.svg';
import { useUserStore } from '@/src/store/userStore';
import {
  useAnomalyCaseDemographic,
  useAnomalyCaseHistory,
  useAnomalyCaseSummary,
  useAnomalyCaseResults,
} from '@/src/features/ai/hooks/anomaly';
import {
  getMarketplaceFeatures,
  getMarketplaceFeatureById,
} from '@/src/features/marketplace/services/aiMarketplace';
import { MarketplaceDetailResponse } from '@/src/features/marketplace/types/aiMarketplace';
import {
  anomalyHistoryRecords,
  anomalyHistoryTotal,
  buildCaseGauges,
  unwrapAnomalyPayload,
  type AnomalyDemographicView,
  type AnomalyHistoryView,
  type AnomalyResultsView,
  type AnomalySummaryView,
} from '@/src/features/ai/utils/anomalyShapes';

export default function AnomalyDetectionUserDetailsScreen() {
  const goBack = useGoBack();
  const { id, gender, user_type, display_name, date_from, date_to } = useLocalSearchParams();
  const estateId = useUserStore((state) => state.estate_id) || '';
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'loaded' | 'forbidden' | 'error'>(
    'idle'
  );
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const formatDateObj = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const displayDateFrom = date_from ? formatDateObj(date_from as string) : '';
  const displayDateTo = date_to ? formatDateObj(date_to as string) : '';
  const dateRangeText =
    displayDateFrom && displayDateTo ? `${displayDateFrom} • ${displayDateTo}` : '';

  const { data: rawDemographic } = useAnomalyCaseDemographic(estateId, id as string);
  const demographic =
    unwrapAnomalyPayload(rawDemographic as AnomalyDemographicView | undefined) ?? {};

  const { data: rawHistoryData, isLoading: historyLoading } = useAnomalyCaseHistory(
    estateId,
    id as string
  );
  const historyData = useMemo(
    () => unwrapAnomalyPayload(rawHistoryData as AnomalyHistoryView | undefined) ?? {},
    [rawHistoryData]
  );

  const { data: rawResultsData } = useAnomalyCaseResults(estateId, id as string);
  const resultsData = useMemo(
    () => unwrapAnomalyPayload(rawResultsData as AnomalyResultsView | undefined) ?? {},
    [rawResultsData]
  );

  const { refetch: fetchSummary, data: summaryData } = useAnomalyCaseSummary(
    estateId,
    id as string,
    false
  );

  const [localSummaryData, setLocalSummaryData] = useState<AnomalySummaryView | null>(null);
  const [featureDetail, setFeatureDetail] = useState<MarketplaceDetailResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchFeature() {
      try {
        const list = await getMarketplaceFeatures();
        const anomalyTool = list.items?.find((item) => item.name.toLowerCase().includes('anomaly'));
        if (anomalyTool && isMounted) {
          const detail = await getMarketplaceFeatureById(anomalyTool.id);
          if (isMounted) {
            setFeatureDetail(detail);
          }
        }
      } catch {}
    }
    fetchFeature();
    return () => {
      isMounted = false;
    };
  }, []);

  const tierTwoApi = featureDetail?.tiers?.find((tier) => tier.tier === 'tier2');
  const tierThreeApi = featureDetail?.tiers?.find((tier) => tier.tier === 'tier3');

  const rawSummaryData = localSummaryData || summaryData;
  const currentSummaryData = unwrapAnomalyPayload(rawSummaryData as AnomalySummaryView | undefined);

  const userTypeStr =
    typeof user_type === 'string' && user_type
      ? user_type
      : demographic?.user_type || demographic.role || 'Guest';
  const genderStr = typeof gender === 'string' && gender ? gender : demographic.gender || '';

  const demo = {
    ...demographic,
    user_type: userTypeStr,
    display_name: display_name
      ? decodeURIComponent(display_name as string)
      : demographic?.display_name || '',
    gender: genderStr,
  };

  const isGuest = userTypeStr.toLowerCase() === 'guest' || userTypeStr.toLowerCase() === 'visitor';
  const isFemale = genderStr.toLowerCase().startsWith('f');
  const accentColor = isGuest ? '#113E55' : '#F46036';

  const historyRecords = useMemo(() => anomalyHistoryRecords(historyData), [historyData]);

  const historyRecordsCount = useMemo(
    () => anomalyHistoryTotal(historyData, historyRecords.length),
    [historyData, historyRecords]
  );

  const selectedDays = useMemo(() => {
    if (date_from && date_to) {
      const d1 = new Date(date_from as string).getTime();
      const d2 = new Date(date_to as string).getTime();
      if (!isNaN(d1) && !isNaN(d2)) {
        return Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
      }
    }
    return 7;
  }, [date_from, date_to]);

  const gaugeList = useMemo(
    () =>
      buildCaseGauges(
        resultsData.anomaly_overview?.contributing_factors,
        historyRecordsCount,
        selectedDays
      ),
    [resultsData, historyRecordsCount, selectedDays]
  );

  const handleGenerateSummary = async () => {
    setAiState('loading');
    const result = await fetchSummary();
    if (result.isError) {
      const error = result.error as { response?: { status?: number }; status?: number } | undefined;
      const status = error?.response?.status || error?.status;
      if (status === 403) {
        setAiState('forbidden');
      } else {
        setAiState('error');
      }
    } else {
      if (result.data) {
        setLocalSummaryData(result.data);
      }
      setAiState('loaded');
    }
  };

  // Pulsing animation for the ring
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const [profilePicUri, setProfilePicUri] = useState<string | null>(null);
  const [isFetchingPicture, setIsFetchingPicture] = useState(true);

  useEffect(() => {
    async function fetchPicture() {
      if (!demo?.user_id) {
        setIsFetchingPicture(false);
        return;
      }
      try {
        const { getUserDocumentViewUri } = require('@/src/features/profile/services/userDocuments');

        // Only the profile photo: never fall back to the government ID image (private, and may
        // be a PDF). Without a photo the screen shows its normal placeholder avatar.
        const profilePic = await getUserDocumentViewUri(demo.user_id, 'profile_picture');
        if (profilePic) setProfilePicUri(profilePic);
      } catch {
        // The screen already falls back to the guest or placeholder avatar.
      } finally {
        setIsFetchingPicture(false);
      }
    }
    fetchPicture();
  }, [demo?.user_id]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, { backgroundColor: '#F6F7F7', paddingHorizontal: 16 }]}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mt-2 mb-6">
        <Back type="short-arrow" onPress={() => goBack()} />
        <Text
          allowFontScaling={false}
          style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#113E55' }}
        >
          User Overview
        </Text>
        <Pressable
          onPress={() => setShowComingSoon(true)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#113E55',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ExportSvg width={14} height={14} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Card */}
        <AnomalyUserProfileCard
          demo={demo}
          dateRangeText={dateRangeText}
          accentColor={accentColor}
          pulseAnim={pulseAnim}
          isFetchingPicture={isFetchingPicture}
          isGuest={isGuest}
          isFemale={isFemale}
          profilePicUri={profilePicUri}
        />

        <AnomalyUserActivity historyRecords={historyRecords} loading={historyLoading} />

        {historyLoading ? null : (
          <AnomalyUserInsight
            aiState={aiState}
            handleGenerateSummary={handleGenerateSummary}
            demographic={demographic}
            currentSummaryData={currentSummaryData}
            setModalInitialIndex={setModalInitialIndex}
            setShowAiSummaryModal={setShowAiSummaryModal}
          />
        )}

        <AnomalyUserOverview resultsData={resultsData} gaugeList={gaugeList} />
      </ScrollView>

      {/* Modals */}
      <AISummaryModal
        visible={showAiSummaryModal}
        onClose={() => setShowAiSummaryModal(false)}
        summaryData={currentSummaryData}
        initialIndex={modalInitialIndex}
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
    </SafeAreaView>
  );
}
