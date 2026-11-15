import { useGoBack } from '@/src/shared/hooks/useGoBack';
import React from 'react';
import { View, Pressable } from 'react-native';
import ScreenLoading from '@/src/shared/components/feedback/ScreenLoading';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import Back from '@/src/shared/components/navigation/Back';
import AnomalyResultView from '@/src/features/ai/components/anomaly/AnomalyResultView';
import DataInsightModal from '@/src/features/ai/components/shared/DataInsightModal';
import {
  ANOMALY_INSIGHT_PAGE_COUNT,
  AnomalyInsightPage,
} from '@/src/features/ai/components/anomaly/modals/anomalyInsightStory';
import AnimatedPillTabs from '@/src/shared/components/AnimatedPillTabs';
import { CrownIcon } from '@/src/assets/svgs';
import PromptModal from '@/src/shared/components/feedback/PromptModal';
import { getUpgradeCopy } from '@/src/features/billing/utils/plans';
import { useUserStore } from '@/src/store/userStore';
import { useAiResultAccess } from '@/src/features/ai/hooks/useAiResultAccess';
import { isAnomalyProduct } from '@/src/features/ai/hooks/useAnomalyProduct';

export default function AnomalyDetectionSummaryScreen() {
  const goBack = useGoBack();
  const [dataInsightVisible, setDataInsightVisible] = React.useState(false);
  const params = useLocalSearchParams<{ featureId?: string }>();
  const estateId = useUserStore((s) => s.estate_id) || '';
  const {
    featureDetail,
    checkingAccess,
    hasResultAccess,
    upgradeModalVisible,
    setUpgradeModalVisible,
  } = useAiResultAccess({
    featureId: typeof params.featureId === 'string' ? params.featureId : undefined,
    nameMatch: isAnomalyProduct,
    estateId,
    paidTierFeatures: ['access_anomaly_detection_tier_2', 'access_anomaly_detection_tier_3'],
    contactAdminMessage:
      'Upgrade to Sentinel or activate Anomaly Detection Tier Two to view results. Contact Admin to upgrade.',
    productRoute: '/(protected)/(shared-screens)/ai-store/anomaly-detection',
  });

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
        <Back
          type="short-arrow"
          onPress={() => {
            if (router.canGoBack()) {
              goBack();
            } else {
              router.replace('/(protected)/(shared-screens)/ai-store/anomaly-detection');
            }
          }}
        />

        <AnimatedPillTabs
          options={[
            { value: 'Overview', label: 'Overview' },
            { value: 'Result', label: 'Result' },
          ]}
          value={hasResultAccess ? 'Result' : 'Overview'}
          onChange={(tab) => {
            if (tab === 'Overview') {
              if (router.canGoBack()) {
                goBack();
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
          <ScreenLoading />
        </View>
      ) : hasResultAccess ? (
        <View style={{ flex: 1 }}>
          <AnomalyResultView isActive />
        </View>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <PromptModal
        visible={upgradeModalVisible}
        icon={<CrownIcon width={40} height={40} />}
        title="Upgrade Plan"
        message={getUpgradeCopy('access_anomaly_detection_tier_2')}
        confirmLabel="Upgrade Your Plan"
        onClose={() => {
          setUpgradeModalVisible(false);
          if (router.canGoBack()) {
            goBack();
          } else {
            router.replace('/(protected)/(shared-screens)/ai-store/anomaly-detection');
          }
        }}
        onConfirm={() => {
          setUpgradeModalVisible(false);
          router.replace('/(protected)/(shared-screens)/ai-store/anomaly-detection');
        }}
      />

      <DataInsightModal
        visible={dataInsightVisible}
        onClose={() => setDataInsightVisible(false)}
        dataInsight={featureDetail?.data_insight}
        pageCount={ANOMALY_INSIGHT_PAGE_COUNT}
        renderPage={(index) => <AnomalyInsightPage index={index} />}
      />
    </SafeAreaView>
  );
}
