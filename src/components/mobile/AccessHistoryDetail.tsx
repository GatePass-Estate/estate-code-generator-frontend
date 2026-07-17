import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { TimelineDashLine } from '@/src/assets/svgs';

export type AccessHistoryTimelineEvent = {
  id: string;
  title: string;
  timestamp: string;
  isExpired?: boolean;
};

const TIMELINE_DOT_SIZE = 28;
const TIMELINE_INNER_DOT_SIZE = 20;
/** Fixed gap between timeline dots; dashed connector fills this space. */
const TIMELINE_GAP = 24;
/** Trailing line below the last item when the code has not expired. */
const TIMELINE_LAST_OVERFLOW = 59;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function TimelineItem({
  event,
  lineHeight,
  showLine,
}: {
  event: AccessHistoryTimelineEvent;
  lineHeight: number;
  showLine: boolean;
}) {
  const isExpired = !!event.isExpired;

  return (
    <View className="flex-row" style={{ gap: 19 }}>
      <View style={{ width: TIMELINE_DOT_SIZE, alignItems: 'center' }}>
        <View
          style={{
            width: TIMELINE_DOT_SIZE,
            height: TIMELINE_DOT_SIZE,
            borderRadius: TIMELINE_DOT_SIZE / 2,
            borderWidth: 1,
            borderColor: isExpired ? '#9B9797' : '#1B998B',
            backgroundColor: isExpired ? '#EFF1F1' : '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: TIMELINE_INNER_DOT_SIZE,
              height: TIMELINE_INNER_DOT_SIZE,
              borderRadius: TIMELINE_INNER_DOT_SIZE / 2,
              backgroundColor: isExpired ? '#9B9797' : '#1B998B',
            }}
          />
        </View>
        {showLine ? (
          <View style={{ height: lineHeight, overflow: 'hidden' }}>
            <TimelineDashLine height={lineHeight} />
          </View>
        ) : null}
      </View>

      <View>
        <Text className="text-sm font-inter-medium text-[#0A1F29]">{event.title}</Text>
        <Text className="mt-1 text-sm font-inter-light text-[#6C6C6C] tracking-[-0.2px]">
          {event.timestamp}
        </Text>
      </View>
    </View>
  );
}

type AccessHistoryDetailProps = {
  name: string;
  category: string;
  events: AccessHistoryTimelineEvent[];
  photoUri?: string | null;
  loading?: boolean;
  error?: string | null;
  onBack: () => void;
  showRegenerate?: boolean;
  regenerating?: boolean;
  onRegenerate?: () => void;
  /** Extra space above the bottom nav when the tab bar stays visible. */
  bottomInset?: number;
};

export default function AccessHistoryDetail({
  name,
  category,
  events,
  photoUri = null,
  loading = false,
  error = null,
  onBack,
  showRegenerate = false,
  regenerating = false,
  onRegenerate,
  bottomInset = 0,
}: AccessHistoryDetailProps) {
  const displayName = name.trim() || 'Unknown';
  const initials = getInitials(displayName);
  const actionBottom = bottomInset + 16;

  return (
    <View className="flex-1">
      <Pressable
        onPress={onBack}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#113E55" />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              alignItems: 'center',
              paddingTop: 6,
              paddingBottom: showRegenerate ? 120 + bottomInset : 40 + bottomInset,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View
              className="h-[105px] w-[105px] items-center justify-center rounded-full bg-[#CEE5ED]"
              style={{ overflow: 'hidden' }}
            >
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-[28px] font-ubuntu-medium text-[#113E55]">{initials}</Text>
              )}
            </View>

            <Text className="mt-[18px] text-[21.88px] font-ubuntu-semibold text-[#0A1F29]">
              {displayName}
            </Text>
            {category ? (
              <Text className="mt-1.5 text-sm font-inter-light capitalize text-[#878686]">
                {category}
              </Text>
            ) : null}

            <View className="mt-[54px] w-full px-3">
              {error ? (
                <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
                  {error}
                </Text>
              ) : events.length === 0 ? (
                <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
                  No timeline events found.
                </Text>
              ) : (
                events.map((event, index) => {
                  const isLast = index === events.length - 1;
                  const endsWithExpired = isLast && !!event.isExpired;

                  return (
                    <TimelineItem
                      key={event.id}
                      event={event}
                      showLine={!endsWithExpired}
                      lineHeight={isLast ? TIMELINE_LAST_OVERFLOW : TIMELINE_GAP}
                    />
                  );
                })
              )}
            </View>
          </ScrollView>

          {showRegenerate ? (
            <View className="absolute bottom-[60px] left-5 right-5">
              <Pressable
                onPress={onRegenerate}
                disabled={regenerating}
                className="items-center justify-center rounded-full bg-primary p-4"
              >
                {regenerating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-sm font-ubuntu-semibold text-white">Regenerate Code</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
