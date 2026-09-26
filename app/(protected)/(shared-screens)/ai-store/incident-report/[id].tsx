import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/components/mobile/Back';
import {
  cacheIncidentDetail,
  getCachedIncidentDetail,
  type IncidentDetailPayload,
} from '@/src/components/incident/incidentDetailCache';
import { mapListItemToRow } from '@/src/components/incident/mapIncidentApi';
import { incidentReportsApi } from '@/src/lib/api/incidentReports';

export default function IncidentReportDetailScreen() {
  const { id, title, category, narrative, reportedLabel } = useLocalSearchParams<{
    id: string;
    title?: string;
    category?: string;
    narrative?: string;
    reportedLabel?: string;
  }>();

  const seed = useMemo<IncidentDetailPayload | null>(() => {
    if (!id) return null;
    const cached = getCachedIncidentDetail(id);
    if (cached) return cached;
    if (title || narrative) {
      return {
        id,
        title: title || 'Incident report',
        category: category || 'Uncategorized',
        narrative: narrative || '',
        reportedLabel: reportedLabel || '',
      };
    }
    return null;
  }, [id, title, category, narrative, reportedLabel]);

  const [detail, setDetail] = useState<IncidentDetailPayload | null>(seed);
  const [loading, setLoading] = useState(!seed && !!id);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (seed) {
      setDetail(seed);
      setLoading(false);
      setLoadError(null);
    }

    let cancelled = false;
    void (async () => {
      if (!seed) setLoading(true);
      try {
        const item = await incidentReportsApi.getReportById(id);
        if (cancelled) return;
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
        const payload: IncidentDetailPayload = {
          id: row.id,
          title: row.title,
          category: row.category,
          narrative: row.narrative,
          reportedLabel: row.reportedLabel || row.reportedAt,
        };
        cacheIncidentDetail(payload);
        setDetail(payload);
        setLoadError(null);
      } catch (err: any) {
        if (cancelled) return;
        if (!seed) {
          setLoadError(err?.message || 'Failed to load report');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, seed]);

  const onDelete = () => {
    Alert.alert('Delete Report', 'Delete this incident report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Coming soon', 'Deleting reports is not available yet.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7F7]" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="px-5 pt-2">
          <Back type="short-arrow" showText={false} showBorder />

          {loading && !detail ? (
            <View className="mt-10 items-center">
              <ActivityIndicator size="small" color="#113E55" />
            </View>
          ) : loadError && !detail ? (
            <Text
              allowFontScaling={false}
              className="mt-10 text-center text-sm font-inter-medium text-[#113E55]"
            >
              {loadError}
            </Text>
          ) : (
            <>
              <Text
                allowFontScaling={false}
                numberOfLines={2}
                className="mt-6 text-center text-[21.88px] font-ubuntu-semibold text-[#0A1F29]"
              >
                {detail?.title || 'Subject Line/Title...'}
              </Text>
              <Text
                allowFontScaling={false}
                className="mt-2 text-left text-[11.2px] font-inter-regular text-[#0A1F29]"
              >
                Category: {detail?.category || '—'}.
              </Text>
              <Text
                allowFontScaling={false}
                className="mt-1 text-left text-[11.2px] font-inter-regular text-[#0A1F29]"
              >
                Reported: {detail?.reportedLabel || '—'}.
              </Text>
            </>
          )}
        </View>

        <View className="mt-6 flex-1 rounded-lg bg-white px-6 py-7">
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <Text
              allowFontScaling={false}
              className="text-sm font-inter-light leading-[20px] text-[#0A1F29]"
            >
              {detail?.narrative?.trim() ||
                (loading ? 'Loading…' : 'No report narrative available.')}
            </Text>
          </ScrollView>
        </View>

        <View className="items-center px-5 pb-4 pt-4">
          <Pressable
            onPress={onDelete}
            className="h-12 w-full max-w-[278px] items-center justify-center rounded-[24px] border border-[#0A1F29] bg-[#113E55] px-8"
          >
            <Text
              allowFontScaling={false}
              className="text-center text-sm font-ubuntu-semibold tracking-[-0.24px] text-[#F6F7F7]"
            >
              Delete Report
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
