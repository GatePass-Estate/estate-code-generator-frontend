import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Animated, { FadeIn } from 'react-native-reanimated';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';

import IncidentReportSvg from '@/src/assets/images/incident-report.svg';
import Pf1Svg from '@/src/assets/icons/pf_1.svg';
import Pf2Svg from '@/src/assets/icons/pf_2.svg';
import Pf3Svg from '@/src/assets/icons/pf_3.svg';
import { FeatureDownloadIcon, FeatureUsersIcon, RatingStarIcon } from '@/src/assets/svgs';
import RatingModal from '@/src/components/anomaly/modals/RatingModal';
import ActivationQuoteModal, {
  prefetchAiQuotes,
} from '@/src/components/anomaly/modals/ActivationQuoteModal';
import PaymentVerificationModal, {
  PaymentVerificationState,
} from '@/src/components/anomaly/modals/PaymentVerificationModal';
import UpgradePlanModal from '@/src/components/mobile/UpgradePlanModal';
import IncidentDataInsightModal from '@/src/components/incident/IncidentDataInsightModal';
import IncidentResultView from '@/src/components/incident/IncidentResultView';
import SubscriptionTierCard from '@/src/components/incident/SubscriptionTierCard';
import AnimatedPillTabs from '@/src/components/mobile/AnimatedPillTabs';
import { useEstateSubscription } from '@/src/hooks/useBillingQueries';
import {
  formatTierLabel,
  formatTierSubtitle,
  getCheckoutStatus,
  getMarketplaceFeatureById,
  initializeCheckout,
  installAiFeature,
  rateMarketplaceFeature,
  resolveMarketplaceFeatureId,
  sortMarketplaceTiers,
  subscribeMarketplaceFeature,
  uninstallAiFeature,
  cancelMarketplaceSubscription,
} from '@/src/lib/api/aiMarketplace';
import { refreshEstateEntitlements, useEstateEntitlements } from '@/src/lib/api/entitlements';
import { hasEntitlement } from '@/src/lib/plans';
import { useUserStore } from '@/src/lib/stores/userStore';
import { scrollCardIntoView } from '@/src/lib/scrollIntoView';
import {
  useContactAdminNoticeStore,
  useFeatureGate,
  useUpgradePromptStore,
} from '@/src/hooks/usePlan';
import {
  AiCheckoutDuration,
  MarketplaceDetailResponse,
  MarketplaceTier,
} from '@/src/types/aiMarketplace';

const isIncidentProduct = (name: string) => name.toLowerCase().includes('incident');

const PRODUCT_FEATURE_ICONS = [Pf1Svg, Pf2Svg, Pf3Svg];

const tierNumber = (tier: string) => tier.replace(/\D/g, '') || tier;

/** Tier One is the base product: it unlocks the Result page. Tiers Two and Three add to it. */
const TIER_ONE_FOR_RESULT_MESSAGE =
  'Subscribe to Tier One (Incident Report Summary and Insights) to view your results.';
const INSTALL_TIER_ONE_FOR_RESULT_MESSAGE =
  'Install Tier One (Incident Report Summary and Insights) to view your results.';
const TIER_ONE_FIRST_MESSAGE =
  'Subscribe to Tier One (Incident Report Summary and Insights) first. Tiers Two and Three build on it.';
const INSTALL_TIER_ONE_FIRST_MESSAGE =
  'Install Tier One (Incident Report Summary and Insights) first. Tiers Two and Three build on it.';

const tierOrder = (tier: MarketplaceTier) => Number.parseInt(tier.tier.replace(/\D/g, ''), 10) || 0;

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
  const params = useLocalSearchParams<{ featureId?: string; title?: string; tab?: string }>();
  const estateId = useUserStore((s) => s.estate_id);
  const userRole = useUserStore((s) => s.role);
  const showContactAdminNotice = useContactAdminNoticeStore((s) => s.show);
  const { data: subscriptionData } = useEstateSubscription();
  const { data: entitlements } = useEstateEntitlements();
  const tierTwoYRef = useRef<number>(0);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'Preview' | 'Result'>('Preview');
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [featureDetail, setFeatureDetail] = useState<MarketplaceDetailResponse | null>(null);
  const email = useUserStore((s) => s.email) || '';
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribingTierKey, setSubscribingTierKey] = useState<string | null>(null);
  const [isUninstalling, setIsUninstalling] = useState(false);
  const [uninstallingTierKey, setUninstallingTierKey] = useState<string | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installingTierKey, setInstallingTierKey] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelTierKey, setCancelTierKey] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [justPurchasedTiers, setJustPurchasedTiers] = useState<Record<string, boolean>>({});
  const [justCancelledTiers, setJustCancelledTiers] = useState<Record<string, boolean>>({});
  // The server refused the Result data; remembered so the next tap shows the prompt straight away.
  const [serverDenied, setServerDenied] = useState(false);
  // Duration quote → Paystack → payment check, the same flow as the anomaly product.
  const [activationModalVisible, setActivationModalVisible] = useState(false);
  const [selectedTierForActivation, setSelectedTierForActivation] =
    useState<MarketplaceTier | null>(null);
  const [isConfirmingActivation, setIsConfirmingActivation] = useState(false);
  const [activePaystackReference, setActivePaystackReference] = useState<string | null>(null);
  const [activeCheckoutToken, setActiveCheckoutToken] = useState<string | null>(null);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationState, setVerificationState] = useState<PaymentVerificationState>('verifying');
  const pollingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    cancelText: string;
    confirmText: string;
    confirmStyle: 'default' | 'destructive';
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    cancelText: 'Cancel',
    confirmText: 'Confirm',
    confirmStyle: 'default',
    onConfirm: () => {},
  });
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [dataInsightVisible, setDataInsightVisible] = useState(false);
  const [cardHeight, setCardHeight] = useState<number>(120);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFeature = useCallback(
    async (id?: string) => {
      if (!featureDetail) setIsLoading(true);
      setLoadError(null);
      try {
        const targetId = await resolveMarketplaceFeatureId(
          id ?? params.featureId,
          isIncidentProduct
        );
        if (!targetId) {
          if (!featureDetail) {
            setFeatureDetail(null);
            setLoadError('No marketplace product returned for this feature.');
          }
          return;
        }

        const detail = await getMarketplaceFeatureById(targetId);
        setFeatureDetail(detail);
        if (estateId) {
          detail.tiers?.forEach((t) => {
            if (t.feature_key && !t.is_free) prefetchAiQuotes(estateId, t.feature_key);
          });
        }
        const sorted = sortMarketplaceTiers(detail.tiers ?? []);
        setExpandedTier((prev) =>
          prev && sorted.some((tier) => tier.tier === prev) ? prev : null
        );
      } catch (err: any) {
        console.log('Error loading feature details:', err?.message || err);
        if (!featureDetail) {
          setFeatureDetail(null);
          setLoadError(err?.message || 'Failed to load feature details');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [params.featureId, estateId, featureDetail]
  );

  useEffect(() => {
    void loadFeature();
  }, [loadFeature]);

  useEffect(() => {
    if (!estateId) return;
    AsyncStorage.getItem(cancelledTiersStorageKey(estateId))
      .then((stored) => {
        if (stored) setJustCancelledTiers(JSON.parse(stored));
      })
      .catch((e) => console.error('Failed to load cancelled tiers from storage', e));
  }, [estateId]);

  const markTierCancelled = (tierKey: string, cancelled: boolean) => {
    setJustCancelledTiers((prev) => {
      const next = { ...prev, [tierKey]: cancelled };
      if (estateId) {
        AsyncStorage.setItem(cancelledTiersStorageKey(estateId), JSON.stringify(next)).catch(
          console.error
        );
      }
      return next;
    });
  };

  const queryClient = useQueryClient();
  /** Tier entitlements changed → drop cached summaries so Result can't show a removed tier. */
  const refreshAfterTierChange = async () => {
    setServerDenied(false);
    queryClient.removeQueries({ queryKey: ['incident-reports', 'summary'] });
    void queryClient.invalidateQueries({ queryKey: ['incident-reports'] });
    await Promise.all([
      refreshEstateEntitlements(),
      featureDetail?.id ? loadFeature(featureDetail.id) : undefined,
    ]);
  };

  useEffect(() => {
    if (!featureDetail) return;
    console.log(
      '[incident-reports] data_insight from API:',
      JSON.stringify(featureDetail.data_insight ?? null, null, 2)
    );
  }, [featureDetail]);

  const handleRate = async (rating: number) => {
    if (!hasFeatureEntitlement) {
      Alert.alert(
        'Rating Unavailable',
        'You need an active subscription or entitlement to this AI feature before you can rate it.'
      );
      return;
    }
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
    if (userRole !== 'primary_admin') {
      showContactAdminNotice(
        'incident_report_summary_tier_2',
        "Only the primary admin can purchase or activate AI subscriptions. Please contact your estate's primary admin."
      );
      return;
    }

    if (tier.is_free && !isPlanIncludingResults) {
      setUpgradeModalVisible(true);
      return;
    }

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
        Alert.alert('Success', 'Free feature tier activated successfully!');
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
        Alert.alert('Success', 'Subscription quote created successfully.');
      }
    } catch (err: any) {
      Alert.alert('Subscription Failed', err?.message || 'Failed to activate tier.');
    } finally {
      setIsSubscribing(false);
      setSubscribingTierKey(null);
    }
  };

  const handleConfirmActivation = async (duration: AiCheckoutDuration) => {
    if (userRole !== 'primary_admin') {
      showContactAdminNotice(
        'incident_report_summary_tier_2',
        'Only the primary admin can purchase AI subscriptions and features.'
      );
      return;
    }

    const tier = selectedTierForActivation;
    if (!tier?.feature_key) {
      Alert.alert('Error', 'Feature key is missing for this tier.');
      return;
    }

    setIsConfirmingActivation(true);
    try {
      const response = await initializeCheckout({
        estate_id: estateId || '',
        customer_email: email,
        checkout_kind: 'ai_only',
        ai_feature_keys: [tier.feature_key],
        ai_feature_ids: tier.ai_feature_id ? [tier.ai_feature_id] : undefined,
        period_months: duration,
      });

      if (response?.authorization_url) {
        setActivePaystackReference(response.paystack_reference);
        setActiveCheckoutToken(response.checkout_token);
        setActivationModalVisible(false);
        setCheckoutUrl(response.authorization_url);
        markTierCancelled(tier.tier, false);
      } else {
        Alert.alert('Error', 'No checkout authorization URL returned.');
      }
    } catch (err: any) {
      Alert.alert('Checkout Failed', err?.message || 'Failed to initialize checkout.');
    } finally {
      setIsConfirmingActivation(false);
    }
  };

  const stopPolling = () => {
    if (pollingTimerRef.current) {
      clearTimeout(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  /** Polls the Paystack reference until it settles (about 30 seconds at most). */
  const startPaymentVerification = (reference: string, token?: string) => {
    stopPolling();
    setVerificationModalVisible(true);
    setVerificationState('verifying');

    const tierKey = selectedTierForActivation?.tier;
    let attempts = 0;
    const maxAttempts = 15;

    const poll = async () => {
      attempts += 1;
      try {
        const res = await getCheckoutStatus(reference, token);
        if (res.status === 'success' || res.status === 'completed' || !!res.paid_at) {
          setVerificationState('success');
          // Shows Install (not Uninstall) for the tier just paid for.
          if (tierKey) setJustPurchasedTiers((prev) => ({ ...prev, [tierKey]: true }));
          void refreshAfterTierChange();
          return;
        }
        if (res.status === 'failed') {
          setVerificationState('failed');
          return;
        }
      } catch (err) {
        console.log('Checkout status poll error:', err);
      }

      if (attempts >= maxAttempts) {
        setVerificationState('delayed');
        void refreshAfterTierChange();
      } else {
        pollingTimerRef.current = setTimeout(poll, 2000);
      }
    };

    pollingTimerRef.current = setTimeout(poll, 1200);
  };

  const closeCheckout = () => {
    setCheckoutUrl(null);
    setActivePaystackReference(null);
    setActiveCheckoutToken(null);
    void refreshAfterTierChange();
  };

  const handleRequestCloseCheckout = () => {
    Alert.alert(
      'Exit Checkout?',
      'If you have already approved this transaction in your bank app, exiting now might disrupt confirmation. Are you sure you want to close this window?',
      [
        { text: 'Stay on Payment', style: 'cancel' },
        { text: 'Exit Anyway', style: 'destructive', onPress: closeCheckout },
      ]
    );
  };

  const handleCancelSubscription = (tier: MarketplaceTier) => {
    if (userRole !== 'primary_admin') {
      showContactAdminNotice(
        'incident_report_summary_tier_2',
        "Only the primary admin can cancel an AI subscription. Please contact your estate's primary admin."
      );
      return;
    }

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
          Alert.alert('Success', 'Subscription cancelled successfully.');
          markTierCancelled(tier.tier, true);
          await refreshAfterTierChange();
        } catch (err: any) {
          const errorMessage = err?.message || 'Failed to cancel subscription.';
          // Paystack rejects disabling a subscription that is already cancelled.
          if (
            errorMessage.toLowerCase().includes('disable subscription failed') ||
            errorMessage.toLowerCase().includes('already')
          ) {
            markTierCancelled(tier.tier, true);
            Alert.alert('Already Cancelled', 'Your subscription has already been cancelled.');
          } else {
            Alert.alert('Cancellation Failed', errorMessage);
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
    if (userRole !== 'primary_admin') {
      showContactAdminNotice(
        'incident_report_summary_tier_2',
        "Only the primary admin can cancel an AI subscription. Please contact your estate's primary admin."
      );
      return;
    }

    if (!estateId) {
      Alert.alert('Error', 'Estate ID not found');
      return;
    }
    const featureKey = tier.feature_key;
    if (!featureKey) {
      Alert.alert('Error', 'Feature key is missing for this tier.');
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
          Alert.alert('Success', 'Feature uninstalled successfully.');
          await refreshAfterTierChange();
        } catch (err: any) {
          Alert.alert('Uninstall Failed', err?.message || 'Failed to uninstall feature.');
        } finally {
          setIsUninstalling(false);
          setUninstallingTierKey(null);
        }
      },
    });
    setConfirmModalVisible(true);
  };

  const handleInstall = async (tier: MarketplaceTier) => {
    if (userRole !== 'primary_admin') {
      showContactAdminNotice(
        'incident_report_summary_tier_2',
        "Only the primary admin can cancel an AI subscription. Please contact your estate's primary admin."
      );
      return;
    }

    if (requireTierOne(tier)) return;
    if (!estateId) {
      Alert.alert('Error', 'Estate ID not found');
      return;
    }
    if (!tier.feature_key) {
      Alert.alert('Error', 'Feature key is missing for this tier.');
      return;
    }

    setInstallingTierKey(tier.tier);
    setIsInstalling(true);
    try {
      await installAiFeature(estateId, tier.feature_key);
      Alert.alert('Success', 'Feature installed successfully.');
      setJustPurchasedTiers((prev) => ({ ...prev, [tier.tier]: false }));
      await refreshAfterTierChange();
    } catch (err: any) {
      Alert.alert('Install Failed', err?.message || 'Failed to install feature.');
    } finally {
      setIsInstalling(false);
      setInstallingTierKey(null);
    }
  };

  const sortedTiers = useMemo(
    () => sortMarketplaceTiers(featureDetail?.tiers ?? []),
    [featureDetail?.tiers]
  );
  const tierOneApi = sortedTiers[0];
  const tierTwoApi = sortedTiers[1];
  const tierThreeApi = sortedTiers[2];

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

  const planSlug = subscriptionData?.tier?.slug ?? entitlements?.tierSlug;
  const isPlanIncludingResults = planSlug === 'sentinel' || planSlug === 'command';
  const hasPaidTierEntitlement =
    hasEntitlement(entitlements, 'incident_report_summary_tier_2') ||
    hasEntitlement(entitlements, 'incident_report_summary_tier_3');
  const hasResultAccess =
    isPlanIncludingResults ||
    hasPaidTierEntitlement ||
    isTierSubscribed(tierTwoApi) ||
    isTierSubscribed(tierThreeApi);

  const hasFeatureEntitlement = hasResultAccess;

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
  // "Upgrade" goes to the plans on Overview with Tier One opened, which is what the Result data needs.
  const showTierOne = () => {
    const tierOne = sortedTiers.find(
      (tier) => (Number.parseInt(tier.tier.replace(/\D/g, ''), 10) || 0) === 1
    );
    if (tierOne) setExpandedTier(tierOne.tier);
    setActiveTab('Preview');
    // The plan list mounts with the tab and the card grows when opened, so let both lay out first.
    setTimeout(
      () =>
        scrollCardIntoView(
          scrollViewRef.current,
          tierOneCardRef.current,
          viewportHeightRef.current
        ),
      450
    );
  };
  const { showDenied: showResultDenied } = useFeatureGate('incident_report_summary_tier_1', {
    notice: 'floating',
    onUpgrade: showTierOne,
  });
  /** True (after prompting) when a Tier Two or Three action needs Tier One first. */
  const requireTierOne = (tier: MarketplaceTier) => {
    if (tierOrder(tier) <= 1 || tierOneInstalled !== false) return false;
    showResultDenied(tierOneSubscribed ? INSTALL_TIER_ONE_FIRST_MESSAGE : TIER_ONE_FIRST_MESSAGE);
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

  const handleUpgradeFlow = () => {
    setUpgradeModalVisible(false);
    setActiveTab('Preview');
    const tierTwoKey = tierTwoApi?.tier || 'Tier Two';
    setExpandedTier(tierTwoKey);
    if (tierTwoYRef.current) {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, tierTwoYRef.current - 16), animated: true });
    }
    setTimeout(() => {
      if (tierTwoApi) {
        setSelectedTierForActivation(tierTwoApi);
        setActivationModalVisible(true);
      }
    }, 400);
  };

  const handleTabChange = (tab: 'Preview' | 'Result') => {
    if (tab === activeTab) return;
    if (tab === 'Result' && !hasResultAccess) {
      if (userRole === 'primary_admin') {
        setUpgradeModalVisible(true);
      } else {
        showContactAdminNotice(
          'incident_report_summary_tier_2',
          'Upgrade to Sentinel or activate Incident Report Tier Two to view results. Contact Admin to upgrade.'
        );
      }
      return;
    }
    setActiveTab(tab);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  useEffect(() => {
    if (params.tab === 'Result') {
      if (hasResultAccess) {
        setActiveTab('Result');
      } else {
        setActiveTab('Preview');
        if (userRole === 'primary_admin') {
          setUpgradeModalVisible(true);
        } else {
          showContactAdminNotice(
            'incident_report_summary_tier_2',
            'Upgrade to Sentinel or activate Incident Report Tier Two to view results. Contact Admin to upgrade.'
          );
        }
      }
    }
  }, [params.tab, hasResultAccess, userRole, showContactAdminNotice]);

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

        {activeTab === 'Result' && (!hasResultAccess || resultLocked || !resultAllowed) ? (
          <View style={{ flex: 1, backgroundColor: '#F6F7F7' }} />
        ) : activeTab === 'Result' ? (
          <IncidentResultView
            isActive={activeTab === 'Result'}
            onAccessDenied={() => setServerDenied(true)}
            hasAiReviewTier={hasAiReviewTier}
            inHouseInstalled={inHouseInstalled}
            thirdPartyInstalled={thirdPartyInstalled}
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
                      {featureDetail.name || ''}
                    </Text>
                    <Pressable
                      onPress={() => {
                        if (!hasFeatureEntitlement) {
                          Alert.alert(
                            'Rating Unavailable',
                            'You need an active subscription or entitlement to this AI feature before you can rate it.'
                          );
                          return;
                        }
                        setIsRatingModalVisible(true);
                      }}
                      className="flex-row items-center gap-1"
                    >
                      <RatingStarIcon width={17} height={16} />
                      <Text
                        allowFontScaling={false}
                        className="w-[39px] text-center text-[21.88px] font-ubuntu-semibold leading-[26px] text-[#6B7280]"
                      >
                        {(featureDetail.rating ?? 0).toFixed(1)}
                      </Text>
                    </Pressable>
                  </View>

                  {!!featureDetail.description?.trim() && (
                    <Text
                      allowFontScaling={false}
                      className="text-[11.2px] font-inter-regular text-[#878686]"
                    >
                      {featureDetail.description}
                    </Text>
                  )}

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
                {productFeatures.length > 0 ? (
                  <>
                    <View className="px-[17px]">
                      <Text
                        allowFontScaling={false}
                        className="mb-4 text-[14px] font-inter-medium leading-[14px] text-[#113E55]"
                      >
                        Product Feature
                      </Text>
                    </View>

                    <View className="mb-[44px] gap-2">
                      {productFeatures.map((text, index) => {
                        const Icon = PRODUCT_FEATURE_ICONS[index % PRODUCT_FEATURE_ICONS.length];
                        return (
                          <View
                            key={`${index}-${text.slice(0, 24)}`}
                            className="flex-row items-center gap-3 rounded-[16px] bg-white px-4 py-2"
                          >
                            <View className="h-4 w-4 shrink-0 items-center justify-center">
                              <Icon width={16} height={16} />
                            </View>
                            <Text
                              allowFontScaling={false}
                              className="flex-1 text-[11.2px] font-inter-regular leading-[18px] text-[#878686]"
                            >
                              {text}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                ) : null}

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
                      const benefits = tier.benefits?.length
                        ? tier.benefits
                        : (featureDetail.tier_benefits?.find(
                            (group) => tierNumber(group.tier) === tierNumber(tierKey)
                          )?.benefits ?? []);
                      const description = tier.description?.trim() || '';
                      // The tier's name, like anomaly; the price shows in the quote sheet on Activate.
                      const subtitle = tier.name?.trim() || formatTierSubtitle(tier);
                      const isFreeTierAllowed = !tier.is_free || isPlanIncludingResults;
                      const isSubscribed =
                        isFreeTierAllowed &&
                        (tier.status === 'active' ||
                          tier.status === 'purchased' ||
                          tier.status === 'subscribed' ||
                          tier.status === 'installed' ||
                          !!tier.purchased);
                      const isInstalled =
                        isFreeTierAllowed && !!tier.is_installed && !justPurchasedTiers[tierKey];

                      const isTierTwo =
                        (Number.parseInt(tier.tier.replace(/\D/g, ''), 10) || 0) === 2;

                      return (
                        <View
                          key={tier.ai_feature_id || tierKey}
                          ref={tierOrder(tier) === 1 ? tierOneCardRef : undefined}
                          collapsable={false}
                          onLayout={
                            isTierTwo
                              ? (e) => {
                                  tierTwoYRef.current = e.nativeEvent.layout.y;
                                }
                              : undefined
                          }
                        >
                          <SubscriptionTierCard
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
                            onCancelSubscription={() => handleCancelSubscription(tier)}
                            onUninstall={() => handleUninstall(tier)}
                            onInstall={() => void handleInstall(tier)}
                            isSubscribing={subscribingTierKey === tierKey}
                            isCanceling={cancelTierKey === tierKey}
                            isUninstalling={uninstallingTierKey === tierKey}
                            isInstalling={installingTierKey === tierKey}
                            subscribeDisabled={isSubscribing}
                            cancelDisabled={isCanceling}
                            installDisabled={isInstalling}
                            uninstallDisabled={isUninstalling}
                            isCancelledLocally={!!justCancelledTiers[tierKey]}
                            cancelLockedMessage={
                              tier.payment_mode === 'subscription'
                                ? 'This feature is included in your estate subscription plan and cannot be cancelled separately.'
                                : undefined
                            }
                            isFree={!!tier.is_free}
                            isInstalled={isInstalled}
                            isSubscribed={isSubscribed}
                          />
                        </View>
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
      <IncidentDataInsightModal
        visible={dataInsightVisible}
        onClose={() => setDataInsightVisible(false)}
        dataInsight={featureDetail?.data_insight}
      />

      <Modal
        visible={!!checkoutUrl}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleRequestCloseCheckout}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#EFF1F3',
            }}
          >
            <Pressable
              onPress={handleRequestCloseCheckout}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <MaterialIcons name="close" size={24} color="#113E55" />
            </Pressable>
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 16, color: '#113E55' }}
            >
              Checkout
            </Text>
            <View style={{ width: 40 }} />
          </View>
          {checkoutUrl && (
            <WebView
              source={{ uri: checkoutUrl }}
              style={{ flex: 1 }}
              onNavigationStateChange={(navState) => {
                const lowerUrl = navState.url.toLowerCase();
                if (lowerUrl.includes('cancel')) {
                  closeCheckout();
                  return;
                }
                if (
                  lowerUrl.includes('app.gatepassng.com') ||
                  lowerUrl.includes('gatepassng.com/callback') ||
                  lowerUrl.includes('callback') ||
                  lowerUrl.includes('close')
                ) {
                  const ref = activePaystackReference;
                  const token = activeCheckoutToken || undefined;
                  setCheckoutUrl(null);
                  if (ref) startPaymentVerification(ref, token);
                  else void refreshAfterTierChange();
                }
              }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (
                    data?.event === 'close' ||
                    data?.event === 'cancel' ||
                    data?.status === 'cancelled'
                  ) {
                    closeCheckout();
                  }
                } catch {
                  // Ignore non-JSON messages from the checkout page.
                }
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              backgroundColor: '#F2F4F4',
              borderRadius: 28,
              padding: 24,
              paddingTop: 28,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 15,
              elevation: 10,
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 18,
                fontFamily: 'Inter_18pt-SemiBold',
                color: '#000',
                marginBottom: 10,
              }}
            >
              {confirmModalConfig.title}
            </Text>
            <Text
              allowFontScaling={false}
              style={{
                fontSize: 15,
                fontFamily: 'Inter_18pt-Regular',
                color: '#666',
                marginBottom: 28,
                lineHeight: 22,
              }}
            >
              {confirmModalConfig.message}
            </Text>

            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable
                onPress={() => setConfirmModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#EBEBEB',
                  height: 50,
                  borderRadius: 25,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontSize: 16, fontFamily: 'Inter_18pt-Medium', color: '#000' }}
                >
                  {confirmModalConfig.cancelText}
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmModalConfig.onConfirm}
                style={{
                  flex: 1,
                  backgroundColor: '#EBEBEB',
                  height: 50,
                  borderRadius: 25,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 16,
                    fontFamily: 'Inter_18pt-Medium',
                    color: confirmModalConfig.confirmStyle === 'destructive' ? '#FF3B30' : '#000',
                  }}
                >
                  {confirmModalConfig.confirmText}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ActivationQuoteModal
        visible={activationModalVisible}
        onClose={() => setActivationModalVisible(false)}
        tier={selectedTierForActivation}
        estateId={estateId || ''}
        onConfirm={(duration) => handleConfirmActivation(duration)}
        isConfirming={isConfirmingActivation}
      />

      <PaymentVerificationModal
        visible={verificationModalVisible}
        status={verificationState}
        onClose={() => {
          stopPolling();
          setVerificationModalVisible(false);
          setActivePaystackReference(null);
          setActiveCheckoutToken(null);
          void refreshAfterTierChange();
        }}
      />

      <UpgradePlanModal
        visible={upgradeModalVisible}
        feature="incident_report_summary_tier_2"
        onClose={() => setUpgradeModalVisible(false)}
        onUpgrade={handleUpgradeFlow}
      />
    </View>
  );
}
