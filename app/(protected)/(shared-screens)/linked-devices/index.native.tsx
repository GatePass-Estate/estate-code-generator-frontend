import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import { listSessions, revokeSession } from '@/src/lib/api/auth';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { useAuth } from '@/src/hooks/useAuthContext';
import { formatLastActive, friendlyDeviceName } from '@/src/lib/deviceName';
import type { SessionResponse } from '@/src/types/auth';

export default function LinkedDevicesScreen() {
  const { signOut } = useAuth();
  const currentSessionId = useAuthStore((state) => state.session_id);

  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setErrorMessage('');
    try {
      const response = await listSessions();
      setSessions(response?.items ?? []);
    } catch (error: any) {
      setErrorMessage(error?.message || 'Could not load your devices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = useCallback(
    (session: SessionResponse) => {
      const isCurrent = !!currentSessionId && session.id === currentSessionId;
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
              setRevokingId(session.id);
              try {
                await revokeSession(session.id);
                // Revoking our own session invalidates this token, so sign out
                // locally instead of re-fetching with a dead credential.
                if (isCurrent) {
                  await signOut();
                  return;
                }
                setSessions((current) => current.filter((item) => item.id !== session.id));
              } catch (error: any) {
                Alert.alert('Could not log out', error?.message || 'Please try again.');
              } finally {
                setRevokingId(null);
              }
            },
          },
        ]
      );
    },
    [currentSessionId, signOut]
  );

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder />

      <Text className="text-primary font-ubuntu-medium mt-[18px]" style={{ fontSize: 27 }}>
        Linked Devices
      </Text>
      <Text className="text-[#0A1F29] font-inter-light text-sm mt-2 mb-6">
        Tap a device to log out
      </Text>

      {loading ? (
        <View className="items-center py-10">
          <ActivityIndicator color="#113E55" />
        </View>
      ) : errorMessage ? (
        <View className="items-center py-10">
          <Text className="text-danger font-inter-regular text-sm text-center mb-4">
            {errorMessage}
          </Text>
          <Pressable
            onPress={() => {
              setLoading(true);
              loadSessions();
            }}
            className="px-5 py-3 rounded-[24px] bg-primary"
          >
            <Text className="text-white font-ubuntu-semibold text-sm">Try again</Text>
          </Pressable>
        </View>
      ) : sessions.length === 0 ? (
        <Text className="text-[#878686] font-inter-regular text-sm text-center py-10">
          No other devices are signed in.
        </Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {sessions.map((session) => {
            const isCurrent = !!currentSessionId && session.id === currentSessionId;
            return (
              <View
                key={session.id}
                className="flex-row items-center justify-between rounded-[8px] border border-accent px-4 py-3"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-[#0A1F29] font-inter-light text-sm">
                    {friendlyDeviceName(session.device_name)}
                    {isCurrent ? ' (This device)' : ''}
                  </Text>
                  <Text className="text-[#878686] font-inter-regular text-xs mt-1">
                    Last Active : {formatLastActive(session.last_active_at)}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleRevoke(session)}
                  disabled={revokingId === session.id}
                  className="px-3 py-2 rounded-[8px]"
                >
                  {revokingId === session.id ? (
                    <ActivityIndicator size="small" color="#113E55" />
                  ) : (
                    <Text className="text-primary font-ubuntu-regular text-xs">Log Out</Text>
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
