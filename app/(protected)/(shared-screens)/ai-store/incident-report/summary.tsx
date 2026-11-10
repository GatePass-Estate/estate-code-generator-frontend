import React from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import IncidentResultView from '@/src/components/incident/IncidentResultView';
import AnimatedPillTabs from '@/src/components/mobile/AnimatedPillTabs';

export default function IncidentReportSummaryScreen() {
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

        {/* Spacer keeps pill tabs centered with the back button */}
        <View className="h-[30px] w-[30px]" />
      </View>

      <View style={{ flex: 1 }}>
        <IncidentResultView />
      </View>
    </SafeAreaView>
  );
}
