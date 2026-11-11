import React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import IncidentResultView from '@/src/components/incident/IncidentResultView';
import AnimatedPillTabs from '@/src/components/mobile/AnimatedPillTabs';
import UpgradePlanModal from '@/src/components/mobile/UpgradePlanModal';
import { useEstateSubscription } from '@/src/hooks/useBillingQueries';
import { useContactAdminNoticeStore } from '@/src/hooks/usePlan';
import {
  getMarketplaceFeatureById,
  getMarketplaceFeatures,
  sortMarketplaceTiers,
} from '@/src/lib/api/aiMarketplace';
import { useEstateEntitlements } from '@/src/lib/api/entitlements';
import { hasEntitlement } from '@/src/lib/plans';
import { useUserStore } from '@/src/lib/stores/userStore';
import { MarketplaceDetailResponse, MarketplaceTier } from '@/src/types/aiMarketplace';

export default function IncidentReportSummaryScreen() {
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
          const incidentTool = list.items?.find((item) =>
            item.name.toLowerCase().includes('incident')
          );
          if (incidentTool) {
            targetId = incidentTool.id;
          }
        }
        if (targetId && isMounted) {
          const detail = await getMarketplaceFeatureById(targetId);
          if (isMounted) {
            setFeatureDetail(detail);
          }
        }
      } catch {
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
    hasEntitlement(entitlements, 'incident_report_summary_tier_2') ||
    hasEntitlement(entitlements, 'incident_report_summary_tier_3');
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
          'incident_report_summary_tier_2',
          'Upgrade to Sentinel or activate Incident Report Tier Two to view results. Contact Admin to upgrade.'
        );
        router.replace('/(protected)/(shared-screens)/ai-store/incident-report');
      }
    }
  }, [checkingAccess, hasResultAccess, userRole, showContactAdminNotice]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: '#F6F7F7' }}>
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
        <Back
          type="short-arrow"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(protected)/(shared-screens)/ai-store/incident-report');
            }
          }}
        />

        <AnimatedPillTabs
          options={[
            { value: 'Preview', label: 'Overview' },
            { value: 'Result', label: 'Result' },
          ]}
          value={hasResultAccess ? 'Result' : 'Preview'}
          onChange={(tab) => {
            if (tab === 'Preview') {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(protected)/(shared-screens)/ai-store/incident-report');
              }
            }
          }}
        />

        {/* Spacer keeps pill tabs centered with the back button */}
        <View className="h-[30px] w-[30px]" />
      </View>

      <View style={{ flex: 1 }}>
        {checkingAccess ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color="#113E55" />
          </View>
        ) : hasResultAccess ? (
          <IncidentResultView />
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>

      <UpgradePlanModal
        visible={upgradeModalVisible}
        feature="incident_report_summary_tier_2"
        onClose={() => {
          setUpgradeModalVisible(false);
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(protected)/(shared-screens)/ai-store/incident-report');
          }
        }}
        onUpgrade={() => {
          setUpgradeModalVisible(false);
          router.replace('/(protected)/(shared-screens)/ai-store/incident-report');
        }}
      />
    </SafeAreaView>
  );
}
