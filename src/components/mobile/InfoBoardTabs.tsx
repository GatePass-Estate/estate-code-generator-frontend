import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { InfoBoardTab } from '@/src/hooks/useInfoBoard';

const TAB_WIDTH = 119;
const TAB_HEIGHT = 40;
const TIMING = { duration: 220 };

/**
 * Message / Activities switch.
 *
 * The active pill is a single absolutely-positioned layer that slides between
 * the two slots, so the swap reads as one movement instead of two colour
 * changes. Switching is purely local state — it never waits on data.
 */
export default function InfoBoardTabs({
  tab,
  onChange,
  broadcastUnread,
  activityUnread,
}: {
  tab: InfoBoardTab;
  onChange: (next: InfoBoardTab) => void;
  broadcastUnread: number;
  activityUnread: number;
}) {
  const offset = useSharedValue(tab === 'message' ? 0 : TAB_WIDTH);

  useEffect(() => {
    offset.value = withTiming(tab === 'message' ? 0 : TAB_WIDTH, TIMING);
  }, [tab, offset]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View
      className="self-start rounded-[24px] bg-[#EFF1F1] mt-5 overflow-hidden"
      style={{ width: TAB_WIDTH * 2, height: TAB_HEIGHT }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          pillStyle,
          {
            position: 'absolute',
            width: TAB_WIDTH,
            height: TAB_HEIGHT,
            borderRadius: 24,
            backgroundColor: '#CEE5ED',
          },
        ]}
      />

      <View className="flex-row">
        {(['message', 'activities'] as InfoBoardTab[]).map((value) => {
          const active = tab === value;
          const unread = value === 'message' ? broadcastUnread : activityUnread;
          return (
            <Pressable
              key={value}
              onPress={() => onChange(value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className="items-center justify-center"
              style={{ width: TAB_WIDTH, height: TAB_HEIGHT }}
            >
              <Text
                className="font-inter-regular text-[11px]"
                style={{ color: active ? '#113E55' : '#878686' }}
              >
                {value === 'message' ? 'Message' : 'Activities'}
              </Text>
              {/* The dot flags unread on the tab you are not currently viewing. */}
              {!active && unread > 0 && (
                <View className="absolute right-3 top-2 h-[9px] w-[9px] rounded-full bg-[#E30404]" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
