import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Animated,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Reanimated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { sharedStyles } from '@/src/theme/styles';
import AnomalyRadarChart from '@/src/components/anomaly/AnomalyRadarChart';
import SemiCircleGauge from '@/src/components/anomaly/SemiCircleGauge';
import Svg, { Circle, Line } from 'react-native-svg';
import AISummaryModal from '@/src/components/anomaly/modals/AISummaryModal';
import GaugeDetailModal from '@/src/components/anomaly/modals/GaugeDetailModal';
import TotalUsersSvg from '@/src/assets/icons/totalusers.svg';
import GuestMaleSvg from '@/src/assets/images/guestmale.svg';
import GuestFemaleSvg from '@/src/assets/images/guestfemale.svg';
import ExportSvg from '@/src/assets/images/export.svg';
import AiSummaryExpandSvg from '@/src/assets/images/aisummaryexpand.svg';
import TimeIconSvg from '@/src/assets/images/timeicon.svg';
import ThirdPartySvg from '@/src/assets/images/thirdparty.svg';
import { useUserStore } from '@/src/lib/stores/userStore';
import {
  useAnomalyCaseDemographic,
  useAnomalyCaseHistory,
  useAnomalyCaseSummary,
  useAnomalyCaseResults,
} from '@/src/hooks/useAnomalyQueries';
import { getMarketplaceFeatures, getMarketplaceFeatureById } from '@/src/lib/api/aiMarketplace';
import { MarketplaceDetailResponse } from '@/src/types/aiMarketplace';

const GaugeCardsSection = React.memo(function GaugeCardsSection({
  gaugeList,
}: {
  gaugeList: any[];
}) {
  const [gaugeLimit, setGaugeLimit] = useState(2);
  const [selectedGaugeIndex, setSelectedGaugeIndex] = useState<number | null>(null);

  return (
    <>
      <View style={{ gap: 16 }}>
        {gaugeList.length > 0 ? (
          <>
            {gaugeList.slice(0, gaugeLimit).map((gauge: any, index: number) => (
              <Pressable
                key={`gauge-${index}`}
                onPress={() => setSelectedGaugeIndex(index)}
                style={{
                  width: '100%',
                  minHeight: 180,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 24,
                  padding: 24,
                  alignSelf: 'center',
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: '#EFF1F3',
                }}
              >
                {/* Gauge Centered */}
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <SemiCircleGauge
                    percentage={gauge.percentage}
                    color={gauge.arcColor || gauge.color}
                    size={150}
                    animate={true}
                  />
                </View>
                {/* Title */}
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: gauge.color }} />
                  <Text
                    allowFontScaling={false}
                    style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 16, color: '#0A1F29' }}
                  >
                    {gauge.title}
                  </Text>
                </View>
                {/* Description */}
                {gauge.description ? (
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Regular',
                      fontSize: 13,
                      color: '#8A9A9D',
                      lineHeight: 18,
                    }}
                  >
                    {gauge.description}
                  </Text>
                ) : null}
              </Pressable>
            ))}
            {gaugeList.length > gaugeLimit ? (
              <Pressable
                onPress={() => setGaugeLimit((l) => l + 2)}
                style={{ alignItems: 'center', paddingVertical: 12 }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'UbuntuSans-SemiBold', fontSize: 14, color: '#113E55' }}
                >
                  Load More
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}
          >
            No gauges found.
          </Text>
        )}
      </View>

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
    </>
  );
});

export default function AnomalyDetectionUserDetailsScreen() {
  const { id, gender, user_type, display_name, date_from, date_to } = useLocalSearchParams();
  const estateId = useUserStore((state: any) => state.estate_id) || '';
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'loaded' | 'forbidden' | 'error'>(
    'idle'
  );
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
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
  const demographic = (rawDemographic as any)?.data || rawDemographic || {};

  const { data: rawHistoryData } = useAnomalyCaseHistory(estateId, id as string);
  const historyData = (rawHistoryData as any)?.data || rawHistoryData || {};

  const { data: rawResultsData } = useAnomalyCaseResults(estateId, id as string);
  const resultsData = (rawResultsData as any)?.data || rawResultsData || {};

  const { refetch: fetchSummary, data: summaryData } = useAnomalyCaseSummary(
    estateId,
    id as string,
    false
  );

  const [localSummaryData, setLocalSummaryData] = useState<any>(null);
  const [featureDetail, setFeatureDetail] = useState<MarketplaceDetailResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchFeature() {
      try {
        const list = await getMarketplaceFeatures();
        const anomalyTool = list.items?.find((item: any) =>
          item.name.toLowerCase().includes('anomaly')
        );
        if (anomalyTool && isMounted) {
          const detail = await getMarketplaceFeatureById(anomalyTool.id);
          if (isMounted) {
            setFeatureDetail(detail);
          }
        }
      } catch (err: any) {
        console.log('Error loading anomaly feature details:', err?.message || err);
      }
    }
    fetchFeature();
    return () => {
      isMounted = false;
    };
  }, []);

  const tierTwoApi = featureDetail?.tiers?.find((t: any) => t.tier === 'tier2');
  const tierThreeApi = featureDetail?.tiers?.find((t: any) => t.tier === 'tier3');

  const rawSummaryData = localSummaryData || summaryData;
  const currentSummaryData = rawSummaryData?.data || rawSummaryData;

  const userTypeStr =
    typeof user_type === 'string' && user_type
      ? user_type
      : demographic?.user_type || (demographic as any)?.role || 'Guest';
  const genderStr =
    typeof gender === 'string' && gender ? gender : (demographic as any)?.gender || '';

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

  const historyRecords = useMemo(() => {
    if (Array.isArray((historyData as any)?.data)) return (historyData as any).data;
    if (Array.isArray(historyData)) return historyData;
    if (historyData?.items) return historyData.items;
    return [];
  }, [historyData]);

  const historyRecordsCount = useMemo(() => {
    if ((historyData as any)?.total !== undefined) return (historyData as any).total;
    return historyRecords.length;
  }, [historyData, historyRecords]);

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

  const gaugeList = useMemo(() => {
    const factors = resultsData?.anomaly_overview?.contributing_factors;
    if (!factors || factors.length === 0) return [];

    const colors = ['#F46036', '#1B998B', '#113E55', '#D97706'];

    const formatFallbackString = (str: string) => {
      if (!str) return '';
      return str
        .split('_')
        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    };

    return factors.map((factor: any, index: number) => {
      const percentage = factor.percentage || 0;
      const themeColor = colors[index % colors.length];

      const rawTitle = factor.name || factor.feature_name || 'Unknown Factor';
      const formattedTitle = factor.label || formatFallbackString(rawTitle);

      const weight = factor.weight !== undefined ? factor.weight : factor.percentage;
      const formattedWeight =
        weight != null ? `${Number(weight).toFixed(weight === 0 ? 0 : 0)}%` : '-';

      return {
        title: formattedTitle,
        description: factor.description || '',
        percentage,
        weightLabel: formattedWeight,
        color: themeColor,
        arcColor: themeColor,
        records: historyRecordsCount,
        days: selectedDays,
        items: (factor.sub_factors || []).map((sf: any) => {
          const rawSfTitle = sf.name || sf.feature_name || 'Sub-factor';
          return {
            title: sf.label || formatFallbackString(rawSfTitle),
            description: sf.description || '',
            percentage: sf.percentage || 0,
            value:
              sf.weight != null
                ? sf.weight
                : sf.percentage != null
                  ? `${Math.round(sf.percentage)}%`
                  : '-',
          };
        }),
      };
    });
  }, [resultsData, historyRecordsCount, selectedDays]);

  const handleGenerateSummary = async () => {
    setAiState('loading');
    const result = await fetchSummary();
    if (result.isError) {
      // @ts-ignore
      const status = result.error?.response?.status || result.error?.status;
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
        const { getUserDocumentViewUri } = require('@/src/lib/api/userDocuments');

        try {
          const profilePic = await getUserDocumentViewUri(demo.user_id, 'profile_picture');
          if (profilePic) {
            setProfilePicUri(profilePic);
            setIsFetchingPicture(false);
            return;
          }
        } catch (e) {
          // ignore error and try id_card
        }

        try {
          const idCard = await getUserDocumentViewUri(demo.user_id, 'id_card');
          if (idCard) {
            setProfilePicUri(idCard);
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.warn('Failed to load profile picture', err);
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
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#EFF1F3',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="keyboard-arrow-left" size={20} color="#113E55" />
        </Pressable>
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

      {/* @ts-ignore */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Profile Card */}
        <View
          style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, marginBottom: 24 }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#F6F7F7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TotalUsersSvg width={14} height={14} color="#113E55" />
            </View>
            <View>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 14,
                  lineHeight: 14,
                  color: '#113E55',
                  marginBottom: 4,
                }}
              >
                {demo.display_name || (demo as any).name || 'Unknown User'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Regular',
                    fontSize: 9,
                    lineHeight: 11,
                    color: '#8A9A9D',
                  }}
                >
                  {dateRangeText || (demo.user_id ? 'Verified User' : 'N/A')}
                </Text>
              </View>
            </View>
          </View>

          {/* Avatar and Stats */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 28,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {/* Dashed Avatar Circle */}
            <View
              style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({ inputRange: [1, 1.03], outputRange: [1, 0.7] }),
                }}
              >
                <Svg width="120" height="120" viewBox="0 0 120 120">
                  <Circle
                    cx="60"
                    cy="60"
                    r="52"
                    stroke={accentColor}
                    strokeWidth="8"
                    strokeDasharray="2 6"
                    fill="none"
                  />
                </Svg>
              </Animated.View>
              <View style={{ backgroundColor: '#EEF0F2', borderRadius: 44, padding: 5 }}>
                {isFetchingPicture ? (
                  !isGuest ? (
                    <View
                      style={{
                        width: 78,
                        height: 78,
                        borderRadius: 39,
                        backgroundColor: '#EFF1F3',
                      }}
                    />
                  ) : isFemale ? (
                    <GuestFemaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
                  ) : (
                    <GuestMaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
                  )
                ) : (demo as any).avatar_url || profilePicUri ? (
                  <Image
                    source={{ uri: (demo as any).avatar_url || profilePicUri! }}
                    style={{ width: 78, height: 78, borderRadius: 39 }}
                  />
                ) : isGuest ? (
                  isFemale ? (
                    <GuestFemaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
                  ) : (
                    <GuestMaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
                  )
                ) : (
                  <View
                    style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: '#EFF1F3' }}
                  />
                )}
              </View>
            </View>

            {/* Stats List */}
            <View style={{ flex: 1, gap: 16 }}>
              {/* Stat 1 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 3, backgroundColor: accentColor, borderRadius: 2 }} />
                <View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Medium',
                      fontSize: 9,
                      lineHeight: 9,
                      color: '#878686',
                      marginBottom: 2,
                    }}
                  >
                    User Type
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Regular',
                      fontSize: 11,
                      lineHeight: 11,
                      color: '#04162D',
                      textTransform: 'capitalize',
                    }}
                  >
                    {demo.user_type || 'Unknown'}
                  </Text>
                </View>
              </View>

              {/* Stat 2 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 3, backgroundColor: accentColor, borderRadius: 2 }} />
                <View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Medium',
                      fontSize: 9,
                      lineHeight: 9,
                      color: '#878686',
                      marginBottom: 2,
                    }}
                  >
                    Avg. Entries / Week
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Regular',
                      fontSize: 11,
                      lineHeight: 11,
                      color: '#04162D',
                    }}
                  >
                    {demo.average_entry_per_week?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>

              {/* Stat 3 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 3, backgroundColor: accentColor, borderRadius: 2 }} />
                <View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Medium',
                      fontSize: 9,
                      lineHeight: 9,
                      color: '#878686',
                      marginBottom: 2,
                    }}
                  >
                    Total Entries
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Regular',
                      fontSize: 11,
                      lineHeight: 11,
                      color: '#04162D',
                    }}
                  >
                    {demo.total_entries || '0'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={{ marginBottom: 24 }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Inter_18pt-Medium',
              fontSize: 9,
              lineHeight: 9,
              color: '#878686',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            RECENT ACTIVITY
          </Text>
          <ScrollView
            style={{ maxHeight: 258 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <View style={{ position: 'relative' }}>
              {/* Dashed Line Background - starts from center of first card (top: 39) */}
              {historyRecords.length > 0 ? (
                <Svg
                  height={historyRecords.length * 90}
                  width="2"
                  style={{ position: 'absolute', top: 39, left: 12, zIndex: 1 }}
                >
                  <Line
                    x1="1"
                    y1="0"
                    x2="1"
                    y2="100%"
                    stroke="#878686"
                    strokeWidth="1.4"
                    strokeDasharray="2.8, 2.8"
                  />
                </Svg>
              ) : null}

              <View style={{ gap: 12 }}>
                {historyRecords.length > 0 ? (
                  historyRecords.map((record: any, index: number) => {
                    const sev = (record.severity || 'low').toLowerCase();
                    let bgColor = '#1B998B1F';
                    let textColor = '#1B998B';
                    if (sev === 'high') {
                      bgColor = '#F61C1C1F';
                      textColor = '#E30404';
                    } else if (sev === 'medium') {
                      bgColor = '#FBFBEE';
                      textColor = '#D97706';
                    }
                    const d = new Date(record.validated_at);
                    const timeString = isNaN(d.getTime())
                      ? '--:--'
                      : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateString = isNaN(d.getTime())
                      ? 'N/A'
                      : `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;

                    return (
                      <View
                        key={`history-${index}`}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}
                      >
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            borderWidth: 1.4,
                            borderColor: '#8A9A9D',
                            backgroundColor: '#F6F7F7',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                          }}
                        >
                          <View
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 7,
                              backgroundColor: '#8A9A9D',
                            }}
                          />
                        </View>
                        <View
                          style={{
                            flex: 1,
                            height: 78,
                            backgroundColor: '#FFFFFF',
                            borderRadius: 16,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            justifyContent: 'space-between',
                          }}
                        >
                          <Text
                            allowFontScaling={false}
                            style={{
                              fontFamily: 'Inter_18pt-Regular',
                              fontSize: 13,
                              color: '#8A9A9D',
                            }}
                          >
                            {timeString} • {dateString}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              allowFontScaling={false}
                              style={{
                                fontFamily: 'UbuntuSans-SemiBold',
                                fontSize: 22,
                                lineHeight: 22,
                                color: '#113E55',
                              }}
                            >
                              {record.validated_code || 'N/A'}
                            </Text>
                            <View
                              style={{
                                backgroundColor: bgColor,
                                paddingHorizontal: 16,
                                height: 28,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderRadius: 16,
                              }}
                            >
                              <Text
                                allowFontScaling={false}
                                style={{
                                  fontFamily: 'Inter_18pt-Regular',
                                  fontSize: 11.2,
                                  lineHeight: 11.2,
                                  color: textColor,
                                  textTransform: 'uppercase',
                                }}
                              >
                                {sev === 'medium' ? 'MED' : record.severity || 'Normal'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text
                    allowFontScaling={false}
                    style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}
                  >
                    No recent activity found.
                  </Text>
                )}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* AI Insight Banner */}
        {aiState === 'idle' ? (
          <Pressable
            onPress={handleGenerateSummary}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
              paddingVertical: 16,
            }}
          >
            <Image
              source={require('@/src/assets/images/logo.png')}
              style={{ width: 64, height: 64, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 13,
                color: '#8A9A9D',
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              {demographic?.has_tier1_summary || demographic?.has_tier2_summary
                ? `Tap to view AI Insight on\nyour report`
                : `Tap to generate AI Insight on\nyour report`}
            </Text>
          </Pressable>
        ) : aiState === 'loading' ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
              paddingVertical: 16,
            }}
          >
            <ActivityIndicator size="large" color="#113E55" />
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 13,
                color: '#8A9A9D',
                marginTop: 12,
              }}
            >
              Analyzing case details...
            </Text>
          </View>
        ) : aiState === 'forbidden' ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: '#EFF1F3',
              marginBottom: 32,
              overflow: 'hidden',
            }}
          >
            <View style={{ position: 'relative' }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#113E55' }}
                >
                  AI Summary
                </Text>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#EFF1F3',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="arrow-expand-all" size={16} color="#113E55" />
                </View>
              </View>
              <Text
                allowFontScaling={false}
                numberOfLines={3}
                style={{
                  fontFamily: 'Inter_18pt-Regular',
                  fontSize: 12,
                  color: '#8A9A9D',
                  lineHeight: 20,
                }}
              >
                This section provides a detailed summary of the anomalous behavior detected for this
                user. It breaks down the key factors contributing to the anomaly, including unusual
                entry times, late-night activity, and irregular visitor patterns over the selected
                timeframe.
              </Text>

              {/* Blur Overlay */}
              <View
                style={{
                  position: 'absolute',
                  top: -5,
                  left: -5,
                  right: -5,
                  bottom: -5,
                  backgroundColor: 'rgba(255,255,255,0.85)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: 24,
                }}
              >
                <MaterialIcons
                  name="lock-outline"
                  size={24}
                  color="#113E55"
                  style={{ marginBottom: 8 }}
                />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Medium',
                    fontSize: 13,
                    color: '#113E55',
                    textAlign: 'center',
                    paddingHorizontal: 20,
                    marginBottom: 4,
                  }}
                >
                  AI Summary Locked
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Regular',
                    fontSize: 11,
                    color: '#8A9A9D',
                    textAlign: 'center',
                    paddingHorizontal: 20,
                  }}
                >
                  Purchase the AI Summary add-on from the marketplace to unlock insights.
                </Text>
              </View>
            </View>
          </View>
        ) : aiState === 'error' ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
              paddingVertical: 16,
            }}
          >
            <MaterialIcons name="error-outline" size={32} color="#ED0808" />
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 13,
                color: '#8A9A9D',
                marginTop: 12,
              }}
            >
              Failed to generate summary. Please try again.
            </Text>
          </View>
        ) : (
          <View style={{ marginBottom: 32 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={Dimensions.get('window').width - 40 + 16}
              decelerationRate="fast"
              disableIntervalMomentum
              contentContainerStyle={{ gap: 16 }}
              onScroll={(e) => {
                const offset = e.nativeEvent.contentOffset.x;
                const index = Math.round(offset / (Dimensions.get('window').width - 24));
                if (index !== activeCarouselIndex) setActiveCarouselIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {['tier1', 'tier2'].map((tierKey, idx, arr) => {
                const tierData = (currentSummaryData as any)?.[tierKey];
                if (!tierData) return null;
                const isTier1 = tierKey === 'tier1';
                const activeTiers = arr.filter((k) => !!(currentSummaryData as any)?.[k]);
                const visualIndex = activeTiers.indexOf(tierKey);

                return (
                  <Pressable
                    key={tierKey}
                    onPress={() => {
                      setModalInitialIndex(visualIndex);
                      setShowAiSummaryModal(true);
                    }}
                    style={{
                      width: Dimensions.get('window').width - 40,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 24,
                      padding: 20,
                      borderWidth: 1,
                      borderColor: '#EFF1F3',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Inter_18pt-Regular',
                          fontSize: 17.5,
                          color: '#0A1F29',
                        }}
                      >
                        AI SUMMARY
                      </Text>
                      <AiSummaryExpandSvg width={32} height={32} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 4,
                          alignItems: 'center',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          backgroundColor: '#FFF0F0',
                          borderRadius: 10,
                        }}
                      >
                        <TimeIconSvg width={12} height={12} color="#F46036" />
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Inter_18pt-Regular',
                            fontSize: 10,
                            color: '#F46036',
                          }}
                        >
                          2 mins Read
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 4,
                          alignItems: 'center',
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          backgroundColor: '#E5F5F3',
                          borderRadius: 10,
                        }}
                      >
                        <ThirdPartySvg width={12} height={12} color="#1B998B" />
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Inter_18pt-Regular',
                            fontSize: 10,
                            color: '#1B998B',
                          }}
                        >
                          {isTier1 ? 'In house' : 'Third Party'}
                        </Text>
                      </View>
                    </View>
                    <Text
                      allowFontScaling={false}
                      numberOfLines={6}
                      style={{
                        fontFamily: 'Inter_18pt-Regular',
                        fontSize: 11.2,
                        color: '#878686',
                        lineHeight: 18,
                      }}
                    >
                      {tierData.executive_summary}
                    </Text>
                  </Pressable>
                );
              })}

              {!currentSummaryData?.tier1 && !currentSummaryData?.tier2 && (
                <Pressable
                  onPress={() => {
                    setModalInitialIndex(0);
                    setShowAiSummaryModal(true);
                  }}
                  style={{
                    width: Dimensions.get('window').width - 40,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 24,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: '#EFF1F3',
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Inter_18pt-Regular',
                        fontSize: 17.5,
                        color: '#0A1F29',
                      }}
                    >
                      AI SUMMARY
                    </Text>
                    <AiSummaryExpandSvg width={32} height={32} />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 4,
                        alignItems: 'center',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: '#FFF0F0',
                        borderRadius: 10,
                      }}
                    >
                      <TimeIconSvg width={12} height={12} color="#F46036" />
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Inter_18pt-Regular',
                          fontSize: 10,
                          color: '#F46036',
                        }}
                      >
                        2 mins Read
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 4,
                        alignItems: 'center',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        backgroundColor: '#E5F5F3',
                        borderRadius: 10,
                      }}
                    >
                      <ThirdPartySvg width={12} height={12} color="#1B998B" />
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Inter_18pt-Regular',
                          fontSize: 10,
                          color: '#1B998B',
                        }}
                      >
                        In house
                      </Text>
                    </View>
                  </View>
                  <Text
                    allowFontScaling={false}
                    numberOfLines={6}
                    style={{
                      fontFamily: 'Inter_18pt-Regular',
                      fontSize: 11.2,
                      color: '#878686',
                      lineHeight: 18,
                    }}
                  >
                    This section provides a detailed summary of the anomalous behavior detected for
                    this user. It breaks down the key factors contributing to the anomaly, including
                    unusual entry times, late-night activity, and irregular visitor patterns over
                    the selected timeframe.
                  </Text>
                </Pressable>
              )}
            </ScrollView>

            {/* Carousel dots indicator */}
            {currentSummaryData?.tier1 && currentSummaryData?.tier2 && (
              <View
                style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12, gap: 6 }}
              >
                {[0, 1].map((dotIndex) => (
                  <View
                    key={dotIndex}
                    style={{
                      width: activeCarouselIndex === dotIndex ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: activeCarouselIndex === dotIndex ? '#113E55' : '#C4CDD0',
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Anomaly Overview Section */}
        <View style={{ marginBottom: 32 }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'UbuntuSans-Medium',
              fontSize: 24,
              color: '#113E55',
              marginBottom: 4,
            }}
          >
            ANOMALY OVERVIEW
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Inter_18pt-Regular',
              fontSize: 16,
              color: '#8A9A9D',
              marginBottom: 40,
            }}
          >
            Actual VS Expected Data Chart
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            {(() => {
              const spider = resultsData?.anomaly_overview?.spider_plot;
              if (spider && spider.length > 0) {
                return (
                  <AnomalyRadarChart
                    labels={spider.map((p: any) => {
                      if (p.label) return p.label;
                      const raw = p.name || p.feature_name || 'Unknown';
                      return raw
                        .split('_')
                        .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');
                    })}
                    series={[
                      {
                        data: spider.map((p: any) => p.percentage || 0),
                        strokeColor: '#1B998B', // Normal is green
                        fillColor: 'rgba(27, 153, 139, 0.28)',
                        dotColor: '#1B998B',
                      },
                      {
                        data: spider.map((p: any) => p.instance_percentage || 0),
                        strokeColor: '#F46036', // Instance is redish
                        fillColor: 'rgba(244, 96, 54, 0.28)',
                        dotColor: '#F46036',
                      },
                    ]}
                  />
                );
              } else {
                return (
                  <View className="items-center justify-center">
                    <AnomalyRadarChart
                      labels={['', '', '', '', '']}
                      series={[
                        {
                          data: [0, 0, 0, 0, 0],
                          strokeColor: 'transparent',
                          fillColor: 'transparent',
                          dotColor: 'transparent',
                        },
                      ]}
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 13, color: '#8A9A9D' }}
                      >
                        No anomaly data plotted
                      </Text>
                    </View>
                  </View>
                );
              }
            })()}
          </View>

          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Inter_18pt-Medium',
              fontSize: 18,
              color: '#113E55',
              marginBottom: 20,
            }}
          >
            These are the top contributing factors
          </Text>

          {/* Pill tags */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {(() => {
              const factors = resultsData?.anomaly_overview?.spider_plot;

              if (factors && factors.length > 0) {
                return factors.map((factor: any, index: number) => {
                  const PALETTE = [
                    { text: '#F46036', bg: '#FFF0F0' },
                    { text: '#113E55', bg: '#E3EDF2' },
                    { text: '#D97706', bg: '#FEF3C7' },
                    { text: '#1B998B', bg: '#E5F5F3' },
                    { text: '#7C3AED', bg: '#F3E8FF' },
                    { text: '#78350F', bg: '#F0E6E1' },
                  ];
                  const colorSet = PALETTE[index % PALETTE.length];

                  return (
                    <View
                      key={`factor-${index}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        height: 34,
                        paddingHorizontal: 14,
                        borderRadius: 17,
                        backgroundColor: colorSet.bg,
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: colorSet.text,
                        }}
                      />
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Inter_18pt-Medium',
                          fontSize: 11.5,
                          color: colorSet.text,
                        }}
                      >
                        {(() => {
                          if (factor.label) return factor.label;
                          const rawName = factor.name || factor.feature_name || 'Unknown';
                          return rawName
                            .split('_')
                            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ');
                        })()}
                      </Text>
                    </View>
                  );
                });
              } else {
                return (
                  <View>
                    <Text
                      allowFontScaling={false}
                      style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}
                    >
                      No top contributing factors identified.
                    </Text>
                  </View>
                );
              }
            })()}
          </View>
          {/* Gauge Cards Section */}
          <GaugeCardsSection gaugeList={gaugeList} />
        </View>
      </ScrollView>

      {/* Modals */}
      <AISummaryModal
        visible={showAiSummaryModal}
        onClose={() => setShowAiSummaryModal(false)}
        summaryData={currentSummaryData}
        initialIndex={modalInitialIndex}
      />

      <Modal
        visible={showComingSoon}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoon(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowComingSoon(false)} />
            </BlurView>
          ) : (
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowComingSoon(false)} />
            </BlurView>
          )}

          <Reanimated.View
            entering={FadeIn.duration(250)}
            exiting={FadeOut.duration(250)}
            style={{
              backgroundColor: '#F6F7F7',
              width: 320,
              borderRadius: 32,
              padding: 24,
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 8, width: '100%' }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'UbuntuSans-Medium',
                  fontSize: 22,
                  color: '#0A1F29',
                  marginBottom: 12,
                }}
              >
                Coming Soon
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Regular',
                  fontSize: 15,
                  color: '#8A9A9D',
                  marginBottom: 32,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                This feature is not yet active. We are working hard to bring it to you soon!
              </Text>

              <Pressable
                onPress={() => setShowComingSoon(false)}
                style={{
                  backgroundColor: '#113E55',
                  width: '100%',
                  paddingVertical: 16,
                  borderRadius: 24,
                  alignItems: 'center',
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 16, color: '#FFFFFF' }}
                >
                  Got it
                </Text>
              </Pressable>
            </View>
          </Reanimated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
