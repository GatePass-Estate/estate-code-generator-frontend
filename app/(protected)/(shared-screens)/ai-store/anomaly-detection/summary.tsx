import React from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';
import AnomalyResultView from '@/src/components/anomaly/AnomalyResultView';
import DataInsightModal from '@/src/components/anomaly/modals/DataInsightModal';
import AnimatedPillTabs from '@/src/components/mobile/AnimatedPillTabs';

export default function AnomalyDetectionSummaryScreen() {
  const [dataInsightVisible, setDataInsightVisible] = React.useState(false);

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
          onPress={() => setDataInsightVisible(true)}
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
      />
    </SafeAreaView>
  );
}
