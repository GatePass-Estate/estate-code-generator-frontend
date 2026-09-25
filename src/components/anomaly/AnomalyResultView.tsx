import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  Image
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { router } from 'expo-router';
import {
  MaterialIcons,
  Ionicons,
  MaterialCommunityIcons,
} from '@expo/vector-icons';
import AnomalyRadarChart from './AnomalyRadarChart';
import AnomalyDonutChart from './AnomalyDonutChart';
import SemiCircleGauge from './SemiCircleGauge';
import FilterModal, { Severity, Gender, UserType } from './modals/FilterModal';
import OrderModal from './modals/OrderModal';
import GaugeDetailModal, { GaugeData } from './modals/GaugeDetailModal';
import DatePickerModal from './modals/DatePickerModal';
import TimeframeModal from './modals/TimeframeModal';
import EstateSvg from '@/src/assets/icons/estate.svg';
import { useUserStore } from '@/src/lib/stores/userStore';
import { useAnomalyOverview, useAnomalyPredictions } from '@/src/hooks/useAnomalyQueries';
import LocationSvg from '@/src/assets/icons/location.svg';
import TotalUsersSvg from '@/src/assets/icons/totalusers.svg';
import UserWarningSvg from '@/src/assets/icons/userwarning.svg';
import AlertSvg from '@/src/assets/icons/alert.svg';
import UpAndDownSvg from '@/src/assets/icons/upanddown.svg';
import ExportSvg from '@/src/assets/images/export.svg';


export default function AnomalyResultView({ isActive = true }: { isActive?: boolean }) {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [timeframeVisible, setTimeframeVisible] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Last Week');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => new Date());
  const [activeEvidenceDot, setActiveEvidenceDot] = useState(0);
  const [sortAscending, setSortAscending] = useState(false);
  const [gaugesInView, setGaugesInView] = useState(false);
  const [gaugeSectionLayout, setGaugeSectionLayout] = useState<{ y: number; height: number } | null>(null);
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
    const parts = addr.split(',').map(p => p.trim()).filter(p => p.length > 0);
    return parts.length > 0 ? parts[0] : 'N/A';
  };
  const { data: rawOverview, isLoading: overviewLoading, isError: overviewError } = useAnomalyOverview(
    estate_id,
    startDate ? startDate.toISOString() : undefined,
    endDate ? endDate.toISOString() : undefined
  );
  
  const { data: rawPredictions, isLoading: predictionsLoading, isFetching: predictionsFetching } = useAnomalyPredictions(
    estate_id,
    {
      from_date: startDate ? startDate.toISOString() : undefined,
      to_date: endDate ? endDate.toISOString() : undefined,
      severity: filterSeverity.length > 0 ? filterSeverity.map(s => s.toLowerCase()) : undefined,
      gender: filterGender.length > 0 ? filterGender : undefined,
      user_type: filterUserType.length > 0 ? filterUserType.map(u => u.toLowerCase()) : undefined,
      sort_order: sortAscending ? 'asc' : 'desc',
      limit: paginationLimit,
      page: 1,
    }
  );

  const isLoading = overviewLoading || predictionsLoading;
  const overview = rawOverview;

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
  const gaugeList: GaugeData[] = React.useMemo(() => {
    const factors = overview?.anomaly_overview?.contributing_factors || overview?.anomaly_overview?.top_contributing_factors;
    if (!factors || factors.length === 0) return [];
    
    const colors = ['#F46036', '#1B998B', '#113E55', '#D97706'];
    
    const formatFallbackString = (str: string) => {
      if (!str) return '';
      return str.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return factors.map((factor: any, index: number) => {
      const percentage = factor.percentage || 0;
      const themeColor = colors[index % colors.length];

      const factorName = factor.name || factor.feature_name;
      const rawTitle = factorName || 'Unknown Factor';
      const formattedTitle = factor.label || formatFallbackString(rawTitle);

      const weight = factor.weight;
      const formattedWeight = weight != null ? `${Number(weight).toFixed(weight === 0 ? 0 : 2)}%` : '-';

      return {
        title: formattedTitle,
        description: factor.description || 'What it does not do It does not block the gate, replace human judgment, or treat every unfamiliar',
        percentage,
        weightLabel: formattedWeight,
        color: themeColor,
        arcColor: themeColor,
        records: totalRecords,
        days: selectedDays,
        items: (factor.sub_factors || []).map((sf: any) => {
          const rawSfTitle = sf.name || sf.feature_name || 'Sub-factor';
          return {
            title: sf.label || formatFallbackString(rawSfTitle),
            description: sf.description || '',
            percentage: sf.percentage || 0,
            value: sf.weight != null ? sf.weight : '-'
          };
        })
      };
    });
  }, [overview, totalRecords, selectedDays]);

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
    Alert.alert('Coming Soon', 'This feature is not yet active.');
  };

  const handleCycleRange = () => {
    setTimeframeVisible(true);
  };

  const selectedRangeText = selectedTimeframe === 'Custom' && startDate && endDate 
    ? `${startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
    : selectedTimeframe;

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F6F7F7', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#113E55" />
      </View>
    );
  }

  const predictions = (rawPredictions?.items || []).slice(0, paginationLimit);

  return (
    <Animated.View
      entering={FadeIn.duration(260)}
      style={{ flex: 1, backgroundColor: '#F6F7F7' }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
      {/* Title & Export Row */}
      <View className="flex-row items-start justify-between mb-1.5">
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'UbuntuSans-Medium',
              fontWeight: '500',
              fontSize: 27.34,
              lineHeight: 27.34,
              letterSpacing: 0,
              textAlign: 'left',
              color: '#113E55',
              width: 259,
            }}
          >
            Your Anomaly{'\n'}Detection{'\n'}Summary
          </Text>
        </View>
        <Pressable
          onPress={handleExport}
          style={{
            minWidth: 100,
            minHeight: 44,
            paddingHorizontal: 20,
            maxWidth: 278,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#113E55',
            backgroundColor: '#113E55',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: 1,
          }}
          hitSlop={8}
        >
          <ExportSvg width={18} height={18} />
          <Text allowFontScaling={false} className="text-[13px] font-inter-medium text-white">Export</Text>
        </Pressable>
      </View>

      {/* Range Dropdown */}
      <Pressable
        onPress={handleCycleRange}
        style={{
          minWidth: 93,
          minHeight: 28,
          borderRadius: 8,
          paddingTop: 4,
          paddingRight: 8,
          paddingBottom: 4,
          paddingLeft: 8,
          gap: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 1,
          marginBottom: 20,
          alignSelf: 'flex-start',
        }}
        hitSlop={8}
      >
        <Text allowFontScaling={false} className="text-[12px] font-inter-medium text-[#113E55]">{selectedRangeText}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={16} color="#113E55" />
      </Pressable>

      {/* Name & Location Chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginBottom: 16 }}>
        {/* Name Card */}
        <View
          style={{
            flex: 1,
            minHeight: 61,
            borderRadius: 16,
            paddingTop: 16,
            paddingRight: 10,
            paddingBottom: 16,
            paddingLeft: 10,
            gap: 7,
            opacity: 1,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#EFF1F3',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <EstateSvg width={28} height={28} />
          <View style={{ justifyContent: 'center' }}>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 10,
                color: '#8A9A9D',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                lineHeight: 12,
              }}
            >
              NAME
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 11.2,
                color: '#0A1F29',
                lineHeight: 12,
                letterSpacing: 0,
              }}
              numberOfLines={1}
            >
              {overview?.demographic?.estate_name || userEstateName || 'Unknown Estate'}
            </Text>
          </View>
        </View>

        {/* Location Card */}
        <View
          style={{
            flex: 1,
            minHeight: 61,
            borderRadius: 16,
            paddingTop: 16,
            paddingRight: 10,
            paddingBottom: 16,
            paddingLeft: 10,
            gap: 7,
            opacity: 1,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#EFF1F3',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <LocationSvg width={28} height={28} />
          <View style={{ justifyContent: 'center' }}>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 10,
                color: '#8A9A9D',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                lineHeight: 12,
              }}
            >
              LOCATION
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 11.2,
                color: '#04162D',
                lineHeight: 12,
                letterSpacing: 0,
              }}
              numberOfLines={1}
            >
              {getShortLocation()}
            </Text>
          </View>
        </View>
      </View>

      {/* Total Users Card */}
      <View
        style={{
          width: '100%',
          minHeight: 178,
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#EFF1F3',
          paddingTop: 12,
          paddingHorizontal: 14,
          paddingBottom: 22,
          marginBottom: 20,
          opacity: 1,
        }}
      >
        {/* Header: Icon + Total Users text with clear separation */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 9,
          }}
        >
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
            <TotalUsersSvg width={13} height={13} />
          </View>
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontFamily: 'Inter_18pt-Medium',
              color: '#113E55',
              lineHeight: 18,
              letterSpacing: 0,
            }}
          >
            Total Users
          </Text>
        </View>

        {/* Chart + Legend Row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {/* Lined Animated Donut Chart */}
          <View
            style={{
              width: 114,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4,
            }}
          >
            <AnomalyDonutChart 
              size={106} 
              isActive={isActive} 
              countText={(overview?.demographic?.total_users || 0).toString()} 
              residentPercentage={overview?.demographic?.ratio?.resident?.percentage || 0}
              guestPercentage={overview?.demographic?.ratio?.guest?.percentage || 0}
              securityPercentage={overview?.demographic?.ratio?.security?.percentage || 0}
              residentCount={overview?.demographic?.ratio?.resident?.count || 0}
              guestCount={overview?.demographic?.ratio?.guest?.count || 0}
              securityCount={overview?.demographic?.ratio?.security?.count || 0}
            />
          </View>

          {/* Legend Items */}
          <View style={{ marginLeft: 22, gap: 10, justifyContent: 'center' }}>
            {/* Guest */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 2,
                  height: 23,
                  borderRadius: 1,
                  backgroundColor: '#F25B2A',
                  marginRight: 9,
                  opacity: 1,
                }}
              />
              <View>
                <Text
                  style={{
                    fontSize: 11.2,
                    fontFamily: 'Inter_18pt-Regular',
                    color: '#113E55',
                    lineHeight: 14,
                    letterSpacing: 0,
                  }}
                >
                  Guest
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <Text
                    style={{
                      minWidth: 44,
                      fontSize: 9.5,
                      fontFamily: 'Inter_18pt-Medium',
                      color: '#878686',
                      lineHeight: 12,
                    }}
                  >
                    {overview?.demographic?.ratio?.guest?.percentage || 0}%
                  </Text>
                  <Text
                    style={{
                      fontSize: 9.5,
                      fontFamily: 'Inter_18pt-Medium',
                      color: '#878686',
                      lineHeight: 12,
                    }}
                  >
                    {overview?.demographic?.ratio?.guest?.count || 0} Users
                  </Text>
                </View>
              </View>
            </View>

            {/* Resident */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 2,
                  height: 23,
                  borderRadius: 1,
                  backgroundColor: '#113E55',
                  marginRight: 9,
                  opacity: 1,
                }}
              />
              <View>
                <Text
                  style={{
                    fontSize: 11.2,
                    fontFamily: 'Inter_18pt-Regular',
                    color: '#113E55',
                    lineHeight: 14,
                    letterSpacing: 0,
                  }}
                >
                  Resident
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <Text
                    style={{
                      minWidth: 44,
                      fontSize: 9.5,
                      fontFamily: 'Inter_18pt-Medium',
                      color: '#878686',
                      lineHeight: 12,
                    }}
                  >
                    {overview?.demographic?.ratio?.resident?.percentage || 0}%
                  </Text>
                  <Text
                    style={{
                      fontSize: 9.5,
                      fontFamily: 'Inter_18pt-Medium',
                      color: '#878686',
                      lineHeight: 12,
                    }}
                  >
                    {overview?.demographic?.ratio?.resident?.count || 0} Users
                  </Text>
                </View>
              </View>
            </View>

            {/* Security */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 2,
                  height: 23,
                  borderRadius: 1,
                  backgroundColor: '#1B998B',
                  marginRight: 9,
                  opacity: 1,
                }}
              />
              <View>
                <Text
                  style={{
                    fontSize: 11.2,
                    fontFamily: 'Inter_18pt-Regular',
                    color: '#113E55',
                    lineHeight: 14,
                    letterSpacing: 0,
                  }}
                >
                  Security
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <Text
                    style={{
                      minWidth: 44,
                      fontSize: 9.5,
                      fontFamily: 'Inter_18pt-Medium',
                      color: '#878686',
                      lineHeight: 12,
                    }}
                  >
                    {overview?.demographic?.ratio?.security?.percentage || 0}%
                  </Text>
                  <Text
                    style={{
                      fontSize: 9.5,
                      fontFamily: 'Inter_18pt-Medium',
                      color: '#878686',
                      lineHeight: 12,
                    }}
                  >
                    {overview?.demographic?.ratio?.security?.count || 0} Users
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Anomalous & High Risk Events Cards (Dark Navy) */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
        {/* Anomalous Events */}
        <View
          style={{
            flex: 1,
            minHeight: 120,
            borderRadius: 16,
            backgroundColor: '#113E55',
            paddingTop: 16,
            paddingBottom: 16,
            paddingHorizontal: 16,
            justifyContent: 'space-between',
            opacity: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 11.2,
                color: '#CEE5ED',
                lineHeight: 14,
                letterSpacing: 0,
              }}
            >
              Anomalous{'\n'}Events
            </Text>
            <UserWarningSvg width={44} height={44} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text
              style={{
                fontFamily: 'UbuntuSans-Medium',
                fontSize: 34.18,
                lineHeight: 34.18,
                color: '#FFFFFF',
                letterSpacing: 0,
                textAlign: 'center',
              }}
            >
              {overview?.demographic?.total_anomalous_instances || 0}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 11.2,
                lineHeight: 14,
                color: '#CEE5ED',
                letterSpacing: 0,
                opacity: 1,
              }}
            >
              EVENTS
            </Text>
          </View>
        </View>

        {/* High Risk Events */}
        <View
          style={{
            flex: 1,
            minHeight: 120,
            borderRadius: 16,
            backgroundColor: '#113E55',
            paddingTop: 16,
            paddingBottom: 16,
            paddingHorizontal: 16,
            justifyContent: 'space-between',
            opacity: 1,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 11.2,
                color: '#CEE5ED',
                lineHeight: 14,
                letterSpacing: 0,
              }}
            >
              High Risk{'\n'}Events
            </Text>
            <AlertSvg width={44} height={44} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text
              style={{
                fontFamily: 'UbuntuSans-Medium',
                fontSize: 34.18,
                lineHeight: 34.18,
                color: '#FFFFFF',
                letterSpacing: 0,
                textAlign: 'center',
              }}
            >
              {overview?.demographic?.total_high_risk_instances || 0}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 11.2,
                lineHeight: 14,
                color: '#CEE5ED',
                letterSpacing: 0,
                opacity: 1,
              }}
            >
              EVENTS
            </Text>
          </View>
        </View>
      </View>

      {/* USER OVERVIEW Section */}
      <View style={{ marginBottom: 32, marginTop: 24 }}>
        {/* Alignment Row: width 333, height 36, left 22 */}
        <View
          style={{
            width: '100%',
            maxWidth: 333,
            height: 36,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            alignSelf: 'center',
            marginBottom: 16,
            opacity: 1,
          }}
        >
          <Text
            style={{
              width: 173,
              height: 26,
              fontFamily: 'UbuntuSans-SemiBold',
              fontWeight: '600',
              fontSize: 21.88,
              lineHeight: 26,
              letterSpacing: 0,
              color: '#113E55',
              opacity: 1,
            }}
          >
            USER OVERVIEW
          </Text>
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={{
              width: 52,
              height: 36,
              borderRadius: 16,
              backgroundColor: '#113E55',
              paddingTop: 4,
              paddingRight: 16,
              paddingBottom: 4,
              paddingLeft: 16,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: 1,
            }}
            hitSlop={8}
          >
            <Ionicons name="options-outline" size={18} color="white" />
          </Pressable>
        </View>

        {/* Table: width 100%, minHeight 350, border-radius 16, padding-top/bottom 16, gap 14 */}
        <View
          style={{
            width: '100%',
            minHeight: predictions.length === 0 ? 150 : 350,
            alignSelf: 'center',
            borderRadius: 16,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#EFF1F3',
            paddingTop: 16,
            paddingBottom: 16,
            paddingHorizontal: 16,
            gap: 14,
            opacity: 1,
            justifyContent: 'space-between',
          }}
        >
          {/* Header Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 10,
              borderBottomWidth: 1,
              borderBottomColor: '#F0F2F4',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_18pt-Medium',
                fontWeight: '500',
                fontSize: 8.96,
                lineHeight: 11,
                letterSpacing: 0,
                color: '#8A9A9D',
                width: 32,
              }}
            >
              RANK
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Medium',
                fontWeight: '500',
                fontSize: 8.96,
                lineHeight: 11,
                letterSpacing: 0,
                color: '#8A9A9D',
                flex: 1,
                marginLeft: 8,
              }}
            >
              USER
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Medium',
                fontWeight: '500',
                fontSize: 8.96,
                lineHeight: 11,
                letterSpacing: 0,
                color: '#8A9A9D',
                width: 90,
                textAlign: 'center',
              }}
            >
              SEVERITY
            </Text>
            <Pressable
              onPress={() => setOrderModalVisible(true)}
              hitSlop={8}
              style={{ width: 25, height: 25, alignItems: 'center', justifyContent: 'center' }}
            >
              <UpAndDownSvg width={25} height={25} />
            </Pressable>
          </View>

          {/* User Rows */}
          {predictions.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
                No suspicious users detected.
              </Text>
            </View>
          ) : (
            predictions.map((row: any, index: number) => {
              const severityStr = (row.severity || 'LOW').toUpperCase();
              let badgeBg = 'bg-[#E4F4F0]';
              let badgeText = 'text-[#2B9B84]';
              if (severityStr === 'HIGH') {
                badgeBg = 'bg-[#FDECEC]';
                badgeText = 'text-[#E12828]';
              } else if (severityStr === 'MEDIUM' || severityStr === 'MED') {
                badgeBg = 'bg-[#FCF6E3]';
                badgeText = 'text-[#B68A13]';
              }

              return (
                <Pressable
                  key={row.prediction_id || row.id || index}
                  onPress={() =>
                    router.push(`/(protected)/(shared-screens)/ai-store/anomaly-detection/user/${row.prediction_id || row.id}?gender=${row.gender || ''}&user_type=${row.user_type || row.role || ''}&display_name=${encodeURIComponent(row.display_name || row.name || '')}&date_from=${startDate ? startDate.toISOString() : ''}&date_to=${endDate ? endDate.toISOString() : ''}`)
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_18pt-Regular',
                      fontSize: 11.2,
                      color: '#8A9A9D',
                      width: 32,
                      marginLeft: 12,
                    }}
                  >
                    {index + 1}
                  </Text>
                  


                  <View style={{ flex: 1, marginLeft: 2 }}>
                    <Text
                      style={{
                        fontFamily: 'Inter_18pt-Regular',
                        fontSize: 13,
                        color: '#113E55',
                      }}
                    >
                      {row.display_name || row.name || 'Unknown User'}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Inter_18pt-Regular',
                        fontSize: 10.5,
                        color: '#8A9A9D',
                        textTransform: 'capitalize',
                      }}
                    >
                      {(row.user_type || row.role || 'Guest').toLowerCase() === 'visitor'
                        ? 'Guest'
                        : row.user_type || row.role || 'Guest'}
                    </Text>
                  </View>
                  <View style={{ width: 90, alignItems: 'center' }}>
                    <View className={`px-4 py-1.5 rounded-full ${badgeBg}`}>
                      <Text allowFontScaling={false} className={`text-[12px] font-inter-semibold ${badgeText}`}>
                        {severityStr}
                      </Text>
                    </View>
                  </View>
                  <View style={{ width: 25, alignItems: 'center' }}>
                    <MaterialIcons name="chevron-right" size={18} color="#8A9A9D" />
                  </View>
                </Pressable>
              );
            })
          )}

          {/* Load More */}
          {predictions.length > 0 && predictions.length < (rawPredictions?.total || 0) && (
            <Pressable onPress={() => setPaginationLimit(l => l + 5)} style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 16 }} hitSlop={8} disabled={predictionsFetching}>
              {predictionsFetching ? (
                <ActivityIndicator size="small" color="#113E55" />
              ) : (
                <Text
                  style={{
                    fontFamily: 'UbuntuSans-SemiBold',
                    fontSize: 14,
                    color: '#113E55',
                  }}
                >
                  Load More
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>

      {/* ANOMALY OVERVIEW Section */}
      <View className="mb-8">
        <Text
          style={{
            fontFamily: 'UbuntuSans-SemiBold',
            fontSize: 21.88,
            lineHeight: 21.88,
            color: '#0A1F29',
            marginBottom: 2,
          }}
        >
          ANOMALY OVERVIEW
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_18pt-Light',
            fontSize: 14,
            lineHeight: 14,
            color: '#878686',
            marginBottom: 32,
          }}
        >
          Normal/Expected Data Chart
        </Text>

        {/* Radar Chart */}
        <View className="items-center justify-center my-2 relative">
          {(() => {
            const spider = overview?.anomaly_overview?.spider_plot;
            if (spider && spider.length > 0) {
              return (
            <AnomalyRadarChart 
              labels={overview.anomaly_overview.spider_plot.map((p: any) => {
                if (p.label) return p.label;
                const raw = p.name || p.feature_name || 'Unknown';
                return raw.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              })}
              series={[
                {
                  data: overview.anomaly_overview.spider_plot.map((p: any) => p.percentage || 0),
                  strokeColor: '#1B998B',
                  fillColor: 'rgba(27, 153, 139, 0.28)',
                  dotColor: '#1B998B',
                }
              ]}
            />
              );
            } else {
              return (
                <View className="items-center justify-center">
                  <AnomalyRadarChart />
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 13, color: '#8A9A9D' }}>No anomaly data plotted</Text>
                  </View>
                </View>
              );
            }
          })()}
        </View>

        {/* Contributing Factors */}
        <Text
          style={{
            fontFamily: 'Inter_18pt-Medium',
            fontSize: 14,
            lineHeight: 14,
            color: '#0A1F29',
            marginTop: 32,
            marginBottom: 24,
          }}
        >
          These are the top contributing factors
        </Text>

        {/* Factor Chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {(() => {
            const topFactors = overview?.anomaly_overview?.top_contributing_factors;
            if (topFactors && topFactors.length > 0) {
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
                        const raw = factor.name || factor.feature_name || 'Unknown';
                        return raw.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                      })()}
                    </Text>
                  </View>
                );
              });
            } else {
              return (
                <Text style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>No top factors identified yet.</Text>
              );
            }
          })()}
        </View>

        {/* Semi-Circle Gauges */}
        <View onLayout={(e) => setGaugeSectionLayout(e.nativeEvent.layout)}>
          {gaugeList.length > 0 ? (
            <>
              {gaugeList.slice(0, gaugeLimit).map((gauge, index) => (
                <Pressable key={`gauge-${index}`} onPress={() => setSelectedGaugeIndex(index)} style={{ width: '100%', minHeight: 180, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignSelf: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#EFF1F3' }}>
                  {/* Gauge Centered */}
                  <View style={{ alignItems: 'center', marginBottom: 24 }}>
                    <SemiCircleGauge percentage={gauge.percentage} color={gauge.arcColor || gauge.color} size={150} animate={gaugesInView} />
                  </View>
                  
                  {/* Title */}
                  <View className="flex-row items-center gap-2 mb-2">
                    <View className="w-2 h-2 rounded-full" style={{ backgroundColor: gauge.color }} />
                    <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 16, color: '#0A1F29' }}>{gauge.title}</Text>
                  </View>

                  {/* Description */}
                  <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D', lineHeight: 18 }}>
                    {gauge.description}
                  </Text>
                </Pressable>
              ))}
              {gaugeList.length > gaugeLimit && (
                <Pressable onPress={() => setGaugeLimit(l => l + 2)} style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-SemiBold', fontSize: 14, color: '#113E55' }}>Load More</Text>
                </Pressable>
              )}
            </>
          ) : (
            <Text style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#878686', textAlign: 'center', marginVertical: 20 }}>No contributing factors found</Text>
          )}
        </View>


      </View>

      {/* EVIDENCE SUMMARY Section */}
      <View className="mb-4">
        <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-SemiBold', fontSize: 21.88, lineHeight: 21.88, letterSpacing: 0, color: '#113E55', marginBottom: 16 }}>
          EVIDENCE SUMMARY
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
          onScroll={(e) => {
            const offset = e.nativeEvent.contentOffset.x;
            setActiveEvidenceDot(offset > 100 ? 1 : 0);
          }}
          scrollEventThrottle={16}
        >
          {/* Card 1: Access Logs */}
          <View className="bg-[#113E55] mr-3" style={{ width: 211, minHeight: 152, borderRadius: 16, paddingTop: 8, paddingRight: 16, paddingBottom: 8, paddingLeft: 16, gap: 8 }}>
            <View className="flex-row items-start justify-between">
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, lineHeight: 18, color: '#DFEBF1', letterSpacing: 0.5, marginTop: 8 }}>
                ACCESS{'\n'}LOGS
              </Text>
              <View className="w-11 h-11 rounded-full bg-[#2A566E] items-center justify-center">
                <EstateSvg width={20} height={20} />
              </View>
            </View>
            <View style={{ flex: 1, justifyContent: 'flex-end', gap: 4 }}>
              <View className="flex-row items-baseline gap-1.5">
                <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Regular', fontSize: 44, color: '#FFFFFF', lineHeight: 48 }}>
                  {overview?.evidence_summary?.total_anomalous_residents_instances || 0}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#DFEBF1', letterSpacing: 0.5 }}>RECORDS</Text>
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#DFEBF1', lineHeight: 18 }}>
                Anomalous entry time was detected in {overview?.evidence_summary?.total_anomalous_residents_instances || 0} resident records.
              </Text>
            </View>
          </View>

          {/* Card 2: Visitors Logs */}
          <View className="bg-[#113E55]" style={{ width: 211, minHeight: 152, borderRadius: 16, paddingTop: 8, paddingRight: 16, paddingBottom: 8, paddingLeft: 16, gap: 8 }}>
            <View className="flex-row items-start justify-between">
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, lineHeight: 18, color: '#DFEBF1', letterSpacing: 0.5, marginTop: 8 }}>
                VISITORS{'\n'}LOGS
              </Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'flex-end', gap: 4 }}>
              <View className="flex-row items-baseline gap-1.5">
                <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Regular', fontSize: 44, color: '#FFFFFF', lineHeight: 48 }}>
                  {overview?.evidence_summary?.total_anomalous_visitors_instances || 0}
                </Text>
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#DFEBF1', letterSpacing: 0.5 }}>RECORDS</Text>
              </View>
              <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#DFEBF1', lineHeight: 18 }}>
                Anomalous entry time was detected in {overview?.evidence_summary?.total_anomalous_visitors_instances || 0} visitor records.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Carousel Indicators */}
        <View className="flex-row items-center justify-center gap-1.5 mt-4">
          <View
            className={`h-1.5 rounded-full ${
              activeEvidenceDot === 0 ? 'w-4 bg-[#1B998B]' : 'w-1.5 bg-[#B9CDD4]'
            }`}
          />
          <View
            className={`h-1.5 rounded-full ${
              activeEvidenceDot === 1 ? 'w-4 bg-[#1B998B]' : 'w-1.5 bg-[#B9CDD4]'
            }`}
          />
        </View>
      </View>
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
      <TimeframeModal
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
      <DatePickerModal
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
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
    </Animated.View>
  );
}
