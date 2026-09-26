import { memo, useMemo } from 'react';
import { Image, ImageSourcePropType, PixelRatio, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import images from '@/src/constants/images';
import { QrErrorCorrection, buildBrandedQr } from '@/src/lib/brandedQr';

type BrandedQRCodeProps = {
  value: string;
  /** Width/height in px, including the quiet zone and corner frame. */
  size?: number;
  /** Module colour. Keep it dark against `backgroundColor` so scanners can read it. */
  color?: string;
  /** Fill behind the code; match the surface it sits on. */
  backgroundColor?: string;
  /** Centre logo; `null` for a plain code. Defaults to the GatePass mark. */
  logo?: ImageSourcePropType | null;
  /** Diameter of the logo badge as a fraction of the code's width (capped at 0.3). */
  logoRatio?: number;
  logoBackgroundColor?: string;
  /**
   * Logo image size relative to the badge. Defaults suit the bundled Gp mark; for another logo,
   * about 0.7 keeps an unpadded image inside the circle.
   */
  logoScale?: number;
  /** Four corner brackets around the code, as in the GatePass QR design. */
  showFrame?: boolean;
  ecl?: QrErrorCorrection;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * The Gp PNG has transparent padding (the mark reaches 81% of the way to its edge), so drawing it
 * slightly larger than the badge fills ~72% of the badge while keeping the mark inside the circle.
 */
const GP_LOGO_SCALE = 1.08;
/** For other logos, assume no padding. */
const CUSTOM_LOGO_SCALE = 0.7;

/**
 * GatePass-styled QR code: rounded eyes, dot-and-line modules, corner brackets and the GatePass
 * mark set into a cleared centre (not pasted over the modules), at error correction level H.
 */
function BrandedQRCode({
  value,
  size = 234,
  color = '#5B5E61',
  backgroundColor = '#F6F7F7',
  logo = images.logo,
  logoRatio = 0.24,
  logoBackgroundColor = '#FFFFFF',
  logoScale,
  showFrame = true,
  ecl,
  accessibilityLabel = 'QR code',
  testID,
}: BrandedQRCodeProps) {
  const hasLogo = logo != null;
  const pixelRatio = PixelRatio.get();

  const geometry = useMemo(() => {
    try {
      return buildBrandedQr(value, {
        size,
        ecl,
        logoRatio: hasLogo ? logoRatio : 0,
        showFrame,
        pixelRatio,
      });
    } catch (error) {
      console.log('Could not render QR code', error);
      return null;
    }
  }, [value, size, ecl, hasLogo, logoRatio, showFrame, pixelRatio]);

  if (!geometry) return null;

  const {
    cell,
    dataPath,
    finderRings,
    finderEyes,
    framePath,
    frameStrokeWidth,
    logo: badge,
  } = geometry;
  const scale = logoScale ?? (logo === images.logo ? GP_LOGO_SCALE : CUSTOM_LOGO_SCALE);
  const logoSize = badge ? badge.radius * 2 * scale : 0;

  return (
    <View
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect x={0} y={0} width={size} height={size} fill={backgroundColor} />

        {framePath && (
          <Path
            d={framePath}
            fill="none"
            stroke={color}
            strokeWidth={frameStrokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {finderRings.map((ring) => (
          <Rect
            key={`ring-${ring.x}-${ring.y}`}
            x={ring.x}
            y={ring.y}
            width={ring.size}
            height={ring.size}
            rx={ring.radius}
            ry={ring.radius}
            fill="none"
            stroke={color}
            strokeWidth={cell}
          />
        ))}

        {finderEyes.map((eye) => (
          <Rect
            key={`eye-${eye.x}-${eye.y}`}
            x={eye.x}
            y={eye.y}
            width={eye.size}
            height={eye.size}
            rx={eye.radius}
            ry={eye.radius}
            fill={color}
          />
        ))}

        <Path d={dataPath} fill={color} />

        {badge && (
          <Circle cx={badge.cx} cy={badge.cy} r={badge.radius} fill={logoBackgroundColor} />
        )}
      </Svg>

      {badge && logo != null && (
        <Image
          source={logo}
          resizeMode="contain"
          style={{
            position: 'absolute',
            left: badge.cx - logoSize / 2,
            top: badge.cy - logoSize / 2,
            width: logoSize,
            height: logoSize,
          }}
        />
      )}
    </View>
  );
}

export default memo(BrandedQRCode);
