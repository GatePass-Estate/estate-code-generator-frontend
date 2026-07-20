import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccessHistoryDetail, {
  AccessHistoryTimelineEvent,
} from '@/src/components/mobile/AccessHistoryDetail';
import { getMyVisitorAccessLogByCode } from '@/src/lib/api/accessLogs';
import { parseLogDate } from '@/src/lib/helpers';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { GenderType } from '@/src/types/general';
import { sharedStyles } from '@/src/theme/styles';

const formatTimelineDate = (value: string) => {
  const date = parseLogDate(value);
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

export default function HistoryDetailScreen() {
  const navigation = useNavigation();
  const { systemBottom, tabBarHeight } = useAndroidBottomInset();
  const params = useLocalSearchParams<{
    codeId: string;
    name?: string;
    category?: string;
  }>();

  const hashedCode = params.codeId ?? '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(params.name?.trim() || '');
  const [category, setCategory] = useState(params.category?.trim() || '');
  const [gender, setGender] = useState<GenderType>('prefer_not_to_say');
  const [events, setEvents] = useState<AccessHistoryTimelineEvent[]>([]);

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        parent?.setOptions({
          tabBarStyle: [
            sharedStyles.tabBar,
            Platform.OS === 'android' && {
              bottom: systemBottom,
              height: tabBarHeight,
            },
          ],
        });
      };
    }, [navigation, systemBottom, tabBarHeight])
  );

  const fetchHistory = useCallback(async () => {
    if (!hashedCode) {
      setError('History not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const history = await getMyVisitorAccessLogByCode(hashedCode, { page: 1, limit: 20 });
      const latest = history.items[0];

      if (latest?.visitor_fullname) {
        setName(latest.visitor_fullname);
      }
      if (latest?.relationship_with_resident) {
        setCategory(latest.relationship_with_resident);
      }
      if (latest?.gender) {
        setGender(latest.gender);
      }

      setEvents(
        [...history.items]
          .sort(
            (a, b) => parseLogDate(a.visit_time).getTime() - parseLogDate(b.visit_time).getTime()
          )
          .map((item, index) => ({
            id: item.id || `visit-${index}`,
            title: 'Access Granted',
            timestamp: formatTimelineDate(item.visit_time),
          }))
      );
    } catch (e: any) {
      setError(e?.message?.trim() || 'Could not load history details.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [hashedCode]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const openDurationScreen = useCallback(() => {
    router.push({
      pathname: '/user/history/duration',
      params: {
        visitorName: name || 'Guest',
        relationship: category || 'other',
        gender,
      },
    });
  }, [category, gender, name]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <AccessHistoryDetail
        name={name}
        category={category}
        events={events}
        loading={loading}
        error={error}
        onBack={() => navigation.goBack()}
        showRegenerate={!loading && !error}
        onRegenerate={openDurationScreen}
      />
    </SafeAreaView>
  );
}
