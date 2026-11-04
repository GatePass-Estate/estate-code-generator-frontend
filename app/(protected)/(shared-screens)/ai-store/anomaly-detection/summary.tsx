import React from 'react';
import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';
import AnomalyResultView from '@/src/components/anomaly/AnomalyResultView';
import DataInsightModal from '@/src/components/anomaly/modals/DataInsightModal';
import AnimatedPillTabs from '@/src/components/mobile/AnimatedPillTabs';
import { getMarketplaceFeatures, getMarketplaceFeatureById } from '@/src/lib/api/aiMarketplace';
import { MarketplaceDetailResponse } from '@/src/types/aiMarketplace';

export default function AnomalyDetectionSummaryScreen() {
  const [dataInsightVisible, setDataInsightVisible] = React.useState(false);
  const [featureDetail, setFeatureDetail] = React.useState<MarketplaceDetailResponse | null>(null);
  const params = useLocalSearchParams<{ featureId?: string }>();

  React.useEffect(() => {
    let isMounted = true;
    async function init() {
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
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [params.featureId]);

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
          value="Result"
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

      <View style={{ flex: 1 }}>
        <AnomalyResultView />
      </View>

      <DataInsightModal
        visible={dataInsightVisible}
        onClose={() => setDataInsightVisible(false)}
        dataInsight={featureDetail?.data_insight}
      />
    </SafeAreaView>
  );
}
