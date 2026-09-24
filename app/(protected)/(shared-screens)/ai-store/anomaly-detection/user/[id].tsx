import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, Image, Animated, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useUserStore } from '@/src/lib/stores/userStore';
import { useAnomalyCaseDemographic, useAnomalyCaseHistory, useAnomalyCaseSummary, useAnomalyCaseResults } from '@/src/hooks/useAnomalyQueries';

const GaugeCardsSection = React.memo(({ gaugeList }: { gaugeList: any[] }) => {
  const [gaugeLimit, setGaugeLimit] = useState(3);
  const [selectedGaugeIndex, setSelectedGaugeIndex] = useState<number | null>(null);

  return (
    <>
      <View style={{ gap: 16 }}>
        {gaugeList.length > 0 ? (
          <>
            {gaugeList.slice(0, gaugeLimit).map((gauge: any, index: number) => (
              <Pressable key={`gauge-${index}`} onPress={() => setSelectedGaugeIndex(index)} style={{ width: '100%', minHeight: 200, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, flexDirection: 'column', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#EFF1F3' }}>
                {/* Gauge Area with Value Inside */}
                <View style={{ position: 'relative', top: 4, marginBottom: 12 }}>
                  <SemiCircleGauge percentage={gauge.percentage} color={gauge.arcColor || gauge.color} size={150} animate={true} />
                  <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, alignItems: 'center' }}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 34.18, lineHeight: 34.18, letterSpacing: 0, color: '#0A1F29' }}>{gauge.weightLabel}</Text>
                  </View>
                </View>
                {/* Title */}
                <View className="flex-row items-center justify-center gap-2 mb-2 w-full">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: gauge.color }} />
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 14, lineHeight: 14, color: '#0A1F29' }}>{gauge.title}</Text>
                </View>
                {/* Description */}
                {gauge.description ? (
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#8A9A9D', textAlign: 'center', marginTop: 4 }}>
                    {gauge.description}
                  </Text>
                ) : null}
              </Pressable>
            ))}
            {gaugeList.length > gaugeLimit ? (
              <Pressable onPress={() => setGaugeLimit(l => l + 3)} style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-SemiBold', fontSize: 14, color: '#113E55' }}>Load More</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
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
  const { id, gender, user_type, display_name } = useLocalSearchParams();
  const estateId = useUserStore((state: any) => state.estate_id) || '';
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'loaded' | 'forbidden' | 'error'>('idle');
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
  
  const { data: rawDemographic } = useAnomalyCaseDemographic(estateId, id as string);
  const { data: rawHistoryData } = useAnomalyCaseHistory(estateId, id as string);
  const { data: rawResultsData } = useAnomalyCaseResults(estateId, id as string);
  
  const { refetch: fetchSummary, data: rawSummaryData } = useAnomalyCaseSummary(estateId, id as string, false);
  const summaryData: any = rawSummaryData;

  const demographic: any = rawDemographic || {};
  let historyData: any = rawHistoryData || {};
  const resultsData: any = rawResultsData || {};

  console.log('--- USER OVERVIEW MOUNTED ---');
  console.log('ID:', id, 'ESTATE:', estateId);
  console.log('RAW DEMOGRAPHIC:', rawDemographic);
  console.log('RAW HISTORY:', rawHistoryData);
  console.log('RAW RESULTS:', rawResultsData);

  const demo = {
    ...demographic,
    user_type: user_type || demographic.user_type,
    display_name: display_name ? decodeURIComponent(display_name as string) : demographic.display_name,
    gender: gender || demographic.gender,
  };
  
  const isGuest = demo.user_type?.toLowerCase() === 'guest';
  const isFemale = demo.gender?.toLowerCase() === 'female';
  const accentColor = isGuest ? '#113E55' : '#F25B2A';

  const gaugeList = useMemo(() => {
    const factors = resultsData?.anomaly_overview?.contributing_factors;
    if (!factors || factors.length === 0) return [];
    
    const colors = ['#F46036', '#1B998B', '#113E55', '#D97706'];

    const formatFallbackString = (str: string) => {
      if (!str) return '';
      return str.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return factors
      .filter((factor: any) => {
        const raw = factor.name || factor.feature_name || '';
        return !raw.toLowerCase().includes('security');
      })
      .map((factor: any, index: number) => {
      const percentage = factor.percentage || 0;
      const themeColor = colors[index % colors.length];

      const rawTitle = factor.name || factor.feature_name || 'Unknown Factor';
      const formattedTitle = factor.label || formatFallbackString(rawTitle);
      
      const weight = factor.weight !== undefined ? factor.weight : factor.percentage;
      const formattedWeight = weight != null ? `${Number(weight).toFixed(weight === 0 ? 0 : 0)}%` : '-';

      return {
        title: formattedTitle,
        description: factor.description || '',
        percentage,
        weightLabel: formattedWeight,
        color: themeColor,
        arcColor: themeColor,
        records: factor.records || 0,
        days: factor.days || 0,
        items: (factor.sub_factors || []).map((sf: any) => {
          const rawSfTitle = sf.name || sf.feature_name || 'Sub-factor';
          return {
            title: sf.label || formatFallbackString(rawSfTitle),
            description: sf.description || '',
            percentage: sf.percentage || 0,
            value: sf.weight != null ? sf.weight : (sf.percentage != null ? `${Math.round(sf.percentage)}%` : '-')
          };
        })
      };
    });
  }, [resultsData]);

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

  useEffect(() => {
    async function fetchPicture() {
      if (!demo?.user_id) return;
      try {
        const { getUserDocumentViewUri } = require('@/src/lib/api/userDocuments');
        
        try {
          const profilePic = await getUserDocumentViewUri(demo.user_id, 'profile_picture');
          if (profilePic) {
            setProfilePicUri(profilePic);
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
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF1F3', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialIcons name="keyboard-arrow-left" size={20} color="#113E55" />
        </Pressable>
        <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#113E55' }}>User Overview</Text>
        <Pressable
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#113E55', alignItems: 'center', justifyContent: 'center' }}
        >
          <MaterialIcons name="edit" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* @ts-ignore */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} delaysContentTouches={false}>
        
        {/* Profile Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, marginBottom: 24 }}>
          
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F6F7F7', alignItems: 'center', justifyContent: 'center' }}>
              <TotalUsersSvg width={14} height={14} color="#113E55" />
            </View>
            <View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 14, lineHeight: 14, color: '#113E55', marginBottom: 4 }}>
                {demo.display_name || demo.name || 'Unknown User'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 9, lineHeight: 11, color: '#8A9A9D' }}>
                  {demo.user_id ? 'Verified User' : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Avatar and Stats */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Dashed Avatar Circle */}
            <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ position: 'absolute', transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({ inputRange: [1, 1.03], outputRange: [1, 0.7] }) }}>
                <Svg width="120" height="120" viewBox="0 0 120 120">
                  <Circle cx="60" cy="60" r="52" stroke={accentColor} strokeWidth="8" strokeDasharray="2 6" fill="none" />
                </Svg>
              </Animated.View>
              <View style={{ backgroundColor: '#EEF0F2', borderRadius: 44, padding: 5 }}>
                {demo.avatar_url || profilePicUri ? (
                  <Image 
                    source={{ uri: demo.avatar_url || profilePicUri! }} 
                    style={{ width: 78, height: 78, borderRadius: 39 }} 
                  />
                ) : isFemale ? (
                  <GuestFemaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
                ) : (
                  <GuestMaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
                )}
              </View>
            </View>

            {/* Stats List */}
            <View style={{ flex: 1, gap: 16 }}>
              {/* Stat 1 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 3, backgroundColor: accentColor, borderRadius: 2 }} />
                <View>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 9, lineHeight: 9, color: '#878686', marginBottom: 2 }}>User Type</Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 11, lineHeight: 11, color: '#04162D', textTransform: 'capitalize' }}>
                    {demo.user_type || 'Unknown'}
                  </Text>
                </View>
              </View>

              {/* Stat 2 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 3, backgroundColor: accentColor, borderRadius: 2 }} />
                <View>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 9, lineHeight: 9, color: '#878686', marginBottom: 2 }}>Avg. Entries / Week</Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 11, lineHeight: 11, color: '#04162D' }}>
                    {demo.average_entry_per_week?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>

              {/* Stat 3 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 3, backgroundColor: accentColor, borderRadius: 2 }} />
                <View>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 9, lineHeight: 9, color: '#878686', marginBottom: 2 }}>Total Entries</Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 11, lineHeight: 11, color: '#04162D' }}>
                    {demo.total_entries || '0'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={{ marginBottom: 24 }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 9, lineHeight: 9, color: '#878686', textTransform: 'uppercase', marginBottom: 24 }}>
            RECENT ACTIVITY
          </Text>
          <ScrollView style={{ maxHeight: 258 }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
            <View style={{ position: 'relative' }}>
              {/* Dashed Line Background - starts from center of first card (top: 39) */}
              {(Array.isArray(historyData) ? historyData : historyData?.items)?.length > 0 ? (
                <Svg height={(Array.isArray(historyData) ? historyData : historyData?.items).length * 90} width="2" style={{ position: 'absolute', top: 39, left: 12, zIndex: 1 }}>
                  <Line x1="1" y1="0" x2="1" y2="100%" stroke="#878686" strokeWidth="1.4" strokeDasharray="2.8, 2.8" />
                </Svg>
              ) : null}
              
              <View style={{ gap: 12 }}>
              {(Array.isArray(historyData) ? historyData : historyData?.items)?.length > 0 ? (
                (Array.isArray(historyData) ? historyData : historyData?.items).map((record: any, index: number) => {
                  const isHigh = record.severity?.toLowerCase() === 'high';
                  const d = new Date(record.validated_at);
                  const timeString = isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateString = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();

                  return (
                    <View key={`history-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                      <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.4, borderColor: '#8A9A9D', backgroundColor: '#F6F7F7', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#8A9A9D' }} />
                      </View>
                      <View style={{ flex: 1, height: 78, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'space-between' }}>
                        <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
                          {timeString} • {dateString}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-SemiBold', fontSize: 22, lineHeight: 22, color: '#113E55' }}>
                            {record.validated_code || 'N/A'}
                          </Text>
                          <View style={{ backgroundColor: isHigh ? '#FEE2E2' : '#E0F2F1', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }}>
                            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: isHigh ? '#ED0808' : '#1B998B', textTransform: 'capitalize' }}>
                              {record.severity || 'Normal'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
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
            style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingVertical: 16 }}
          >
            <Image 
              source={require('@/src/assets/images/logo.png')} 
              style={{ width: 64, height: 64, marginBottom: 12 }} 
              resizeMode="contain" 
            />
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D', textAlign: 'center', lineHeight: 20 }}>
              Tap to generate AI Insight on{'\n'}your report
            </Text>
          </Pressable>
        ) : aiState === 'loading' ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingVertical: 16 }}>
             <ActivityIndicator size="large" color="#113E55" />
             <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D', marginTop: 12 }}>
                Analyzing case details...
             </Text>
          </View>
        ) : aiState === 'forbidden' ? (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EFF1F3', marginBottom: 32, overflow: 'hidden' }}>
            <View style={{ position: 'relative' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#113E55' }}>AI Summary</Text>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF1F3', alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialCommunityIcons name="arrow-expand-all" size={16} color="#113E55" />
                </View>
              </View>
              <Text allowFontScaling={false} numberOfLines={3} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#8A9A9D', lineHeight: 20 }}>
                This section provides a detailed summary of the anomalous behavior detected for this user. It breaks down the key factors contributing to the anomaly, including unusual entry times, late-night activity, and irregular visitor patterns over the selected timeframe.
              </Text>
              
              {/* Blur Overlay */}
              <View style={{ position: 'absolute', top: -5, left: -5, right: -5, bottom: -5, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: 24 }}>
                <MaterialIcons name="lock-outline" size={24} color="#113E55" style={{ marginBottom: 8 }} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 13, color: '#113E55', textAlign: 'center', paddingHorizontal: 20, marginBottom: 4 }}>
                  AI Summary Locked
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 11, color: '#8A9A9D', textAlign: 'center', paddingHorizontal: 20 }}>
                  Purchase the AI Summary add-on from the marketplace to unlock insights.
                </Text>
              </View>
            </View>
          </View>
        ) : aiState === 'error' ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 32, paddingVertical: 16 }}>
             <MaterialIcons name="error-outline" size={32} color="#ED0808" />
             <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D', marginTop: 12 }}>
                Failed to generate summary. Please try again.
             </Text>
          </View>
        ) : (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EFF1F3', marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#113E55' }}>AI Summary</Text>
              <Pressable style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF1F3', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="arrow-expand-all" size={16} color="#113E55" />
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
               <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                 <MaterialIcons name="schedule" size={12} color="#F46036" />
                 <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 10, color: '#F46036' }}>
                   {summaryData?.summary?.read_time || '2 mins Read'}
                 </Text>
               </View>
               <Pressable onPress={() => setShowAiSummaryModal(true)} style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                 <MaterialIcons name="security" size={12} color="#1B998B" />
                 <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 10, color: '#1B998B' }}>Read Fully</Text>
               </Pressable>
            </View>
            <Text allowFontScaling={false} numberOfLines={3} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#8A9A9D', lineHeight: 20 }}>
              {summaryData?.tier2?.executive_summary || summaryData?.tier1?.executive_summary || 'No summary available for this user.'}
            </Text>
          </View>
        )}

        {/* Anomaly Overview Section */}
        <View style={{ marginBottom: 32 }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 24, color: '#113E55', marginBottom: 4 }}>
            ANOMALY OVERVIEW
          </Text>
          <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 16, color: '#8A9A9D', marginBottom: 40 }}>
            Actual VS Expected Data Chart
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            {(() => {
              const spider = resultsData?.anomaly_overview?.spider_plot;
              if (spider && spider.length > 0) {
                return (
                  <AnomalyRadarChart 
                    size={280} 
                    labels={spider.map((p: any) => {
                      if (p.label) return p.label;
                      const raw = p.name || p.feature_name || 'Unknown';
                      return raw.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
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
                        strokeColor: '#F25B2A', // Instance is redish
                        fillColor: 'rgba(242, 91, 42, 0.28)',
                        dotColor: '#F25B2A',
                      }
                    ]}
                  />
                );
              } else {
                return <AnomalyRadarChart size={280} />;
              }
            })()}
          </View>

          <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 18, color: '#113E55', marginBottom: 20 }}>
            These are the top contributing factors
          </Text>

          {/* Pill tags */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {(() => {
              const factors = resultsData?.anomaly_overview?.contributing_factors;
              const topFactors = factors ? [...factors].sort((a: any, b: any) => (b.percentage || 0) - (a.percentage || 0)).slice(0, 4) : [];
              
              if (topFactors && topFactors.length > 0 && factors) {
                return topFactors.map((factor: any, index: number) => {
                  const PALETTE = [
                    { text: '#F25B2A', bg: '#FFF0F0' },
                    { text: '#113E55', bg: '#E3EDF2' },
                    { text: '#D97706', bg: '#FEF3C7' },
                    { text: '#1B998B', bg: '#E5F5F3' },
                    { text: '#7C3AED', bg: '#F3E8FF' },
                    { text: '#78350F', bg: '#F0E6E1' },
                  ];
                  const colorSet = PALETTE[index % PALETTE.length];

                  return (
                    <View key={`factor-${index}`} style={{ flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: colorSet.bg, gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorSet.text }} />
                      <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 11.5, color: colorSet.text }}>
                        {(() => {
                          if (factor.label) return factor.label;
                          const rawName = factor.name || factor.feature_name || 'Unknown';
                          return rawName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        })()}
                      </Text>
                    </View>
                  );
                });
              } else {
                return (
                  <View>
                    <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
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
      <AISummaryModal visible={showAiSummaryModal} onClose={() => setShowAiSummaryModal(false)} summaryData={summaryData} />
    </SafeAreaView>
  );
}
