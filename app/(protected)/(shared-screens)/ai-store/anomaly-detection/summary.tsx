import React from 'react';
import { View, Pressable, ScrollView, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import BiInfoSvg from '@/src/assets/icons/bi_info.svg';
import ValidationBackSvg from '@/src/assets/icons/validation-back.svg';
import AnomalyResultView from '@/src/components/anomaly/AnomalyResultView';
import DataInsightModal from '@/src/components/anomaly/modals/DataInsightModal';

const PILL_WIDTH = 228;
const PILL_HEIGHT = 40;
const PADDING = 3;
const TAB_WIDTH = (PILL_WIDTH - PADDING * 2) / 2;
const TAB_HEIGHT = PILL_HEIGHT - PADDING * 2;

export default function AnomalyDetectionSummaryScreen() {
  const [dataInsightVisible, setDataInsightVisible] = React.useState(false);

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

        <View style={styles.pillContainer}>
          <View style={[styles.pillIndicator, { left: PADDING + TAB_WIDTH }]} />
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: false }}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(protected)/(shared-screens)/ai-store/anomaly-detection');
              }
            }}
            style={styles.pillTab}
          >
            <Text allowFontScaling={false} style={[styles.pillText, { color: '#8A9A9D' }]}>Overview</Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: true }}
            style={styles.pillTab}
          >
            <Text allowFontScaling={false} style={[styles.pillText, { color: '#113E55' }]}>Result</Text>
          </Pressable>
        </View>

        <Pressable
          className="h-[30px] w-[30px] items-center justify-center"
          hitSlop={20}
          onPress={() => {
            console.log('INFO ICON CLICKED IN SUMMARY');
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
      />
    </SafeAreaView>
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
