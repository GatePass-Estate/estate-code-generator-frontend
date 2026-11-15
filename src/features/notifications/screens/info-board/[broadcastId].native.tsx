import { Pressable, ScrollView, Text, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import Back from '@/src/shared/components/navigation/Back';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useBroadcastDetail } from '@/src/features/notifications/hooks/useBroadcastDetail';
import { formatSentDate } from '@/src/features/notifications/utils/broadcastStyle';

export default function BroadcastDetailScreen() {
  const { broadcastId } = useLocalSearchParams<{ broadcastId?: string }>();
  const { broadcast, loading, errorMessage, reload } = useBroadcastDetail(broadcastId);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder />

      {loading ? (
        <View className="items-center py-14">
          <CircleLoader size={32} />
        </View>
      ) : errorMessage ? (
        <View className="items-center py-14">
          <Text className="text-danger font-inter-regular text-sm text-center mb-4">
            {errorMessage}
          </Text>
          <Pressable onPress={reload} className="px-5 py-3 rounded-[24px] bg-primary">
            <Text className="text-white font-ubuntu-semibold text-sm">Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Text className="mt-3 font-ubuntu-medium text-primary" style={{ fontSize: 27 }}>
            {broadcast?.title}
          </Text>
          <Text className="text-primary font-inter-light text-sm mt-1">
            Sent: {formatSentDate(broadcast?.created_at)}
          </Text>

          <ScrollView
            className="mt-5 mb-6"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            <View className="bg-white rounded-[8px] px-5 py-7">
              <Text className="text-[#0A1F29] font-inter-light text-sm leading-6">
                {broadcast?.message}
              </Text>
            </View>

            {/* {!!broadcast?.sender_name && (
              <Text className="text-[#878686] font-inter-regular text-[11px] mt-4">
                From {broadcast.sender_name}
              </Text>
            )} */}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}
