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
import Button from '@/src/components/mobile/Button';

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
  /** Active (not-yet-expired) codes show Share/Delete instead of Regenerate. */
  activeCodeActions?: {
    onShare: () => void;
    onDelete: () => void;
    deleting?: boolean;
  };
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
  activeCodeActions,
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
          <View className="items-center" style={{ paddingTop: 6 }}>
            <View
              className="h-[105px] w-[105px] items-center justify-center rounded-full bg-[#F4FFFE]"
              style={{ overflow: 'hidden' }}
            >
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-[40px] font-ubuntu-regular text-[#1B998B] uppercase">
                  {initials}
                </Text>
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
          </View>

          {/* Timeline scrolls within its own bounded frame, independent of the header above. */}
          <ScrollView
            className="mt-[54px] flex-1"
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingBottom:
                showRegenerate || activeCodeActions ? 120 + bottomInset : 40 + bottomInset,
            }}
            showsVerticalScrollIndicator={false}
          >
            <AccessTimeline
              className="w-full"
              events={events}
              error={error}
              gap={timelineGap}
              lastOverflow={timelineLastOverflow}
            />
          </ScrollView>

          {activeCodeActions ? (
            <View
              className="absolute bottom-8 left-5 right-5 flex-row items-center justify-center"
              style={{ gap: 20 }}
            >
              <Button
                label="Delete Invite"
                variant="secondary"
                size="md"
                loading={activeCodeActions.deleting}
                onPress={activeCodeActions.onDelete}
              />
              <Button label="Share Invite" size="md" onPress={activeCodeActions.onShare} />
            </View>
          ) : showRegenerate ? (
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
