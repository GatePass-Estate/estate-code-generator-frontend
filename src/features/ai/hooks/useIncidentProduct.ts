import { useEffect, useMemo, useRef, useState } from 'react';
import type { ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
  isTierNumberInstalled,
  isTierNumberSubscribed,
  resultDeniedMessage,
  tierOneState,
} from '@/src/features/ai/utils/aiTierState';

export const isIncidentProduct = (name: string) => name.toLowerCase().includes('incident');

/** Tier One is the base product: it unlocks the Result page. Tiers Two and Three add to it. */
const TIER_ONE_FIRST_MESSAGE = 'The base tier is required before activating higher tiers.';
/** Shown when the server refuses the Result data although Tier One is active. */
const SUBSCRIPTION_NOT_LINKED_MESSAGE =
  'Your subscription is active, but it isn’t linked to this product yet. Please contact support.';

/** Separate from anomaly's `cancelledTiers-*` key, which is keyed by its own tier names. */
const cancelledTiersStorageKey = (estateId: string) => `incidentCancelledTiers-${estateId}`;

export type IncidentTab = 'Preview' | 'Result';

/**
 * Everything behind the Incident Report product screen except layout: the marketplace
 * product, tab and Tier One gating, which summary tiers are installed, tier actions and the
 * plan-list scroll targets.
 */
export function useIncidentProduct() {
  const params = useLocalSearchParams<{ featureId?: string; title?: string; tab?: string }>();
  const estateId = useUserStore((s) => s.estate_id);
  const { featureDetail, isLoading, loadError, refetch } = useMarketplaceFeature({
    featureId: typeof params.featureId === 'string' ? params.featureId : undefined,
    nameMatch: isIncidentProduct,
    estateId: estateId || undefined,
  });
  const [activeTab, setActiveTab] = useState<IncidentTab>(
    params.tab === 'Result' ? 'Result' : 'Preview'
  );
  const [prevParamTab, setPrevParamTab] = useState(params.tab);
  if (params.tab !== prevParamTab) {
    setPrevParamTab(params.tab);
    setActiveTab(params.tab === 'Result' ? 'Result' : 'Preview');
  }
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  // The server refused the Result data; remembered so the next tap shows the prompt straight away.
  const [serverDenied, setServerDenied] = useState(false);
  const bookkeeping = useTierBookkeeping(estateId ? cancelledTiersStorageKey(estateId) : null);
  const { justPurchasedTiers, justCancelledTiers, installOverrides } = bookkeeping;

  useEffect(() => {
    if (!featureDetail) return;
    const tiers = sortMarketplaceTiers(featureDetail.tiers ?? []);
    setExpandedTier((prev) => (prev && tiers.some((tier) => tier.tier === prev) ? prev : null));
  }, [featureDetail]);

  const queryClient = useQueryClient();
  /** Tier entitlements changed → drop Result cache + Active AI Tools grants. */
  const refreshAfterTierChange = async () => {
    setServerDenied(false);
    queryClient.removeQueries({ queryKey: [...queryKeys.incidents.all, 'summary'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.incidents.all });
    void queryClient.invalidateQueries({ queryKey: ['billing', 'ai-grants'] });
    void queryClient.invalidateQueries({ queryKey: ['billing', 'ai-marketplace'] });
    await Promise.all([refreshEstateEntitlements(), refetch()]);
  };

  const sortedTiers = useMemo(
    () => sortMarketplaceTiers(featureDetail?.tiers ?? []),
    [featureDetail?.tiers]
  );

  /** Tier 2 = In-house summary, tier 3 = Third-party summary; undefined until tiers load. */
  const inHouseInstalled = isTierNumberInstalled(sortedTiers, !!featureDetail, 2);
  const thirdPartyInstalled = isTierNumberInstalled(sortedTiers, !!featureDetail, 3);
  const hasAiReviewTier =
    inHouseInstalled === undefined ? undefined : !!(inHouseInstalled || thirdPartyInstalled);
  const inHouseSubscribed = isTierNumberSubscribed(
    sortedTiers,
    !!featureDetail,
    2,
    justCancelledTiers
  );
  const thirdPartySubscribed = isTierNumberSubscribed(
    sortedTiers,
    !!featureDetail,
    3,
    justCancelledTiers
  );
  /** Paid for an AI review tier but none installed → Install, not Upgrade Plan. */
  const aiSummaryNeedsInstall =
    hasAiReviewTier === false && !!(inHouseSubscribed || thirdPartySubscribed);
  const productFeatures = (featureDetail?.product_features ?? [])
    .map((text) => text.trim())
    .filter(Boolean);

  const scrollViewRef = useRef<ScrollView>(null);
  const tierOneCardRef = useRef<View>(null);
  const viewportHeightRef = useRef(0);

  // Tier One unlocks Result. Marketplace `status` (e.g. installed) = paid; `is_installed` = on.
  // Entitlements do not list AI tiers. Paid + not installed → Install modal, not Upgrade.
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
    showResultDenied(
      tierOneSubscribed ? installTierOneMessage : TIER_ONE_FIRST_MESSAGE,
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
      setActiveTab('Preview');
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
    installTierOneMessage,
    subscribeTierOneMessage,
    installTierOneConfirm,
    tierOneSubscribed,
    showResultDenied,
  ]);

  const hasFeatureEntitlement = computeHasFeatureEntitlement(
    tierOneInstalled,
    sortedTiers,
    justCancelledTiers
  );

  const actions = useAiTierActions({
    estateId: estateId || '',
    bookkeeping,
    requireTierOne,
    requireTierOneToUninstall: false,
    cancelByFeatureKey: true,
    onTierChange: refreshAfterTierChange,
    afterCheckout: () => void refreshAfterTierChange(),
    rating: { allowed: hasFeatureEntitlement, targetId: featureDetail?.id, refetch },
  });
  const { denyIfUnauthorized, notifyActionError, runSubscribe } = actions;
  const { markTierInstallState } = bookkeeping;

  const handleSubscribe = async (tier: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    if (requireTierOne(tier)) return;
    if (!featureDetail?.id || (!tier.ai_feature_id && !tier.feature_key)) {
      return;
    }
    const featureId = featureDetail.id;

    await runSubscribe(tier.tier, async () => {
      try {
        if (tier.is_free) {
          if (tier.feature_key) {
            await installAiFeature(estateId || '', tier.feature_key);
          } else {
            await subscribeMarketplaceFeature(featureId, {
              ai_feature_id: tier.ai_feature_id,
              period_months: 1,
            });
          }
          markTierInstallState(tier.tier, true);
          showAlert('Success', 'Free feature tier activated successfully!');
          // Don't hold the Activate spinner open while marketplace/entitlements refetch.
          void refreshAfterTierChange();
        } else if (tier.feature_key) {
          // Paid tier: pick a duration and see the price before Paystack.
          actions.activation.open(tier);
        } else {
          await subscribeMarketplaceFeature(featureId, {
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
      }
    });
  };

  const handleTabChange = (tab: IncidentTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const toggleTier = (tierKey: string) =>
    setExpandedTier(expandedTier === tierKey ? null : tierKey);

  return {
    estateId: estateId || '',
    featureDetail,
    isLoading,
    loadError,
    refetch,
    sortedTiers,
    productFeatures,
    activeTab,
    handleTabChange,
    /** Result is hidden while a denial prompt is up or Tier One is missing. */
    resultBlocked: resultLocked || !resultAllowed,
    onResultAccessDenied: () => setServerDenied(true),
    hasAiReviewTier,
    aiSummaryNeedsInstall,
    inHouseInstalled,
    thirdPartyInstalled,
    showAiSummaryTier: () => showTier(2),
    expandedTier,
    toggleTier,
    justPurchasedTiers,
    justCancelledTiers,
    installOverrides,
    scrollViewRef,
    viewportHeightRef,
    tierOneCardRef,
    tierCardRefs,
    handleSubscribe,
    ...actions,
  };
}
