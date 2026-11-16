import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ScrollView, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { showAlert } from '@/src/shared/utils/alert';
import { errorMessage } from '@/src/shared/services/api/errors';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { scrollCardIntoView } from '@/src/shared/utils/scrollIntoView';
import { refreshEstateEntitlements } from '@/src/features/billing';
import {
  useContactAdminNoticeStore,
  useFeatureGate,
  useUpgradePromptStore,
} from '@/src/features/billing/hooks/usePlan';
import {
  installAiFeature,
  sortMarketplaceTiers,
  subscribeMarketplaceFeature,
} from '@/src/features/marketplace/services/aiMarketplace';
import { useMarketplaceFeature } from '@/src/features/marketplace/hooks/useMarketplaceFeature';
import type { MarketplaceTier } from '@/src/features/marketplace/types/aiMarketplace';
import { tierOrder } from '@/src/features/ai/components/shared/MarketplaceTierList';
import { useUserStore } from '@/src/store/userStore';
import { useTierBookkeeping } from '@/src/features/ai/hooks/useTierBookkeeping';
import { useAiTierActions } from '@/src/features/ai/hooks/useAiTierActions';
import {
  hasFeatureEntitlement as computeHasFeatureEntitlement,
  resultDeniedMessage,
  tierOneState,
} from '@/src/features/ai/utils/aiTierState';

/** Tier One is the base product: it unlocks the Result page. Tiers Two and Three add to it. */
const TIER_ONE_FIRST_MESSAGE = 'The base tier is required before activating higher tiers.';
const INSTALL_TIER_ONE_FIRST_MESSAGE = 'The base tier is required before activating higher tiers.';
/** Shown when the server refuses the Result data although Tier One is active. */
const SUBSCRIPTION_NOT_LINKED_MESSAGE =
  'Your subscription is active, but it isn’t linked to this product yet. Please contact support.';

export const isAnomalyProduct = (name: string) => name.toLowerCase().includes('anomaly');

export type AnomalyTab = 'Overview' | 'Result';

/**
 * Everything behind the Anomaly Detection product screen except layout: the marketplace
 * product, tab and Tier One gating, tier actions and the plan-list scroll targets.
 */
export function useAnomalyProduct() {
  const params = useLocalSearchParams<{
    featureId?: string;
    title?: string;
    tab?: string;
    expandTier?: string;
  }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AnomalyTab>(
    params.tab === 'Result' ? 'Result' : 'Overview'
  );
  const [prevParamTab, setPrevParamTab] = useState(params.tab);
  if (params.tab !== prevParamTab) {
    setPrevParamTab(params.tab);
    setActiveTab(params.tab === 'Result' ? 'Result' : 'Overview');
  }
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  // The server refused the Result data; remembered so the next tap shows the prompt straight away.
  const [serverDenied, setServerDenied] = useState(false);

  const estateId = useUserStore((state) => state.estate_id) || '';
  const { featureDetail, isLoading, loadError, refetch } = useMarketplaceFeature({
    featureId: typeof params.featureId === 'string' ? params.featureId : undefined,
    nameMatch: isAnomalyProduct,
    estateId,
  });
  const bookkeeping = useTierBookkeeping(estateId ? `cancelledTiers-${estateId}` : null);
  const { justPurchasedTiers, justCancelledTiers, installOverrides } = bookkeeping;

  const refreshAfterTierChange = useCallback(async () => {
    setServerDenied(false);
    refreshEstateEntitlements();
    void queryClient.invalidateQueries({ queryKey: queryKeys.anomaly.all });
    void queryClient.invalidateQueries({ queryKey: ['billing', 'ai-grants'] });
    void queryClient.invalidateQueries({ queryKey: ['billing', 'ai-marketplace'] });
    await refetch();
  }, [queryClient, refetch]);

  useFocusEffect(
    useCallback(() => {
      refreshEstateEntitlements();
      void queryClient.invalidateQueries({ queryKey: queryKeys.anomaly.all });
    }, [queryClient])
  );

  useEffect(() => {
    if (!featureDetail) return;
    const tiers = sortMarketplaceTiers(featureDetail.tiers ?? []);
    setExpandedTier((prev) => (prev && tiers.some((tier) => tier.tier === prev) ? prev : null));
  }, [featureDetail]);

  const sortedTiers = useMemo(
    () => (featureDetail?.tiers ? sortMarketplaceTiers(featureDetail.tiers) : []),
    [featureDetail?.tiers]
  );
  const tierOne = sortedTiers.find((tier) => tierOrder(tier) === 1);
  const { tierOneInstalled, tierOneSubscribed } = tierOneState(
    tierOne,
    !!featureDetail,
    justPurchasedTiers,
    installOverrides
  );
  const resultAllowed = tierOneInstalled !== false && !serverDenied;
  const productName = featureDetail?.name?.trim() || 'this product';
  const installTierOneConfirm = useMemo(
    () => ({
      title: `Install ${productName}`,
      confirmLabel: 'Install',
    }),
    [productName]
  );
  const subscribeTierOneMessage = `Subscribe to ${productName} to view your results.`;
  const installTierOneMessage = `Install ${productName} to view your results.`;

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
  const requireTierOne = (tier: MarketplaceTier) => {
    if (tierOrder(tier) <= 1 || tierOneInstalled !== false) return false;
    showResultDenied(
      tierOneSubscribed ? INSTALL_TIER_ONE_FIRST_MESSAGE : TIER_ONE_FIRST_MESSAGE,
      tierOneSubscribed ? installTierOneConfirm : null
    );
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
    const message = resultDeniedMessage(tierOneInstalled, tierOneSubscribed, {
      notLinked: SUBSCRIPTION_NOT_LINKED_MESSAGE,
      installTierOne: installTierOneMessage,
      subscribeTierOne: subscribeTierOneMessage,
    });
    const needsInstall = !tierOneInstalled && !!tierOneSubscribed;
    showResultDenied(message, needsInstall ? installTierOneConfirm : null);
  }, [
    activeTab,
    resultLocked,
    resultAllowed,
    tierOneInstalled,
    tierOneSubscribed,
    showResultDenied,
    installTierOneMessage,
    subscribeTierOneMessage,
    installTierOneConfirm,
  ]);

  const hasFeatureEntitlement = computeHasFeatureEntitlement(
    tierOneInstalled,
    sortedTiers,
    justCancelledTiers
  );

  const actions = useAiTierActions({
    estateId,
    bookkeeping,
    requireTierOne,
    requireTierOneToUninstall: true,
    cancelByFeatureKey: true,
    onTierChange: refreshAfterTierChange,
    afterCheckout: () => void refreshAfterTierChange(),
    rating: {
      allowed: hasFeatureEntitlement,
      targetId: featureDetail?.id || params.featureId,
      refetch,
    },
  });
  const { denyIfUnauthorized, notifyActionError, runSubscribe } = actions;
  const { markTierInstallState } = bookkeeping;

  const handleActivateFreeTier = async (tierPayload: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    if (!featureDetail?.id || (!tierPayload.ai_feature_id && !tierPayload.feature_key)) {
      return;
    }
    const featureId = featureDetail.id;

    await runSubscribe(tierPayload.tier, async () => {
      try {
        if (tierPayload.feature_key) {
          await installAiFeature(estateId, tierPayload.feature_key);
        } else {
          if (!tierPayload.ai_feature_id) {
            showAlert('Error', 'Missing feature identifier.');
            return;
          }
          await subscribeMarketplaceFeature(featureId, {
            ai_feature_id: tierPayload.ai_feature_id,
            period_months: 1,
          });
        }
        markTierInstallState(tierPayload.tier, true);
        showAlert('Success', 'Free feature tier activated successfully!');
        void refetch();
      } catch (err: unknown) {
        notifyActionError(
          'Activation Failed',
          { message: errorMessage(err) },
          'Failed to activate tier.'
        );
      }
    });
  };

  const handlePressActivate = (tierPayload: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    if (requireTierOne(tierPayload)) return;
    if (tierPayload.is_free) {
      handleActivateFreeTier(tierPayload);
      return;
    }
    actions.activation.open(tierPayload);
  };

  const handleTabPress = (tab: AnomalyTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const toggleTier = (tierKey: string) =>
    setExpandedTier(expandedTier === tierKey ? null : tierKey);

  return {
    estateId,
    featureDetail,
    isLoading,
    loadError,
    refetch,
    sortedTiers,
    activeTab,
    handleTabPress,
    /** Result is hidden while a denial prompt is up or Tier One is missing. */
    resultBlocked: resultLocked || !resultAllowed,
    onResultAccessDenied: () => setServerDenied(true),
    expandedTier,
    toggleTier,
    justPurchasedTiers,
    justCancelledTiers,
    installOverrides,
    scrollViewRef,
    viewportHeightRef,
    tierOneRef,
    tierCardRefs,
    handlePressActivate,
    ...actions,
  };
}
