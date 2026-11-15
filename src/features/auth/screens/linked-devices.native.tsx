import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useLinkedDevices } from '@/src/features/auth/hooks/useLinkedDevices';
import { formatLastActive, friendlyDeviceName } from '@/src/shared/services/storage/deviceName';
import type { SessionResponse } from '@/src/features/auth/types/auth';

export default function LinkedDevicesScreen() {
  const {
    sessions,
    loading,
    loadError: errorMessage,
    retry,
    isCurrent: isCurrentDevice,
    revokeDevice,
    revokingId,
  } = useLinkedDevices();

  const handleRevoke = useCallback(
    (session: SessionResponse) => {
      const isCurrent = isCurrentDevice(session);
      const label = friendlyDeviceName(session.device_name);

      Alert.alert(
        isCurrent ? 'Log out of this device?' : `Log out of ${label}?`,
        isCurrent
          ? 'This is the device you are using now. You will be signed out.'
          : 'That device will need to sign in again to use GatePass.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: async () => {
              try {
                // Logging out this device also signs out locally (see useLinkedDevices).
                await revokeDevice(session);
              } catch (error: unknown) {
                Alert.alert('Could not log out', thrownMessage(error) || 'Please try again.');
              }
            },
          },
        ]
      );
    },
    [isCurrentDevice, revokeDevice]
  );

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        showBack
        title="Linked Devices"
        subtitle="Tap a device to log out"
        subtitleClassName="font-inter-light text-sm text-[#0A1F29]"
      />

      {loading ? (
        <View className="mt-7 items-center py-10">
          <CircleLoader size={32} />
        </View>
      ) : errorMessage ? (
        <View className="mt-7 items-center py-10">
          <Text className="mb-4 text-center font-inter-regular text-sm text-danger">
            {errorMessage}
          </Text>
          <Pressable onPress={() => void retry()} className="rounded-[24px] bg-primary px-5 py-3">
            <Text className="font-ubuntu-semibold text-sm text-white">Try again</Text>
          </Pressable>
        </View>
      ) : sessions.length === 0 ? (
        <Text className="mt-7 py-10 text-center font-inter-regular text-sm text-[#878686]">
          No other devices are signed in.
        </Text>
      ) : (
        <ScrollView
          className="mt-7"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 7 }}
        >
          {sessions.map((session) => {
            const isCurrent = isCurrentDevice(session);
            return (
              <View
                key={session.id}
                className="flex-row items-center justify-between rounded-[8px] px-4 py-1"
                style={{ borderWidth: 0.4, borderColor: '#CEE5ED' }}
              >
                <View className="flex-1 pr-3">
                  <Text
                    className="font-inter-light text-sm text-[#0A1F29]"
                    style={{ lineHeight: 18, includeFontPadding: false }}
                  >
                    {friendlyDeviceName(session.device_name)}
                    {isCurrent ? ' (This device)' : ''}
                  </Text>
                  <Text
                    className="mt-1 font-inter-regular text-xs text-[#878686]"
                    style={{ letterSpacing: -0.24, lineHeight: 16, includeFontPadding: false }}
                  >
                    Last Active : {formatLastActive(session.last_active_at)}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleRevoke(session)}
                  disabled={revokingId === session.id}
                  className="h-[46px] w-[70px] items-center justify-center"
                >
                  {revokingId === session.id ? (
                    <CircleLoader size={32} />
                  ) : (
                    <Text className="text-center font-ubuntu-regular text-xs leading-[14px] text-primary">
                      Log Out
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
