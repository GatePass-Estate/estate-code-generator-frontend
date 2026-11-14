import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Blocks scrim and Android back dismissal while a request is in flight. */
  busy?: boolean;
  children: ReactNode;
  /** Scrim classes. Callers keep their existing class string. */
  scrimClassName: string;
  scrimProps?: Omit<PressableProps, 'onPress' | 'className'>;
  panelClassName?: string;
  panelStyle?: StyleProp<ViewStyle>;
  /** Extra panel props (accessibility). Taps inside never dismiss: the scrim is not a parent. */
  panelProps?: Omit<ViewProps, 'style' | 'className'>;
  /** Drawn behind the scrim. Use this for a blur layer. */
  backdrop?: ReactNode;
  /** Drawn over the panel, inside the scrim. Use this for a nested overlay. */
  overlay?: ReactNode;
  /** Fires after the sheet has fully closed, so another sheet can open. */
  onDismissed?: () => void;
  /** The sheet draws one grabber. Turn this off only when the visible card is an inner view. */
  showGrabber?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  statusBarTranslucent?: boolean;
};

const SLIDE = { duration: 280, easing: Easing.bezier(0.22, 1, 0.36, 1) };
/** Snap-back when the drag is released short of dismiss. */
const SNAP = { damping: 26, stiffness: 320, mass: 0.85, overshootClamping: true };

/** The one grabber every bottom sheet uses. */
export function SheetGrabber() {
  return (
    <View className="h-[34px] w-full items-center justify-center">
      <View className="h-[7px] w-[134px] rounded-[4px] bg-grey" />
    </View>
  );
}

/**
 * Slide-up sheet shell: transparent modal, scrim dismiss, Android back, and a panel
 * that swallows taps. The panel slides up and the scrim fades. Drag-to-dismiss works
 * anywhere on the sheet; padding and content stay with the caller.
 */
export default function BottomSheet({
  visible,
  onClose,
  busy = false,
  children,
  scrimClassName,
  scrimProps,
  panelClassName,
  panelStyle,
  panelProps,
  backdrop,
  overlay,
  onDismissed,
  showGrabber = true,
  animationType = 'slide',
}: BottomSheetProps) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(height);
  const scrimOpacity = useSharedValue(0);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;
  const instant = animationType === 'none';
  const dragStartY = useSharedValue(0);
  // True while the gesture is finishing the slide-away; skip the close effect's
  // second withTiming so the sheet does not hitch mid-dismiss.
  const dismissFromDrag = useSharedValue(false);

  const close = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  // Drag anywhere on the sheet (not only the grabber). activeOffsetY waits for a clear
  // downward pull; failOffsetY lets nested ScrollViews keep upward / content scrolling.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!busy)
        .activeOffsetY(10)
        .failOffsetY(-10)
        .failOffsetX([-28, 28])
        .onBegin(() => {
          dismissFromDrag.value = false;
          dragStartY.value = translateY.value;
        })
        .onUpdate((event) => {
          // Follow the finger 1:1 downward only — never rubber-band above the rest pose.
          const next = Math.max(0, dragStartY.value + event.translationY);
          translateY.value = next;
          scrimOpacity.value = 1 - Math.min(next / height, 1);
        })
        .onEnd((event) => {
          const dragged = translateY.value;
          const shouldClose = dragged > height * 0.18 || event.velocityY > 900;
          if (shouldClose) {
            dismissFromDrag.value = true;
            const distance = Math.max(height - dragged, 1);
            const velocity = Math.max(event.velocityY, 400);
            const duration = Math.min(280, Math.max(160, (distance / velocity) * 1000));
            translateY.value = withTiming(
              height,
              { duration, easing: SLIDE.easing },
              (finished) => {
                if (finished) runOnJS(close)();
              }
            );
            scrimOpacity.value = withTiming(0, { duration, easing: SLIDE.easing });
            return;
          }
          translateY.value = withSpring(0, SNAP);
          scrimOpacity.value = withSpring(1, SNAP);
        }),
    [busy, close, dismissFromDrag, dragStartY, height, scrimOpacity, translateY]
  );

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;
    const hide = () => {
      if (visibleRef.current) return;
      setMounted(false);
      const notify = onDismissedRef.current;
      if (notify) setTimeout(notify, 50);
    };
    if (visible) {
      dismissFromDrag.value = false;
      translateY.value = height;
      scrimOpacity.value = 0;
      translateY.value = withTiming(0, instant ? { duration: 0 } : SLIDE);
      scrimOpacity.value = withTiming(1, instant ? { duration: 0 } : SLIDE);
      return;
    }
    if (dismissFromDrag.value) {
      // Gesture already slid the sheet off-screen; just unmount after a beat.
      dismissFromDrag.value = false;
      const t = setTimeout(hide, instant ? 0 : 40);
      return () => clearTimeout(t);
    }
    translateY.value = withTiming(height, instant ? { duration: 0 } : SLIDE, (finished) => {
      if (finished) runOnJS(hide)();
    });
    scrimOpacity.value = withTiming(0, instant ? { duration: 0 } : SLIDE);
  }, [visible, mounted, height, instant, translateY, scrimOpacity, dismissFromDrag]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOpacity.value }));
  const panelMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  // Callers still pass a scrim class. The backdrop colour is a style, because that class does not paint inside the modal.
  void scrimClassName;
  // Never let caller styles replace the full-screen hit target (that broke overlay dismiss).
  const { style: scrimStyleProp, ...restScrimProps } = scrimProps ?? {};

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <GestureHandlerRootView style={styles.root}>
        {/*
          Full-screen blur + dark tint, faded in and out with the sheet (same opacity value the
          slide and drag-to-close drive). A caller's own `backdrop` (e.g. the AI sheets' blur)
          replaces the default blur and fades the same way, so there is never a double blur.
        */}
        <Animated.View pointerEvents="none" style={[styles.fill, scrimStyle]}>
          {backdrop ?? (
            <BlurView intensity={40} tint="dark" blurMethod="dimezisBlurView" style={styles.fill} />
          )}
          <View style={[styles.fill, styles.dim]} />
        </Animated.View>
        <Pressable
          style={[styles.fill, scrimStyleProp]}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          {...restScrimProps}
        />
        <GestureDetector gesture={pan}>
          <Animated.View
            className={panelClassName}
            {...panelProps}
            style={[styles.sheet, panelStyle, panelMotion]}
          >
            {showGrabber ? <SheetGrabber /> : null}
            {children}
          </Animated.View>
        </GestureDetector>
        {overlay ? (
          <View style={styles.fill} pointerEvents="box-none">
            {overlay}
          </View>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor: '#F6F7F7',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
  },
});
