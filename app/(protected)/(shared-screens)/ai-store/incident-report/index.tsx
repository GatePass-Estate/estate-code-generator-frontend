import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';

import Pf1Svg from '@/src/assets/icons/pf_1.svg';
import Pf2Svg from '@/src/assets/icons/pf_2.svg';
import Pf3Svg from '@/src/assets/icons/pf_3.svg';
import IncidentReportSvg from '@/src/assets/images/incident-report.svg';
import { FeatureDownloadIcon, FeatureUsersIcon, RatingStarIcon } from '@/src/assets/svgs';
import RatingModal from '@/src/components/anomaly/modals/RatingModal';
import DataInsightModal from '@/src/components/anomaly/modals/DataInsightModal';
import IncidentResultView from '@/src/components/incident/IncidentResultView';
import SubscriptionTierCard from '@/src/components/incident/SubscriptionTierCard';
import AnimatedPillTabs from '@/src/components/mobile/AnimatedPillTabs';
import {
  getMarketplaceFeatureById,
  getMarketplaceFeatures,
  subscribeMarketplaceFeature,
  getFeaturePictureUrl,
  rateMarketplaceFeature,
} from '@/src/lib/api/aiMarketplace';
import { MarketplaceDetailResponse } from '@/src/types/aiMarketplace';

export default function IncidentReportPreviewScreen() {
  const params = useLocalSearchParams<{ featureId?: string; title?: string; tab?: string }>();
  const [activeTab, setActiveTab] = useState<'Preview' | 'Result'>(
    params.tab === 'Result' ? 'Result' : 'Preview'
  );
  const [prevParamTab, setPrevParamTab] = useState(params.tab);
  if (params.tab !== prevParamTab) {
    setPrevParamTab(params.tab);
    const newTab = params.tab === 'Result' ? 'Result' : 'Preview';
    setActiveTab(newTab);
  }
  const [expandedTier, setExpandedTier] = useState<string | null>('Tier Two');
  const [featureDetail, setFeatureDetail] = useState<MarketplaceDetailResponse | null>(null);
  const [, setIsSubscribing] = useState(false);
  const [subscribingTierKey, setSubscribingTierKey] = useState<string | null>(null);
  const [dataInsightVisible, setDataInsightVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [cardHeight, setCardHeight] = useState<number>(120);

  const formatTierName = (tier: string) => {
    const map: Record<string, string> = { '1': 'One', '2': 'Two', '3': 'Three' };
    return tier
      .split('_')
      .map((w) => map[w] || w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
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

  const loadFeature = useCallback(
    async (id?: string) => {
      setIsLoading(true);
      try {
        let targetId = id || params.featureId;
        if (!targetId) {
          const list = await getMarketplaceFeatures();
          const anomalyTool = list.items?.find((item) =>
            item.name.toLowerCase().includes('incident')
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
    },
    [params.featureId]
  );

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        let targetId = params.featureId;
        if (!targetId) {
          const list = await getMarketplaceFeatures();
          const anomalyTool = list.items?.find((item) =>
            item.name.toLowerCase().includes('incident')
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
      router.push('/(protected)/(shared-screens)/ai-store/incident-report/summary');
      return;
    }

    if (!featureDetail?.id || !tierPayload.ai_feature_id) {
      router.push('/(protected)/(shared-screens)/ai-store/incident-report/summary');
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

  const handleTabChange = (tab: 'Preview' | 'Result') => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View style={{ flex: 1, backgroundColor: activeTab === 'Result' ? '#F6F7F7' : '#FFFFFF' }}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        {/* Header: matches Figma top 55px to 109px (height 54px) */}
        <View
          style={{
            height: 54,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            backgroundColor: activeTab === 'Result' ? '#F6F7F7' : '#FFFFFF',
          }}
        >
          <Pressable
            onPress={() => router.back()}
            className="h-[30px] w-[30px] items-center justify-center"
            hitSlop={8}
          >
            <ValidationBackSvg width={30} height={30} />
          </Pressable>

          <AnimatedPillTabs
            options={[
              { value: 'Preview', label: 'Preview' },
              { value: 'Result', label: 'Result' },
            ]}
            value={activeTab}
            onChange={handleTabChange}
          />

          <Pressable
            className="h-[30px] w-[30px] items-center justify-center"
            hitSlop={20}
            onPress={() => {
              setDataInsightVisible(true);
            }}
            style={{ zIndex: 100 }}
          >
            <View pointerEvents="none">
              <BiInfoSvg width={24} height={24} />
            </View>
          </Pressable>
        </View>

        {activeTab === 'Result' ? (
          <IncidentResultView isActive={activeTab === 'Result'} />
        ) : isLoading ? (
          <View
            style={{
              flex: 1,
              backgroundColor: '#F6F7F7',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
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
                    height: 500 + 37 + 274 + 16 + (cardHeight ? cardHeight / 2 : 60),
                    backgroundColor: '#FFFFFF',
                  }}
                />

                {/* Illustration (Figma: width 302, height 274, centered) — 37px below tab */}
                <View
                  style={{
                    width: 302,
                    height: 274,
                    marginTop: 37,
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
                    <IncidentReportSvg width={302} height={274} />
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
                  className="bg-white rounded-[16px] p-4 gap-2 justify-between "
                  style={{
                    minHeight: 118,
                    marginTop: 36,
                    marginHorizontal: 20,
                  }}
                >
                  {/* Title and Rating */}
                  <View className="flex-row justify-between items-center">
                    <Text
                      allowFontScaling={false}
                      className="text-[21.88px] font-ubuntu-semibold text-[#113E55] leading-[21.88px]"
                    >
                      {featureDetail?.name || 'Incident Report Insights'}
                    </Text>
                    <Pressable
                      onPress={() => setIsRatingModalVisible(true)}
                      className="flex-row items-center gap-1"
                    >
                      <RatingStarIcon width={17} height={16} />
                      <Text
                        allowFontScaling={false}
                        className="text-[21.88px] font-ubuntu-semibold text-[#6B7280] leading-[26px] text-center w-[39px]"
                      >
                        {featureDetail?.rating != null ? featureDetail.rating.toFixed(1) : '0.0'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Description */}
                  <Text
                    allowFontScaling={false}
                    className="text-[11.2px] font-inter-regular text-[#878686]"
                  >
                    {featureDetail?.description ||
                      'See which incidents dominate your estate, when they peak, and what the reports are saying.'}
                  </Text>

                  {/* Stats */}
                  <View className="flex-row items-center gap-2 mt-1">
                    <View className="flex-row items-center ">
                      <FeatureDownloadIcon width={13} height={13} />
                      <Text
                        allowFontScaling={false}
                        className="text-[8.96px] font-inter-medium text-[#878686] px-1"
                      >
                        0
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <FeatureUsersIcon width={16} height={16} />
                      <Text
                        allowFontScaling={false}
                        className="text-[8.96px] font-inter-medium text-[#878686] px-1"
                      >
                        {featureDetail?.rating_count ?? 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Lower Body Section on #F6F7F7 */}
              <View className="flex-1 bg-[#F6F7F7] px-5 pt-[44px] pb-[100px]">
                {/* Product Feature */}

                <View className="px-[17px]">
                  <Text
                    allowFontScaling={false}
                    className="text-[14px] font-inter-medium text-[#113E55] mb-4 leading-[14px]"
                  >
                    Product Feature
                  </Text>
                </View>

                <View className="gap-2 mb-[44px]">
                  <View className="bg-white rounded-[16px] px-4 py-2 flex-row items-center gap-3  ">
                    <View className="w-4 h-4 shrink-0 items-center justify-center">
                      <Pf1Svg width={16} height={16} />
                    </View>
                    <Text
                      allowFontScaling={false}
                      className="text-[11.2px] font-inter-regular text-[#878686] flex-1 leading-[18px]"
                    >
                      Spot unusual activities early, so you can investigate before they become
                      bigger issues.
                    </Text>
                  </View>

                  <View className="bg-white rounded-[16px] px-4 py-2 flex-row items-center gap-3 ">
                    <View className="w-4 h-4 shrink-0 items-center justify-center">
                      <Pf2Svg width={16} height={16} />
                    </View>
                    <Text
                      allowFontScaling={false}
                      className="text-[11.2px] font-inter-regular text-[#878686] flex-1 leading-[18px]"
                    >
                      Instead of reviewing everything, instantly see the people or patterns that
                      deserve your attention.
                    </Text>
                  </View>

                  <View className="bg-white rounded-[16px] px-4 py-2 flex-row items-center gap-3">
                    <View className="w-4 h-4 shrink-0 items-center justify-center">
                      <Pf3Svg width={16} height={16} />
                    </View>
                    <Text
                      allowFontScaling={false}
                      className="text-[11.2px] font-inter-regular text-[#878686] flex-1 leading-[18px]"
                    >
                      {
                        "No complicated reports. Get simple insights that help you understand what's happening and why."
                      }
                    </Text>
                  </View>
                </View>
                <View className="px-[17px]">
                  {/* Choose Subscription Plan */}
                  <Text
                    allowFontScaling={false}
                    className="text-[14px] font-inter-medium text-[#113E55] mb-4 leading-[14px]"
                  >
                    Choose Subscription Plan
                  </Text>
                </View>

                {/* Tier cards */}
                <View className="flex-col gap-6">
                  <SubscriptionTierCard
                    tierLabel={tierOneApi?.tier ? formatTierName(tierOneApi.tier) : 'Tier One'}
                    subtitle="FREE"
                    description="Instead of reviewing everything, instantly see the people or patterns that deserve your attention."
                    expanded={expandedTier === 'Tier One'}
                    onToggle={() =>
                      setExpandedTier(expandedTier === 'Tier One' ? null : 'Tier One')
                    }
                    onActivate={() => handleSubscribe(tierOneApi || { tier: 'Tier One' })}
                    isSubscribing={subscribingTierKey === (tierOneApi?.tier || 'Tier One')}
                    isInstalled={!!tierOneApi?.is_installed}
                    activeBenefitCount={3}
                  />

                  <SubscriptionTierCard
                    tierLabel={tierTwoApi?.tier ? formatTierName(tierTwoApi.tier) : 'Tier Two'}
                    subtitle={tierTwoApi?.name || 'Incident Insights In-house AI Review'}
                    subtitleUppercase
                    description={
                      tierTwoApi?.description ||
                      'Spot peak times and repeat locations before they become patterns.'
                    }
                    expanded={expandedTier === 'Tier Two'}
                    onToggle={() =>
                      setExpandedTier(expandedTier === 'Tier Two' ? null : 'Tier Two')
                    }
                    onActivate={() => handleSubscribe(tierTwoApi || { tier: 'Tier Two' })}
                    isSubscribing={subscribingTierKey === (tierTwoApi?.tier || 'Tier Two')}
                    isInstalled={!!tierTwoApi?.is_installed}
                    activeBenefitCount={3}
                  />

                  <SubscriptionTierCard
                    tierLabel={
                      tierThreeApi?.tier ? formatTierName(tierThreeApi.tier) : 'Tier Three'
                    }
                    subtitle={tierThreeApi?.name || 'Incident Insights Third-Party AI Review'}
                    subtitleUppercase
                    description={
                      tierThreeApi?.description ||
                      'Spot peak times and repeat locations before they become patterns.'
                    }
                    expanded={expandedTier === 'Tier Three'}
                    onToggle={() =>
                      setExpandedTier(expandedTier === 'Tier Three' ? null : 'Tier Three')
                    }
                    onActivate={() => handleSubscribe(tierThreeApi || { tier: 'Tier Three' })}
                    isSubscribing={subscribingTierKey === (tierThreeApi?.tier || 'Tier Three')}
                    isInstalled={!!tierThreeApi?.is_installed}
                    activeBenefitCount={5}
                  />
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        )}
      </SafeAreaView>

      <RatingModal
        visible={isRatingModalVisible}
        onClose={() => setIsRatingModalVisible(false)}
        onSubmit={handleRate}
      />

      <DataInsightModal visible={dataInsightVisible} onClose={() => setDataInsightVisible(false)} />
    </View>
  );
}
