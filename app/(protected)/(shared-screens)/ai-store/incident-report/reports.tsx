import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { IncidentRowChevronIcon } from '@/src/assets/svgs';
import { useIncidentReports } from '@/src/hooks/useIncidentQueries';
import { useUserStore } from '@/src/lib/stores/userStore';
import { cacheIncidentDetailFromRow } from '@/src/components/incident/incidentDetailCache';
import { getIncidentReportsListFilters } from '@/src/components/incident/incidentReportsListFilters';
import type { IncidentRow } from '@/src/components/incident/incidentTypes';
import { mapListItemToRow } from '@/src/components/incident/mapIncidentApi';

function ReportListCard({ row }: { row: IncidentRow }) {
  return (
    <Pressable
      onPress={() => {
        cacheIncidentDetailFromRow(row);
        router.push({
          pathname: '/(protected)/(shared-screens)/ai-store/incident-report/[id]',
          params: { id: row.id },
        });
      }}
      className="w-full flex-row items-center justify-between rounded-2xl border-[0.4px] border-[#CEE5ED] bg-transparent p-4"
    >
      <View className="mr-3 min-w-0 flex-1 gap-1">
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="text-sm font-inter-light text-[#0A1F29]"
        >
          {row.title}
        </Text>
        <Text allowFontScaling={false} className="text-[11.2px] font-inter-regular text-[#878686]">
          Sent: {row.reportedLabel || row.reportedAt}
        </Text>
      </View>
      <View className="h-4 w-4 items-center justify-center rounded-full bg-[#113E55]">
        <View style={{ transform: [{ rotate: '-90deg' }] }}>
          <IncidentRowChevronIcon color="#F6F7F7" size={12} />
        </View>
      </View>
    </Pressable>
  );
}

export default function IncidentReportsListScreen() {
  const estate_id = useUserStore((state) => state.estate_id) || '';
  const filters = useMemo(() => getIncidentReportsListFilters(), []);
  const {
    data: reports,
    isLoading,
    isError,
    refetch,
  } = useIncidentReports(estate_id, {
    ...filters,
    page: 1,
    limit: 50,
  });

  const rows = useMemo(() => (reports?.items ?? []).map(mapListItemToRow), [reports?.items]);

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7F7]" edges={['top', 'bottom']}>
      <View className="flex-1 px-5">
        <Back type="short-arrow" showText={false} showBorder />

        <ScreenHeader
          containerClassName="mt-11"
          title="Incident Report"
          subtitle="View all reports you sent."
          titleClassName="text-[27.34px] font-ubuntu-medium text-[#113E55]"
          subtitleClassName="text-sm font-inter-light text-[#878686]"
        />

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#113E55" />
          </View>
        ) : isError ? (
          <View className="mt-10 items-center">
            <Text allowFontScaling={false} className="text-sm font-inter-medium text-[#113E55]">
              Could not load reports.
            </Text>
            <Pressable
              onPress={() => void refetch()}
              className="mt-4 rounded-full bg-[#113E55] px-5 py-3"
            >
              <Text allowFontScaling={false} className="text-sm font-inter-medium text-white">
                Retry
              </Text>
            </Pressable>
          </View>
        ) : rows.length === 0 ? (
          <Text
            allowFontScaling={false}
            className="mt-10 text-center text-[11.2px] font-inter-regular text-[#878686]"
          >
            No reports yet.
          </Text>
        ) : (
          <ScrollView
            className="mt-6 flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
          >
            {rows.map((row) => (
              <ReportListCard key={row.id} row={row} />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
