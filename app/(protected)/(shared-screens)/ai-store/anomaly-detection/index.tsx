import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  runOnJS,
  FadeIn,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';
import AnomalyRadarChart from '@/src/components/anomaly/AnomalyRadarChart';
import AnomalyDonutChart from '@/src/components/anomaly/AnomalyDonutChart';
import SemiCircleGauge from '@/src/components/anomaly/SemiCircleGauge';
import FilterModal from '@/src/components/anomaly/modals/FilterModal';
import OrderModal from '@/src/components/anomaly/modals/OrderModal';
import GaugeDetailModal, { GaugeData } from '@/src/components/anomaly/modals/GaugeDetailModal';
import DatePickerModal from '@/src/components/anomaly/modals/DatePickerModal';
import TimeframeModal from '@/src/components/anomaly/modals/TimeframeModal';

import Pf1Svg from '@/src/assets/icons/pf_1.svg';
import Pf2Svg from '@/src/assets/icons/pf_2.svg';
import Pf3Svg from '@/src/assets/icons/pf_3.svg';
import DownloadSvg from '@/src/assets/icons/download.svg';
import AnomalySvg from '@/src/assets/images/anomaly.svg';
import RatingModal from '@/src/components/anomaly/modals/RatingModal';
import DataInsightModal from '@/src/components/anomaly/modals/DataInsightModal';
import AnomalyResultView from '@/src/components/anomaly/AnomalyResultView';
import { WebView } from 'react-native-webview';
import {
  getMarketplaceFeatureById,
  getMarketplaceFeatures,
  subscribeMarketplaceFeature,
  getFeaturePictureUrl,
  rateMarketplaceFeature,
  uninstallAiFeature,
  installAiFeature,
  initializeCheckout,
  cancelMarketplaceSubscription,
  sortMarketplaceTiers,
} from '@/src/lib/api/aiMarketplace';
import { useUserStore } from '@/src/lib/stores/userStore';
import { MarketplaceDetailResponse } from '@/src/types/aiMarketplace';

const PILL_WIDTH = 228;
const PILL_HEIGHT = 40;
const PADDING = 3;
const TAB_WIDTH = (PILL_WIDTH - PADDING * 2) / 2; // 111
const TAB_HEIGHT = PILL_HEIGHT - PADDING * 2; // 34

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 0.7,
};

export default function AnomalyDetectionPreviewScreen() {
  const params = useLocalSearchParams<{ featureId?: string; title?: string; tab?: string }>();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Result'>(
    params.tab === 'Result' ? 'Result' : 'Overview'
  );
  const [prevParamTab, setPrevParamTab] = useState(params.tab);
  if (params.tab !== prevParamTab) {
    setPrevParamTab(params.tab);
    const newTab = params.tab === 'Result' ? 'Result' : 'Overview';
    setActiveTab(newTab);
  }
  const [expandedTier, setExpandedTier] = useState<string | null>('Tier Two');
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
            item.name.toLowerCase().includes('anomaly')
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

        let targetId = params.featureId;
        if (!targetId) {
          const list = await getMarketplaceFeatures();
          const anomalyTool = list.items?.find((item) =>
            item.name.toLowerCase().includes('anomaly')
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
  }, [params.featureId, estateId]);

  const handleSubscribe = async (tierPayload: {
    id?: string;
    tier: string;
    ai_feature_id?: string;
    is_free?: boolean;
    is_installed?: boolean;
    feature_key?: string | null;
  }) => {
    if (!featureDetail?.id || (!tierPayload.ai_feature_id && !tierPayload.feature_key)) {
      return;
    }

    setSubscribingTierKey(tierPayload.tier);
    setIsSubscribing(true);
    try {
      if (tierPayload.is_free) {
        if (tierPayload.feature_key) {
          await installAiFeature(estateId, tierPayload.feature_key);
        } else {
          await subscribeMarketplaceFeature(featureDetail.id, {
            ai_feature_id: tierPayload.ai_feature_id,
            period_months: 1,
          });
        }
        Alert.alert('Success', 'Free feature tier activated successfully!');
        loadFeature(featureDetail.id);
      } else {
        if (tierPayload.feature_key) {
          const response = await initializeCheckout({
            estate_id: estateId,
            customer_email: email,
            checkout_kind: 'ai_only',
            ai_feature_keys: tierPayload.feature_key ? [tierPayload.feature_key] : undefined,
            ai_feature_ids: tierPayload.ai_feature_id ? [tierPayload.ai_feature_id] : undefined,
            period_months: 1,
          });

          if (response?.authorization_url) {
            setCheckoutUrl(response.authorization_url);
            // Mark as just purchased so it shows 'Install' after checkout
            setJustPurchasedTiers((prev) => ({ ...prev, [tierPayload.tier]: true }));
            // Also remove from justCancelledTiers if they activate again
            setJustCancelledTiers((prev) => {
              const next = { ...prev, [tierPayload.tier]: false };
              if (estateId) AsyncStorage.setItem(`cancelledTiers-${estateId}`, JSON.stringify(next)).catch(console.error);
              return next;
            });
          }
        } else {
          await subscribeMarketplaceFeature(featureDetail.id, {
            ai_feature_id: tierPayload.ai_feature_id,
            period_months: 1,
          });
          Alert.alert('Success', 'Subscription quote created successfully.');
        }
      }
    } catch (err: any) {
      Alert.alert('Subscription Failed', err?.message || 'Failed to activate tier.');
    } finally {
      setIsSubscribing(false);
      setSubscribingTierKey(null);
    }
  };

  const handleCancelSubscription = async (tierPayload: { tier: string }) => {
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
          await cancelMarketplaceSubscription(estateId);
          Alert.alert('Success', 'Subscription cancelled successfully.');
          setJustCancelledTiers((prev) => {
            const next = { ...prev, [tierPayload.tier]: true };
            if (estateId) AsyncStorage.setItem(`cancelledTiers-${estateId}`, JSON.stringify(next)).catch(console.error);
            return next;
          });
          loadFeature(featureDetail?.id);
        } catch (err: any) {
          const errorMessage = err?.message || 'Failed to cancel subscription.';
          // If Paystack says it failed to disable, it's almost certainly because it's already cancelled
          if (
            errorMessage.toLowerCase().includes('disable subscription failed') ||
            errorMessage.toLowerCase().includes('already')
          ) {
            setJustCancelledTiers((prev) => {
              const next = { ...prev, [tierPayload.tier]: true };
              if (estateId) AsyncStorage.setItem(`cancelledTiers-${estateId}`, JSON.stringify(next)).catch(console.error);
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
          loadFeature(featureDetail?.id);
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
      loadFeature(featureDetail?.id);
    } catch (err: any) {
      Alert.alert('Install Failed', err?.message || 'Failed to install feature.');
    } finally {
      setIsInstalling(false);
      setInstallingTierKey(null);
    }
  };


  const sortedTiers = featureDetail?.tiers ? sortMarketplaceTiers(featureDetail.tiers) : [];
  const tierOneApi = sortedTiers[0];
  const tierTwoApi = sortedTiers[1];
  const tierThreeApi = sortedTiers[2];

  const renderTierButtons = (tierApi: any, fallbackTier: string) => {
    const api = tierApi || { tier: fallbackTier };
    const isSubscribed = api.status === 'active' || api.status === 'purchased' || api.status === 'subscribed' || api.status === 'installed' || api.purchased;
    const isCancelledLocally = !!justCancelledTiers[api.tier];
    const isInstalled = !!api.is_installed && !justPurchasedTiers[api.tier];

    const showActivate = !isSubscribed;
    const showCancel = isSubscribed;
    const showInstall = isSubscribed && !isInstalled;
    const showUninstall = isInstalled;
    
    return (
      <View className="gap-3 mt-4">
        {showActivate && (
          <Pressable
            disabled={isSubscribing}
            onPress={() => handleSubscribe(api)}
            className="w-full h-[48px] bg-[#113E55] rounded-full items-center justify-center"
          >
            {subscribingTierKey === api.tier ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-white">
                Activate
              </Text>
            )}
          </Pressable>
        )}
        
        {showCancel && (
          <Pressable
            disabled={isCanceling || isCancelledLocally}
            style={{ opacity: isCancelledLocally ? 0.5 : 1 }}
            className="w-full h-[48px] bg-[#113E55] rounded-full items-center justify-center"
            onPress={() => handleCancelSubscription(api)}
          >
            {cancelTierKey === api.tier ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-white">
                {isCancelledLocally ? 'Cancelled' : 'Cancel Subscription'}
              </Text>
            )}
          </Pressable>
        )}

        {showInstall && (
          <Pressable
            disabled={isInstalling}
            className="w-full h-[48px] bg-[#E3F5FC] rounded-full items-center justify-center"
            onPress={() => handleInstall(api)}
          >
            {installingTierKey === api.tier ? (
              <ActivityIndicator size="small" color="#113E55" />
            ) : (
              <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-[#113E55]">
                Install
              </Text>
            )}
          </Pressable>
        )}

        {showUninstall && (
          <Pressable
            disabled={isUninstalling}
            className="w-full h-[48px] bg-[#E3F5FC] rounded-full items-center justify-center"
            onPress={() => handleUninstall(api)}
          >
            {uninstallingTierKey === api.tier ? (
              <ActivityIndicator size="small" color="#113E55" />
            ) : (
              <Text allowFontScaling={false} className="text-[14px] font-inter-medium text-[#113E55]">
                Uninstall
              </Text>
            )}
          </Pressable>
        )}
      </View>
    );
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const translateX = useSharedValue(params.tab === 'Result' ? TAB_WIDTH : 0);
  const startX = useSharedValue(0);

  const handleTabPress = (tab: 'Overview' | 'Result') => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      const targetX = tab === 'Result' ? TAB_WIDTH : 0;
      translateX.value = withSpring(targetX, SPRING_CONFIG);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onStart(() => {
      'worklet';
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      'worklet';
      const raw = startX.value + e.translationX;
      if (raw < 0) {
        translateX.value = raw * 0.25;
      } else if (raw > TAB_WIDTH) {
        translateX.value = TAB_WIDTH + (raw - TAB_WIDTH) * 0.25;
      } else {
        translateX.value = raw;
      }
    })
    .onEnd((e) => {
      'worklet';
      let targetTab: 'Overview' | 'Result' = 'Overview';
      if (e.velocityX > 250) {
        targetTab = 'Result';
      } else if (e.velocityX < -250) {
        targetTab = 'Overview';
      } else {
        targetTab = translateX.value > TAB_WIDTH / 2 ? 'Result' : 'Overview';
      }

      const targetX = targetTab === 'Result' ? TAB_WIDTH : 0;
      translateX.value = withSpring(targetX, {
        ...SPRING_CONFIG,
        velocity: e.velocityX,
      });

      runOnJS(setActiveTab)(targetTab);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd((e) => {
      'worklet';
      const targetTab: 'Overview' | 'Result' = e.x < PILL_WIDTH / 2 ? 'Overview' : 'Result';
      const targetX = targetTab === 'Result' ? TAB_WIDTH : 0;
      translateX.value = withSpring(targetX, SPRING_CONFIG);
      runOnJS(setActiveTab)(targetTab);
    });

  const pillGesture = Gesture.Race(panGesture, tapGesture);

  useEffect(() => {
    const targetX = activeTab === 'Result' ? TAB_WIDTH : 0;
    translateX.value = withSpring(targetX, SPRING_CONFIG);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedHeaderBgStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      backgroundColor: interpolateColor(translateX.value, [0, TAB_WIDTH], ['#FFFFFF', '#F6F7F7']),
    };
  });

  const overviewTextStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      color: interpolateColor(translateX.value, [0, TAB_WIDTH], ['#113E55', '#8A9A9D']),
    };
  });

  const resultTextStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      color: interpolateColor(translateX.value, [0, TAB_WIDTH], ['#8A9A9D', '#113E55']),
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedHeaderBgStyle]}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        {/* Header: matches Figma top 55px to 109px (height 54px) */}
        <Animated.View
          style={[
            {
              height: 54,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
            },
            animatedHeaderBgStyle,
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            className="h-[30px] w-[30px] items-center justify-center"
            hitSlop={8}
          >
            <ValidationBackSvg width={30} height={30} />
          </Pressable>

          <GestureDetector gesture={pillGesture}>
            <View style={styles.pillContainer}>
              <Animated.View style={[styles.pillIndicator, animatedIndicatorStyle]} />
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'Overview' }}
                onPress={() => handleTabPress('Overview')}
                style={styles.pillTab}
              >
                <Animated.Text style={[styles.pillText, overviewTextStyle]}>Overview</Animated.Text>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'Result' }}
                onPress={() => handleTabPress('Result')}
                style={styles.pillTab}
              >
                <Animated.Text style={[styles.pillText, resultTextStyle]}>Result</Animated.Text>
              </Pressable>
            </View>
          </GestureDetector>

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
        </Animated.View>

        {activeTab === 'Result' ? (
          <AnomalyResultView />
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
                      onPress={() => setIsRatingModalVisible(true)}
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
                        0
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

                <View
                  className={`rounded-[16px] p-5 mb-4 ${expandedTier === 'Tier One' ? (tierOneApi?.is_installed ? 'bg-[#F2FAF9] border border-[#1B998B]' : 'bg-white border border-[#113E55]') : 'bg-white border border-[#EFF1F3]'}`}
                >
                  <View className="flex-row justify-between items-start mb-1.5">
                    <View className="flex-1 pr-2">
                      <Text
                        allowFontScaling={false}
                        className={`text-[17.5px] font-inter-regular leading-[17.5px] mb-1.5 ${tierOneApi?.is_installed && expandedTier === 'Tier One' ? 'text-[#1B998B]' : 'text-[#113E55]'}`}
                      >
                        {tierOneApi?.tier ? formatTierName(tierOneApi.tier) : 'Tier One'}
                      </Text>
                      {tierOneApi?.name && (
                        <Text
                          allowFontScaling={false}
                          className={`text-[15px] font-inter-medium leading-[22px] mb-2.5 ${tierOneApi?.is_installed && expandedTier === 'Tier One' ? 'text-[#1B998B]' : 'text-[#113E55]'}`}
                        >
                          {tierOneApi?.name}
                        </Text>
                      )}
                    </View>
                    {tierOneApi?.is_installed && expandedTier === 'Tier One' && (
                      <View className="bg-[#D9EAE8] px-[22px] py-[10px] rounded-[14px]">
                        <Text
                          allowFontScaling={false}
                          className="text-[#1B998B] font-inter-medium text-[13px]"
                        >
                          ACTIVE
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    allowFontScaling={false}
                    className="text-[11.2px] font-inter-regular text-[#8A9A9D] leading-[16px] text-justify"
                  >
                    {tierOneApi?.description}
                  </Text>

                  <Pressable
                    onPress={() => setExpandedTier(expandedTier === 'Tier One' ? null : 'Tier One')}
                    className={`flex-row items-center gap-1 mt-5 ${expandedTier === 'Tier One' ? 'mb-5' : ''}`}
                  >
                    <Text
                      allowFontScaling={false}
                      className="text-[13px] font-inter-medium text-[#8A9A9D]"
                    >
                      See benefits
                    </Text>
                    <MaterialIcons
                      name={
                        expandedTier === 'Tier One' ? 'keyboard-arrow-down' : 'keyboard-arrow-right'
                      }
                      size={18}
                      color="#8A9A9D"
                    />
                  </Pressable>

                  {expandedTier === 'Tier One' && (
                    <View className="space-y-3">
                      {(tierOneApi?.benefits || []).map((benefit, index) => (
                        <View key={index} className="flex-row items-start gap-2 mb-3">
                          <View
                            className={`${tierOneApi?.is_installed ? 'bg-[#D9EAE8]' : 'bg-[#CEE5ED]'} rounded-full p-[2px] mt-[2px]`}
                          >
                            <MaterialIcons
                              name="check"
                              size={12}
                              color={tierOneApi?.is_installed ? '#1B998B' : '#113E55'}
                            />
                          </View>
                          <Text
                            allowFontScaling={false}
                            className="text-[11.2px] font-inter-regular text-[#8A9A9D] flex-1 leading-[16px] text-justify"
                          >
                            {benefit}
                          </Text>
                        </View>
                      ))}
                      {renderTierButtons(tierOneApi, 'Tier One')}
                    </View>
                  )}
                </View>

                <View
                  className={`rounded-[16px] p-5 mb-4 ${expandedTier === 'Tier Two' ? (tierTwoApi?.is_installed ? 'bg-[#F2FAF9] border border-[#1B998B]' : 'bg-white border border-[#113E55]') : 'bg-white border border-[#EFF1F3]'}`}
                >
                  <View className="flex-row justify-between items-start mb-1.5">
                    <View className="flex-1 pr-2">
                      <Text
                        allowFontScaling={false}
                        className={`text-[17.5px] font-inter-regular leading-[17.5px] mb-1.5 ${tierTwoApi?.is_installed && expandedTier === 'Tier Two' ? 'text-[#1B998B]' : 'text-[#113E55]'}`}
                      >
                        {tierTwoApi?.tier ? formatTierName(tierTwoApi.tier) : 'Tier Two'}
                      </Text>
                      {tierTwoApi?.name && (
                        <Text
                          allowFontScaling={false}
                          className={`text-[15px] font-inter-medium leading-[22px] mb-2.5 ${tierTwoApi?.is_installed && expandedTier === 'Tier Two' ? 'text-[#1B998B]' : 'text-[#113E55]'}`}
                        >
                          {tierTwoApi?.name}
                        </Text>
                      )}
                    </View>
                    {tierTwoApi?.is_installed && expandedTier === 'Tier Two' && (
                      <View className="bg-[#D9EAE8] px-[22px] py-[10px] rounded-[14px]">
                        <Text
                          allowFontScaling={false}
                          className="text-[#1B998B] font-inter-medium text-[13px]"
                        >
                          ACTIVE
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    allowFontScaling={false}
                    className="text-[11.2px] font-inter-regular text-[#8A9A9D] leading-[16px] text-justify"
                  >
                    {tierTwoApi?.description}
                  </Text>

                  <Pressable
                    onPress={() => setExpandedTier(expandedTier === 'Tier Two' ? null : 'Tier Two')}
                    className={`flex-row items-center gap-1 mt-5 ${expandedTier === 'Tier Two' ? 'mb-5' : ''}`}
                  >
                    <Text
                      allowFontScaling={false}
                      className="text-[13px] font-inter-medium text-[#8A9A9D]"
                    >
                      See benefits
                    </Text>
                    <MaterialIcons
                      name={
                        expandedTier === 'Tier Two' ? 'keyboard-arrow-down' : 'keyboard-arrow-right'
                      }
                      size={18}
                      color="#8A9A9D"
                    />
                  </Pressable>

                  {expandedTier === 'Tier Two' && (
                    <View className="space-y-3">
                      {(tierTwoApi?.benefits || []).map((benefit, index) => (
                        <View key={index} className="flex-row items-start gap-2 mb-3">
                          <View
                            className={`${tierTwoApi?.is_installed ? 'bg-[#D9EAE8]' : 'bg-[#CEE5ED]'} rounded-full p-[2px] mt-[2px]`}
                          >
                            <MaterialIcons
                              name="check"
                              size={12}
                              color={tierTwoApi?.is_installed ? '#1B998B' : '#113E55'}
                            />
                          </View>
                          <Text
                            allowFontScaling={false}
                            className="text-[11.2px] font-inter-regular text-[#8A9A9D] flex-1 leading-[16px] text-justify"
                          >
                            {benefit}
                          </Text>
                        </View>
                      ))}
                      {renderTierButtons(tierTwoApi, 'Tier Two')}
                    </View>
                  )}
                </View>

                <View
                  className={`rounded-[16px] p-5 mb-4 ${expandedTier === 'Tier Three' ? (tierThreeApi?.is_installed ? 'bg-[#F2FAF9] border border-[#1B998B]' : 'bg-white border border-[#113E55]') : 'bg-white border border-[#EFF1F3]'}`}
                >
                  <View className="flex-row justify-between items-start mb-1.5">
                    <View className="flex-1 pr-2">
                      <Text
                        allowFontScaling={false}
                        className={`text-[17.5px] font-inter-regular leading-[17.5px] mb-1.5 ${tierThreeApi?.is_installed && expandedTier === 'Tier Three' ? 'text-[#1B998B]' : 'text-[#113E55]'}`}
                      >
                        {tierThreeApi?.tier ? formatTierName(tierThreeApi.tier) : 'Tier Three'}
                      </Text>
                      {tierThreeApi?.name && (
                        <Text
                          allowFontScaling={false}
                          className={`text-[15px] font-inter-medium leading-[22px] mb-2.5 ${tierThreeApi?.is_installed && expandedTier === 'Tier Three' ? 'text-[#1B998B]' : 'text-[#113E55]'}`}
                        >
                          {tierThreeApi?.name}
                        </Text>
                      )}
                    </View>
                    {tierThreeApi?.is_installed && expandedTier === 'Tier Three' && (
                      <View className="bg-[#D9EAE8] px-[22px] py-[10px] rounded-[14px]">
                        <Text
                          allowFontScaling={false}
                          className="text-[#1B998B] font-inter-medium text-[13px]"
                        >
                          ACTIVE
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    allowFontScaling={false}
                    className="text-[11.2px] font-inter-regular text-[#8A9A9D] leading-[16px] text-justify"
                  >
                    {tierThreeApi?.description}
                  </Text>

                  <Pressable
                    onPress={() =>
                      setExpandedTier(expandedTier === 'Tier Three' ? null : 'Tier Three')
                    }
                    className={`flex-row items-center gap-1 mt-5 ${expandedTier === 'Tier Three' ? 'mb-5' : ''}`}
                  >
                    <Text
                      allowFontScaling={false}
                      className="text-[13px] font-inter-medium text-[#8A9A9D]"
                    >
                      See benefits
                    </Text>
                    <MaterialIcons
                      name={
                        expandedTier === 'Tier Three'
                          ? 'keyboard-arrow-down'
                          : 'keyboard-arrow-right'
                      }
                      size={18}
                      color="#8A9A9D"
                    />
                  </Pressable>

                  {expandedTier === 'Tier Three' && (
                    <View className="space-y-3">
                      {(tierThreeApi?.benefits || []).map((benefit, index) => (
                        <View key={index} className="flex-row items-start gap-2 mb-3">
                          <View
                            className={`${tierThreeApi?.is_installed ? 'bg-[#D9EAE8]' : 'bg-[#CEE5ED]'} rounded-full p-[2px] mt-[2px]`}
                          >
                            <MaterialIcons
                              name="check"
                              size={12}
                              color={tierThreeApi?.is_installed ? '#1B998B' : '#113E55'}
                            />
                          </View>
                          <Text
                            allowFontScaling={false}
                            className="text-[11.2px] font-inter-regular text-[#8A9A9D] flex-1 leading-[16px] text-justify"
                          >
                            {benefit}
                          </Text>
                        </View>
                      ))}
                      {renderTierButtons(tierThreeApi, 'Tier Three')}
                    </View>
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
        onRequestClose={() => setCheckoutUrl(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#EFF1F3' }}>
            <Pressable onPress={() => setCheckoutUrl(null)} style={{ padding: 8, marginLeft: -8 }}>
              <MaterialIcons name="close" size={24} color="#113E55" />
            </Pressable>
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 16, color: '#113E55' }}>Checkout</Text>
            <View style={{ width: 40 }} />
          </View>
          {checkoutUrl && (
            <WebView
              source={{ uri: checkoutUrl }}
              style={{ flex: 1 }}
              onNavigationStateChange={(navState) => {
                if (
                  navState.url.includes('app.gatepassng.com') ||
                  navState.url.includes('gatepassng.com/callback') ||
                  navState.url.includes('callback') ||
                  navState.url.includes('close')
                ) {
                  setCheckoutUrl(null);
                  if (featureDetail?.id) {
                    loadFeature(featureDetail.id);
                  }
                }
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

      <Modal visible={confirmModalVisible} transparent animationType="fade" onRequestClose={() => setConfirmModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', backgroundColor: '#F2F4F4', borderRadius: 28, padding: 24, paddingTop: 28, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 15, elevation: 10 }}>
            <Text allowFontScaling={false} style={{ fontSize: 18, fontFamily: 'Inter_18pt-SemiBold', color: '#000', marginBottom: 10 }}>
              {confirmModalConfig.title}
            </Text>
            <Text allowFontScaling={false} style={{ fontSize: 15, fontFamily: 'Inter_18pt-Regular', color: '#666', marginBottom: 28, lineHeight: 22 }}>
              {confirmModalConfig.message}
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <Pressable
                onPress={() => setConfirmModalVisible(false)}
                style={{ flex: 1, backgroundColor: '#EBEBEB', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}
              >
                <Text allowFontScaling={false} style={{ fontSize: 16, fontFamily: 'Inter_18pt-Medium', color: '#000' }}>
                  {confirmModalConfig.cancelText}
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmModalConfig.onConfirm}
                style={{ flex: 1, backgroundColor: '#EBEBEB', height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3 }}
              >
                <Text allowFontScaling={false} style={{ fontSize: 16, fontFamily: 'Inter_18pt-Medium', color: confirmModalConfig.confirmStyle === 'destructive' ? '#FF3B30' : '#000' }}>
                  {confirmModalConfig.confirmText}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    backgroundColor: '#EFF1F1',
    borderRadius: PILL_HEIGHT / 2,
    padding: PADDING,
    flexDirection: 'row',
    position: 'relative',
  },
  pillIndicator: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    backgroundColor: '#DFEBF1',
    borderRadius: TAB_HEIGHT / 2,
  },
  pillTab: {
    width: TAB_WIDTH,
    height: TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pillText: {
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 11.2,
    lineHeight: 11.2,
    textAlign: 'center',
  },
});
