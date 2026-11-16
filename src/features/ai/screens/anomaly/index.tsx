import { useGoBack } from '@/src/shared/hooks/useGoBack';
import React, { useState } from 'react';
import { View, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoadError from '@/src/shared/components/feedback/LoadError';
import ScreenLoading from '@/src/shared/components/feedback/ScreenLoading';
import Animated, { FadeIn } from 'react-native-reanimated';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import Back from '@/src/shared/components/navigation/Back';
import AnimatedPillTabs from '@/src/shared/components/AnimatedPillTabs';

import AnomalySvg from '@/src/assets/images/anomaly.svg';
import {
  MarketplaceProductFeatureList,
  MarketplaceProductInfoCard,
  MarketplaceSectionTitle,
} from '@/src/features/ai/components/shared/MarketplaceProductSummary';
import MarketplaceConfirmModal from '@/src/features/ai/components/shared/MarketplaceConfirmModal';
import MarketplaceTierList from '@/src/features/ai/components/shared/MarketplaceTierList';
import RatingModal from '@/src/features/ai/components/shared/RatingModal';
import DataInsightModal from '@/src/features/ai/components/shared/DataInsightModal';
import {
  ANOMALY_INSIGHT_PAGE_COUNT,
  AnomalyInsightPage,
} from '@/src/features/ai/components/anomaly/modals/anomalyInsightStory';
import ActivationQuoteModal from '@/src/features/ai/components/shared/ActivationQuoteModal';
import AnomalyResultView from '@/src/features/ai/components/anomaly/AnomalyResultView';
import { getFeaturePictureUrl } from '@/src/features/marketplace/services/aiMarketplace';
import { useAnomalyProduct } from '@/src/features/ai/hooks/useAnomalyProduct';

export default function AnomalyDetectionPreviewScreen() {
  const goBack = useGoBack();
  const {
    estateId,
    featureDetail,
    isLoading,
    loadError,
    refetch,
    sortedTiers,
    activeTab,
    handleTabPress,
    resultBlocked,
    onResultAccessDenied,
    expandedTier,
    toggleTier,
    justPurchasedTiers,
    justCancelledTiers,
    installOverrides,
    scrollViewRef,
    viewportHeightRef,
    tierOneRef,
    tierCardRefs,
    tierListBusy,
    handlePressActivate,
    handleReactivate,
    handleCancelSubscription,
    handleUninstall,
    handleInstall,
    handleRate,
    activation,
    checkoutSheet,
    confirmModal,
  } = useAnomalyProduct();
  const [dataInsightVisible, setDataInsightVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [cardHeight, setCardHeight] = useState<number>(120);

  const isResultTab = activeTab === 'Result';

  return (
    <View style={{ flex: 1, backgroundColor: isResultTab ? '#F6F7F7' : '#FFFFFF' }}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        {/* Header: matches Figma top 55px to 109px (height 54px) */}
        <View
          style={{
            height: 54,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            backgroundColor: isResultTab ? '#F6F7F7' : '#FFFFFF',
          }}
        >
          <Back type="short-arrow" onPress={() => goBack()} />

          <AnimatedPillTabs
            options={[
              { value: 'Overview', label: 'Overview' },
              { value: 'Result', label: 'Result' },
            ]}
            value={activeTab}
            onChange={handleTabPress}
          />

          <Pressable
            onPress={() => setDataInsightVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Data insight"
            className="h-[30px] w-[30px] items-center justify-center"
            hitSlop={20}
            style={{ zIndex: 100 }}
          >
            <View pointerEvents="none">
              <BiInfoSvg width={24} height={24} />
            </View>
          </Pressable>
        </View>

        {activeTab === 'Result' && resultBlocked ? (
          <View style={{ flex: 1, backgroundColor: '#F6F7F7' }} />
        ) : activeTab === 'Result' ? (
          <AnomalyResultView
            isActive={activeTab === 'Result'}
            onAccessDenied={onResultAccessDenied}
          />
        ) : loadError && !featureDetail ? (
          <LoadError message={loadError} onRetry={() => void refetch()} />
        ) : isLoading && !featureDetail ? (
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
        ) : (
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1, backgroundColor: '#F6F7F7' }}
            contentContainerStyle={{ flexGrow: 1 }}
            onLayout={(e) => {
              viewportHeightRef.current = e.nativeEvent.layout.height;
            }}
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

                {/* Illustration (Figma: width 302, height 274, centered) */}
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
                    <AnomalySvg width={302} height={274} />
                  )}
                </View>

                <MarketplaceProductInfoCard
                  name={featureDetail?.name || 'Anomaly Detection'}
                  rating={featureDetail?.rating ?? 0}
                  description={featureDetail?.description}
                  installedCount={sortedTiers.filter((tier) => tier.is_installed).length}
                  ratingCount={featureDetail?.rating_count ?? 0}
                  onPressRating={() => setIsRatingModalVisible(true)}
                  onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    if (h && Math.abs(h - cardHeight) > 1) setCardHeight(h);
                  }}
                />
              </View>

              <View className="flex-1 bg-[#F6F7F7] px-5 pb-[100px] pt-[44px]">
                <MarketplaceProductFeatureList features={featureDetail?.product_features ?? []} />

                <MarketplaceSectionTitle>Choose Subscription Plan</MarketplaceSectionTitle>

                <MarketplaceTierList
                  feature={featureDetail}
                  tiers={sortedTiers}
                  expandedTier={expandedTier}
                  onToggle={toggleTier}
                  tierOneRef={tierOneRef}
                  onTierCardRef={(order, node) => {
                    tierCardRefs.current[order] = node;
                  }}
                  justPurchasedTiers={justPurchasedTiers}
                  justCancelledTiers={justCancelledTiers}
                  installOverrides={installOverrides}
                  {...tierListBusy}
                  onActivate={handlePressActivate}
                  onReactivate={(tier) => void handleReactivate(tier)}
                  onCancel={handleCancelSubscription}
                  onUninstall={handleUninstall}
                  onInstall={(tier) => void handleInstall(tier)}
                />
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
        dataInsight={featureDetail?.data_insight}
        pageCount={ANOMALY_INSIGHT_PAGE_COUNT}
        renderPage={(index) => <AnomalyInsightPage index={index} />}
      />

      {checkoutSheet}

      <MarketplaceConfirmModal
        visible={confirmModal.visible}
        config={confirmModal.config}
        onClose={confirmModal.close}
      />

      <ActivationQuoteModal
        visible={activation.visible}
        onClose={activation.close}
        tier={activation.tier}
        estateId={estateId}
        onConfirm={activation.confirm}
        isConfirming={activation.isConfirming}
      />
    </View>
  );
}
