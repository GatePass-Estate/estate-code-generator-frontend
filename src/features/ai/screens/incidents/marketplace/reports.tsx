import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import ScreenLoading from '@/src/shared/components/feedback/ScreenLoading';
import { IncidentRowChevronIcon } from '@/src/assets/svgs';
import { useIncidentReports } from '@/src/features/ai/hooks/incidents';
import { useUserStore } from '@/src/store/userStore';
import { cacheIncidentDetailFromRow } from '@/src/features/ai/components/incidents/incidentDetailCache';
import { getIncidentReportsListFilters } from '@/src/features/ai/components/incidents/report/incidentReportsListFilters';
import type { IncidentRow } from '@/src/features/ai/components/incidents/incidentTypes';
import { mapListItemToRow } from '@/src/features/ai/components/incidents/mapIncidentApi';
import TableEmptyState from '@/src/features/ai/components/shared/TableEmptyState';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
      className="w-full flex-row items-center justify-between rounded-2xl border-[0.4px] border-accent bg-transparent p-4"
    >
      <View className="mr-3 min-w-0 flex-1 gap-1">
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="text-sm font-inter-light text-[#0A1F29]"
        >
          {row.title}
        </Text>
        <Text allowFontScaling={false} className="text-caption font-inter-regular text-[#878686]">
          Sent: {row.reportedLabel || row.reportedAt}
        </Text>
      </View>
      <View className="h-4 w-4 items-center justify-center rounded-full bg-primary">
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
        <ScreenHeader
          showBack
          title="Incident Report"
          subtitle="View all reports you sent."
          titleClassName="text-heading font-ubuntu-medium text-primary"
          subtitleClassName="text-sm font-inter-light text-[#878686]"
        />

        {isLoading ? (
          <ScreenLoading />
        ) : isError ? (
          <View className="mt-10 items-center">
            <Text allowFontScaling={false} className="text-sm font-inter-medium text-primary">
              Could not load reports.
            </Text>
            <Pressable
              onPress={() => void refetch()}
              className="mt-4 rounded-full bg-primary px-5 py-3"
            >
              <Text allowFontScaling={false} className="text-sm font-inter-medium text-white">
                Retry
              </Text>
            </Pressable>
          </View>
        ) : rows.length === 0 ? (
          <View className="mt-16">
            <TableEmptyState
              icon={
                <MaterialCommunityIcons name="clipboard-text-outline" size={22} color="#878686" />
              }
              title="No incident reports"
              subtitle="Nothing was reported in this window. Try another date range."
            />
          </View>
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
