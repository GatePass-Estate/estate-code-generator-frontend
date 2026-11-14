import { useGoBack } from '@/src/shared/hooks/useGoBack';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Pressable, ScrollView, Image } from 'react-native';
import { showAlert } from '@/src/shared/utils/alert';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorMessage } from '@/src/shared/services/api/errors';
import LoadError from '@/src/shared/components/feedback/LoadError';
import ScreenLoading from '@/src/shared/components/feedback/ScreenLoading';
import { logger } from '@/src/shared/utils/logger';
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
import MarketplaceConfirmModal, {
  emptyMarketplaceConfirm,
} from '@/src/features/ai/components/shared/MarketplaceConfirmModal';
import MarketplaceTierList, {
  tierOrder,
} from '@/src/features/ai/components/shared/MarketplaceTierList';
import RatingModal from '@/src/features/ai/components/shared/RatingModal';
import DataInsightModal from '@/src/features/ai/components/shared/DataInsightModal';
import {
  ANOMALY_INSIGHT_PAGE_COUNT,
  AnomalyInsightPage,
} from '@/src/features/ai/components/anomaly/modals/anomalyInsightStory';
import ActivationQuoteModal from '@/src/features/ai/components/shared/ActivationQuoteModal';
import AnomalyResultView from '@/src/features/ai/components/anomaly/AnomalyResultView';
import { refreshEstateEntitlements } from '@/src/features/billing';
import { usePaystackCheckout } from '@/src/features/billing/utils/billingCheckout';
import {
  subscribeMarketplaceFeature,
  getFeaturePictureUrl,
  rateMarketplaceFeature,
  uninstallAiFeature,
  installAiFeature,
  cancelMarketplaceSubscription,
  sortMarketplaceTiers,
} from '@/src/features/marketplace/services/aiMarketplace';
import { useMarketplaceFeature } from '@/src/features/marketplace/hooks/useMarketplaceFeature';
import { useBillingAccess } from '@/src/features/billing/hooks/billing';
import {
  useFeatureGate,
  useContactAdminNoticeStore,
  useUpgradePromptStore,
} from '@/src/features/billing/hooks/usePlan';
import { scrollCardIntoView } from '@/src/shared/utils/scrollIntoView';
import { useUserStore } from '@/src/store/userStore';
import {
  MarketplaceTier,
  AiCheckoutDuration,
  AiQuoteResponse,
} from '@/src/features/marketplace/types/aiMarketplace';

/** Tier One is the base product: it unlocks the Result page. Tiers Two and Three add to it. */
const TIER_ONE_FOR_RESULT_MESSAGE =
  'Subscribe to Tier One (Anomaly Detection and Insights) to view your results.';
const INSTALL_TIER_ONE_FOR_RESULT_MESSAGE =
  'Install Tier One (Anomaly Detection and Insights) to view your results.';
const TIER_ONE_FIRST_MESSAGE = 'Tier One is required for Tier 2 and Tier 3 activation.';
const INSTALL_TIER_ONE_FIRST_MESSAGE = 'Tier One is required for Tier 2 and Tier 3 activation.';

const isAnomalyProduct = (name: string) => name.toLowerCase().includes('anomaly');

const isTierActive = (tier: MarketplaceTier) =>
  !!tier.is_installed ||
  !!tier.purchased ||
  ['active', 'purchased', 'subscribed', 'installed'].includes(tier.status ?? '');

/** Shown when the server refuses the Result data although Tier One is active. */
const SUBSCRIPTION_NOT_LINKED_MESSAGE =
  'Your subscription is active, but it isn’t linked to Anomaly Detection Insights yet. Please contact support.';

export default function AnomalyDetectionPreviewScreen() {
  const goBack = useGoBack();
  const params = useLocalSearchParams<{
    featureId?: string;
    title?: string;
    tab?: string;
    expandTier?: string;
  }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Result'>(
    params.tab === 'Result' ? 'Result' : 'Overview'
  );
  const [prevParamTab, setPrevParamTab] = useState(params.tab);
  if (params.tab !== prevParamTab) {
    setPrevParamTab(params.tab);
    setActiveTab(params.tab === 'Result' ? 'Result' : 'Overview');
  }
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribingTierKey, setSubscribingTierKey] = useState<string | null>(null);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [uninstallingTierKey, setUninstallingTierKey] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installingTierKey, setInstallingTierKey] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelTierKey, setCancelTierKey] = useState<string | null>(null);
  const [dataInsightVisible, setDataInsightVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [cardHeight, setCardHeight] = useState<number>(120);
  const [justPurchasedTiers, setJustPurchasedTiers] = useState<Record<string, boolean>>({});
  const [justCancelledTiers, setJustCancelledTiers] = useState<Record<string, boolean>>({});
  // The server refused the Result data; remembered so the next tap shows the prompt straight away.
  const [serverDenied, setServerDenied] = useState(false);
  const [activationModalVisible, setActivationModalVisible] = useState(false);
  const [selectedTierForActivation, setSelectedTierForActivation] =
    useState<MarketplaceTier | null>(null);
  // Shared Paystack checkout: one lifecycle (idempotent start, resume after cancel, verification)
  // for plan, seat and AI purchases, and it also works on web (redirect), unlike an embedded WebView.
  const { startCheckout, isRunning: checkoutRunning, checkoutSheet } = usePaystackCheckout();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState(emptyMarketplaceConfirm);

  const estateId = useUserStore((state) => state.estate_id) || '';
  const { denyIfUnauthorized, notifyActionError } = useBillingAccess();
  const { featureDetail, isLoading, loadError, refetch } = useMarketplaceFeature({
    featureId: typeof params.featureId === 'string' ? params.featureId : undefined,
    nameMatch: isAnomalyProduct,
    estateId,
  });

  const handleRate = async (rating: number) => {
    if (!hasFeatureEntitlement) {
      showAlert(
        'Rating Unavailable',
        'You need an active subscription or entitlement to this AI feature before you can rate it.'
      );
      return;
    }
    const targetId = featureDetail?.id || params.featureId;
    if (!targetId) return;
    try {
      await rateMarketplaceFeature(targetId, { score: rating });
      await refetch();
      showAlert('Success', 'Rating submitted successfully');
    } catch (err: unknown) {
      showAlert('Error', errorMessage(err) || 'Failed to submit rating');
      throw err;
    }
  };

  const refreshAfterTierChange = useCallback(async () => {
    setServerDenied(false);
    refreshEstateEntitlements();
    void queryClient.invalidateQueries({ queryKey: queryKeys.anomaly.all });
    await refetch();
  }, [queryClient, refetch]);

  useFocusEffect(
    useCallback(() => {
      refreshEstateEntitlements();
      void queryClient.invalidateQueries({ queryKey: queryKeys.anomaly.all });
    }, [queryClient])
  );

  useEffect(() => {
    if (!estateId) return;
    AsyncStorage.getItem(`cancelledTiers-${estateId}`)
      .then((stored) => {
        if (stored) setJustCancelledTiers(JSON.parse(stored));
      })
      .catch((e) => logger.error('Could not load cancelled tiers', e));
  }, [estateId]);

  useEffect(() => {
    if (!featureDetail) return;
    const tiers = sortMarketplaceTiers(featureDetail.tiers ?? []);
    setExpandedTier((prev) => (prev && tiers.some((tier) => tier.tier === prev) ? prev : null));
  }, [featureDetail]);

  const handleActivateFreeTier = async (tierPayload: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    if (!featureDetail?.id || (!tierPayload.ai_feature_id && !tierPayload.feature_key)) {
      return;
    }

    setSubscribingTierKey(tierPayload.tier);
    setIsSubscribing(true);
    try {
      if (tierPayload.feature_key) {
        await installAiFeature(estateId, tierPayload.feature_key);
      } else {
        if (!tierPayload.ai_feature_id) {
          showAlert('Error', 'Missing feature identifier.');
          return;
        }
        await subscribeMarketplaceFeature(featureDetail.id, {
          ai_feature_id: tierPayload.ai_feature_id,
          period_months: 1,
        });
      }
      showAlert('Success', 'Free feature tier activated successfully!');
      void refetch();
    } catch (err: unknown) {
      notifyActionError(
        'Activation Failed',
        { message: errorMessage(err) },
        'Failed to activate tier.'
      );
    } finally {
      setIsSubscribing(false);
      setSubscribingTierKey(null);
    }
  };

  const handlePressActivate = (tierPayload: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    if (requireTierOne(tierPayload.tier)) return;
    if (tierPayload.is_free) {
      handleActivateFreeTier(tierPayload);
      return;
    }
    setSelectedTierForActivation(tierPayload);
    setActivationModalVisible(true);
  };

  const handleConfirmActivation = async (duration: AiCheckoutDuration, _quote: AiQuoteResponse) => {
    if (denyIfUnauthorized()) return;
    const tier = selectedTierForActivation;
    if (!tier?.feature_key) {
      showAlert('Error', 'Feature key is missing for this tier.');
      return;
    }

    setActivationModalVisible(false);
    const outcome = await startCheckout({
      checkout_kind: 'ai_only',
      ai_feature_keys: [tier.feature_key],
      period_months: duration,
    });
    if (outcome === 'error') return;

    if (outcome === 'paid' && estateId) {
      setInstallingTierKey(tier.tier);
      setIsInstalling(true);
      try {
        await installAiFeature(estateId, tier.feature_key);
        setJustPurchasedTiers((prev) => ({ ...prev, [tier.tier]: false }));
      } catch (err: unknown) {
        setJustPurchasedTiers((prev) => ({ ...prev, [tier.tier]: true }));
        notifyActionError(
          'Install Failed',
          { message: errorMessage(err) },
          'Payment succeeded, but the feature could not be installed. Tap Install to try again.'
        );
      } finally {
        setIsInstalling(false);
        setInstallingTierKey(null);
      }
    }

    if (outcome === 'paid' || outcome === 'pending') {
      // Bought again after cancelling: no longer "just cancelled".
      setJustCancelledTiers((prev) => {
        const next = { ...prev, [tier.tier]: false };
        if (estateId)
          AsyncStorage.setItem(`cancelledTiers-${estateId}`, JSON.stringify(next)).catch((error) =>
            logger.error('Could not save cancelled tiers', error)
          );
        return next;
      });
    }
    void refetch();
  };

  const handleCancelSubscription = async (tierPayload: {
    tier: string;
    feature_key?: string | null;
  }) => {
    if (denyIfUnauthorized()) return;
    setConfirmModalConfig({
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel your subscription to this AI feature?',
      cancelText: 'No',
      confirmText: 'Yes, Cancel',
      confirmStyle: 'destructive',
      onConfirm: async () => {
        setConfirmModalVisible(false);
        setCancelTierKey(tierPayload.tier);
        setIsCanceling(true);
        try {
          await cancelMarketplaceSubscription(estateId, tierPayload.feature_key || undefined);
          showAlert('Success', 'Subscription cancelled successfully.');
          setJustCancelledTiers((prev) => {
            const next = { ...prev, [tierPayload.tier]: true };
            if (estateId)
              AsyncStorage.setItem(`cancelledTiers-${estateId}`, JSON.stringify(next)).catch(
                (error) => logger.error('Could not save cancelled tiers', error)
              );
            return next;
          });
          await refreshAfterTierChange();
        } catch (err: unknown) {
          const cancelMessage = errorMessage(err) || 'Failed to cancel subscription.';
          // If Paystack says it failed to disable, it's almost certainly because it's already cancelled
          if (
            cancelMessage.toLowerCase().includes('disable subscription failed') ||
            cancelMessage.toLowerCase().includes('already')
          ) {
            setJustCancelledTiers((prev) => {
              const next = { ...prev, [tierPayload.tier]: true };
              if (estateId)
                AsyncStorage.setItem(`cancelledTiers-${estateId}`, JSON.stringify(next)).catch(
                  (error) => logger.error('Could not save cancelled tiers', error)
                );
              return next;
            });
            showAlert('Already Cancelled', 'Your subscription has already been cancelled.');
          } else {
            showAlert('Cancellation Failed', cancelMessage);
          }
        } finally {
          setIsCanceling(false);
          setCancelTierKey(null);
        }
      },
    });
    setConfirmModalVisible(true);
  };

  const handleUninstall = async (tierPayload: {
    id?: string;
    tier: string;
    feature_key?: string | null;
  }) => {
    if (denyIfUnauthorized()) return;
    if (requireTierOne(tierPayload.tier)) return;
    if (!estateId) {
      showAlert('Error', 'Estate ID not found');
      return;
    }
    if (!tierPayload.feature_key) {
      showAlert('Error', 'Feature key is missing for this tier.');
      return;
    }

    setConfirmModalConfig({
      title: 'Uninstall Feature',
      message: 'Are you sure you want to uninstall this feature?',
      cancelText: 'Cancel',
      confirmText: 'Uninstall',
      confirmStyle: 'destructive',
      onConfirm: async () => {
        setConfirmModalVisible(false);
        setUninstallingTierKey(tierPayload.tier);
        setIsUninstalling(true);
        try {
          await uninstallAiFeature(estateId, tierPayload.feature_key!);
          showAlert('Success', 'Feature uninstalled successfully.');
          await refreshAfterTierChange();
        } catch (err: unknown) {
          notifyActionError(
            'Uninstall Failed',
            { message: errorMessage(err) },
            'Failed to uninstall feature.'
          );
        } finally {
          setIsUninstalling(false);
          setUninstallingTierKey(null);
        }
      },
    });
    setConfirmModalVisible(true);
  };

  const handleInstall = async (tierPayload: {
    id?: string;
    tier: string;
    feature_key?: string | null;
  }) => {
    if (denyIfUnauthorized()) return;
    if (requireTierOne(tierPayload.tier)) return;
    if (!estateId) {
      showAlert('Error', 'Estate ID not found');
      return;
    }
    if (!tierPayload.feature_key) {
      showAlert('Error', 'Feature key is missing for this tier.');
      return;
    }

    setInstallingTierKey(tierPayload.tier);
    setIsInstalling(true);
    try {
      await installAiFeature(estateId, tierPayload.feature_key);
      showAlert('Success', 'Feature installed successfully.');
      setJustPurchasedTiers((prev) => ({ ...prev, [tierPayload.tier]: false }));
      await refreshAfterTierChange();
    } catch (err: unknown) {
      notifyActionError(
        'Install Failed',
        { message: errorMessage(err) },
        'Failed to install feature.'
      );
    } finally {
      setIsInstalling(false);
      setInstallingTierKey(null);
    }
  };

  const sortedTiers = featureDetail?.tiers ? sortMarketplaceTiers(featureDetail.tiers) : [];
  const tierOne = sortedTiers.find((tier) => tierOrder(tier) === 1);

  const isTierSubscribed = useCallback(
    (tier?: MarketplaceTier | null) => {
      if (!tier) return false;
      const tierKey = tier.tier;
      if (justCancelledTiers[tierKey]) return false;
      return (
        tier.status === 'active' ||
        tier.status === 'purchased' ||
        tier.status === 'subscribed' ||
        tier.status === 'installed' ||
        Boolean(tier.purchased)
      );
    },
    [justCancelledTiers]
  );

  // Tier One is the base product; Tiers Two and Three are add-ons that need it installed. Paying
  // makes a tier "installed" on the server before the user has chosen to install it, so a tier
  // just purchased still counts as not installed (as the Install / Uninstall button does). Until
  // the tiers load there is nothing to judge, so nothing is blocked.
  const tierOneInstalled = featureDetail
    ? !!tierOne &&
      (!!tierOne.is_installed || tierOne.status === 'installed') &&
      !justPurchasedTiers[tierOne.tier]
    : undefined;
  const tierOneSubscribed = featureDetail ? !!tierOne && isTierActive(tierOne) : undefined;
  const resultAllowed = tierOneInstalled !== false && !serverDenied;
  const tierOneRef = useRef<View>(null);
  const tierCardRefs = useRef<Record<number, View | null>>({});
  const viewportHeightRef = useRef(0);
  const scrollViewRef = useRef<ScrollView>(null);

  /** "Upgrade" goes to the Overview tab with that tier opened and in view. */
  const showTier = (order: number) => {
    const tier = sortedTiers.find((item) => tierOrder(item) === order);
    if (tier) setExpandedTier(tier.tier);
    setActiveTab('Overview');
    // The card grows when opened, so let it lay out first.
    setTimeout(
      () =>
        scrollCardIntoView(
          scrollViewRef.current,
          tierCardRefs.current[order] ?? tierOneRef.current,
          viewportHeightRef.current
        ),
      450
    );
  };
  const showTierOne = () => showTier(1);
  const openedExpandTier = useRef<string | null>(null);
  useEffect(() => {
    if (params.expandTier !== '2') {
      openedExpandTier.current = null;
      return;
    }
    if (!sortedTiers.length || openedExpandTier.current === '2') return;
    openedExpandTier.current = '2';
    showTier(2);
    // showTier reads sortedTiers (already listed) plus stable setters and refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.expandTier, sortedTiers]);
  const { showDenied: showResultDenied } = useFeatureGate('access_anomaly_detection_tier_1', {
    notice: 'floating',
    onUpgrade: showTierOne,
  });
  /** True (after prompting) when a Tier Two or Three action needs Tier One first. */
  const requireTierOne = (tierName: string) => {
    const order = Number.parseInt(tierName.replace(/\D/g, ''), 10) || 0;
    if (order <= 1 || tierOneInstalled !== false) return false;
    showResultDenied(tierOneSubscribed ? INSTALL_TIER_ONE_FIRST_MESSAGE : TIER_ONE_FIRST_MESSAGE);
    return true;
  };
  const [resultLocked, setResultLocked] = useState(false);
  const promptVisible = useUpgradePromptStore((s) => s.visible);
  const noticeVisible = useContactAdminNoticeStore((s) => s.visible);

  useEffect(() => {
    if (resultLocked && !promptVisible && !noticeVisible) {
      setResultLocked(false);
      setActiveTab('Overview');
    }
  }, [resultLocked, promptVisible, noticeVisible]);

  // Also covers arriving with `?tab=Result` and the tiers finishing loading while on Result.
  useEffect(() => {
    if (activeTab !== 'Result' || resultLocked || resultAllowed) return;
    setResultLocked(true);
    // With a tier active, upgrading isn't the fix: the server hasn't linked the subscription.
    showResultDenied(
      tierOneInstalled
        ? SUBSCRIPTION_NOT_LINKED_MESSAGE
        : tierOneSubscribed
          ? INSTALL_TIER_ONE_FOR_RESULT_MESSAGE
          : TIER_ONE_FOR_RESULT_MESSAGE
    );
  }, [
    activeTab,
    resultLocked,
    resultAllowed,
    tierOneInstalled,
    tierOneSubscribed,
    showResultDenied,
  ]);

  const hasFeatureEntitlement =
    Boolean(tierOneInstalled) ||
    sortedTiers.some(
      (tier) =>
        (Boolean(tier.is_installed) || isTierSubscribed(tier)) && !justCancelledTiers[tier.tier]
    );

  const handleTabPress = (tab: 'Overview' | 'Result') => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

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

        {activeTab === 'Result' && (resultLocked || !resultAllowed) ? (
          <View style={{ flex: 1, backgroundColor: '#F6F7F7' }} />
        ) : activeTab === 'Result' ? (
          <AnomalyResultView
            isActive={activeTab === 'Result'}
            onAccessDenied={() => setServerDenied(true)}
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
                  onToggle={(tierKey) => setExpandedTier(expandedTier === tierKey ? null : tierKey)}
                  tierOneRef={tierOneRef}
                  onTierCardRef={(order, node) => {
                    tierCardRefs.current[order] = node;
                  }}
                  justPurchasedTiers={justPurchasedTiers}
                  justCancelledTiers={justCancelledTiers}
                  subscribingTierKey={subscribingTierKey}
                  cancelTierKey={cancelTierKey}
                  uninstallingTierKey={uninstallingTierKey}
                  installingTierKey={installingTierKey}
                  actionsLocked={{
                    subscribe: isSubscribing,
                    cancel: isCanceling,
                    install: isInstalling,
                    uninstall: isUninstalling,
                  }}
                  onActivate={handlePressActivate}
                  onCancel={(tier) => void handleCancelSubscription(tier)}
                  onUninstall={(tier) => void handleUninstall(tier)}
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
        visible={confirmModalVisible}
        config={confirmModalConfig}
        onClose={() => setConfirmModalVisible(false)}
      />

      <ActivationQuoteModal
        visible={activationModalVisible}
        onClose={() => setActivationModalVisible(false)}
        tier={selectedTierForActivation}
        estateId={estateId}
        onConfirm={handleConfirmActivation}
        isConfirming={checkoutRunning}
      />
    </View>
  );
}
