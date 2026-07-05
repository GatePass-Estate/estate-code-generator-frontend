import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { sharedStyles } from '@/src/theme/styles';
import { ProfileAvatar, TimelineDashLine } from '@/src/assets/svgs';

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

type TimelineEvent = {
  title: string;
  timestamp: string;
};

const TIMELINE_DOT_SIZE = 28;
const TIMELINE_INNER_DOT_SIZE = 20;
const TIMELINE_DASH_UNIT = 2.8 + 2.8;
const TIMELINE_LINE_BETWEEN = 56;
const TIMELINE_LAST_OVERFLOW = TIMELINE_DASH_UNIT * 10;

const TimelineItem = ({ event, lineHeight }: { event: TimelineEvent; lineHeight: number }) => (
  <View className="flex-row" style={{ overflow: 'visible', gap: 19 }}>
    <View
      style={{
        width: TIMELINE_DOT_SIZE,
        alignItems: 'center',
        overflow: 'visible',
      }}
    >
      <View
        style={{
          width: TIMELINE_DOT_SIZE,
          height: TIMELINE_DOT_SIZE,
          borderRadius: TIMELINE_DOT_SIZE / 2,
          borderWidth: 1,
          borderColor: '#1B998B',
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: TIMELINE_INNER_DOT_SIZE,
            height: TIMELINE_INNER_DOT_SIZE,
            borderRadius: TIMELINE_INNER_DOT_SIZE / 2,
            backgroundColor: '#1B998B',
          }}
        />
      </View>
      <TimelineDashLine height={lineHeight} style={{ marginTop: 2 }} />
    </View>

    <View className="">
      <Text className="text-base font-ubuntu-semibold text-[#0A1F29]">{event.title}</Text>
      <Text className="mt-1 text-base font-ubuntu-regular text-[#6C6C6C] tracking-[-0.2px]">
        {event.timestamp}
      </Text>
    </View>
  </View>
);

export default function AccessLogDetailScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const name = String(params.name || '');
  const category = String(params.category || '');
  const accessTime = String(params.timestamp || '');
  const codeCreatedAt = String(params.code_created_at || '');

  const events = useMemo(() => {
    const items: { title: string; date: Date }[] = [];

    if (codeCreatedAt) {
      items.push({ title: 'Code Generated', date: parseLogDate(codeCreatedAt) });
    }

    if (accessTime) {
      items.push({ title: 'Access Granted', date: parseLogDate(accessTime) });
    }

    return items
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((item) => ({
        title: item.title,
        timestamp: formatTimelineDate(item.date),
      }));
  }, [accessTime, codeCreatedAt]);

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

      <ScrollView
        contentContainerClassName="items-center pt-11 pb-16"
        showsVerticalScrollIndicator={false}
        style={{ overflow: 'visible' }}
      >
        <View className="p-2">
          <View className="h-[88px] w-[88px] items-center justify-center rounded-full bg-[#04162D]">
            <ProfileAvatar width={100} height={100} />
          </View>
        </View>

        <Text className="mt-3 text-[23px] font-ubuntu-regular text-[#0A1F29]">
          {capitalizeWords(name)}
        </Text>
        <Text className="mt-1 text-xs font-ubuntu-regular capitalize text-[#6C6C6C]">
          {category}
        </Text>

        <View className="mt-[50px] w-full px-3 pb-10" style={{ overflow: 'visible' }}>
          {events.length === 0 ? (
            <Text className="text-center text-sm text-grey">No timeline events found.</Text>
          ) : (
            events.map((event, index) => (
              <TimelineItem
                key={event.title}
                event={event}
                lineHeight={
                  index === events.length - 1 ? TIMELINE_LAST_OVERFLOW : TIMELINE_LINE_BETWEEN
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
