import { useGoBack } from '@/src/shared/hooks/useGoBack';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { showAlert } from '@/src/shared/utils/alert';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorMessage } from '@/src/shared/services/api/errors';
import { logger } from '@/src/shared/utils/logger';
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
import MarketplaceConfirmModal, {
  emptyMarketplaceConfirm,
} from '@/src/features/ai/components/shared/MarketplaceConfirmModal';
import MarketplaceTierList, {
  tierOrder,
} from '@/src/features/ai/components/shared/MarketplaceTierList';
import AnimatedPillTabs from '@/src/shared/components/AnimatedPillTabs';
import {
  installAiFeature,
  rateMarketplaceFeature,
  sortMarketplaceTiers,
  subscribeMarketplaceFeature,
  uninstallAiFeature,
  cancelMarketplaceSubscription,
} from '@/src/features/marketplace/services/aiMarketplace';
import { useMarketplaceFeature } from '@/src/features/marketplace/hooks/useMarketplaceFeature';
import { usePaystackCheckout } from '@/src/features/billing/utils/billingCheckout';
import { refreshEstateEntitlements } from '@/src/features/billing';
import { useBillingAccess } from '@/src/features/billing/hooks/billing';
import { useUserStore } from '@/src/store/userStore';
import { scrollCardIntoView } from '@/src/shared/utils/scrollIntoView';
import {
  useContactAdminNoticeStore,
  useFeatureGate,
  useUpgradePromptStore,
} from '@/src/features/billing/hooks/usePlan';
import {
  AiCheckoutDuration,
  MarketplaceTier,
} from '@/src/features/marketplace/types/aiMarketplace';

const isIncidentProduct = (name: string) => name.toLowerCase().includes('incident');

/** Tier One is the base product: it unlocks the Result page. Tiers Two and Three add to it. */
const TIER_ONE_FOR_RESULT_MESSAGE =
  'Subscribe to Tier One (Incident Report Summary and Insights) to view your results.';
const INSTALL_TIER_ONE_FOR_RESULT_MESSAGE =
  'Install Tier One (Incident Report Summary and Insights) to view your results.';
const TIER_ONE_FIRST_MESSAGE = 'Tier One is required for Tier 2 and Tier 3 activation.';

const isTierActive = (tier: MarketplaceTier) =>
  !!tier.is_installed ||
  !!tier.purchased ||
  ['active', 'purchased', 'subscribed', 'installed'].includes(tier.status ?? '');

/** Shown when the server refuses the Result data although Tier One is active. */
const SUBSCRIPTION_NOT_LINKED_MESSAGE =
  'Your subscription is active, but it isn’t linked to Incident Report Insights yet. Please contact support.';

/** Separate from anomaly's `cancelledTiers-*` key, which is keyed by its own tier names. */
const cancelledTiersStorageKey = (estateId: string) => `incidentCancelledTiers-${estateId}`;

export default function IncidentReportPreviewScreen() {
  const goBack = useGoBack();
  const params = useLocalSearchParams<{ featureId?: string; title?: string; tab?: string }>();
  const estateId = useUserStore((s) => s.estate_id);
  const { denyIfUnauthorized, notifyActionError } = useBillingAccess();
  const { featureDetail, isLoading, loadError, refetch } = useMarketplaceFeature({
    featureId: typeof params.featureId === 'string' ? params.featureId : undefined,
    nameMatch: isIncidentProduct,
    estateId: estateId || undefined,
  });
  const [activeTab, setActiveTab] = useState<'Preview' | 'Result'>(
    params.tab === 'Result' ? 'Result' : 'Preview'
  );
  const [prevParamTab, setPrevParamTab] = useState(params.tab);
  if (params.tab !== prevParamTab) {
    setPrevParamTab(params.tab);
    setActiveTab(params.tab === 'Result' ? 'Result' : 'Preview');
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
  const [justPurchasedTiers, setJustPurchasedTiers] = useState<Record<string, boolean>>({});
  const [justCancelledTiers, setJustCancelledTiers] = useState<Record<string, boolean>>({});
  // The server refused the Result data; remembered so the next tap shows the prompt straight away.
  const [serverDenied, setServerDenied] = useState(false);
  // Duration quote → Paystack → payment check, the same flow as the anomaly product.
  const [activationModalVisible, setActivationModalVisible] = useState(false);
  const [selectedTierForActivation, setSelectedTierForActivation] =
    useState<MarketplaceTier | null>(null);
  // Shared Paystack checkout (same lifecycle as plan and seat purchases; works on web too).
  const { startCheckout, isRunning: checkoutRunning, checkoutSheet } = usePaystackCheckout();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState(emptyMarketplaceConfirm);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [dataInsightVisible, setDataInsightVisible] = useState(false);
  const [cardHeight, setCardHeight] = useState<number>(120);

  useEffect(() => {
    if (!estateId) return;
    AsyncStorage.getItem(cancelledTiersStorageKey(estateId))
      .then((stored) => {
        if (stored) setJustCancelledTiers(JSON.parse(stored));
      })
      .catch((error) => logger.error('Could not load cancelled tiers', error));
  }, [estateId]);

  useEffect(() => {
    if (!featureDetail) return;
    const tiers = sortMarketplaceTiers(featureDetail.tiers ?? []);
    setExpandedTier((prev) => (prev && tiers.some((tier) => tier.tier === prev) ? prev : null));
  }, [featureDetail]);

  const markTierCancelled = (tierKey: string, cancelled: boolean) => {
    setJustCancelledTiers((prev) => {
      const next = { ...prev, [tierKey]: cancelled };
      if (estateId) {
        AsyncStorage.setItem(cancelledTiersStorageKey(estateId), JSON.stringify(next)).catch(
          (error) => logger.error('Could not save cancelled tiers', error)
        );
      }
      return next;
    });
  };

  const queryClient = useQueryClient();
  /** Tier entitlements changed → drop cached summaries so Result can't show a removed tier. */
  const refreshAfterTierChange = async () => {
    setServerDenied(false);
    queryClient.removeQueries({ queryKey: [...queryKeys.incidents.all, 'summary'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all });
    await Promise.all([refreshEstateEntitlements(), refetch()]);
  };

  const handleRate = async (rating: number) => {
    if (!hasFeatureEntitlement) {
      showAlert(
        'Rating Unavailable',
        'You need an active subscription or entitlement to this AI feature before you can rate it.'
      );
      return;
    }
    const targetId = featureDetail?.id;
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

  const handleSubscribe = async (tier: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    if (requireTierOne(tier)) return;
    if (!featureDetail?.id || (!tier.ai_feature_id && !tier.feature_key)) {
      return;
    }

    setSubscribingTierKey(tier.tier);
    setIsSubscribing(true);
    try {
      if (tier.is_free) {
        if (tier.feature_key) {
          await installAiFeature(estateId || '', tier.feature_key);
        } else {
          await subscribeMarketplaceFeature(featureDetail.id, {
            ai_feature_id: tier.ai_feature_id,
            period_months: 1,
          });
        }
        showAlert('Success', 'Free feature tier activated successfully!');
        await refreshAfterTierChange();
      } else if (tier.feature_key) {
        // Paid tier: pick a duration and see the price before Paystack.
        setSelectedTierForActivation(tier);
        setActivationModalVisible(true);
      } else {
        await subscribeMarketplaceFeature(featureDetail.id, {
          ai_feature_id: tier.ai_feature_id,
          period_months: 1,
        });
        showAlert('Success', 'Subscription quote created successfully.');
      }
    } catch (err: unknown) {
      notifyActionError(
        'Subscription Failed',
        { message: errorMessage(err) },
        'Failed to activate tier.'
      );
    } finally {
      setIsSubscribing(false);
      setSubscribingTierKey(null);
    }
  };

  const handleConfirmActivation = async (duration: AiCheckoutDuration) => {
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
    if (outcome === 'paid' || outcome === 'pending') markTierCancelled(tier.tier, false);
    void refreshAfterTierChange();
  };

  const handleCancelSubscription = (tier: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;

    setConfirmModalConfig({
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel your subscription to this AI feature?',
      cancelText: 'No',
      confirmText: 'Yes, Cancel',
      confirmStyle: 'destructive',
      onConfirm: async () => {
        setConfirmModalVisible(false);
        setCancelTierKey(tier.tier);
        setIsCanceling(true);
        try {
          await cancelMarketplaceSubscription(estateId || '');
          showAlert('Success', 'Subscription cancelled successfully.');
          markTierCancelled(tier.tier, true);
          await refreshAfterTierChange();
        } catch (err: unknown) {
          const cancelMessage = errorMessage(err) || 'Failed to cancel subscription.';
          // Paystack rejects disabling a subscription that is already cancelled.
          if (
            cancelMessage.toLowerCase().includes('disable subscription failed') ||
            cancelMessage.toLowerCase().includes('already')
          ) {
            markTierCancelled(tier.tier, true);
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

  const handleUninstall = (tier: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    if (!estateId) {
      showAlert('Error', 'Estate ID not found');
      return;
    }
    const featureKey = tier.feature_key;
    if (!featureKey) {
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
        setUninstallingTierKey(tier.tier);
        setIsUninstalling(true);
        try {
          await uninstallAiFeature(estateId, featureKey);
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

  const handleInstall = async (tier: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    if (requireTierOne(tier)) return;
    if (!estateId) {
      showAlert('Error', 'Estate ID not found');
      return;
    }
    if (!tier.feature_key) {
      showAlert('Error', 'Feature key is missing for this tier.');
      return;
    }

    setInstallingTierKey(tier.tier);
    setIsInstalling(true);
    try {
      await installAiFeature(estateId, tier.feature_key);
      showAlert('Success', 'Feature installed successfully.');
      setJustPurchasedTiers((prev) => ({ ...prev, [tier.tier]: false }));
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

  const sortedTiers = useMemo(
    () => sortMarketplaceTiers(featureDetail?.tiers ?? []),
    [featureDetail?.tiers]
  );

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

  /** Tier 2 = In-house summary, tier 3 = Third-party summary; undefined until tiers load. */
  const isTierInstalled = (num: number) =>
    featureDetail
      ? sortedTiers.some(
          (tier) =>
            (tier.is_installed || tier.status === 'installed') &&
            (Number.parseInt(tier.tier.replace(/\D/g, ''), 10) || 0) === num
        )
      : undefined;
  const inHouseInstalled = isTierInstalled(2);
  const thirdPartyInstalled = isTierInstalled(3);
  const hasAiReviewTier =
    inHouseInstalled === undefined ? undefined : !!(inHouseInstalled || thirdPartyInstalled);
  const productFeatures = (featureDetail?.product_features ?? [])
    .map((text) => text.trim())
    .filter(Boolean);

  const scrollViewRef = useRef<ScrollView>(null);
  const tierOneCardRef = useRef<View>(null);
  const viewportHeightRef = useRef(0);

  // Tier One is what unlocks Result; Tiers Two and Three are add-ons. The entitlements endpoint
  // doesn't list the AI tiers, so the marketplace status (the same data behind Install /
  // Uninstall) decides. While it's still loading the tab opens; the server's 402/403 is then
  // handled by the Result view itself. A locked estate sees the tab switch and the plan prompt
  // together, with nothing fetched; closing the prompt takes the tab back to Overview.
  // Paying makes a tier "installed" on the server before the user has chosen to install it, so a
  // tier just purchased still counts as not installed (as the Install / Uninstall button does).
  const tierOne = sortedTiers.find((tier) => tierOrder(tier) === 1);
  const tierOneInstalled = featureDetail
    ? !!tierOne &&
      (!!tierOne.is_installed || tierOne.status === 'installed') &&
      !justPurchasedTiers[tierOne.tier]
    : undefined;
  const tierOneSubscribed = featureDetail ? !!tierOne && isTierActive(tierOne) : undefined;
  const resultAllowed = tierOneInstalled !== false && !serverDenied;
  // "Upgrade" goes to Overview with the tier that unlocks that action opened on Activate.
  const tierCardRefs = useRef<Record<number, View | null>>({});
  const showTier = (order: number) => {
    const tier = sortedTiers.find((item) => tierOrder(item) === order);
    if (tier) setExpandedTier(tier.tier);
    setActiveTab('Preview');
    // The plan list mounts with the tab and the card grows when opened, so let both lay out first.
    setTimeout(
      () =>
        scrollCardIntoView(
          scrollViewRef.current,
          tierCardRefs.current[order] ?? tierOneCardRef.current,
          viewportHeightRef.current
        ),
      450
    );
  };
  const showTierOne = () => showTier(1);
  const { showDenied: showResultDenied } = useFeatureGate('incident_report_summary_tier_1', {
    notice: 'floating',
    onUpgrade: showTierOne,
  });
  /** True (after prompting) when a Tier Two or Three action needs Tier One first. */
  const requireTierOne = (tier: MarketplaceTier) => {
    if (tierOrder(tier) <= 1 || tierOneInstalled !== false) return false;
    showResultDenied(TIER_ONE_FIRST_MESSAGE);
    return true;
  };
  const [resultLocked, setResultLocked] = useState(false);
  const promptVisible = useUpgradePromptStore((s) => s.visible);
  const noticeVisible = useContactAdminNoticeStore((s) => s.visible);

  useEffect(() => {
    if (resultLocked && !promptVisible && !noticeVisible) {
      setResultLocked(false);
      setActiveTab('Preview');
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

        {activeTab === 'Result' && (resultLocked || !resultAllowed) ? (
          <View style={{ flex: 1, backgroundColor: '#F6F7F7' }} />
        ) : activeTab === 'Result' ? (
          <IncidentResultView
            isActive={activeTab === 'Result'}
            onAccessDenied={() => setServerDenied(true)}
            hasAiReviewTier={hasAiReviewTier}
            inHouseInstalled={inHouseInstalled}
            thirdPartyInstalled={thirdPartyInstalled}
            onUpgradeAiSummary={() => showTier(2)}
          />
        ) : isLoading && !featureDetail ? (
          <View
            style={{
              flex: 1,
              backgroundColor: '#F6F7F7',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CircleLoader size={48} />
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
                  onToggle={(tierKey) => setExpandedTier(expandedTier === tierKey ? null : tierKey)}
                  tierOneRef={tierOneCardRef}
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
                  onActivate={(tier) => void handleSubscribe(tier)}
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
        pageCount={INCIDENT_INSIGHT_PAGE_COUNT}
        renderPage={(index) => <IncidentInsightPage index={index} />}
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
        estateId={estateId || ''}
        onConfirm={(duration) => handleConfirmActivation(duration)}
        isConfirming={checkoutRunning}
      />
    </View>
  );
}
