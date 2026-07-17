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
import AccessTimeline, { AccessTimelineEvent } from '@/src/components/mobile/AccessTimeline';

/** @deprecated Prefer `AccessTimelineEvent` from AccessTimeline. */
export type AccessHistoryTimelineEvent = AccessTimelineEvent;

type AccessHistoryDetailProps = {
  name: string;
  category: string;
  events: AccessTimelineEvent[];
  photoUri?: string | null;
  loading?: boolean;
  error?: string | null;
  onBack: () => void;
  showRegenerate?: boolean;
  regenerating?: boolean;
  onRegenerate?: () => void;
  /** Extra space above the bottom nav when the tab bar stays visible. */
  bottomInset?: number;
  /** Gap between timeline items. Default 24. */
  timelineGap?: number;
  /** Trailing line below last non-expired item. Default 59. */
  timelineLastOverflow?: number;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

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
  timelineGap = 24,
  timelineLastOverflow = 59,
}: AccessHistoryDetailProps) {
  const displayName = name.trim() || 'Unknown';
  const initials = getInitials(displayName);

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

            <AccessTimeline
              className="mt-[54px] w-full px-3"
              events={events}
              error={error}
              gap={timelineGap}
              lastOverflow={timelineLastOverflow}
            />
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
