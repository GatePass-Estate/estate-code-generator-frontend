import { useGoBack } from '@/src/shared/hooks/useGoBack';
import React, { useRef, useState } from 'react';
import { Platform, View, Text, Pressable, ScrollView } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import Back from '@/src/shared/components/navigation/Back';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';

import IncidentReportSvg from '@/src/assets/images/incident-report.svg';
import RatingModal from '@/src/features/ai/components/shared/RatingModal';
import ActivationQuoteModal from '@/src/features/ai/components/shared/ActivationQuoteModal';
import DataInsightModal from '@/src/features/ai/components/shared/DataInsightModal';
import {
  INCIDENT_INSIGHT_PAGE_COUNT,
  IncidentInsightPage,
} from '@/src/features/ai/components/incidents/modals/incidentInsightStory';
import IncidentResultView from '@/src/features/ai/components/incidents/IncidentResultView';
import {
  MarketplaceProductFeatureList,
  MarketplaceProductInfoCard,
  MarketplaceSectionTitle,
} from '@/src/features/ai/components/shared/MarketplaceProductSummary';
import MarketplaceConfirmModal from '@/src/features/ai/components/shared/MarketplaceConfirmModal';
import MarketplaceTierList from '@/src/features/ai/components/shared/MarketplaceTierList';
import AnimatedPillTabs from '@/src/shared/components/AnimatedPillTabs';
import { useIncidentProduct } from '@/src/features/ai/hooks/useIncidentProduct';

export default function IncidentReportPreviewScreen() {
  const goBack = useGoBack();
  const {
    estateId,
    featureDetail,
    isLoading,
    loadError,
    refetch,
    sortedTiers,
    productFeatures,
    activeTab,
    handleTabChange,
    resultBlocked,
    onResultAccessDenied,
    hasAiReviewTier,
    aiSummaryNeedsInstall,
    inHouseInstalled,
    thirdPartyInstalled,
    showAiSummaryTier,
    expandedTier,
    toggleTier,
    justPurchasedTiers,
    justCancelledTiers,
    installOverrides,
    scrollViewRef,
    viewportHeightRef,
    tierOneCardRef,
    tierCardRefs,
    tierListBusy,
    handleSubscribe,
    handleReactivate,
    handleCancelSubscription,
    handleUninstall,
    handleInstall,
    handleRate,
    activation,
    checkoutSheet,
    confirmModal,
  } = useIncidentProduct();
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [dataInsightVisible, setDataInsightVisible] = useState(false);
  const [cardHeight, setCardHeight] = useState<number>(120);
  // Keep Result mounted after the first successful open so Android doesn't flash blank on remount.
  const hasOpenedResultRef = useRef(false);
  if (activeTab === 'Result' && !resultBlocked) {
    hasOpenedResultRef.current = true;
  }
  const mountResult = hasOpenedResultRef.current && !resultBlocked;
  const isResultTab = activeTab === 'Result';
  const OverviewFade = Platform.OS === 'android' ? View : Animated.View;
  const overviewFadeProps = Platform.OS === 'android' ? {} : { entering: FadeIn.duration(280) };

  return (
    <View style={{ flex: 1, backgroundColor: isResultTab ? '#F6F7F7' : '#FFFFFF' }}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
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
              { value: 'Preview', label: 'Overview' },
              { value: 'Result', label: 'Result' },
            ]}
            value={activeTab}
            onChange={handleTabChange}
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

        {mountResult ? (
          <View
            collapsable={false}
            pointerEvents={isResultTab ? 'auto' : 'none'}
            style={{ flex: 1, display: isResultTab ? 'flex' : 'none' }}
          >
            <IncidentResultView
              isActive={isResultTab}
              onAccessDenied={onResultAccessDenied}
              hasAiReviewTier={hasAiReviewTier}
              aiSummaryNeedsInstall={aiSummaryNeedsInstall}
              inHouseInstalled={inHouseInstalled}
              thirdPartyInstalled={thirdPartyInstalled}
              onUpgradeAiSummary={showAiSummaryTier}
            />
          </View>
        ) : null}

        {isResultTab && resultBlocked ? (
          <View
            style={{
              flex: 1,
              backgroundColor: '#F6F7F7',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CircleLoader size={36} />
          </View>
        ) : isResultTab ? null : isLoading && !featureDetail ? (
          <View
            style={{
              flex: 1,
              backgroundColor: '#F6F7F7',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CircleLoader size={36} />
          </View>
        ) : !featureDetail ? (
          <View className="flex-1 items-center justify-center bg-[#F6F7F7] px-8">
            <Text className="text-center text-sm font-inter-medium text-primary">
              {loadError || 'No marketplace product returned for this feature.'}
            </Text>
            <Pressable
              onPress={() => void refetch()}
              className="mt-4 rounded-full bg-primary px-5 py-3"
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
            onLayout={(e) => {
              viewportHeightRef.current = e.nativeEvent.layout.height;
            }}
          >
            <OverviewFade {...overviewFadeProps}>
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

                <MarketplaceProductInfoCard
                  name={featureDetail.name || ''}
                  rating={featureDetail.rating ?? 0}
                  description={featureDetail.description}
                  installedCount={sortedTiers.filter((tier) => tier.is_installed).length}
                  ratingCount={featureDetail.rating_count ?? 0}
                  onPressRating={() => setIsRatingModalVisible(true)}
                  onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    if (h && Math.abs(h - cardHeight) > 1) setCardHeight(h);
                  }}
                />
              </View>

              <View className="flex-1 bg-[#F6F7F7] px-5 pb-[100px] pt-[44px]">
                <MarketplaceProductFeatureList features={productFeatures} />

                <MarketplaceSectionTitle>Choose Subscription Plan</MarketplaceSectionTitle>

                <MarketplaceTierList
                  feature={featureDetail}
                  tiers={sortedTiers}
                  expandedTier={expandedTier}
                  onToggle={toggleTier}
                  tierOneRef={tierOneCardRef}
                  onTierCardRef={(order, node) => {
                    tierCardRefs.current[order] = node;
                  }}
                  justPurchasedTiers={justPurchasedTiers}
                  justCancelledTiers={justCancelledTiers}
                  installOverrides={installOverrides}
                  {...tierListBusy}
                  onActivate={(tier) => void handleSubscribe(tier)}
                  onReactivate={(tier) => void handleReactivate(tier)}
                  onCancel={handleCancelSubscription}
                  onUninstall={handleUninstall}
                  onInstall={(tier) => void handleInstall(tier)}
                />
              </View>
            </OverviewFade>
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
        pageCount={INCIDENT_INSIGHT_PAGE_COUNT}
        renderPage={(index) => <IncidentInsightPage index={index} />}
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
        onConfirm={(duration) => activation.confirm(duration)}
        isConfirming={activation.isConfirming}
      />
    </View>
  );
}
