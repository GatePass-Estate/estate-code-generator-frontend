import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';
import AnomalyRadarChart from '@/src/components/anomaly/AnomalyRadarChart';
import AnomalyDonutChart from '@/src/components/anomaly/AnomalyDonutChart';
import SemiCircleGauge from '@/src/components/anomaly/SemiCircleGauge';
import FilterModal from '@/src/components/anomaly/modals/FilterModal';
import OrderModal from '@/src/components/anomaly/modals/OrderModal';
import GaugeDetailModal, { GaugeData } from '@/src/components/anomaly/modals/GaugeDetailModal';
import DatePickerModal from '@/src/components/anomaly/modals/DatePickerModal';
import TimeframeModal from '@/src/components/anomaly/modals/TimeframeModal';

import Pf1Svg from '@/src/assets/icons/pf_1.svg';
import Pf2Svg from '@/src/assets/icons/pf_2.svg';
import Pf3Svg from '@/src/assets/icons/pf_3.svg';
import DownloadSvg from '@/src/assets/icons/download.svg';
import AnomalySvg from '@/src/assets/images/anomaly.svg';
import RatingModal from '@/src/components/anomaly/modals/RatingModal';
import DataInsightModal from '@/src/components/anomaly/modals/DataInsightModal';
import AnomalyResultView from '@/src/components/anomaly/AnomalyResultView';
import {
  getMarketplaceFeatureById,
  getMarketplaceFeatures,
  subscribeMarketplaceFeature,
  getFeaturePictureUrl,
  rateMarketplaceFeature,
} from '@/src/lib/api/aiMarketplace';
import { MarketplaceDetailResponse } from '@/src/types/aiMarketplace';

const PILL_WIDTH = 228;
const PILL_HEIGHT = 40;
const PADDING = 3;
const TAB_WIDTH = (PILL_WIDTH - PADDING * 2) / 2; // 111
const TAB_HEIGHT = PILL_HEIGHT - PADDING * 2; // 34

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.7,
};

export default function AnomalyDetectionPreviewScreen() {
  const params = useLocalSearchParams<{ featureId?: string; title?: string; tab?: string }>();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Result'>(
    params.tab === 'Result' ? 'Result' : 'Overview'
  );
  const [prevParamTab, setPrevParamTab] = useState(params.tab);
  if (params.tab !== prevParamTab) {
    setPrevParamTab(params.tab);
    const newTab = params.tab === 'Result' ? 'Result' : 'Overview';
    setActiveTab(newTab);
  }
  const [expandedTier, setExpandedTier] = useState<string | null>('Tier Two');
  const [featureDetail, setFeatureDetail] = useState<MarketplaceDetailResponse | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribingTierKey, setSubscribingTierKey] = useState<string | null>(null);
  const [dataInsightVisible, setDataInsightVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [cardHeight, setCardHeight] = useState<number>(120);

  const formatTierName = (tier: string) => {
    const map: Record<string, string> = { '1': 'One', '2': 'Two', '3': 'Three' };
    return tier.split('_').map(w => map[w] || (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(' ');
  };

  const handleRate = async (rating: number) => {
    const targetId = featureDetail?.id || params.featureId;
    if (!targetId) return;
    try {
      await rateMarketplaceFeature(targetId, { score: rating });
      const data = await getMarketplaceFeatureById(targetId);
      setFeatureDetail(data);
      Alert.alert('Success', 'Rating submitted successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit rating');
      throw err;
    }
  };

  const [isLoading, setIsLoading] = useState(true);

  const loadFeature = useCallback(async (id?: string) => {
    setIsLoading(true);
    try {
      let targetId = id || params.featureId;
      if (!targetId) {
        const list = await getMarketplaceFeatures();
        const anomalyTool = list.items?.find((item) =>
          item.name.toLowerCase().includes('anomaly')
        );
        if (anomalyTool) {
          targetId = anomalyTool.id;
        }
      }

      if (targetId) {
        const detail = await getMarketplaceFeatureById(targetId);
        setFeatureDetail(detail);
      }
    } catch (err: any) {
      console.log('Error loading feature details:', err?.message || err);
    } finally {
      setIsLoading(false);
    }
  }, [params.featureId]);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        let targetId = params.featureId;
        if (!targetId) {
          const list = await getMarketplaceFeatures();
          const anomalyTool = list.items?.find((item) =>
            item.name.toLowerCase().includes('anomaly')
          );
          if (anomalyTool) {
            targetId = anomalyTool.id;
          }
        }

        if (targetId && isMounted) {
          const detail = await getMarketplaceFeatureById(targetId);
          if (isMounted) {
            setFeatureDetail(detail);
          }
        }
      } catch (err: any) {
        console.log('Error loading feature details:', err?.message || err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [params.featureId]);

  const handleSubscribe = async (tierPayload: {
    id?: string;
    tier: string;
    ai_feature_id?: string;
    is_free?: boolean;
    is_installed?: boolean;
  }) => {
    if (tierPayload.is_installed) {
      router.push('/(protected)/(shared-screens)/ai-store/anomaly-detection/summary');
      return;
    }

    if (!featureDetail?.id || !tierPayload.ai_feature_id) {
      router.push('/(protected)/(shared-screens)/ai-store/anomaly-detection/summary');
      return;
    }

    setSubscribingTierKey(tierPayload.tier);
    setIsSubscribing(true);
    try {
      await subscribeMarketplaceFeature(featureDetail.id, {
        ai_feature_id: tierPayload.ai_feature_id,
        period_months: 1,
      });
      Alert.alert(
        'Subscription Update',
        tierPayload.is_free
          ? 'Free feature tier activated successfully!'
          : 'Subscription quote created successfully.'
      );
      loadFeature(featureDetail.id);
    } catch (err: any) {
      Alert.alert('Subscription Failed', err?.message || 'Failed to activate tier.');
    } finally {
      setIsSubscribing(false);
      setSubscribingTierKey(null);
    }
  };

  const tierOneApi = featureDetail?.tiers?.find(
    (t) => t.tier.toLowerCase().includes('1') || t.tier.toLowerCase().includes('one')
  );
  const tierTwoApi = featureDetail?.tiers?.find(
    (t) => t.tier.toLowerCase().includes('2') || t.tier.toLowerCase().includes('two')
  );
  const tierThreeApi = featureDetail?.tiers?.find(
    (t) => t.tier.toLowerCase().includes('3') || t.tier.toLowerCase().includes('three')
  );

  const scrollViewRef = useRef<ScrollView>(null);
  const translateX = useSharedValue(params.tab === 'Result' ? TAB_WIDTH : 0);
  const startX = useSharedValue(0);

  const handleTabPress = (tab: 'Overview' | 'Result') => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      const targetX = tab === 'Result' ? TAB_WIDTH : 0;
      translateX.value = withSpring(targetX, SPRING_CONFIG);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onStart(() => {
      'worklet';
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      'worklet';
      const raw = startX.value + e.translationX;
      if (raw < 0) {
        translateX.value = raw * 0.25;
      } else if (raw > TAB_WIDTH) {
        translateX.value = TAB_WIDTH + (raw - TAB_WIDTH) * 0.25;
      } else {
        translateX.value = raw;
      }
    })
    .onEnd((e) => {
      'worklet';
      let targetTab: 'Overview' | 'Result' = 'Overview';
      if (e.velocityX > 250) {
        targetTab = 'Result';
      } else if (e.velocityX < -250) {
        targetTab = 'Overview';
      } else {
        targetTab = translateX.value > TAB_WIDTH / 2 ? 'Result' : 'Overview';
      }

      const targetX = targetTab === 'Result' ? TAB_WIDTH : 0;
      translateX.value = withSpring(targetX, {
        ...SPRING_CONFIG,
        velocity: e.velocityX,
      });

      runOnJS(setActiveTab)(targetTab);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      'worklet';
      const targetTab: 'Overview' | 'Result' = e.x < PILL_WIDTH / 2 ? 'Overview' : 'Result';
      const targetX = targetTab === 'Result' ? TAB_WIDTH : 0;
      translateX.value = withSpring(targetX, SPRING_CONFIG);
      runOnJS(setActiveTab)(targetTab);
    });

  const pillGesture = Gesture.Race(panGesture, tapGesture);

  useEffect(() => {
    const targetX = activeTab === 'Result' ? TAB_WIDTH : 0;
    translateX.value = withSpring(targetX, SPRING_CONFIG);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedHeaderBgStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      backgroundColor: interpolateColor(
        translateX.value,
        [0, TAB_WIDTH],
        ['#FFFFFF', '#F6F7F7']
      ),
    };
  });

  const overviewTextStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      color: interpolateColor(
        translateX.value,
        [0, TAB_WIDTH],
        ['#113E55', '#8A9A9D']
      ),
    };
  });

  const resultTextStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      color: interpolateColor(
        translateX.value,
        [0, TAB_WIDTH],
        ['#8A9A9D', '#113E55']
      ),
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedHeaderBgStyle]}>
      <SafeAreaView
        edges={['top', 'left', 'right']}
        style={{ flex: 1 }}
      >
        {/* Header: matches Figma top 55px to 109px (height 54px) */}
        <Animated.View
          style={[
            {
              height: 54,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
            },
            animatedHeaderBgStyle,
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            className="h-[30px] w-[30px] items-center justify-center"
            hitSlop={8}
          >
            <ValidationBackSvg width={30} height={30} />
          </Pressable>

          <GestureDetector gesture={pillGesture}>
            <View style={styles.pillContainer}>
              <Animated.View style={[styles.pillIndicator, animatedIndicatorStyle]} />
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'Overview' }}
                onPress={() => handleTabPress('Overview')}
                style={styles.pillTab}
              >
                  <Animated.Text style={[styles.pillText, overviewTextStyle]}>
                    Overview
                  </Animated.Text>
                </Pressable>
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === 'Result' }}
                  onPress={() => handleTabPress('Result')}
                  style={styles.pillTab}
                >
                  <Animated.Text style={[styles.pillText, resultTextStyle]}>
                    Result
                  </Animated.Text>
                </Pressable>
              </View>
            </GestureDetector>

          <Pressable
            className="h-[30px] w-[30px] items-center justify-center"
            hitSlop={20}
            onPress={() => {
              console.log('INFO ICON CLICKED');
              setDataInsightVisible(true);
            }}
            style={{ zIndex: 100 }}
          >
            <View pointerEvents="none">
              <BiInfoSvg width={24} height={24} />
            </View>
          </Pressable>
        </Animated.View>

        {activeTab === 'Result' ? (
          <AnomalyResultView />
        ) : isLoading ? (
          <View style={{ flex: 1, backgroundColor: '#F6F7F7', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#113E55" />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, backgroundColor: '#F6F7F7' }}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <Animated.View entering={FadeIn.duration(280)}>
              {/* Top Hero Container with split background */}
              <View style={{ width: '100%', position: 'relative' }}>
                {/* White background: spans full width of device, no border radius, extending to half of the anomaly detection card */}
                <View
                  style={{
                    position: 'absolute',
                    top: -500,
                    left: 0,
                    right: 0,
                    height: 500 + 274 + 16 + (cardHeight ? cardHeight / 2 : 60),
                    backgroundColor: '#FFFFFF',
                  }}
                />

                {/* Illustration (Figma: width 302, height 274, centered) */}
                <View
                  style={{
                    width: 302,
                    height: 274,
                    alignSelf: 'center',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {featureDetail?.display_picture_url && !imageError ? (
                    <Image
                      source={{ uri: getFeaturePictureUrl(featureDetail.display_picture_url) }}
                      style={{ width: 302, height: 274 }}
                      resizeMode="contain"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <AnomalySvg width={302} height={274} />
                  )}
                </View>

                {/* Details Card: sitting over the split line between #FFFFFF and #F6F7F7 */}
                <View
                  onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    if (h && Math.abs(h - cardHeight) > 1) {
                      setCardHeight(h);
                    }
                  }}
                  className="bg-white rounded-[16px] p-[16px] gap-[8px] justify-between border border-[#EFF1F3]"
                  style={{
                    minHeight: 118,
                    marginTop: 16,
                    marginHorizontal: 20,
                  }}
                >
                  {/* Title and Rating */}
                  <View className="flex-row justify-between items-center">
                    <Text allowFontScaling={false} className="text-[21.88px] font-ubuntu-semibold text-[#113E55] leading-[21.88px]">
                      {featureDetail?.name || 'Anomaly Detection'}
                    </Text>
                    <Pressable onPress={() => setIsRatingModalVisible(true)} className="flex-row items-center gap-1.5">
                      <Svg
                        width={17}
                        height={16}
                        viewBox="0 0 24 24"
                        fill="#F46036"
                        stroke="#F46036"
                        strokeWidth={2.5}
                      >
                        <Path
                          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                      </Svg>
                      <Text allowFontScaling={false} className="text-[21.88px] font-ubuntu-semibold text-[#6B7280] leading-[21.88px] text-center">
                        {featureDetail?.rating != null ? featureDetail.rating.toFixed(1) : '0.0'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Description */}
                  <Text allowFontScaling={false} className="text-[11.2px] font-inter-regular text-[#8A9A9D] leading-[16px]">
                    {featureDetail?.description || "See unusual patterns, understand user behavior, and uncover hidden insights all from your dashboard."}
                  </Text>

                  {/* Stats */}
                  <View className="flex-row items-center gap-6 mt-1">
                    <View className="flex-row items-center gap-1.5">
                      <DownloadSvg width={14} height={14} />
                      <Text allowFontScaling={false} className="text-[11.2px] font-inter-medium text-[#8A9A9D]">0</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <MaterialIcons name="people" size={16} color="#0E706B" />
                      <Text allowFontScaling={false} className="text-[11.2px] font-inter-medium text-[#8A9A9D]">
                        {featureDetail?.rating_count || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Lower Body Section on #F6F7F7 */}
              <View style={{ flex: 1, backgroundColor: '#F6F7F7', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100 }}>

              {/* Product Feature */}
              <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-[#113E55] mb-3 leading-[14px]">
                Product Feature
              </Text>

              <View className="bg-white rounded-[16px] px-[16px] py-[8px] mb-3 flex-row items-center gap-[12px] min-h-[44px] border border-[#EFF1F3]">
                <View className="w-[16px] h-[16px] items-center justify-center">
                  <Pf1Svg width={16} height={16} />
                </View>
                <Text allowFontScaling={false} className="text-[12px] font-inter-regular text-[#8A9A9D] flex-1 leading-[18px]">
                  Spot unusual activities early, so you can investigate before they become bigger issues.
                </Text>
              </View>

              <View className="bg-white rounded-[16px] px-[16px] py-[8px] mb-3 flex-row items-center gap-[12px] min-h-[44px] border border-[#EFF1F3]">
                <View className="w-[16px] h-[16px] items-center justify-center">
                  <Pf2Svg width={16} height={16} />
                </View>
                <Text allowFontScaling={false} className="text-[12px] font-inter-regular text-[#8A9A9D] flex-1 leading-[18px]">
                  Instead of reviewing everything, instantly see the people or patterns that deserve your attention.
                </Text>
              </View>

              <View className="bg-white rounded-[16px] px-[16px] py-[8px] mb-8 flex-row items-center gap-[12px] min-h-[44px] border border-[#EFF1F3]">
                <View className="w-[16px] h-[16px] items-center justify-center">
                  <Pf3Svg width={16} height={16} />
                </View>
                <Text allowFontScaling={false} className="text-[12px] font-inter-regular text-[#8A9A9D] flex-1 leading-[18px]">
                  No complicated reports. Get simple insights that help you understand what&apos;s happening and why.
                </Text>
              </View>

              {/* Choose Subscription Plan */}
              <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-[#113E55] mb-4 leading-[14px]">
                Choose Subscription Plan
              </Text>

              {/* Tier One */}
              <View className={`bg-white rounded-[16px] p-5 mb-4 ${expandedTier === 'Tier One' ? 'border border-[#113E55]' : ''}`}>
                <Text allowFontScaling={false} className="text-[17.5px] font-inter-regular text-[#113E55] leading-[17.5px] mb-1.5">
                  {tierOneApi?.tier ? formatTierName(tierOneApi.tier) : 'Tier One'}
                </Text>
                <Text allowFontScaling={false} className="text-[15px] font-inter-medium text-[#113E55] leading-[22px] mb-2.5">
                  {tierOneApi?.name || 'Access Code Anomaly Scan'}
                </Text>
                <Text allowFontScaling={false} className="text-[11.2px] font-inter-regular text-[#8A9A9D] leading-[16px] text-justify">
                  {tierOneApi?.description || 'Instead of reviewing everything, instantly see the people or patterns that deserve your attention.'}
                </Text>
                
                <Pressable 
                  onPress={() => setExpandedTier(expandedTier === 'Tier One' ? null : 'Tier One')}
                  className={`flex-row items-center gap-1 mt-5 ${expandedTier === 'Tier One' ? 'mb-5' : ''}`}
                >
                  <Text allowFontScaling={false} className="text-[13px] font-inter-medium text-[#113E55]">See benefits</Text>
                  <MaterialIcons 
                    name={expandedTier === 'Tier One' ? "keyboard-arrow-down" : "keyboard-arrow-right"} 
                    size={18} 
                    color="#113E55" 
                  />
                </Pressable>

                {expandedTier === 'Tier One' && (
                  <View className="space-y-3">
                    {[0, 1, 2, 3, 4].map((index) => {
                      const isActive = index < 3;
                      return (
                        <View key={index} className="flex-row items-start gap-2 mb-3">
                          <View className={`rounded-full p-[2px] mt-[2px] ${isActive ? 'bg-[#CEE5ED]' : 'bg-[#EFF1F3]'}`}>
                            <MaterialIcons 
                              name="check" 
                              size={12} 
                              color={isActive ? "#113E55" : "#A0AAB0"} 
                            />
                          </View>
                          <Text allowFontScaling={false} className={`text-[11.2px] font-inter-regular flex-1 leading-[16px] text-justify ${isActive ? 'text-[#8A9A9D]' : 'text-[#B5BFC4]'}`}>
                            Instead of reviewing everything, instantly see the people or patterns that deserve your attention.
                          </Text>
                        </View>
                      );
                    })}
                    <Pressable 
                      disabled={isSubscribing}
                      onPress={() => handleSubscribe(tierOneApi || { tier: 'Tier One' })}
                      className="w-full h-[48px] bg-[#113E55] rounded-full items-center justify-center mt-4"
                    >
                      {subscribingTierKey === (tierOneApi?.tier || 'Tier One') ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-white">
                          {tierOneApi?.is_installed ? 'Installed' : 'Activate'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Tier Two */}
              <View className={`bg-white rounded-[16px] p-5 mb-4 ${expandedTier === 'Tier Two' ? 'border border-[#113E55]' : ''}`}>
                <Text allowFontScaling={false} className="text-[17.5px] font-inter-regular text-[#113E55] leading-[17.5px] mb-1.5">
                  {tierTwoApi?.tier ? formatTierName(tierTwoApi.tier) : 'Tier Two'}
                </Text>
                <Text allowFontScaling={false} className="text-[15px] font-inter-medium text-[#113E55] leading-[22px] mb-2.5">
                  {tierTwoApi?.name || 'Anomaly Scan Results In-house AI Review'}
                </Text>
                <Text allowFontScaling={false} className="text-[11.2px] font-inter-regular text-[#8A9A9D] leading-[16px] text-justify">
                  {tierTwoApi?.description || 'Instead of reviewing everything, instantly see the people or patterns that deserve your attention.'}
                </Text>
                
                <Pressable 
                  onPress={() => setExpandedTier(expandedTier === 'Tier Two' ? null : 'Tier Two')}
                  className={`flex-row items-center gap-1 mt-5 ${expandedTier === 'Tier Two' ? 'mb-5' : ''}`}
                >
                  <Text allowFontScaling={false} className="text-[13px] font-inter-medium text-[#113E55]">See benefits</Text>
                  <MaterialIcons 
                    name={expandedTier === 'Tier Two' ? "keyboard-arrow-down" : "keyboard-arrow-right"} 
                    size={18} 
                    color="#113E55" 
                  />
                </Pressable>

                {expandedTier === 'Tier Two' && (
                  <View className="space-y-3">
                    {[0, 1, 2, 3, 4].map((index) => {
                      const isActive = index < 3;
                      return (
                        <View key={index} className="flex-row items-start gap-2 mb-3">
                          <View className={`rounded-full p-[2px] mt-[2px] ${isActive ? 'bg-[#CEE5ED]' : 'bg-[#EFF1F3]'}`}>
                            <MaterialIcons 
                              name="check" 
                              size={12} 
                              color={isActive ? "#113E55" : "#A0AAB0"} 
                            />
                          </View>
                          <Text allowFontScaling={false} className={`text-[11.2px] font-inter-regular flex-1 leading-[16px] text-justify ${isActive ? 'text-[#8A9A9D]' : 'text-[#B5BFC4]'}`}>
                            Instead of reviewing everything, instantly see the people or patterns that deserve your attention.
                          </Text>
                        </View>
                      );
                    })}
                    <Pressable 
                      disabled={isSubscribing}
                      onPress={() => handleSubscribe(tierTwoApi || { tier: 'Tier Two' })}
                      className="w-full h-[48px] bg-[#113E55] rounded-full items-center justify-center mt-4"
                    >
                      {subscribingTierKey === (tierTwoApi?.tier || 'Tier Two') ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-white">
                          {tierTwoApi?.is_installed ? 'Installed' : 'Activate'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Tier Three */}
              <View className={`bg-white rounded-[16px] p-5 mb-4 ${expandedTier === 'Tier Three' ? 'border border-[#113E55]' : ''}`}>
                <Text allowFontScaling={false} className="text-[17.5px] font-inter-regular text-[#113E55] leading-[17.5px] mb-1.5">
                  {tierThreeApi?.tier ? formatTierName(tierThreeApi.tier) : 'Tier Three'}
                </Text>
                <Text allowFontScaling={false} className="text-[15px] font-inter-medium text-[#113E55] leading-[22px] mb-2.5">
                  {tierThreeApi?.name || 'Anomaly Scan Results Third-Party AI Review'}
                </Text>
                <Text allowFontScaling={false} className="text-[11.2px] font-inter-regular text-[#8A9A9D] leading-[16px] text-justify">
                  {tierThreeApi?.description || 'Instead of reviewing everything, instantly see the people or patterns that deserve your attention.'}
                </Text>
                
                <Pressable 
                  onPress={() => setExpandedTier(expandedTier === 'Tier Three' ? null : 'Tier Three')}
                  className={`flex-row items-center gap-1 mt-5 ${expandedTier === 'Tier Three' ? 'mb-5' : ''}`}
                >
                  <Text allowFontScaling={false} className="text-[13px] font-inter-medium text-[#113E55]">See benefits</Text>
                  <MaterialIcons 
                    name={expandedTier === 'Tier Three' ? "keyboard-arrow-down" : "keyboard-arrow-right"} 
                    size={18} 
                    color="#113E55" 
                  />
                </Pressable>

                {expandedTier === 'Tier Three' && (
                  <View className="space-y-3">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <View key={index} className="flex-row items-start gap-2 mb-3">
                        <View className="bg-[#CEE5ED] rounded-full p-[2px] mt-[2px]">
                          <MaterialIcons name="check" size={12} color="#113E55" />
                        </View>
                        <Text allowFontScaling={false} className="text-[11.2px] font-inter-regular text-[#8A9A9D] flex-1 leading-[16px] text-justify">
                          Instead of reviewing everything, instantly see the people or patterns that deserve your attention.
                        </Text>
                      </View>
                    ))}
                    <Pressable 
                      disabled={isSubscribing}
                      onPress={() => handleSubscribe(tierThreeApi || { tier: 'Tier Three' })}
                      className="w-full h-[48px] bg-[#113E55] rounded-full items-center justify-center mt-4"
                    >
                      {subscribingTierKey === (tierThreeApi?.tier || 'Tier Three') ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-white">
                          {tierThreeApi?.is_installed ? 'Installed' : 'Activate'}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
            </Animated.View>
          </ScrollView>
        )}</SafeAreaView>

      <RatingModal
        visible={isRatingModalVisible}
        onClose={() => setIsRatingModalVisible(false)}
        onSubmit={handleRate}
      />

      <DataInsightModal
        visible={dataInsightVisible}
        onClose={() => setDataInsightVisible(false)}
      />


    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    backgroundColor: '#EFF1F1',
    borderRadius: PILL_HEIGHT / 2,
    padding: PADDING,
    flexDirection: 'row',
    position: 'relative',
  },
  pillIndicator: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    backgroundColor: '#DFEBF1',
    borderRadius: TAB_HEIGHT / 2,
  },
  pillTab: {
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pillText: {
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 11.2,
    lineHeight: 11.2,
    textAlign: 'center',
  },
});
