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
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
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

const SLIDE = { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };

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
 * that swallows taps. The panel slides up and the scrim fades. The handle, padding,
 * and content stay with the caller.
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

  const close = useCallback(() => {
    if (!busy) onClose();
  }, [busy, onClose]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!busy)
        .activeOffsetY(8)
        .failOffsetX([-24, 24])
        .onBegin(() => {
          dragStartY.value = translateY.value;
        })
        .onUpdate((event) => {
          translateY.value = Math.max(0, dragStartY.value + event.translationY);
        })
        .onEnd((event) => {
          const shouldClose = event.translationY > 120 || event.velocityY > 800;
          if (shouldClose) {
            runOnJS(close)();
            return;
          }
          translateY.value = withTiming(0, SLIDE);
        }),
    [busy, close, dragStartY, translateY]
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
      translateY.value = height;
      scrimOpacity.value = 0;
      translateY.value = withTiming(0, instant ? { duration: 0 } : SLIDE);
      scrimOpacity.value = withTiming(1, instant ? { duration: 0 } : SLIDE);
      return;
    }
    translateY.value = withTiming(height, instant ? { duration: 0 } : SLIDE, (finished) => {
      if (finished) runOnJS(hide)();
    });
    scrimOpacity.value = withTiming(0, instant ? { duration: 0 } : SLIDE);
  }, [visible, mounted, height, instant, translateY, scrimOpacity]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimOpacity.value }));
  const panelMotion = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!mounted) return null;

  const scrimStyleProp = scrimProps?.style;
  const scrimAlreadyDimmed =
    !!backdrop ||
    scrimClassName.includes('bg-') ||
    !!StyleSheet.flatten(scrimStyleProp)?.backgroundColor;
  const resolvedScrimClass = scrimAlreadyDimmed ? scrimClassName : `${scrimClassName} bg-black/50`;

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
        {backdrop}
        <Animated.View style={[styles.fill, scrimStyle]} pointerEvents="box-none">
          <Pressable
            style={styles.fill}
            className={resolvedScrimClass}
            onPress={close}
            {...scrimProps}
          />
        </Animated.View>
        {/*
          The spacer above the panel is the outside tap. The top strip is the drag-down handle.
          The panel itself stays a plain View so a ScrollView inside it (the Set Time wheels)
          still receives the drag.
        */}
        <Animated.View style={[styles.dock, panelMotion]} pointerEvents="box-none">
          <Pressable style={styles.dismiss} onPress={close} />
          <View className={panelClassName} style={panelStyle} {...panelProps}>
            <GestureDetector gesture={pan}>
              <View style={styles.handle} />
            </GestureDetector>
            {showGrabber ? <SheetGrabber /> : null}
            {children}
          </View>
        </Animated.View>
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
  fill: StyleSheet.absoluteFillObject,
  dismiss: { flex: 1 },
  handle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    zIndex: 2,
  },
  dock: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});
