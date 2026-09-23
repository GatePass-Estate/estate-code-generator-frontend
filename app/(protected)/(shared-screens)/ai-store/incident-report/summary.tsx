import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';
import IncidentResultView from '@/src/components/incident/IncidentResultView';
import DataInsightModal from '@/src/components/anomaly/modals/DataInsightModal';
import AnimatedPillTabs from '@/src/components/mobile/AnimatedPillTabs';
import {
  getMarketplaceFeatureById,
  resolveMarketplaceFeatureId,
  splitFeatureBullets,
} from '@/src/lib/api/aiMarketplace';
import { MarketplaceDetailResponse } from '@/src/types/aiMarketplace';

export default function IncidentReportSummaryScreen() {
  const [dataInsightVisible, setDataInsightVisible] = useState(false);
  const [featureDetail, setFeatureDetail] = useState<MarketplaceDetailResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const id = await resolveMarketplaceFeatureId(undefined, (name) =>
          name.toLowerCase().includes('incident')
        );
        if (!id || !mounted) return;
        const detail = await getMarketplaceFeatureById(id);
        if (mounted) setFeatureDetail(detail);
      } catch {
        if (mounted) setFeatureDetail(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const insightBullets = useMemo(
    () => splitFeatureBullets(featureDetail?.description),
    [featureDetail?.description]
  );

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
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(protected)/(shared-screens)/ai-store/incident-report');
            }
          }}
          className="h-[30px] w-[30px] items-center justify-center"
          hitSlop={8}
        >
          <ValidationBackSvg width={30} height={30} />
        </Pressable>

        <AnimatedPillTabs
          options={[
            { value: 'Preview', label: 'Preview' },
            { value: 'Result', label: 'Result' },
          ]}
          value="Result"
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

        <Pressable
          className="h-[30px] w-[30px] items-center justify-center"
          hitSlop={20}
          onPress={() => setDataInsightVisible(true)}
          style={{ zIndex: 100 }}
        >
          <View pointerEvents="none">
            <BiInfoSvg width={24} height={24} />
          </View>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        <IncidentResultView />
      </View>

      <DataInsightModal
        visible={dataInsightVisible}
        onClose={() => setDataInsightVisible(false)}
        description={featureDetail?.description}
        bullets={insightBullets}
      />
    </SafeAreaView>
  );
}
