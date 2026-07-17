import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccessHistoryDetail, {
  AccessHistoryTimelineEvent,
} from '@/src/components/mobile/AccessHistoryDetail';
import { mapResidentCodeHistoryToEvents } from '@/src/lib/accessLogMappers';
import {
  getMyResidentAccessLogByCode,
  getMyVisitorAccessLogByCode,
} from '@/src/lib/api/accessLogs';
import { generateCode } from '@/src/lib/api/codes';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { useProfileDocumentsStore } from '@/src/lib/stores/profileDocumentsStore';
import { useUserStore } from '@/src/lib/stores/userStore';
import { sharedStyles } from '@/src/theme/styles';

const parseLogDate = (value: string) => {
  const iso = value.replace(' ', 'T').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  return new Date(iso);
};

const formatTimelineDate = (value: string) => {
  const date = parseLogDate(value);
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const EVENT_TITLES = {
  generated: 'Code Generated',
  validated: 'Access Granted',
  expired: 'Code Expired',
} as const;

export default function HistoryDetailScreen() {
  const navigation = useNavigation();
  const { systemBottom, tabBarHeight } = useAndroidBottomInset();
  const params = useLocalSearchParams<{
    codeId: string;
    name?: string;
    category?: string;
    receiver?: string;
  }>();
  const { user_id, estate_id } = useUserStore();
  const profilePhotoUri = useProfileDocumentsStore((state) => state.profilePhotoUri);
  const syncDocuments = useProfileDocumentsStore((state) => state.syncDocuments);

  const hashedCode = params.codeId ?? '';
  const isVisitor = params.receiver === 'visitor';
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCodeActive, setIsCodeActive] = useState(false);
  const [name, setName] = useState(params.name?.trim() || '');
  const [category, setCategory] = useState(params.category?.trim() || 'Resident');
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
      if (isVisitor) {
        const history = await getMyVisitorAccessLogByCode(hashedCode, { page: 1, limit: 100 });
        const latest = history.items[0];

        if (!params.name && latest?.visitor_fullname) {
          setName(latest.visitor_fullname);
        }
        if (!params.category && latest?.relationship_with_resident) {
          setCategory(latest.relationship_with_resident);
        }

        setEvents(
          [...history.items]
            .sort(
              (a, b) => parseLogDate(a.visit_time).getTime() - parseLogDate(b.visit_time).getTime()
            )
            .map((item, index) => ({
              id: item.id || `visit-${index}`,
              title: EVENT_TITLES.validated,
              timestamp: formatTimelineDate(item.visit_time),
            }))
        );
        setIsCodeActive(false);
      } else {
        const history = await getMyResidentAccessLogByCode(hashedCode, { page: 1, limit: 100 });
        const latest = history.items[0];

        if (!params.name && latest?.full_name) {
          setName(latest.full_name);
        }
        if (!params.category) {
          setCategory('Resident');
        }

        setEvents(
          mapResidentCodeHistoryToEvents(history).map((event) => ({
            id: event.id,
            title: EVENT_TITLES[event.type],
            timestamp: formatTimelineDate(event.timestamp),
            isExpired: event.type === 'expired',
          }))
        );
        setIsCodeActive(!history.code_deleted);
      }
    } catch (e: any) {
      setError(e?.message?.trim() || 'Could not load history details.');
      setEvents([]);
      setIsCodeActive(false);
    } finally {
      setLoading(false);
    }
  }, [hashedCode, isVisitor, params.category, params.name]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (user_id) {
      void syncDocuments(user_id);
    }
  }, [user_id, syncDocuments]);

  const handleRegenerate = useCallback(async () => {
    if (!user_id || isVisitor) return;
    setRegenerating(true);
    try {
      await generateCode({ user_id, estate_id: estate_id ?? '' }, 'resident');
      Alert.alert('Code regenerated', 'Your new access code is ready on your profile.', [
        { text: 'OK', onPress: () => router.replace('/profile') },
      ]);
    } catch {
      Alert.alert('Could not regenerate code', 'Please try again later.');
    } finally {
      setRegenerating(false);
    }
  }, [estate_id, isVisitor, user_id]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <AccessHistoryDetail
        name={name}
        category={category}
        events={events}
        photoUri={isVisitor ? undefined : profilePhotoUri}
        loading={loading}
        error={error}
        onBack={() => navigation.goBack()}
        showRegenerate={!isVisitor && !isCodeActive}
        regenerating={regenerating}
        onRegenerate={handleRegenerate}
      />
    </SafeAreaView>
  );
}
