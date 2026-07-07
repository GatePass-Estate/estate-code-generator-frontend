import images from '@/src/constants/images';
import { useEffect, useMemo, useState } from 'react';
import { Image, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DEFAULT_MIN_DISPLAY_MS = 1500;

const BACKGROUND_COLOR = '#113E55';

type SplashScreenProps = {
  /** App-level bootstrap readiness (e.g. fonts loaded). */
  ready?: boolean;
  /** Minimum time the splash should remain visible. */
  minDisplayMs?: number;
  /** Called once both `ready` is true and the minimum display time has elapsed. */
  onAnimationComplete?: () => void;
};

/**
 * Custom brand splash screen.
 *
 * Renders a full-screen GatePass-branded loading view with a scalable SVG
 * logo mark. It enforces a minimum display duration so the splash never
 * flashes on fast devices, and calls `onAnimationComplete` when it is safe to
 * swap to the real app layout.
 */
export function SplashScreen({
  ready = false,
  minDisplayMs = DEFAULT_MIN_DISPLAY_MS,
  onAnimationComplete,
}: SplashScreenProps) {
  const [minElapsed, setMinElapsed] = useState(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), minDisplayMs);
    return () => clearTimeout(timer);
  }, [minDisplayMs]);

  useEffect(() => {
    if (ready && minElapsed) {
      onAnimationComplete?.();
    }
  }, [ready, minElapsed, onAnimationComplete]);

  const logoSize = useMemo(() => {
    const minDimension = Math.min(width, height);
    // Use ~35 % of the shorter screen edge, capped for very large screens.
    return Math.min(Math.round(minDimension * 0.35), 220);
  }, [width, height]);

  const bottomPadding = Math.max(insets.bottom, 40);

  return (
    <View
      style={{ flex: 1, backgroundColor: BACKGROUND_COLOR }}
      className="items-center justify-center"
      accessibilityRole="progressbar"
      accessibilityLabel="GatePass is loading"
    >
      <View
        className="items-center justify-center"
        style={{ flex: 1 }}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Image source={images.whiteLogo} width={100} height={40} resizeMode="contain" />
      </View>

      <View
        className="items-center px-8 mb-20"
        style={{ paddingBottom: bottomPadding, paddingTop: 16 }}
        accessible
        accessibilityLabel="Gate Pass. For Smart Access Management."
      >
        <Image source={images.whiteLogoText} width={40} height={10} resizeMode="contain" />
        <Text className="text-lg text-white font-ubuntu-regular">For Smart Access Management</Text>
      </View>
    </View>
  );
}
