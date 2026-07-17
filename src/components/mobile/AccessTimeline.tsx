import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { TimelineDashLine } from '@/src/assets/svgs';

export type AccessTimelineEvent = {
  id: string;
  title: string;
  timestamp: string;
  isExpired?: boolean;
};

const TIMELINE_DOT_SIZE = 28;
const TIMELINE_INNER_DOT_SIZE = 20;

type AccessTimelineProps = {
  events: AccessTimelineEvent[];
  /** Gap between consecutive items; dashed connector fills this space. */
  gap?: number;
  /** Trailing dashed line below the last item when the code has not expired. */
  lastOverflow?: number;
  error?: string | null;
  emptyMessage?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Extra style on the dashed connector (e.g. marginTop). */
  dashStyle?: StyleProp<ViewStyle>;
};

function TimelineItem({
  event,
  lineHeight,
  showLine,
  dashStyle,
}: {
  event: AccessTimelineEvent;
  lineHeight: number;
  showLine: boolean;
  dashStyle?: StyleProp<ViewStyle>;
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
          <View style={[{ height: lineHeight, overflow: 'hidden' }, dashStyle]}>
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

export default function AccessTimeline({
  events,
  gap = 24,
  lastOverflow = 56,
  error = null,
  emptyMessage = 'No timeline events found.',
  className,
  style,
  dashStyle,
}: AccessTimelineProps) {
  if (error) {
    return <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">{error}</Text>;
  }

  if (events.length === 0) {
    return (
      <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">{emptyMessage}</Text>
    );
  }

  return (
    <View className={className} style={style}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const endsWithExpired = isLast && !!event.isExpired;

        return (
          <TimelineItem
            key={event.id}
            event={event}
            showLine={!endsWithExpired}
            lineHeight={isLast ? lastOverflow : gap}
            dashStyle={dashStyle}
          />
        );
      })}
    </View>
  );
}
