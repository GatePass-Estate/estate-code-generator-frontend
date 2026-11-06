import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PriorityBadge from './PriorityBadge';
import type { BroadcastItem } from '@/src/types/broadcast';

type BroadcastPopupProps = {
  broadcasts: BroadcastItem[];
  /** Acknowledge one broadcast ("Got it!"). Resolves once it is marked read. */
  onAcknowledge: (id: string) => Promise<void>;
  /** Close without acknowledging — the popup returns on the next app open. */
  onClose: () => void;
};

const CARD_MAX_WIDTH = 337;
/** Matches the backdrop's `px-[19px]`. */
const SIDE_GUTTER = 19;

/**
 * Full-screen broadcast announcement.
 *
 * Deliberately not dismissible by tapping the backdrop or the Android back
 * button: it closes only via the X (which leaves the broadcast unread, so it
 * reappears next launch) or "Got it!" (which marks it read for good).
 *
 * With several broadcasts the card becomes a pager — swipe horizontally, with
 * dots showing position.
 */
export default function BroadcastPopup({
  broadcasts,
  onAcknowledge,
  onClose,
}: BroadcastPopupProps) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [acknowledging, setAcknowledging] = useState(false);

  // One page is exactly one card, and the pager is exactly one page wide: paging snaps by the
  // viewport width, so any difference between the two makes each swipe drift by that much.
  const pageWidth = useMemo(() => Math.min(CARD_MAX_WIDTH, width - SIDE_GUTTER * 2), [width]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const raw = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
      const next = Math.max(0, Math.min(raw, broadcasts.length - 1));
      setIndex((current) => (current === next ? current : next));
    },
    [broadcasts.length, pageWidth]
  );

  // The list can also shrink from outside (a broadcast opened on its own page),
  // so keep the pager on a card that still exists.
  useEffect(() => {
    if (broadcasts.length > 0 && index > broadcasts.length - 1) {
      const last = broadcasts.length - 1;
      setIndex(last);
      scrollRef.current?.scrollTo({ x: last * pageWidth, animated: false });
    }
  }, [broadcasts.length, index, pageWidth]);

  const handleAcknowledge = useCallback(
    async (item: BroadcastItem) => {
      if (acknowledging) return;

      setAcknowledging(true);
      try {
        await onAcknowledge(item.id);

        // Acknowledging the last remaining card closes the popup; otherwise
        // stay put — the list shrinks under us, so this index now holds the
        // next one.
        if (broadcasts.length <= 1) {
          onClose();
          return;
        }

        const nextIndex = Math.min(index, broadcasts.length - 2);
        setIndex(nextIndex);
        scrollRef.current?.scrollTo({ x: nextIndex * pageWidth, animated: false });
      } finally {
        setAcknowledging(false);
      }
    },
    [broadcasts.length, index, acknowledging, onAcknowledge, onClose, pageWidth]
  );

  if (broadcasts.length === 0) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      // No-op so the hardware back button cannot dismiss an announcement.
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-[19px]">
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          // react-native-web never fires momentum events, so track the offset as it scrolls there.
          onScroll={Platform.OS === 'web' ? handleScroll : undefined}
          scrollEventThrottle={Platform.OS === 'web' ? 32 : undefined}
          scrollEnabled={broadcasts.length > 1}
          style={{ width: pageWidth, maxHeight: '70%', flexGrow: 0 }}
        >
          {broadcasts.map((item) => {
            return (
              <View key={item.id} style={{ width: pageWidth }}>
                <View
                  className="rounded-[24px] border bg-white px-5 py-7"
                  style={{ borderColor: '#CEE5ED' }}
                >
                  <View className="flex-row items-center gap-4 mb-5">
                    <PriorityBadge priority={item.priority} />
                    <Text
                      className="flex-1 text-[#0A1F29] font-ubuntu-semibold"
                      style={{ fontSize: 22 }}
                    >
                      {item.title}
                    </Text>
                  </View>

                  <ScrollView
                    style={{ maxHeight: 260 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    <Text className="text-[#0A1F29] font-inter-light text-sm leading-6">
                      {item.message}
                    </Text>
                  </ScrollView>

                  <Pressable
                    onPress={() => void handleAcknowledge(item)}
                    disabled={acknowledging}
                    className="bg-primary rounded-[24px] h-11 items-center justify-center self-stretch mt-7"
                    style={{ opacity: acknowledging ? 0.7 : 1 }}
                  >
                    {acknowledging ? (
                      <ActivityIndicator color="#F6F7F7" />
                    ) : (
                      <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">Got it!</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {broadcasts.length > 1 && (
          <View className="flex-row items-center gap-2 mt-4">
            {broadcasts.map((item, dotIndex) => (
              <View
                key={item.id}
                className="rounded-full"
                style={{
                  width: dotIndex === index ? 18 : 7,
                  height: 7,
                  backgroundColor: dotIndex === index ? '#113E55' : '#CEE5ED',
                }}
              />
            ))}
          </View>
        )}

        <Pressable
          onPress={onClose}
          disabled={acknowledging}
          accessibilityRole="button"
          accessibilityLabel="Close announcement"
          className="mt-6"
          hitSlop={12}
        >
          <MaterialCommunityIcons name="close-circle-outline" size={32} color="#F6F7F7" />
        </Pressable>
      </View>
    </Modal>
  );
}
