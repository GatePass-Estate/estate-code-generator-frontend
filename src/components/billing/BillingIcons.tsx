import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = { size?: number; color?: string };

/** boxicons `check-circle-filled` (16pt frame in the plan feature lists). */
export function CheckCircleFilledIcon({ size = 16, color = '#113E55' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm-1.999 14.413-3.713-3.705L7.7 11.292l2.299 2.295 5.294-5.294 1.414 1.414-6.706 6.706z"
        fill={color}
      />
    </Svg>
  );
}

/** bootstrap `check-circle` outline — unselected feature on the Custom plan. */
export function CheckCircleOutlineIcon({ size = 16, color = '#9B9797' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" fill={color} />
      <Path
        d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"
        fill={color}
      />
    </Svg>
  );
}

/** garden `lock-locked-stroke-12` — locked (not in plan) feature row. */
export function LockOutlineIcon({ size = 12, color = '#878686' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path d="M3.5 6V3a2 2 0 0 1 4 0v3" stroke={color} strokeWidth={1} strokeLinecap="round" />
      <Rect x={1.5} y={6.5} width={8} height={5} rx={1.5} stroke={color} strokeWidth={1} />
    </Svg>
  );
}
