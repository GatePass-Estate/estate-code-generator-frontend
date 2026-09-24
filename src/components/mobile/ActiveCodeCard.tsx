import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import AccessCodeRing from './AccessCodeRing';
import CodeActionsSheet from './CodeActionsSheet';
import { CarbonAddFilledIcon } from '@/src/assets/svgs';
import images from '@/src/constants/images';
import { useFeatureGate } from '@/src/hooks/usePlan';
import { deleteCode } from '@/src/lib/api/codes';
import { Codes } from '@/src/types/codes';

/** Gesture / layout math — must stay numeric for Reanimated interpolations. */
const ACTION_WIDTH = 68;
const OPEN_THRESHOLD = 28;
const VELOCITY_THRESHOLD = 480;
const RING_WIDTH = 71;
const CLUSTER_GAP = 16;
const PLUS_SIZE = 20;
const TIMER_CLUSTER_WIDTH = RING_WIDTH + CLUSTER_GAP + PLUS_SIZE;
const DELETE_TIMER_SCREEN_LEFT = 38;
const RING_TOP = 12;
const PLUS_TOP = RING_TOP + (RING_WIDTH - PLUS_SIZE) / 2;
const SPRING = { damping: 22, stiffness: 280, mass: 0.65, overshootClamping: true };
const FROZEN_TEXT = 'rgba(241, 248, 251, 0.6)';

type ActiveCodeCardProps = {
  item: Codes;
  guestName: string;
  code: string;
  expiresAt: number;
  startAt: number | null;
  frozen: boolean;
  onToggleFreeze: () => void;
  onDeleted: () => void;
  onCopied: () => void;
  onOpenHistory: () => void;
  onOpenDetails: () => void;
  onExtend: () => void;
};

export default function ActiveCodeCard({
  item,
  guestName,
  code,
  expiresAt,
  startAt,
  frozen,
  onToggleFreeze,
  onDeleted,
  onCopied,
  onOpenHistory,
  onOpenDetails,
  onExtend,
}: ActiveCodeCardProps) {
  const translateX = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetView, setSheetView] = useState<'menu' | 'confirmDelete'>('menu');
  const [deleting, setDeleting] = useState(false);
  const [cardWidth, setCardWidth] = useState(339);
  const [openAction, setOpenAction] = useState<'none' | 'freeze' | 'delete'>('none');
  const { requestAccess: requestCodeAccess } = useFeatureGate('advanced_code_management');

  const tryAdvanced = useCallback(
    (action: () => void) => {
      if (!requestCodeAccess()) return false;
      action();
      return true;
    },
    [requestCodeAccess]
  );

  const closeSwipe = useCallback(() => {
    translateX.value = withSpring(0, SPRING);
    setOpenAction('none');
  }, [translateX]);

  const snapOpenHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCopied();
  }, [code, onCopied]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteCode(item.hashed_code);
      setSheetVisible(false);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }, [item.hashed_code, onDeleted]);

  const openMenu = useCallback(() => {
    setSheetView('menu');
    setSheetVisible(true);
  }, []);

  const openDeleteConfirm = useCallback(() => {
    closeSwipe();
    setSheetView('confirmDelete');
    setSheetVisible(true);
  }, [closeSwipe]);

  const handleCardPress = useCallback(() => {
    if (Math.abs(translateX.value) > 4) {
      closeSwipe();
      return;
    }
    openMenu();
  }, [closeSwipe, openMenu, translateX]);

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      dragStartX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = dragStartX.value + e.translationX;
      translateX.value = Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, next));
    })
    .onEnd((e) => {
      const current = translateX.value;
      const velocity = e.velocityX;
      let target = 0;

      if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
        if (velocity > 0) {
          // Swipe right: open Freeze/Unfreeze, or close Delete
          target = dragStartX.value < 0 ? 0 : ACTION_WIDTH;
        } else {
          // Swipe left: open Delete, or close Freeze/Unfreeze
          target = dragStartX.value > 0 ? 0 : -ACTION_WIDTH;
        }
      } else if (current > OPEN_THRESHOLD) {
        target = ACTION_WIDTH;
      } else if (current < -OPEN_THRESHOLD) {
        target = -ACTION_WIDTH;
      }

      if (target !== 0 && dragStartX.value === 0) {
        runOnJS(snapOpenHaptic)();
      }

      runOnJS(setOpenAction)(target > 0 ? 'freeze' : target < 0 ? 'delete' : 'none');

      translateX.value = withSpring(target, {
        ...SPRING,
        velocity,
      });
    });

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((_e, success) => {
      if (success) runOnJS(handleCardPress)();
    });

  const longPress = Gesture.LongPress()
    .minDuration(450)
    .onStart(() => {
      runOnJS(handleCopy)();
    });

  const cardGesture = Gesture.Race(pan, Gesture.Exclusive(longPress, tap));

  // Freeze open → name + code shift right
  const identityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-ACTION_WIDTH, -ACTION_WIDTH * 0.4, 0],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
    left: interpolate(translateX.value, [0, ACTION_WIDTH], [16, 88], Extrapolation.CLAMP),
  }));

  // Delete open → timer @ 38, plus @ 125. Card does not slide.
  const timerClusterStyle = useAnimatedStyle(() => {
    const closedLeft = Math.max(cardWidth - 16 - TIMER_CLUSTER_WIDTH, 16);

    return {
      opacity: interpolate(
        translateX.value,
        [0, ACTION_WIDTH * 0.4, ACTION_WIDTH],
        [1, 0, 0],
        Extrapolation.CLAMP
      ),
      left: interpolate(
        translateX.value,
        [-ACTION_WIDTH, 0],
        [DELETE_TIMER_SCREEN_LEFT, closedLeft],
        Extrapolation.CLAMP
      ),
    };
  });

  const plusStyle = useAnimatedStyle(() => {
    const closedLeft = Math.max(cardWidth - 16 - TIMER_CLUSTER_WIDTH, 16);
    const clusterLeft = interpolate(
      translateX.value,
      [-ACTION_WIDTH, 0],
      [DELETE_TIMER_SCREEN_LEFT, closedLeft],
      Extrapolation.CLAMP
    );

    return {
      opacity: interpolate(
        translateX.value,
        [0, ACTION_WIDTH * 0.4, ACTION_WIDTH],
        [1, 0, 0],
        Extrapolation.CLAMP
      ),
      left: clusterLeft + RING_WIDTH + CLUSTER_GAP,
    };
  });

  const freezeActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, ACTION_WIDTH * 0.2, ACTION_WIDTH],
      [0, 0.9, 1],
      Extrapolation.CLAMP
    ),
  }));

  const deleteActionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-ACTION_WIDTH, -ACTION_WIDTH * 0.2, 0],
      [1, 0.9, 0],
      Extrapolation.CLAMP
    ),
  }));

  const sheet = (
    <CodeActionsSheet
      visible={sheetVisible}
      frozen={frozen}
      initialView={sheetView}
      deleting={deleting}
      onClose={() => {
        setSheetVisible(false);
      }}
      onFreezeToggle={() => {
        tryAdvanced(() => {
          setSheetVisible(false);
          closeSwipe();
          onToggleFreeze();
        });
      }}
      onExtend={() => {
        tryAdvanced(() => {
          setSheetVisible(false);
          onExtend();
        });
      }}
      onShare={() => {
        setSheetVisible(false);
        onOpenDetails();
      }}
      onHistory={() => {
        setSheetVisible(false);
        onOpenHistory();
      }}
      onConfirmDelete={handleDelete}
    />
  );

  if (frozen) {
    return (
      <View className="h-[95px] max-h-[95px] min-h-[95px] w-full overflow-hidden rounded-2xl border border-[#BEE4F5] bg-[#70B1EE]">
        <GestureDetector gesture={Gesture.Exclusive(longPress, tap)}>
          <View className="h-[95px] w-full">
            <LinearGradient
              colors={['#70B1EE', 'rgba(230, 242, 255, 0.5)', '#62A5D7']}
              locations={[0.2078, 0.5123, 0.8952]}
              start={{ x: 0.021, y: 0.357 }}
              end={{ x: 0.979, y: 0.643 }}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Image
                source={images.frozenIceOverlay}
                resizeMode="cover"
                className="h-full w-full"
              />
            </View>

            <View className="absolute left-4 top-[22px]" pointerEvents="none">
              <Text
                className="font-inter-regular text-[11.2px] leading-[14px]  text-[#F1F8FB]/60"
                style={{ includeFontPadding: false }}
              >
                {guestName}
              </Text>
              <Text
                className="font-ubuntu-medium text-[34.18px]  leading-[40px] text-[#F1F8FB]/60"
                style={{ includeFontPadding: false }}
              >
                {code.toUpperCase()}
              </Text>
            </View>

            <View
              className="absolute right-[52px] top-3 flex-row items-center"
              pointerEvents="none"
            >
              <AccessCodeRing expiresAt={expiresAt} startAt={startAt} dimmed />
            </View>
          </View>
        </GestureDetector>

        <View
          pointerEvents="none"
          className="absolute right-4 z-20 h-5 w-5 items-center justify-center"
          style={{ top: PLUS_TOP }}
        >
          <CarbonAddFilledIcon color={FROZEN_TEXT} width={PLUS_SIZE} height={PLUS_SIZE} />
        </View>

        {sheet}
      </View>
    );
  }

  return (
    <View
      className="h-[95px] max-h-[95px] min-h-[95px] w-full"
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}
    >
      <GestureDetector gesture={cardGesture}>
        <Animated.View className="h-[95px] w-full overflow-hidden rounded-2xl border border-[#CEE5ED] bg-[#F6F7F7]">
          {/* Name + code — visible at rest & on Freeze */}
          <Animated.View className="absolute top-[22px]" style={identityStyle} pointerEvents="none">
            <Text className="font-inter-regular text-[11.2px] leading-[14px] text-[#9B9797]">
              {guestName}
            </Text>
            <Text className="font-ubuntu-medium text-[34.18px] leading-[40px] text-[#F46036]">
              {code.toUpperCase()}
            </Text>
          </Animated.View>

          {/* Timer — plus sits in an overlay so it can open the drawer */}
          <Animated.View
            className="absolute top-3 flex-row items-center"
            style={timerClusterStyle}
            pointerEvents="none"
          >
            <AccessCodeRing expiresAt={expiresAt} startAt={startAt} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Freeze overlays the left; the card’s 16px right edge stays visible */}
      <Animated.View
        pointerEvents={openAction === 'freeze' ? 'auto' : 'none'}
        className="absolute bottom-0 left-0 top-0 z-[15] w-[68px] items-center justify-center rounded-l-[8px] bg-[#1F62A6]"
        style={freezeActionStyle}
      >
        <Pressable
          onPress={() => {
            const allowed = tryAdvanced(() => {
              closeSwipe();
              onToggleFreeze();
            });
            if (!allowed) {
              closeSwipe();
              openMenu();
            }
          }}
          className="h-full w-full items-center justify-center"
        >
          <Text className="text-xs font-inter-semibold text-[#F6F7F7]">Freeze</Text>
        </Pressable>
      </Animated.View>

      {/* Delete overlays the right; the card’s 16px left edge stays visible */}
      <Animated.View
        pointerEvents={openAction === 'delete' ? 'auto' : 'none'}
        className="absolute bottom-0 right-0 top-0 z-[15] w-[68px] items-center justify-center rounded-r-[8px] bg-[#F46036]"
        style={deleteActionStyle}
      >
        <Pressable
          onPress={openDeleteConfirm}
          className="h-full w-full items-center justify-center"
        >
          <Text className="text-xs font-inter-semibold text-[#F6F7F7]">Delete</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        className="absolute z-20 h-5 w-5 items-center justify-center"
        style={[{ top: PLUS_TOP }, plusStyle]}
      >
        <CarbonAddFilledIcon />
      </Animated.View>

      {sheet}
    </View>
  );
}
