import { useId } from 'react';
import Svg, { Defs, Ellipse, G, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';

/** Vector frost drawn from the ice overlay: scratches, haze, fade to the right. */
export default function FrozenIceOverlay() {
  const uid = useId().replace(/:/g, '');
  const veil = `${uid}-veil`;
  const fade = `${uid}-fade`;
  const mask = `${uid}-mask`;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 339 95"
      preserveAspectRatio="none"
      pointerEvents="none"
    >
      <Defs>
        <LinearGradient id={veil} x1="0.05" y1="0.2" x2="0.95" y2="0.85">
          <Stop offset="0" stopColor="#F1F8FB" stopOpacity="0.42" />
          <Stop offset="0.38" stopColor="#D7EEF8" stopOpacity="0.28" />
          <Stop offset="0.72" stopColor="#A9D4F0" stopOpacity="0.1" />
          <Stop offset="1" stopColor="#70B1EE" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id={fade} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#fff" stopOpacity="1" />
          <Stop offset="0.55" stopColor="#fff" stopOpacity="0.7" />
          <Stop offset="0.82" stopColor="#fff" stopOpacity="0.22" />
          <Stop offset="1" stopColor="#fff" stopOpacity="0" />
        </LinearGradient>
        <Mask id={mask}>
          <Rect width="339" height="95" fill={`url(#${fade})`} />
        </Mask>
      </Defs>

      <Rect width="339" height="95" fill={`url(#${veil})`} />

      <G opacity="0.55">
        <Ellipse cx="78" cy="40" rx="96" ry="52" fill="#F1F8FB" fillOpacity="0.22" />
        <Ellipse cx="28" cy="18" rx="54" ry="28" fill="#FFFFFF" fillOpacity="0.18" />
        <Ellipse cx="160" cy="70" rx="70" ry="30" fill="#E6F2FF" fillOpacity="0.12" />
      </G>

      <G
        stroke="#F1F8FB"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.55"
        mask={`url(#${mask})`}
      >
        <Path d="M12 18 L48 8 L92 22 L128 6" strokeWidth="0.7" />
        <Path d="M8 42 L54 30 L96 48 L150 28 L198 44" strokeWidth="0.55" />
        <Path d="M22 72 L70 58 L118 78 L176 60" strokeWidth="0.5" />
        <Path d="M36 6 L44 40 L28 78" strokeWidth="0.45" />
        <Path d="M68 4 L78 52 L62 92" strokeWidth="0.4" />
        <Path d="M110 10 L102 48 L124 88" strokeWidth="0.45" />
        <Path d="M148 2 L162 46 L140 90" strokeWidth="0.4" />
        <Path d="M18 28 L86 18 L154 36" strokeWidth="0.35" />
        <Path d="M40 54 L112 42 L186 62" strokeWidth="0.35" />
        <Path d="M6 60 L62 70 L108 52 L168 74" strokeWidth="0.4" />
        <Path d="M84 8 L90 36 L118 30 L126 58" strokeWidth="0.35" />
        <Path d="M170 16 L214 8 L258 26" strokeWidth="0.3" opacity="0.7" />
        <Path d="M188 50 L236 38 L280 58" strokeWidth="0.28" opacity="0.55" />
        <Path d="M200 78 L248 66 L300 80" strokeWidth="0.25" opacity="0.4" />
        <Path d="M52 22 L58 8 M58 8 L72 16 M58 8 L50 14" strokeWidth="0.5" />
        <Path d="M98 36 L108 20 M108 20 L122 28 M108 20 L100 14" strokeWidth="0.45" />
        <Path d="M132 64 L146 48 M146 48 L160 58 M146 48 L138 42" strokeWidth="0.4" />
      </G>

      <G fill="#F1F8FB" fillOpacity="0.14" mask={`url(#${mask})`}>
        <Path d="M24 12 L42 6 L38 28 Z" />
        <Path d="M88 48 L108 36 L102 62 Z" />
        <Path d="M156 20 L176 12 L170 38 Z" />
        <Path d="M64 70 L82 62 L76 88 Z" />
      </G>
    </Svg>
  );
}
