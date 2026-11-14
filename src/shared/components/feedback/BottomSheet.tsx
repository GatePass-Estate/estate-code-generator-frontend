import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Modal,
  Platform,
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
import { NavigationBar as AndroidNavigationBar } from 'expo-navigation-bar';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  /** Plain or Reanimated styles (e.g. animated height on household search). */
  panelStyle?: StyleProp<ViewStyle> | object;
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
  /**
   * When false, overlay tap, drag-to-dismiss, and Android back do not close the sheet —
   * a child control must call onClose (e.g. Data Insight "I understand"). Default true.
   */
  dismissible?: boolean;
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
 * anywhere on the sheet. On Android the system nav is hidden while open and the panel
 * always clears a safe bottom inset so Confirm / Done are never under the nav bar.
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
  dismissible = true,
  animationType = 'slide',
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  // Translucent modals often report insets.bottom as 0 on Android — keep a floor so
  // every sheet clears the 3-button / gesture nav without each caller re-learning it.
  const minBottomPad = Platform.OS === 'android' ? Math.max(insets.bottom, 48) : insets.bottom;
  const translateY = useSharedValue(height);
  const scrimOpacity = useSharedValue(0);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const onDismissedRef = useRef(onDismissed);
  onDismissedRef.current = onDismissed;
  // Track open/close edges only — window height often changes when Android nav hides,
  // and that must not restart the enter animation (looked like the sheet opening twice).
  const wasOpenRef = useRef(false);
  const heightRef = useRef(height);
  heightRef.current = height;
  const instant = animationType === 'none';
  const dragStartY = useSharedValue(0);
  // True while the gesture is finishing the slide-away; skip the close effect's
  // second withTiming so the sheet does not hitch mid-dismiss.
  const dismissFromDrag = useSharedValue(false);
  const canDismiss = dismissible && !busy;

  const close = useCallback(() => {
    if (canDismiss) onClose();
  }, [canDismiss, onClose]);

  // Drag anywhere on the sheet (not only the grabber). activeOffsetY waits for a clear
  // downward pull; failOffsetY lets nested ScrollViews keep upward / content scrolling.
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(canDismiss)
        .activeOffsetY(10)
        .failOffsetY(-10)
        .failOffsetX([-28, 28])
        .onBegin(() => {
          dismissFromDrag.value = false;
          dragStartY.value = translateY.value;
        })
        .onUpdate((event) => {
          // Follow the finger 1:1 downward only — never rubber-band above the rest pose.
          const h = heightRef.current;
          const next = Math.max(0, dragStartY.value + event.translationY);
          translateY.value = next;
          scrimOpacity.value = 1 - Math.min(next / h, 1);
        })
        .onEnd((event) => {
          const h = heightRef.current;
          const dragged = translateY.value;
          const shouldClose = dragged > h * 0.18 || event.velocityY > 900;
          if (shouldClose) {
            dismissFromDrag.value = true;
            const distance = Math.max(h - dragged, 1);
            const velocity = Math.max(event.velocityY, 400);
            const duration = Math.min(280, Math.max(160, (distance / velocity) * 1000));
            translateY.value = withTiming(h, { duration, easing: SLIDE.easing }, (finished) => {
              if (finished) runOnJS(close)();
            });
            scrimOpacity.value = withTiming(0, { duration, easing: SLIDE.easing });
            return;
          }
          translateY.value = withSpring(0, SNAP);
          scrimOpacity.value = withSpring(1, SNAP);
        }),
    [canDismiss, close, dismissFromDrag, dragStartY, scrimOpacity, translateY]
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

    const opening = visible && !wasOpenRef.current;
    const closing = !visible && wasOpenRef.current;

    if (opening) {
      wasOpenRef.current = true;
      dismissFromDrag.value = false;
      const h = heightRef.current;
      translateY.value = h;
      scrimOpacity.value = 0;
      translateY.value = withTiming(0, instant ? { duration: 0 } : SLIDE);
      scrimOpacity.value = withTiming(1, instant ? { duration: 0 } : SLIDE);
      return;
    }

    if (!closing) return;

    wasOpenRef.current = false;
    if (dismissFromDrag.value) {
      // Gesture already slid the sheet off-screen; just unmount after a beat.
      dismissFromDrag.value = false;
      const t = setTimeout(hide, instant ? 0 : 40);
      return () => clearTimeout(t);
    }
    const h = heightRef.current;
    translateY.value = withTiming(h, instant ? { duration: 0 } : SLIDE, (finished) => {
      if (finished) runOnJS(hide)();
    });
    scrimOpacity.value = withTiming(0, instant ? { duration: 0 } : SLIDE);
  }, [visible, mounted, instant, translateY, scrimOpacity, dismissFromDrag]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOpacity.value }));
  const panelMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  // Callers still pass a scrim class. The backdrop colour is a style, because that class does not paint inside the modal.
  void scrimClassName;
  // Never let caller styles replace the full-screen hit target (that broke overlay dismiss).
  const { style: scrimStyleProp, ...restScrimProps } = scrimProps ?? {};
  // Only read paddingBottom from plain style objects — animated handles are not flattenable.
  const callerBottomPad = (() => {
    const entries = Array.isArray(panelStyle) ? panelStyle : panelStyle ? [panelStyle] : [];
    let pad = 0;
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      if ('viewDescriptors' in entry || 'styleId' in entry) continue;
      const pb = (entry as ViewStyle).paddingBottom;
      if (typeof pb === 'number') pad = Math.max(pad, pb);
    }
    return pad;
  })();
  const panelBottomPad = Math.max(callerBottomPad, minBottomPad);
  const scrimViewStyle = StyleSheet.flatten(
    typeof scrimStyleProp === 'function' ? undefined : scrimStyleProp
  );

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      // Non-dismissible sheets (e.g. Data Insight) ignore Android back — only an
      // in-sheet action like "I understand" may call onClose.
      onRequestClose={canDismiss ? close : undefined}
    >
      {/* Hide the system nav while any sheet is open so it cannot cover Confirm / Done. */}
      {Platform.OS === 'android' ? <AndroidNavigationBar hidden /> : null}
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
        {canDismiss ? (
          <Pressable
            style={[styles.fill, scrimViewStyle]}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            {...restScrimProps}
          />
        ) : (
          // Swallow outside taps — do not wire onPress to onClose.
          <View style={[styles.fill, scrimViewStyle]} />
        )}
        <GestureDetector gesture={pan}>
          <Animated.View
            className={panelClassName}
            {...panelProps}
            style={[
              styles.sheet,
              panelStyle as StyleProp<ViewStyle>,
              { paddingBottom: panelBottomPad },
              panelMotion,
            ]}
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
