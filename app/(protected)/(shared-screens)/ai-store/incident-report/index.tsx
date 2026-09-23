import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';

import IncidentReportSvg from '@/src/assets/images/incident-report.svg';
import { FeatureDownloadIcon, FeatureUsersIcon, RatingStarIcon } from '@/src/assets/svgs';
import RatingModal from '@/src/components/anomaly/modals/RatingModal';
import DataInsightModal from '@/src/components/anomaly/modals/DataInsightModal';
import IncidentResultView from '@/src/components/incident/IncidentResultView';
import SubscriptionTierCard from '@/src/components/incident/SubscriptionTierCard';
import AnimatedPillTabs from '@/src/components/mobile/AnimatedPillTabs';
import {
  formatTierLabel,
  formatTierSubtitle,
  getMarketplaceFeatureById,
  rateMarketplaceFeature,
  resolveMarketplaceFeatureId,
  sortMarketplaceTiers,
  splitFeatureBullets,
  subscribeMarketplaceFeature,
} from '@/src/lib/api/aiMarketplace';
import { MarketplaceDetailResponse, MarketplaceTier } from '@/src/types/aiMarketplace';

const isIncidentProduct = (name: string) => name.toLowerCase().includes('incident');

export default function IncidentReportPreviewScreen() {
  const params = useLocalSearchParams<{ featureId?: string; title?: string; tab?: string }>();
  const [activeTab, setActiveTab] = useState<'Preview' | 'Result'>(
    params.tab === 'Result' ? 'Result' : 'Preview'
  );
  const [prevParamTab, setPrevParamTab] = useState(params.tab);
  if (params.tab !== prevParamTab) {
    setPrevParamTab(params.tab);
    setActiveTab(params.tab === 'Result' ? 'Result' : 'Preview');
  }
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [featureDetail, setFeatureDetail] = useState<MarketplaceDetailResponse | null>(null);
  const [, setIsSubscribing] = useState(false);
  const [subscribingTierKey, setSubscribingTierKey] = useState<string | null>(null);
  const [dataInsightVisible, setDataInsightVisible] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [cardHeight, setCardHeight] = useState<number>(120);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFeature = useCallback(async (id?: string) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const targetId = await resolveMarketplaceFeatureId(id ?? params.featureId, isIncidentProduct);
      if (!targetId) {
        setFeatureDetail(null);
        setLoadError('No marketplace product returned for this feature.');
        return;
      }

      const detail = await getMarketplaceFeatureById(targetId);
      setFeatureDetail(detail);
      const sorted = sortMarketplaceTiers(detail.tiers ?? []);
      setExpandedTier((prev) => {
        if (prev && sorted.some((tier) => tier.tier === prev)) return prev;
        return sorted[0]?.tier ?? null;
      });
    } catch (err: any) {
      console.log('Error loading feature details:', err?.message || err);
      setFeatureDetail(null);
      setLoadError(err?.message || 'Failed to load feature details');
    } finally {
      setIsLoading(false);
    }
  }, [params.featureId]);

  useEffect(() => {
    void loadFeature();
  }, [loadFeature]);

  const handleRate = async (rating: number) => {
    const targetId = featureDetail?.id;
    if (!targetId) return;
    try {
      await rateMarketplaceFeature(targetId, { score: rating });
      await loadFeature(targetId);
      Alert.alert('Success', 'Rating submitted successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit rating');
      throw err;
    }
  };

  const handleSubscribe = async (tier: MarketplaceTier) => {
    if (tier.is_installed) {
      setActiveTab('Result');
      return;
    }

    if (!featureDetail?.id || !tier.ai_feature_id) {
      Alert.alert(
        'Unable to activate',
        'This tier is missing marketplace details. Pull to refresh or try again later.'
      );
      return;
    }

    setSubscribingTierKey(tier.tier);
    setIsSubscribing(true);
    try {
      await subscribeMarketplaceFeature(featureDetail.id, {
        ai_feature_id: tier.ai_feature_id,
        period_months: 1,
      });
      Alert.alert(
        'Subscription Update',
        tier.is_free
          ? 'Free feature tier activated successfully!'
          : 'Subscription quote created successfully.'
      );
      await loadFeature(featureDetail.id);
    } catch (err: any) {
      Alert.alert('Subscription Failed', err?.message || 'Failed to activate tier.');
    } finally {
      setIsSubscribing(false);
      setSubscribingTierKey(null);
    }
  };

  const productBullets = useMemo(
    () => splitFeatureBullets(featureDetail?.description),
    [featureDetail?.description]
  );
  const sortedTiers = useMemo(
    () => sortMarketplaceTiers(featureDetail?.tiers ?? []),
    [featureDetail?.tiers]
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
            onPress={() => setDataInsightVisible(true)}
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
        ) : !featureDetail ? (
          <View className="flex-1 items-center justify-center bg-[#F6F7F7] px-8">
            <Text className="text-center text-sm font-inter-medium text-[#113E55]">
              {loadError || 'Could not load preview.'}
            </Text>
            <Pressable
              onPress={() => void loadFeature()}
              className="mt-4 rounded-full bg-[#113E55] px-5 py-3"
            >
              <Text className="text-sm font-inter-medium text-white">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, backgroundColor: '#F6F7F7' }}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <Animated.View entering={FadeIn.duration(280)}>
              <View style={{ width: '100%', position: 'relative' }}>
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
                  <IncidentReportSvg width={302} height={274} />
                </View>

                <View
                  onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    if (h && Math.abs(h - cardHeight) > 1) setCardHeight(h);
                  }}
                  className="justify-between gap-2 rounded-[16px] bg-white p-4"
                  style={{ minHeight: 118, marginTop: 36, marginHorizontal: 20 }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      allowFontScaling={false}
                      className="text-[21.88px] font-ubuntu-semibold leading-[21.88px] text-[#113E55]"
                    >
                      {featureDetail.name || 'Incident Report Insights'}
                    </Text>
                    <Pressable
                      onPress={() => setIsRatingModalVisible(true)}
                      className="flex-row items-center gap-1"
                    >
                      <RatingStarIcon width={17} height={16} />
                      <Text
                        allowFontScaling={false}
                        className="w-[39px] text-center text-[21.88px] font-ubuntu-semibold leading-[26px] text-[#6B7280]"
                      >
                        {featureDetail.rating != null ? featureDetail.rating.toFixed(1) : '0.0'}
                      </Text>
                    </Pressable>
                  </View>

                  <Text
                    allowFontScaling={false}
                    className="text-[11.2px] font-inter-regular text-[#878686]"
                  >
                    {featureDetail.description ||
                      'See which incidents dominate your estate, when they peak, and what the reports are saying.'}
                  </Text>

                  <View className="mt-1 flex-row items-center gap-2">
                    <View className="flex-row items-center">
                      <FeatureDownloadIcon width={13} height={13} />
                      <Text
                        allowFontScaling={false}
                        className="px-1 text-[8.96px] font-inter-medium text-[#878686]"
                      >
                        {sortedTiers.filter((tier) => tier.is_installed).length}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <FeatureUsersIcon width={16} height={16} />
                      <Text
                        allowFontScaling={false}
                        className="px-1 text-[8.96px] font-inter-medium text-[#878686]"
                      >
                        {featureDetail.rating_count ?? 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="flex-1 bg-[#F6F7F7] px-5 pb-[100px] pt-[44px]">
                <View className="px-[17px]">
                  <Text
                    allowFontScaling={false}
                    className="mb-4 text-[14px] font-inter-medium leading-[14px] text-[#113E55]"
                  >
                    Choose Subscription Plan
                  </Text>
                </View>

                <View className="flex-col gap-6">
                  {sortedTiers.length === 0 ? (
                    <Text className="text-center text-[11.2px] font-inter-regular text-[#878686]">
                      No subscription tiers returned for this product.
                    </Text>
                  ) : (
                    sortedTiers.map((tier) => {
                      const tierKey = tier.tier;
                      const benefits = splitFeatureBullets(tier.description);
                      const description = tier.description?.trim() || '';
                      const subtitle = formatTierSubtitle(tier);
                      return (
                        <SubscriptionTierCard
                          key={tier.ai_feature_id || tierKey}
                          tierLabel={formatTierLabel(tierKey)}
                          subtitle={subtitle}
                          subtitleUppercase={false}
                          description={description}
                          benefits={benefits}
                          expanded={expandedTier === tierKey}
                          onToggle={() =>
                            setExpandedTier(expandedTier === tierKey ? null : tierKey)
                          }
                          onActivate={() => void handleSubscribe(tier)}
                          isSubscribing={subscribingTierKey === tierKey}
                          isInstalled={!!tier.is_installed}
                        />
                      );
                    })
                  )}
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

      <DataInsightModal
        visible={dataInsightVisible}
        onClose={() => setDataInsightVisible(false)}
        description={featureDetail?.description}
        bullets={productBullets}
      />
    </View>
  );
}
