import React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';
import AnomalyResultView from '@/src/components/anomaly/AnomalyResultView';
import DataInsightModal from '@/src/components/anomaly/modals/DataInsightModal';
import AnimatedPillTabs from '@/src/components/mobile/AnimatedPillTabs';
import UpgradePlanModal from '@/src/components/mobile/UpgradePlanModal';
import { useEstateSubscription } from '@/src/hooks/useBillingQueries';
import { useContactAdminNoticeStore } from '@/src/hooks/usePlan';
import { useEstateEntitlements } from '@/src/lib/api/entitlements';
import { hasEntitlement } from '@/src/lib/plans';
import { useUserStore } from '@/src/lib/stores/userStore';
import {
  getMarketplaceFeatures,
  getMarketplaceFeatureById,
  sortMarketplaceTiers,
} from '@/src/lib/api/aiMarketplace';
import { MarketplaceDetailResponse, MarketplaceTier } from '@/src/types/aiMarketplace';

export default function AnomalyDetectionSummaryScreen() {
  const [dataInsightVisible, setDataInsightVisible] = React.useState(false);
  const [featureDetail, setFeatureDetail] = React.useState<MarketplaceDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [upgradeModalVisible, setUpgradeModalVisible] = React.useState(false);
  const params = useLocalSearchParams<{ featureId?: string }>();
  const userRole = useUserStore((s) => s.role);
  const showContactAdminNotice = useContactAdminNoticeStore((s) => s.show);
  const { data: subscriptionData, isLoading: subLoading } = useEstateSubscription();
  const { data: entitlements, isLoading: entLoading } = useEstateEntitlements();

  React.useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
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
      } catch (err) {
        // Silent fail
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
  }, [params.featureId]);

  const sortedTiers = featureDetail?.tiers ? sortMarketplaceTiers(featureDetail.tiers) : [];
  const tierTwoApi = sortedTiers[1];
  const tierThreeApi = sortedTiers[2];
  const isTierSubscribed = (tier?: MarketplaceTier | null) =>
    Boolean(
      tier &&
      (tier.status === 'active' ||
        tier.status === 'purchased' ||
        tier.status === 'subscribed' ||
        tier.status === 'installed' ||
        tier.purchased)
    );

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

  const checkingAccess = isLoading || subLoading || entLoading;

  React.useEffect(() => {
    if (!checkingAccess && !hasResultAccess) {
      if (userRole === 'primary_admin') {
        setUpgradeModalVisible(true);
      } else {
        showContactAdminNotice(
          'access_anomaly_detection_tier_2',
          'Upgrade to Sentinel or activate Anomaly Detection Tier Two to view results. Contact Admin to upgrade.'
        );
        router.replace('/(protected)/(shared-screens)/ai-store/anomaly-detection');
      }
    }
  }, [checkingAccess, hasResultAccess, userRole, showContactAdminNotice]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#F6F7F7' }}>
      {/* Header: matches Figma */}
      <View
        style={{
          height: 54,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          backgroundColor: '#F6F7F7',
        }}
      >
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(protected)/(shared-screens)/ai-store/anomaly-detection');
            }
          }}
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
          value={hasResultAccess ? 'Result' : 'Overview'}
          onChange={(tab) => {
            if (tab === 'Overview') {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(protected)/(shared-screens)/ai-store/anomaly-detection');
              }
            }
          }}
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

      {checkingAccess ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#113E55" />
        </View>
      ) : hasResultAccess ? (
        <View style={{ flex: 1 }}>
          <AnomalyResultView isActive />
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <UpgradePlanModal
        visible={upgradeModalVisible}
        feature="access_anomaly_detection_tier_2"
        onClose={() => {
          setUpgradeModalVisible(false);
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(protected)/(shared-screens)/ai-store/anomaly-detection');
          }
        }}
        onUpgrade={() => {
          setUpgradeModalVisible(false);
          router.replace('/(protected)/(shared-screens)/ai-store/anomaly-detection');
        }}
      />

      <DataInsightModal
        visible={dataInsightVisible}
        onClose={() => setDataInsightVisible(false)}
        dataInsight={featureDetail?.data_insight}
      />
    </SafeAreaView>
  );
}
