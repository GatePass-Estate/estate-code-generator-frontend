import { useMemo } from 'react';
import ScreenLoading from '@/src/shared/components/feedback/ScreenLoading';
import { View, ScrollView, Text } from 'react-native';
import { Stack, router, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessLogCard } from '@/src/features/history/components/AccessLogCard';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import { mapResidentLogToAccessLog } from '@/src/features/history/utils/accessLogMappers';
import { useMyResidentAccessLogs } from '@/src/features/history/hooks/accessLogs';
import { compareLogDatesDesc } from '@/src/shared/utils/helpers';
import { sharedStyles } from '@/src/shared/theme/styles';

export default function AccessLogScreen() {
  const navigation = useNavigation();
  const logsQuery = useMyResidentAccessLogs({ page: 1, limit: 50 });
  const logs = useMemo(
    () =>
      (logsQuery.data?.items ?? [])
        .map(mapResidentLogToAccessLog)
        .sort((a, b) => compareLogDatesDesc(a.generatedAt, b.generatedAt)),
    [logsQuery.data]
  );
  const loading = logsQuery.isLoading;
  const error = logsQuery.isError
    ? logsQuery.error.message.trim() || 'Could not load access history.'
    : null;

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        onBack={() => navigation.goBack()}
        subtitleClassName="text-[#0A1F29] font-inter-light"
        title="Access Log"
        subtitle="View your access code history."
      />

      {loading ? (
        <ScreenLoading />
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingBottom: 40,
            paddingTop: 32,
            flexGrow: logs.length ? 0 : 1,
          }}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">{error}</Text>
          ) : logs.length === 0 ? (
            <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
              No access logs yet.
            </Text>
          ) : (
            <View className="gap-[9px]">
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
