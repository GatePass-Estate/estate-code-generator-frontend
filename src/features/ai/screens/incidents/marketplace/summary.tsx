import { useGoBack } from '@/src/shared/hooks/useGoBack';
import React from 'react';
import { View } from 'react-native';
import ScreenLoading from '@/src/shared/components/feedback/ScreenLoading';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/shared/components/navigation/Back';
import IncidentResultView from '@/src/features/ai/components/incidents/IncidentResultView';
import AnimatedPillTabs from '@/src/shared/components/AnimatedPillTabs';
import { CrownIcon } from '@/src/assets/svgs';
import PromptModal from '@/src/shared/components/feedback/PromptModal';
import { getUpgradeCopy } from '@/src/features/billing/utils/plans';
import { useUserStore } from '@/src/store/userStore';
import { useAiResultAccess } from '@/src/features/ai/hooks/useAiResultAccess';
import { isIncidentProduct } from '@/src/features/ai/hooks/useIncidentProduct';

export default function IncidentReportSummaryScreen() {
  const goBack = useGoBack();
  const params = useLocalSearchParams<{ featureId?: string }>();
  const estateId = useUserStore((s) => s.estate_id);
  const { checkingAccess, hasResultAccess, upgradeModalVisible, setUpgradeModalVisible } =
    useAiResultAccess({
      featureId: typeof params.featureId === 'string' ? params.featureId : undefined,
      nameMatch: isIncidentProduct,
      estateId: estateId || undefined,
      paidTierFeatures: ['incident_report_summary_tier_2', 'incident_report_summary_tier_3'],
      contactAdminMessage:
        'Upgrade to Sentinel or activate Incident Report Tier Two to view results. Contact Admin to upgrade.',
      productRoute: '/(protected)/(shared-screens)/ai-store/incident-report',
    });

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
              goBack();
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
                goBack();
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
            <ScreenLoading />
          </View>
        ) : hasResultAccess ? (
          <IncidentResultView />
        ) : (
          <View style={{ flex: 1 }} />
        )}
      </View>

      <PromptModal
        visible={upgradeModalVisible}
        icon={<CrownIcon width={40} height={40} />}
        title="Upgrade Plan"
        message={getUpgradeCopy('incident_report_summary_tier_2')}
        confirmLabel="Upgrade Your Plan"
        onClose={() => {
          setUpgradeModalVisible(false);
          if (router.canGoBack()) {
            goBack();
          } else {
            router.replace('/(protected)/(shared-screens)/ai-store/incident-report');
          }
        }}
        onConfirm={() => {
          setUpgradeModalVisible(false);
          router.replace('/(protected)/(shared-screens)/ai-store/incident-report');
        }}
      />
    </SafeAreaView>
  );
}
