import { useEffect, useMemo, useState } from 'react';
import ScreenLoading from '@/src/shared/components/feedback/ScreenLoading';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import Back from '@/src/shared/components/navigation/Back';
import { sharedStyles } from '@/src/shared/theme/styles';
import AccessTimeline, {
  AccessTimelineEvent,
} from '@/src/features/history/components/AccessTimeline';
import { mapResidentCodeHistoryToEvents } from '@/src/features/history/utils/accessLogMappers';
import {
  useEstateResidentLogByCode,
  useEstateVisitorLogByCode,
} from '@/src/features/history/hooks/accessLogs';
import { getUserDocumentViewUri } from '@/src/features/profile/services/userDocuments';
import {
  compareLogDatesDesc,
  formatAccessLogTimestamp,
  parseLogDate,
} from '@/src/shared/utils/helpers';
import { ReceiverType } from '@/src/features/access-codes/types/codes';

const capitalizeWords = (value: string) =>
  value
    ? value
        .split(' ')
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
        .join(' ')
    : '';

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

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const isResident = receiver === 'resident';
  const residentQuery = useEstateResidentLogByCode(hashedCode, { page: 1, limit: 100 }, isResident);
  const visitorQuery = useEstateVisitorLogByCode(hashedCode, { page: 1, limit: 100 }, !isResident);
  const activeQuery = isResident ? residentQuery : visitorQuery;
  const residentUserId =
    paramUserId || (isResident ? (residentQuery.data?.items[0]?.user_id ?? '') : '');
  const events = useMemo<AccessTimelineEvent[]>(() => {
    if (isResident) {
      if (!residentQuery.data) return [];
      return mapResidentCodeHistoryToEvents(residentQuery.data).map((event, index) => ({
        id: `${event.type}-${index}`,
        title:
          event.type === 'generated'
            ? 'Code Generated'
            : event.type === 'expired'
              ? 'Code Expired'
              : 'Access Granted',
        timestamp: formatAccessLogTimestamp(parseLogDate(event.timestamp)),
        isExpired: event.type === 'expired',
      }));
    }
    if (!visitorQuery.data) return [];
    return [...visitorQuery.data.items]
      .sort((a, b) => compareLogDatesDesc(a.visit_time, b.visit_time))
      .map((item) => ({
        id: item.id,
        title: 'Access Granted',
        timestamp: formatAccessLogTimestamp(parseLogDate(item.visit_time)),
      }));
  }, [isResident, residentQuery.data, visitorQuery.data]);
  const loading = Boolean(hashedCode) && activeQuery.isLoading;
  const error = !hashedCode
    ? 'Access log not found.'
    : activeQuery.isError
      ? activeQuery.error.message.trim() || 'Could not load timeline.'
      : null;

  useEffect(() => {
    if (!isResident || !residentUserId) {
      setPhotoUri(null);
      return;
    }
    let active = true;
    getUserDocumentViewUri(residentUserId, 'profile_picture')
      .then((uri) => {
        if (active) setPhotoUri(uri);
      })
      .catch(() => {
        if (active) setPhotoUri(null);
      });
    return () => {
      active = false;
    };
  }, [isResident, residentUserId]);
  const timelineEvents = events;
  const initials = getInitials(name);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Back type="short-arrow" onPress={() => navigation.goBack()} />

      {loading ? (
        <ScreenLoading />
      ) : (
        <ScrollView
          contentContainerClassName="items-center pt-11 pb-16"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="h-[105px] w-[105px] items-center justify-center rounded-full bg-light-teal"
            style={{ overflow: 'hidden' }}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <Text className="text-[40px] font-ubuntu-normal uppercase text-teal">{initials}</Text>
            )}
          </View>

          <Text className="mt-[18px] text-heading-sm font-ubuntu-semibold text-[#0A1F29]">
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
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
