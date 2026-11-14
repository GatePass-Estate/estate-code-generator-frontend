import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import ScreenLoading, { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import Back from '@/src/shared/components/navigation/Back';
import AccessTimeline, {
  AccessTimelineEvent,
} from '@/src/features/history/components/AccessTimeline';
import Button from '@/src/shared/components/Button';

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
  /** Called when the timeline is scrolled near its end (load the next page of events). */
  onEndReached?: () => void;
  /** Shows a spinner under the timeline while the next page loads. */
  loadingMore?: boolean;
};

const END_REACHED_THRESHOLD = 120;

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
  onEndReached,
  loadingMore = false,
}: AccessHistoryDetailProps) {
  const displayName = name.trim() || 'Unknown';
  const initials = getInitials(displayName);

  const handleScroll = onEndReached
    ? ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
        if (
          layoutMeasurement.height + contentOffset.y >=
          contentSize.height - END_REACHED_THRESHOLD
        ) {
          onEndReached();
        }
      }
    : undefined;

  return (
    <View className="flex-1">
      <Back type="short-arrow" onPress={onBack} />

      {loading ? (
        <ScreenLoading />
      ) : (
        <>
          <View className="items-center" style={{ paddingTop: 6 }}>
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
                <Text className="text-[40px] font-ubuntu-regular text-teal uppercase">
                  {initials}
                </Text>
              )}
            </View>

            <Text className="mt-[18px] text-heading-sm font-ubuntu-semibold text-[#0A1F29]">
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
            onScroll={handleScroll}
            scrollEventThrottle={handleScroll ? 100 : undefined}
          >
            <AccessTimeline className="w-full" events={events} error={error} gap={timelineGap} />
            {loadingMore ? (
              <View style={{ marginTop: 16 }}>
                <CircleLoader size={32} />
              </View>
            ) : null}
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
                  <CircleLoader size={22} tone="light" />
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
