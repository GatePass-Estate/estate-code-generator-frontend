import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { sharedStyles } from '@/src/theme/styles';
import AccessTimeline, { AccessTimelineEvent } from '@/src/components/mobile/AccessTimeline';
import { mapResidentCodeHistoryToEvents } from '@/src/lib/accessLogMappers';
import { getEstateResidentLogByCode, getEstateVisitorLogByCode } from '@/src/lib/api/accessLogs';
import { getUserDocumentViewUri } from '@/src/lib/api/userDocuments';
import { ReceiverType } from '@/src/types/codes';

const capitalizeWords = (value: string) =>
  value
    ? value
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ')
    : '';

const parseLogDate = (value: string) => {
  const iso = value.replace(' ', 'T').replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  return new Date(iso);
};

const formatTimelineDate = (date: Date) => {
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export default function AccessLogDetailScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const name = String(params.name || '');
  const category = String(params.category || '');
  const hashedCode = String(params.hashed_code || '');
  const receiver = String(params.receiver || 'visitor') as ReceiverType;
  const paramUserId = String(params.user_id || '').trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<AccessTimelineEvent[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!hashedCode) {
      setError('Access log not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setPhotoUri(null);

    try {
      let residentUserId = paramUserId;

      if (receiver === 'resident') {
        const history = await getEstateResidentLogByCode(hashedCode, { page: 1, limit: 100 });
        const mapped = mapResidentCodeHistoryToEvents(history).map((event, index) => ({
          id: `${event.type}-${index}`,
          title:
            event.type === 'generated'
              ? 'Code Generated'
              : event.type === 'expired'
                ? 'Code Expired'
                : 'Access Granted',
          timestamp: formatTimelineDate(parseLogDate(event.timestamp)),
          isExpired: event.type === 'expired',
        }));
        setEvents(mapped);

        if (!residentUserId && history.items[0]?.user_id) {
          residentUserId = history.items[0].user_id;
        }
      } else {
        const history = await getEstateVisitorLogByCode(hashedCode, { page: 1, limit: 100 });
        const mapped = history.items
          .sort(
            (a, b) => parseLogDate(a.visit_time).getTime() - parseLogDate(b.visit_time).getTime()
          )
          .map((item) => ({
            id: item.id,
            title: 'Access Granted',
            timestamp: formatTimelineDate(parseLogDate(item.visit_time)),
          }));

        setEvents(mapped);
      }

      if (receiver === 'resident' && residentUserId) {
        try {
          const uri = await getUserDocumentViewUri(residentUserId, 'profile_picture');
          setPhotoUri(uri);
        } catch {
          setPhotoUri(null);
        }
      }
    } catch (e: any) {
      setError(e?.message?.trim() || 'Could not load timeline.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [hashedCode, paramUserId, receiver]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const timelineEvents = useMemo(() => events, [events]);
  const initials = getInitials(name);

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

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#113E55" />
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="items-center pt-11 pb-16"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="h-[105px] w-[105px] items-center justify-center rounded-full bg-[#F4FFFE]"
            style={{ overflow: 'hidden' }}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-[40px] font-ubuntu-normal uppercase text-[#1B998B]">
                {initials}
              </Text>
            )}
          </View>

          <Text className="mt-[18px] text-[21.88px] font-ubuntu-semibold text-[#0A1F29]">
            {capitalizeWords(name)}
          </Text>
          <Text className="mt-1.5 text-sm font-inter-light capitalize text-[#6C6C6C]">
            {category}
          </Text>

          <AccessTimeline
            className="mt-[59px] w-full px-3 pb-10"
            events={timelineEvents}
            error={error}
            gap={24}
            lastOverflow={56}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
