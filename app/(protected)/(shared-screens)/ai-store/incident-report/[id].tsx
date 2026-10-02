import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/components/mobile/Button';
import {
  cacheIncidentDetail,
  getCachedIncidentDetail,
  type IncidentDetailPayload,
} from '@/src/components/incident/incidentDetailCache';
import { mapListItemToRow } from '@/src/components/incident/mapIncidentApi';
import { incidentReportsApi, type IncidentListItem } from '@/src/lib/api/incidentReports';

function detailFromParams(
  id: string,
  params: {
    title?: string;
    category?: string;
    narrative?: string;
    reportedLabel?: string;
  }
): IncidentDetailPayload | null {
  if (!params.title && !params.narrative) return null;
  return {
    id,
    title: params.title || '',
    category: params.category || '',
    narrative: params.narrative || '',
    reportedLabel: params.reportedLabel || '',
  };
}

function detailFromApiItem(item: IncidentListItem): IncidentDetailPayload {
  const row = mapListItemToRow({
    id: item.id,
    created_at: item.created_at,
    occurred_at: item.occurred_at,
    title: item.title,
    category: item.category,
    custom_category: item.custom_category,
    narrative: item.narrative,
    reporter_user_type: null,
  });
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    narrative: row.narrative,
    reportedLabel: row.reportedLabel || row.reportedAt,
  };
}

export default function IncidentReportDetailScreen() {
  const { id, title, category, narrative, reportedLabel } = useLocalSearchParams<{
    id: string;
    title?: string;
    category?: string;
    narrative?: string;
    reportedLabel?: string;
  }>();

  const [detail, setDetail] = useState<IncidentDetailPayload | null>(() => {
    if (!id) return null;
    return (
      getCachedIncidentDetail(id) ??
      detailFromParams(id, { title, category, narrative, reportedLabel })
    );
  });
  const [fetching, setFetching] = useState(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const cached =
      getCachedIncidentDetail(id) ??
      detailFromParams(id, { title, category, narrative, reportedLabel });
    if (cached) {
      setDetail(cached);
      setLoadError(null);
    } else {
      setDetail(null);
    }

    let cancelled = false;
    setFetching(true);

    void (async () => {
      try {
        const item = await incidentReportsApi.getReportById(id);
        if (cancelled) return;
        const payload = detailFromApiItem(item);
        cacheIncidentDetail(payload);
        setDetail(payload);
        setLoadError(null);
      } catch (err: unknown) {
        if (cancelled) return;
        if (!cached) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load report');
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, title, category, narrative, reportedLabel]);

  const showSpinner = fetching && !detail;
  const showError = !!loadError && !detail;

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7F7]" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="px-6 py-5">
          <Back type="short-arrow" showText={false} showBorder />

          {showSpinner ? (
            <View className="mt-10 items-center">
              <ActivityIndicator size="small" color="#113E55" />
            </View>
          ) : showError ? (
            <Text className="mt-10 text-center text-sm font-inter-medium text-[#113E55]">
              {loadError}
            </Text>
          ) : (
            <View className="mt-6 flex-col gap-1.5">
              <Text
                allowFontScaling={false}
                numberOfLines={2}
                className="text-[21.88px] font-ubuntu-semibold text-[#0A1F29]"
              >
                {detail?.title || ''}
              </Text>
              <Text
                allowFontScaling={false}
                className="text-left text-[11.2px] font-inter-regular text-[#0A1F29]"
              >
                Category: {detail?.category || '—'}.
              </Text>
              <Text
                allowFontScaling={false}
                className="text-left text-[11.2px] font-inter-regular text-[#0A1F29]"
              >
                Reported: {detail?.reportedLabel || '—'}.
              </Text>
            </View>
          )}
        </View>

        <View className="mt-[9px] flex-1 rounded-lg bg-white px-6 py-7">
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <Text
              allowFontScaling={false}
              className="text-sm font-inter-light leading-[20px] text-[#0A1F29]"
            >
              {detail?.narrative?.trim() || (fetching ? 'Loading…' : '')}
            </Text>
          </ScrollView>
        </View>

        <View className="items-center px-5 pt-20" style={{ paddingBottom: BUTTON_MARGIN_BOTTOM }}>
          <Button label="Delete Report" />
        </View>
      </View>
    </SafeAreaView>
  );
}
