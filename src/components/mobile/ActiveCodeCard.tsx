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

const ACTION_WIDTH = 68;
const OPEN_THRESHOLD = 28;
const VELOCITY_THRESHOLD = 480;
const CARD_HEIGHT = 95;
const CARD_RADIUS = 16;
const ACTION_RADIUS = 8;
/** Timer 71 + gap 16 + add 20 — Figma delete: timer@38, add@125 */
const RING_WIDTH = 71;
const CLUSTER_GAP = 16;
const PLUS_SIZE = 20;
const TIMER_CLUSTER_WIDTH = RING_WIDTH + CLUSTER_GAP + PLUS_SIZE;
const DELETE_TIMER_SCREEN_LEFT = 38;
const RING_TOP = 12;
const PLUS_TOP = RING_TOP + (RING_WIDTH - PLUS_SIZE) / 2;
const NAME_TOP = 22;
const NAME_FONT_SIZE = 11.2;
const NAME_LINE_HEIGHT = 11.2;
const CODE_FONT_SIZE = 34.18;
const CODE_LINE_HEIGHT = 34.18;
const SPRING = { damping: 22, stiffness: 280, mass: 0.65, overshootClamping: true };
const FROZEN_TEXT = 'rgba(241, 248, 251, 0.6)';
const FROZEN_BORDER = '#BEE4F5';
const CARD_SHELL = {
  width: '100%' as const,
  height: CARD_HEIGHT,
  minHeight: CARD_HEIGHT,
  maxHeight: CARD_HEIGHT,
  borderRadius: CARD_RADIUS,
  overflow: 'hidden' as const,
};

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

  // Freeze open → name + code shift right (Figma 5123:2360)
  const identityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-ACTION_WIDTH, -ACTION_WIDTH * 0.4, 0],
      [0, 0, 1],
      Extrapolation.CLAMP
    ),
    left: interpolate(translateX.value, [0, ACTION_WIDTH], [16, 88], Extrapolation.CLAMP),
  }));

  // Delete open → timer @ 38, plus @ 125 (Figma 5165:5470). Card does not slide.
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
    // Figma 8054:6286 / 8073:8227 —
    // border: 1px solid #BEE4F5; radius 16;
    // background: ice image cover + linear-gradient(106.59deg, #70B1EE 20.78%, rgba(230,242,255,.5) 51.23%, #62A5D7 89.52%)
    return (
      <View
        style={[
          CARD_SHELL,
          {
            borderWidth: 1,
            borderColor: FROZEN_BORDER,
            backgroundColor: '#70B1EE',
          },
        ]}
      >
        <GestureDetector gesture={Gesture.Exclusive(longPress, tap)}>
          <View style={{ width: '100%', height: CARD_HEIGHT }}>
            {/* Gradient behind — Figma first paints this, then ice on top */}
            <LinearGradient
              colors={['#70B1EE', 'rgba(230, 242, 255, 0.5)', '#62A5D7']}
              locations={[0.2078, 0.5123, 0.8952]}
              start={{ x: 0.021, y: 0.357 }}
              end={{ x: 0.979, y: 0.643 }}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            {/* Official Figma ice overlay (natural alpha fade L→R) */}
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <Image
                source={images.frozenIceOverlay}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}
              />
            </View>

            <View style={{ position: 'absolute', left: 16, top: NAME_TOP }} pointerEvents="none">
              <Text
                className="font-inter-regular"
                style={{
                  color: FROZEN_TEXT,
                  fontSize: NAME_FONT_SIZE,
                  lineHeight: NAME_LINE_HEIGHT,
                  includeFontPadding: false,
                }}
              >
                {guestName}
              </Text>
              <Text
                className="font-ubuntu-medium"
                style={{
                  color: FROZEN_TEXT,
                  fontSize: CODE_FONT_SIZE,
                  lineHeight: CODE_LINE_HEIGHT,
                  includeFontPadding: false,
                }}
              >
                {code.toUpperCase()}
              </Text>
            </View>

            <View
              style={{
                position: 'absolute',
                right: 16 + PLUS_SIZE + CLUSTER_GAP,
                top: RING_TOP,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              pointerEvents="none"
            >
              <AccessCodeRing expiresAt={expiresAt} startAt={startAt} dimmed />
            </View>
          </View>
        </GestureDetector>

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: 16,
            top: PLUS_TOP,
            zIndex: 20,
            width: PLUS_SIZE,
            height: PLUS_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CarbonAddFilledIcon color={FROZEN_TEXT} width={PLUS_SIZE} height={PLUS_SIZE} />
        </View>

        {sheet}
      </View>
    );
  }

  return (
    <View style={CARD_SHELL} onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)}>
      <GestureDetector gesture={cardGesture}>
        <Animated.View
          style={{
            width: '100%',
            height: CARD_HEIGHT,
            backgroundColor: '#F6F7F7',
            borderRadius: CARD_RADIUS,
            borderWidth: 1,
            borderColor: '#CEE5ED',
            overflow: 'hidden',
          }}
        >
          {/* Name + code — visible at rest & on Freeze */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: NAME_TOP,
              },
              identityStyle,
            ]}
            pointerEvents="none"
          >
            <Text
              className="font-inter-regular text-[#9B9797]"
              style={{
                fontSize: NAME_FONT_SIZE,
                lineHeight: NAME_LINE_HEIGHT,
                includeFontPadding: false,
              }}
            >
              {guestName}
            </Text>
            <Text
              className="font-ubuntu-medium text-[#F46036]"
              style={{
                fontSize: CODE_FONT_SIZE,
                lineHeight: CODE_LINE_HEIGHT,
                includeFontPadding: false,
              }}
            >
              {code.toUpperCase()}
            </Text>
          </Animated.View>

          {/* Timer — plus sits in an overlay so it can open the drawer */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: RING_TOP,
                flexDirection: 'row',
                alignItems: 'center',
              },
              timerClusterStyle,
            ]}
            pointerEvents="none"
          >
            <AccessCodeRing expiresAt={expiresAt} startAt={startAt} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Freeze overlays the left; the card’s 16px right edge stays visible */}
      <Animated.View
        pointerEvents={openAction === 'freeze' ? 'auto' : 'none'}
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: ACTION_WIDTH,
            zIndex: 15,
            backgroundColor: '#1F62A6',
            borderTopLeftRadius: ACTION_RADIUS,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: ACTION_RADIUS,
            alignItems: 'center',
            justifyContent: 'center',
          },
          freezeActionStyle,
        ]}
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
          style={{ height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="text-xs font-inter-semibold text-[#F6F7F7]">Freeze</Text>
        </Pressable>
      </Animated.View>

      {/* Delete overlays the right; the card’s 16px left edge stays visible */}
      <Animated.View
        pointerEvents={openAction === 'delete' ? 'auto' : 'none'}
        style={[
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: ACTION_WIDTH,
            zIndex: 15,
            backgroundColor: '#F46036',
            borderTopLeftRadius: 0,
            borderTopRightRadius: ACTION_RADIUS,
            borderBottomRightRadius: ACTION_RADIUS,
            borderBottomLeftRadius: 0,
            alignItems: 'center',
            justifyContent: 'center',
          },
          deleteActionStyle,
        ]}
      >
        <Pressable
          onPress={openDeleteConfirm}
          style={{ height: '100%', width: '100%', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="text-xs font-inter-semibold text-[#F6F7F7]">Delete</Text>
        </Pressable>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: PLUS_TOP,
            width: PLUS_SIZE,
            height: PLUS_SIZE,
            zIndex: 20,
            alignItems: 'center',
            justifyContent: 'center',
          },
          plusStyle,
        ]}
      >
        <CarbonAddFilledIcon />
      </Animated.View>

      {sheet}
    </View>
  );
}
