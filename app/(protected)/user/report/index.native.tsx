import { View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { sharedStyles, TAB_BAR_BASE_HEIGHT } from '@/src/theme/styles';

export default function ReportTabScreen() {
  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
      edges={['top']}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        subtitleClassName="text-[#0A1F29] font-inter-light"
        title="Report"
        subtitle="Report incidents in your estate."
      />

      <View
        className="flex-1 items-center justify-center"
        style={{ paddingBottom: TAB_BAR_BASE_HEIGHT }}
      >
        <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
          Incident reporting is coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
