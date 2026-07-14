import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;
const MIN_SCALE = 0.88;
const MAX_PHONE_SCALE = 1.18;
const MAX_TABLET_SCALE = 1.12;

export function useSecurityResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isTabletWidth = width >= 600;
    const maxScale = isTabletWidth ? MAX_TABLET_SCALE : MAX_PHONE_SCALE;
    const rawScale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
    const scale = Math.min(Math.max(rawScale, MIN_SCALE), maxScale);
    const scaledWidth = BASE_WIDTH * scale;
    const scaledHeight = BASE_HEIGHT * scale;

    return {
      scale,
      scaleValue: (value: number) => value * scale,
      frameStyle: {
        alignSelf: 'center' as const,
        height: scaledHeight,
        overflow: 'visible' as const,
        width: scaledWidth,
      },
      canvasStyle: {
        height: BASE_HEIGHT,
        left: (scaledWidth - BASE_WIDTH) / 2,
        position: 'absolute' as const,
        top: (scaledHeight - BASE_HEIGHT) / 2,
        transform: [{ scale }],
        width: BASE_WIDTH,
      },
    };
  }, [height, width]);
}
