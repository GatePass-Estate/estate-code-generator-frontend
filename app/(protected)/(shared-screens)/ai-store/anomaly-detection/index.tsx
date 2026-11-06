import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import AnimatedPillTabs from '@/src/components/mobile/AnimatedPillTabs';
import SubscriptionTierCard from '@/src/components/incident/SubscriptionTierCard';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';

import Pf1Svg from '@/src/assets/icons/pf_1.svg';
import Pf2Svg from '@/src/assets/icons/pf_2.svg';
import Pf3Svg from '@/src/assets/icons/pf_3.svg';
import DownloadSvg from '@/src/assets/icons/download.svg';
import AnomalySvg from '@/src/assets/images/anomaly.svg';
import RatingModal from '@/src/components/anomaly/modals/RatingModal';
import DataInsightModal from '@/src/components/anomaly/modals/DataInsightModal';
import ActivationQuoteModal, {
  prefetchAiQuotes,
} from '@/src/components/anomaly/modals/ActivationQuoteModal';
import PaymentVerificationModal, {
  PaymentVerificationState,
} from '@/src/components/anomaly/modals/PaymentVerificationModal';
import UpgradePlanModal from '@/src/components/mobile/UpgradePlanModal';
import AnomalyResultView from '@/src/components/anomaly/AnomalyResultView';
import { useEstateSubscription } from '@/src/hooks/useBillingQueries';
import { refreshEstateEntitlements, useEstateEntitlements } from '@/src/lib/api/entitlements';
import { hasEntitlement } from '@/src/lib/plans';
import { WebView } from 'react-native-webview';
import {
  formatTierLabel,
  formatTierSubtitle,
  getMarketplaceFeatureById,
  subscribeMarketplaceFeature,
  getFeaturePictureUrl,
  rateMarketplaceFeature,
  uninstallAiFeature,
  installAiFeature,
  initializeCheckout,
  getCheckoutStatus,
  cancelMarketplaceSubscription,
  sortMarketplaceTiers,
  resolveMarketplaceFeatureId,
} from '@/src/lib/api/aiMarketplace';
import { useFeatureGate } from '@/src/hooks/usePlan';
import { scrollCardIntoView } from '@/src/lib/scrollIntoView';
import { useUserStore } from '@/src/lib/stores/userStore';
import { useContactAdminNoticeStore } from '@/src/hooks/usePlan';
import {
  MarketplaceDetailResponse,
  MarketplaceTier,
  AiCheckoutDuration,
  AiQuoteResponse,
} from '@/src/types/aiMarketplace';

const tierNumber = (tier: string) => tier.replace(/\D/g, '') || tier;

export default function AnomalyDetectionPreviewScreen() {
  const params = useLocalSearchParams<{ featureId?: string; title?: string; tab?: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Result'>('Overview');
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [featureDetail, setFeatureDetail] = useState<MarketplaceDetailResponse | null>(null);
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
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [justPurchasedTiers, setJustPurchasedTiers] = useState<Record<string, boolean>>({});
  const [justCancelledTiers, setJustCancelledTiers] = useState<Record<string, boolean>>({});
  const [activationModalVisible, setActivationModalVisible] = useState(false);
  const [selectedTierForActivation, setSelectedTierForActivation] =
    useState<MarketplaceTier | null>(null);
  const [isConfirmingActivation, setIsConfirmingActivation] = useState(false);
  const [activePaystackReference, setActivePaystackReference] = useState<string | null>(null);
  const [activeCheckoutToken, setActiveCheckoutToken] = useState<string | null>(null);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationState, setVerificationState] = useState<PaymentVerificationState>('verifying');
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const tierTwoYRef = useRef<number>(0);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);

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

  const estateId = useUserStore((state) => state.estate_id) || '';
  const email = useUserStore((state) => state.email) || '';
  const userRole = useUserStore((state) => state.role);
  const showContactAdminNotice = useContactAdminNoticeStore((s) => s.show);

  const handleRate = async (rating: number) => {
    if (!hasFeatureEntitlement) {
      Alert.alert(
        'Rating Unavailable',
        'You need an active subscription or entitlement to this AI feature before you can rate it.'
      );
      return;
    }
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

  const isAnomalyProduct = (name: string) => name.toLowerCase().includes('anomaly');

  const loadFeature = useCallback(
    async (id?: string) => {
      if (!featureDetail) setIsLoading(true);
      try {
        const rawId = id || (typeof params.featureId === 'string' ? params.featureId : undefined);
        const targetId = await resolveMarketplaceFeatureId(rawId, isAnomalyProduct);

        if (targetId) {
          const detail = await getMarketplaceFeatureById(targetId);
          setFeatureDetail(detail);
          const sorted = sortMarketplaceTiers(detail.tiers ?? []);
          setExpandedTier((prev) =>
            prev && sorted.some((tier) => tier.tier === prev) ? prev : null
          );
          if (estateId && detail.tiers) {
            detail.tiers.forEach((t) => {
              if (t.feature_key && !t.is_free) {
                prefetchAiQuotes(estateId, t.feature_key);
              }
            });
          }
        }
      } catch (err: any) {
        console.log('Error loading feature details:', err?.message || err);
      } finally {
        setIsLoading(false);
      }
    },
    [params.featureId, estateId, featureDetail]
  );

  const refreshAfterTierChange = useCallback(
    async (id?: string) => {
      refreshEstateEntitlements();
      void queryClient.invalidateQueries({ queryKey: ['anomaly'] });
      await loadFeature(id ?? featureDetail?.id);
    },
    [queryClient, loadFeature, featureDetail?.id]
  );

  useFocusEffect(
    useCallback(() => {
      refreshEstateEntitlements();
      void queryClient.invalidateQueries({ queryKey: ['anomaly'] });
    }, [queryClient])
  );

  useEffect(() => {
    let isMounted = true;
    async function init() {
      if (!featureDetail) setIsLoading(true);
      try {
        if (estateId) {
          try {
            const stored = await AsyncStorage.getItem(`cancelledTiers-${estateId}`);
            if (stored) {
              setJustCancelledTiers(JSON.parse(stored));
            }
          } catch (e) {
            console.error('Failed to load cancelled tiers from storage', e);
          }
        }

        const rawId = typeof params.featureId === 'string' ? params.featureId : undefined;
        const targetId = await resolveMarketplaceFeatureId(rawId, isAnomalyProduct);

        if (targetId && isMounted) {
          const detail = await getMarketplaceFeatureById(targetId);
          if (isMounted) {
            setFeatureDetail(detail);
            if (estateId && detail.tiers) {
              detail.tiers.forEach((t) => {
                if (t.feature_key && !t.is_free) {
                  prefetchAiQuotes(estateId, t.feature_key);
                }
              });
            }
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
  }, [params.featureId, estateId]);

  const handleActivateFreeTier = async (tierPayload: MarketplaceTier) => {
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
          Alert.alert('Error', 'Missing feature identifier.');
          return;
        }
        await subscribeMarketplaceFeature(featureDetail.id, {
          ai_feature_id: tierPayload.ai_feature_id,
          period_months: 1,
        });
      }
      Alert.alert('Success', 'Free feature tier activated successfully!');
      loadFeature(featureDetail.id);
    } catch (err: any) {
      Alert.alert('Activation Failed', err?.message || 'Failed to activate tier.');
    } finally {
      setIsSubscribing(false);
      setSubscribingTierKey(null);
    }
  };

  const handlePressActivate = (tierPayload: MarketplaceTier) => {
    if (userRole !== 'primary_admin') {
      showContactAdminNotice(
        'access_anomaly_detection_tier_2',
        "Only the primary admin can purchase or activate AI subscriptions. Please contact your estate's primary admin."
      );
      return;
    }
    if (requireTierOne(tierPayload.tier)) return;
    if (tierPayload.is_free) {
      if (!isPlanIncludingResults) {
        setUpgradeModalVisible(true);
        return;
      }
      handleActivateFreeTier(tierPayload);
      return;
    }
    setSelectedTierForActivation(tierPayload);
    setActivationModalVisible(true);
  };

  const handleConfirmActivation = async (duration: AiCheckoutDuration, _quote: AiQuoteResponse) => {
    if (userRole !== 'primary_admin') {
      showContactAdminNotice(
        'guest_management',
        'Only the primary admin can purchase AI subscriptions and features.'
      );
      return;
    }
    if (!selectedTierForActivation?.feature_key) {
      Alert.alert('Error', 'Feature key is missing for this tier.');
      return;
    }

    setIsConfirmingActivation(true);
    try {
      const response = await initializeCheckout({
        estate_id: estateId,
        customer_email: email,
        checkout_kind: 'ai_only',
        ai_feature_keys: [selectedTierForActivation.feature_key],
        ai_feature_ids: selectedTierForActivation.ai_feature_id
          ? [selectedTierForActivation.ai_feature_id]
          : undefined,
        period_months: duration,
      });

      if (response?.authorization_url) {
        setActivePaystackReference(response.paystack_reference);
        setActiveCheckoutToken(response.checkout_token);
        setActivationModalVisible(false);
        setCheckoutUrl(response.authorization_url);
        // Also remove from justCancelledTiers if they activate again
        setJustCancelledTiers((prev) => {
          const next = { ...prev, [selectedTierForActivation.tier]: false };
          if (estateId)
            AsyncStorage.setItem(`cancelledTiers-${estateId}`, JSON.stringify(next)).catch(
              console.error
            );
          return next;
        });
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

  const startPaymentVerification = useCallback(
    (reference: string, token?: string) => {
      stopPolling();
      setVerificationModalVisible(true);
      setVerificationState('verifying');

      let attempts = 0;
      const maxAttempts = 15; // 30 seconds max polling

      const poll = async () => {
        attempts += 1;
        try {
          const res = await getCheckoutStatus(reference, token);
          if (res.status === 'success' || res.status === 'completed' || !!res.paid_at) {
            setVerificationState('success');
            if (selectedTierForActivation?.tier) {
              setJustPurchasedTiers((prev) => ({
                ...prev,
                [selectedTierForActivation.tier]: true,
              }));
            }
            if (featureDetail?.id) {
              loadFeature(featureDetail.id);
            }
            return;
          } else if (res.status === 'failed') {
            setVerificationState('failed');
            return;
          }
        } catch (err) {
          console.log('Checkout status poll error:', err);
        }

        if (attempts >= maxAttempts) {
          setVerificationState('delayed');
          if (featureDetail?.id) {
            loadFeature(featureDetail.id);
          }
        } else {
          pollingTimerRef.current = setTimeout(poll, 2000);
        }
      };

      pollingTimerRef.current = setTimeout(poll, 1200);
    },
    [selectedTierForActivation?.tier, featureDetail?.id, loadFeature]
  );

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const handleRequestCloseCheckout = () => {
    Alert.alert(
      'Exit Checkout?',
      'If you have already approved this transaction in your bank app, exiting now might disrupt confirmation. Are you sure you want to close this window?',
      [
        {
          text: 'Stay on Payment',
          style: 'cancel',
        },
        {
          text: 'Exit Anyway',
          style: 'destructive',
          onPress: () => {
            setCheckoutUrl(null);
            setActivePaystackReference(null);
            setActiveCheckoutToken(null);
            if (featureDetail?.id) {
              loadFeature(featureDetail.id);
            }
          },
        },
      ]
    );
  };

  const handleCancelSubscription = async (tierPayload: {
    tier: string;
    feature_key?: string | null;
  }) => {
    if (userRole !== 'primary_admin') {
      showContactAdminNotice(
        'access_anomaly_detection_tier_2',
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
        setCancelTierKey(tierPayload.tier);
        setIsCanceling(true);
        try {
          await cancelMarketplaceSubscription(estateId, tierPayload.feature_key || undefined);
          Alert.alert('Success', 'Subscription cancelled successfully.');
          setJustCancelledTiers((prev) => {
            const next = { ...prev, [tierPayload.tier]: true };
            if (estateId)
              AsyncStorage.setItem(`cancelledTiers-${estateId}`, JSON.stringify(next)).catch(
                console.error
              );
            return next;
          });
          await refreshAfterTierChange(featureDetail?.id);
        } catch (err: any) {
          const errorMessage = err?.message || 'Failed to cancel subscription.';
          // If Paystack says it failed to disable, it's almost certainly because it's already cancelled
          if (
            errorMessage.toLowerCase().includes('disable subscription failed') ||
            errorMessage.toLowerCase().includes('already')
          ) {
            setJustCancelledTiers((prev) => {
              const next = { ...prev, [tierPayload.tier]: true };
              if (estateId)
                AsyncStorage.setItem(`cancelledTiers-${estateId}`, JSON.stringify(next)).catch(
                  console.error
                );
              return next;
            });
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

  const handleUninstall = async (tierPayload: {
    id?: string;
    tier: string;
    feature_key?: string | null;
  }) => {
    if (userRole !== 'primary_admin') {
      showContactAdminNotice(
        'access_anomaly_detection_tier_2',
        "Only the primary admin can uninstall or manage AI subscriptions. Please contact your estate's primary admin."
      );
      return;
    }
    if (!estateId) {
      Alert.alert('Error', 'Estate ID not found');
      return;
    }
    if (!tierPayload.feature_key) {
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
        setUninstallingTierKey(tierPayload.tier);
        setIsUninstalling(true);
        try {
          await uninstallAiFeature(estateId, tierPayload.feature_key!);
          Alert.alert('Success', 'Feature uninstalled successfully.');
          await refreshAfterTierChange(featureDetail?.id);
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

  const handleInstall = async (tierPayload: {
    id?: string;
    tier: string;
    feature_key?: string | null;
  }) => {
    if (userRole !== 'primary_admin') {
      showContactAdminNotice(
        'access_anomaly_detection_tier_2',
        "Only the primary admin can install or manage AI subscriptions. Please contact your estate's primary admin."
      );
      return;
    }
    if (requireTierOne(tierPayload.tier)) return;
    if (!estateId) {
      Alert.alert('Error', 'Estate ID not found');
      return;
    }
    if (!tierPayload.feature_key) {
      Alert.alert('Error', 'Feature key is missing for this tier.');
      return;
    }

    setInstallingTierKey(tierPayload.tier);
    setIsInstalling(true);
    try {
      await installAiFeature(estateId, tierPayload.feature_key);
      Alert.alert('Success', 'Feature installed successfully.');
      setJustPurchasedTiers((prev) => ({ ...prev, [tierPayload.tier]: false }));
      await refreshAfterTierChange(featureDetail?.id);
    } catch (err: any) {
      Alert.alert('Install Failed', err?.message || 'Failed to install feature.');
    } finally {
      setIsInstalling(false);
      setInstallingTierKey(null);
    }
  };

  const { data: subscriptionData } = useEstateSubscription();
  const { data: entitlements } = useEstateEntitlements();
  const sortedTiers = featureDetail?.tiers ? sortMarketplaceTiers(featureDetail.tiers) : [];
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

  // Tier One is the base product; Tiers Two and Three are add-ons that need it installed. Paying
  // makes a tier "installed" on the server before the user has chosen to install it, so a tier
  // just purchased still counts as not installed (as the Install / Uninstall button does). Until
  // the tiers load there is nothing to judge, so nothing is blocked.
  const tierOneInstalled = featureDetail
    ? !!tierOneApi && !!tierOneApi.is_installed && !justPurchasedTiers[tierOneApi.tier]
    : undefined;
  const tierOneSubscribed = featureDetail
    ? !!tierOneApi &&
      (!!tierOneApi.is_installed ||
        !!tierOneApi.purchased ||
        ['active', 'purchased', 'subscribed', 'installed'].includes(tierOneApi.status ?? ''))
    : undefined;
  const tierOneRef = useRef<View>(null);
  const viewportHeightRef = useRef(0);

  /** "Upgrade" goes to the Overview tab with Tier One opened and in view. */
  const showTierOne = () => {
    setExpandedTier(tierOneApi?.tier || 'Tier One');
    handleTabPress('Overview');
    // The card grows when opened, so let it lay out first.
    setTimeout(
      () =>
        scrollCardIntoView(scrollViewRef.current, tierOneRef.current, viewportHeightRef.current),
      450
    );
  };
  const { showDenied: showTierOneRequired } = useFeatureGate('access_anomaly_detection_tier_1', {
    notice: 'floating',
    onUpgrade: showTierOne,
  });
  /** True (after prompting) when a Tier Two or Three action needs Tier One first. */
  const requireTierOne = (tierName: string) => {
    const order = Number.parseInt(tierName.replace(/\D/g, ''), 10) || 0;
    if (order <= 1 || tierOneInstalled !== false) return false;
    showTierOneRequired(
      `${tierOneSubscribed ? 'Install' : 'Subscribe to'} Tier One first. Tiers Two and Three build on it.`
    );
    return true;
  };

  const planSlug = subscriptionData?.tier?.slug ?? entitlements?.tierSlug;
  const isPlanIncludingResults = planSlug === 'sentinel' || planSlug === 'command';
  const hasPaidTierEntitlement =
    hasEntitlement(entitlements, 'access_anomaly_detection_tier_2') ||
    hasEntitlement(entitlements, 'access_anomaly_detection_tier_3');
  const hasResultAccess =
    isPlanIncludingResults ||
    hasPaidTierEntitlement ||
    isTierSubscribed(tierTwoApi) ||
    isTierSubscribed(tierThreeApi);

  const hasFeatureEntitlement = hasResultAccess;

  // Ensure subscription-included Tier 1 is installed when the estate is on Sentinel/Command so scans trigger.
  const autoInstalledTierOneRef = useRef(false);
  useEffect(() => {
    if (
      autoInstalledTierOneRef.current ||
      !estateId ||
      !isPlanIncludingResults ||
      !tierOneApi?.feature_key ||
      tierOneApi.is_installed
    ) {
      return;
    }
    autoInstalledTierOneRef.current = true;
    installAiFeature(estateId, tierOneApi.feature_key)
      .then(() => {
        refreshEstateEntitlements();
        if (featureDetail?.id) void loadFeature(featureDetail.id);
      })
      .catch(() => {
        // Ignore if already installed or not needed by backend
      });
  }, [estateId, isPlanIncludingResults, tierOneApi, featureDetail?.id, loadFeature]);

  const scrollViewRef = useRef<ScrollView>(null);

  const handleUpgradeFlow = () => {
    setUpgradeModalVisible(false);
    setActiveTab('Overview');
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

  const handleTabPress = (tab: 'Overview' | 'Result') => {
    if (tab === activeTab) return;
    if (tab === 'Result' && !hasResultAccess) {
      if (userRole === 'primary_admin') {
        setUpgradeModalVisible(true);
      } else {
        showContactAdminNotice(
          'access_anomaly_detection_tier_2',
          'Upgrade to Sentinel or activate Anomaly Detection Tier Two to view results. Contact Admin to upgrade.'
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
      } else if (!isLoading) {
        setActiveTab('Overview');
        if (userRole === 'primary_admin') {
          setUpgradeModalVisible(true);
        } else {
          showContactAdminNotice(
            'access_anomaly_detection_tier_2',
            'Upgrade to Sentinel or activate Anomaly Detection Tier Two to view results. Contact Admin to upgrade.'
          );
        }
      }
    }
  }, [params.tab, hasResultAccess, isLoading, userRole, showContactAdminNotice]);

  useEffect(() => {
    if (activeTab === 'Result' && featureDetail && !isLoading && !hasResultAccess) {
      setActiveTab('Overview');
      if (userRole === 'primary_admin') {
        setUpgradeModalVisible(true);
      } else {
        showContactAdminNotice(
          'access_anomaly_detection_tier_2',
          'Upgrade to Sentinel or activate Anomaly Detection Tier Two to view results. Contact Admin to upgrade.'
        );
      }
    }
  }, [activeTab, featureDetail, isLoading, hasResultAccess, userRole, showContactAdminNotice]);

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
          <Pressable
            onPress={() => router.back()}
            className="h-[30px] w-[30px] items-center justify-center"
            hitSlop={8}
          >
            <ValidationBackSvg width={30} height={30} />
          </Pressable>

          <AnimatedPillTabs
            options={[
              { value: 'Overview', label: 'Overview' },
              { value: 'Result', label: 'Result' },
            ]}
            value={activeTab}
            onChange={handleTabPress}
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

        {activeTab === 'Result' && hasResultAccess ? (
          <AnomalyResultView />
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
                    <Text
                      allowFontScaling={false}
                      className="text-[21.88px] font-ubuntu-semibold text-[#113E55] leading-[21.88px]"
                    >
                      {featureDetail?.name || 'Anomaly Detection'}
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
                      className="flex-row items-center gap-1.5"
                    >
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
                      <Text
                        allowFontScaling={false}
                        className="text-[21.88px] font-ubuntu-semibold text-[#6B7280] leading-[21.88px] text-center"
                      >
                        {featureDetail?.rating != null ? featureDetail.rating.toFixed(1) : '0.0'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Description */}
                  <Text
                    allowFontScaling={false}
                    className="text-[11.2px] font-inter-regular text-[#8A9A9D] leading-[16px]"
                  >
                    {featureDetail?.description}
                  </Text>

                  {/* Stats */}
                  <View className="flex-row items-center gap-6 mt-1">
                    <View className="flex-row items-center gap-1.5">
                      <DownloadSvg width={14} height={14} />
                      <Text
                        allowFontScaling={false}
                        className="text-[11.2px] font-inter-medium text-[#8A9A9D]"
                      >
                        {sortedTiers.filter((tier) => tier.is_installed).length}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <MaterialIcons name="people" size={16} color="#0E706B" />
                      <Text
                        allowFontScaling={false}
                        className="text-[11.2px] font-inter-medium text-[#8A9A9D]"
                      >
                        {featureDetail?.rating_count || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Lower Body Section on #F6F7F7 */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#F6F7F7',
                  paddingHorizontal: 20,
                  paddingTop: 24,
                  paddingBottom: 100,
                }}
              >
                {/* Product Feature */}
                <Text
                  allowFontScaling={false}
                  className="text-[14px] font-inter-medium text-[#113E55] mb-3 leading-[14px]"
                >
                  Product Feature
                </Text>

                {featureDetail?.product_features && featureDetail.product_features.length > 0 && (
                  <View className="mb-5">
                    {featureDetail.product_features.map((feature, idx) => (
                      <View
                        key={idx}
                        className="bg-white rounded-[16px] px-[16px] py-[8px] mb-3 flex-row items-center gap-[12px] min-h-[44px] border border-[#EFF1F3]"
                      >
                        <View className="w-[16px] h-[16px] items-center justify-center">
                          {idx % 3 === 0 ? (
                            <Pf1Svg width={16} height={16} />
                          ) : idx % 3 === 1 ? (
                            <Pf2Svg width={16} height={16} />
                          ) : (
                            <Pf3Svg width={16} height={16} />
                          )}
                        </View>
                        <Text
                          allowFontScaling={false}
                          className="text-[12px] font-inter-regular text-[#8A9A9D] flex-1 leading-[18px]"
                        >
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Choose Subscription Plan */}
                <Text
                  allowFontScaling={false}
                  className="text-[14px] font-inter-medium text-[#113E55] mb-4 leading-[14px]"
                >
                  Choose Subscription Plan
                </Text>

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
                        : (featureDetail?.tier_benefits?.find(
                            (group) => tierNumber(group.tier) === tierNumber(tierKey)
                          )?.benefits ?? []);
                      const description = tier.description?.trim() || '';
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
                      const order = Number.parseInt(tier.tier.replace(/\D/g, ''), 10) || 0;
                      const isTierOne = order === 1;
                      const isTierTwo = order === 2;

                      return (
                        <View
                          key={tier.ai_feature_id || tierKey}
                          ref={isTierOne ? tierOneRef : undefined}
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
                            onActivate={() => handlePressActivate(tier)}
                            onCancelSubscription={() => void handleCancelSubscription(tier)}
                            onUninstall={() => void handleUninstall(tier)}
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

      <DataInsightModal
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
                if (lowerUrl.includes('cancel') || lowerUrl.includes('cancelled')) {
                  setCheckoutUrl(null);
                  setActivePaystackReference(null);
                  setActiveCheckoutToken(null);
                  if (featureDetail?.id) {
                    loadFeature(featureDetail.id);
                  }
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
                  if (ref) {
                    startPaymentVerification(ref, token);
                  } else if (featureDetail?.id) {
                    loadFeature(featureDetail.id);
                  }
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
                    setCheckoutUrl(null);
                    setActivePaystackReference(null);
                    setActiveCheckoutToken(null);
                    if (featureDetail?.id) {
                      loadFeature(featureDetail.id);
                    }
                  }
                } catch {
                  // Ignore non-json messages
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
        estateId={estateId}
        onConfirm={handleConfirmActivation}
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
          if (featureDetail?.id) {
            loadFeature(featureDetail.id);
          }
        }}
      />

      <UpgradePlanModal
        visible={upgradeModalVisible}
        feature="access_anomaly_detection_tier_2"
        onClose={() => setUpgradeModalVisible(false)}
        onUpgrade={handleUpgradeFlow}
      />
    </View>
  );
}
