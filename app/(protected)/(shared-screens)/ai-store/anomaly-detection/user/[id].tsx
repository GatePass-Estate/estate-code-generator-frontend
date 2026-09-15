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
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useAnomalyCaseDemographic, useAnomalyCaseHistory, useAnomalyCaseSummary, useAnomalyCaseResults } from '@/src/hooks/useAnomalyQueries';

export default function AnomalyDetectionUserDetailsScreen() {
  const { id } = useLocalSearchParams();
  const estateId = useAuthStore((s: any) => s.user?.estate_id || '');
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'loaded' | 'forbidden' | 'error'>('idle');
  const [showAiSummaryModal, setShowAiSummaryModal] = useState(false);
  const [selectedGaugeIndex, setSelectedGaugeIndex] = useState<number | null>(null);
  
  const { data: rawDemographic } = useAnomalyCaseDemographic(estateId, id as string);
  const { data: rawHistoryData } = useAnomalyCaseHistory(estateId, id as string);
  const { data: rawResultsData } = useAnomalyCaseResults(estateId, id as string);
  
  const { refetch: fetchSummary, data: summaryData } = useAnomalyCaseSummary(estateId, id as string, false);

  const demographic = rawDemographic || {};
  const historyData = rawHistoryData || {};
  const resultsData = rawResultsData || {};

  const demo = demographic?.demographic || {};
  const isGuest = demo.user_type?.toLowerCase() === 'guest';
  const isFemale = demo.gender?.toLowerCase() === 'female';
  const accentColor = isGuest ? '#113E55' : '#F25B2A';

  const gaugeList = useMemo(() => {
    const factors = resultsData?.anomaly_overview?.contributing_factors;
    if (!factors || factors.length === 0) return [];
    return factors.map((factor: any) => {
      const percentage = factor.percentage || 0;
      let color = '#1B998B';
      if (percentage >= 20 && percentage < 60) color = '#D97706';
      if (percentage >= 60) color = '#E81616';

      const rawTitle = factor.name || factor.feature_name || 'Unknown Factor';
      const formattedTitle = rawTitle.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      return {
        title: formattedTitle,
        percentage,
        color,
        records: 0,
        days: 0,
        items: (factor.sub_factors || []).map((sf: any) => ({
          title: sf.feature_name || 'Sub-factor',
          percentage: sf.percentage || 0
        }))
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Profile Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, marginBottom: 24 }}>
          
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#F6F7F7', alignItems: 'center', justifyContent: 'center' }}>
              <TotalUsersSvg width={14} height={14} color="#113E55" />
            </View>
            <View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 14, lineHeight: 14, color: '#113E55', marginBottom: 4 }}>
                {demo.name || 'Unknown User'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 9, lineHeight: 11, color: '#8A9A9D' }}>
                  {demo.date_start ? new Date(demo.date_start).toLocaleDateString() : 'N/A'}
                </Text>
                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#8A9A9D' }} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 9, lineHeight: 11, color: '#8A9A9D' }}>
                  {demo.date_end ? new Date(demo.date_end).toLocaleDateString() : 'N/A'}
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
                {isGuest ? (
                  isFemale ? (
                    <GuestFemaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
                  ) : (
                    <GuestMaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
                  )
                ) : (
                  <Image 
                    source={{ uri: demo.avatar_url || 'https://i.pravatar.cc/150?img=11' }} 
                    style={{ width: 78, height: 78, borderRadius: 39 }} 
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
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 9, lineHeight: 9, color: '#878686', marginBottom: 2 }}>Average Entry Time</Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 11, lineHeight: 11, color: '#04162D' }}>
                    {demo.average_entry_time || '--:--'}
                  </Text>
                </View>
              </View>

              {/* Stat 3 */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 3, backgroundColor: accentColor, borderRadius: 2 }} />
                <View>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 9, lineHeight: 9, color: '#878686', marginBottom: 2 }}>Total Entry Times</Text>
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 11, lineHeight: 11, color: '#04162D' }}>
                    {demo.total_entry_time || '0'}
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
          <View style={{ position: 'relative' }}>
            {/* Dashed Line Background - starts from center of first card (top: 51) */}
            {historyData?.history && historyData.history.length > 0 && (
              <Svg height={historyData.history.length * 90} width="2" style={{ position: 'absolute', top: 51, left: 12, zIndex: 1 }}>
                <Line x1="1" y1="0" x2="1" y2="100%" stroke="#878686" strokeWidth="1.4" strokeDasharray="2.8, 2.8" />
              </Svg>
            )}
            
            <View style={{ gap: 12 }}>
              {historyData?.history && historyData.history.length > 0 ? (
                historyData.history.map((record: any, index: number) => {
                  const isHigh = record.severity?.toLowerCase() === 'high';
                  return (
                    <View key={`history-${index}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
                      <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.4, borderColor: '#8A9A9D', backgroundColor: '#F6F7F7', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#8A9A9D' }} />
                      </View>
                      <View style={{ flex: 1, height: 78, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, justifyContent: 'space-between' }}>
                        <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
                          {record.time} • {new Date(record.date).toLocaleDateString()}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-SemiBold', fontSize: 22, lineHeight: 22, color: '#113E55' }}>
                            {record.code || 'N/A'}
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
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
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
              {summaryData?.summary?.text || 'No summary available for this user.'}
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
              if (spider && spider.length > 0 && !spider.every((p: any) => (!p.percentage || p.percentage === 0) && (!p.normal_value || p.normal_value === 0))) {
                return (
                  <AnomalyRadarChart 
                    size={280} 
                    labels={spider.map((p: any) => p.feature_name || '')}
                    series={[
                      {
                        data: spider.map((p: any) => p.normal_value || 0),
                        strokeColor: '#F25B2A',
                        fillColor: 'rgba(242, 91, 42, 0.28)',
                        dotColor: '#F25B2A',
                      },
                      {
                        data: spider.map((p: any) => p.percentage || 0),
                        strokeColor: '#1B998B',
                        fillColor: 'rgba(27, 153, 139, 0.28)',
                        dotColor: '#1B998B',
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
              const topFactors = resultsData?.anomaly_overview?.top_contributing_factors;
              const factors = resultsData?.anomaly_overview?.contributing_factors;
              
              if (topFactors && topFactors.length > 0 && factors && !factors.every((f: any) => !f.percentage || f.percentage === 0)) {
                return topFactors.map((factor: any, index: number) => {
                  const colors = ['#F46036', '#1B998B', '#113E55', '#D97706'];
                  const bgs = ['rgba(244, 96, 54, 0.2)', 'rgba(27, 153, 139, 0.2)', 'rgba(17, 62, 85, 0.2)', 'rgba(217, 119, 6, 0.2)'];
                  const color = colors[index % colors.length];
                  const bg = bgs[index % bgs.length];

                  return (
                    <View key={`factor-${index}`} style={{ flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: bg, gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
                      <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 11.5, color: color }}>
                        {factor.feature_name?.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Unknown'}
                      </Text>
                    </View>
                  );
                });
              } else {
                return (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: 'rgba(244, 96, 54, 0.2)', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#F46036' }} />
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 11.5, color: '#F46036' }}>Unusual Entry Time</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: 'rgba(27, 153, 139, 0.2)', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1B998B' }} />
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 11.5, color: '#1B998B' }}>Late Night Entry</Text>
                </View>
              </>
                );
              }
            })()}
          </View>

          {/* Gauge Cards */}
          <View style={{ gap: 16 }}>
            {gaugeList.length > 0 ? (
              gaugeList.map((gauge: any, index: number) => (
                <Pressable key={`gauge-${index}`} onPress={() => setSelectedGaugeIndex(index)} style={{ width: '100%', minHeight: 136, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, justifyContent: 'space-between', flexDirection: 'column', alignSelf: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#EFF1F3' }}>
                  {/* Top Row: Title */}
                  <View className="flex-row items-center gap-2" style={{ marginLeft: 16 }}>
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: gauge.color }} />
                    <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 14, lineHeight: 14, color: '#0A1F29' }}>{gauge.title}</Text>
                  </View>
                  {/* Bottom Row: Percentage and Gauge */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
                    <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 34.18, lineHeight: 34.18, letterSpacing: 0, color: '#0A1F29', marginBottom: -4, marginLeft: 16 }}>{gauge.percentage}%</Text>
                    <View style={{ position: 'relative', top: 4 }}>
                      <SemiCircleGauge percentage={gauge.percentage} color={gauge.arcColor || gauge.color} size={130} animate={true} />
                    </View>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
                No gauges found.
              </Text>
            )}
          </View>

          {/* Load More */}
          <Pressable style={{ alignItems: 'center', marginTop: 32, marginBottom: 20 }}>
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 14, color: '#113E55' }}>Load More</Text>
          </Pressable>
          
        </View>

      </ScrollView>
      
      {/* Modals */}
      <AISummaryModal visible={showAiSummaryModal} onClose={() => setShowAiSummaryModal(false)} />
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
    </SafeAreaView>
  );
}
