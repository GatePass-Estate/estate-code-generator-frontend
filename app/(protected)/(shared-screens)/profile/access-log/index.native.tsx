import { useCallback, useEffect, useState } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Text } from 'react-native';
import { Stack, router, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AccessLogCard } from '@/src/components/mobile/AccessLogCard';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { mapResidentLogToAccessLog } from '@/src/lib/accessLogMappers';
import { getMyResidentAccessLogs } from '@/src/lib/api/accessLogs';
import { ResidentAccessLog } from '@/src/types/accessLog';
import { sharedStyles } from '@/src/theme/styles';

export default function AccessLogScreen() {
  const navigation = useNavigation();
  const [logs, setLogs] = useState<ResidentAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMyResidentAccessLogs({ page: 1, limit: 50 });
      setLogs(result.items.map(mapResidentLogToAccessLog));
    } catch (e: any) {
      setError(e?.message?.trim() || 'Could not load access history.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable
        onPress={() => navigation.goBack()}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScreenHeader title="Access Log" subtitle="View your access code history." />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#113E55" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 21, flexGrow: logs.length ? 0 : 1 }}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">{error}</Text>
          ) : logs.length === 0 ? (
            <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
              No access logs yet.
            </Text>
          ) : (
            <View className="gap-3">
              {logs.map((log) => (
                <AccessLogCard
                  key={log.id}
                  log={log}
                  onPress={() => router.push(`/profile/access-log/${log.code}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
