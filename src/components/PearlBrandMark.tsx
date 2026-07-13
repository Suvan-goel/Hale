import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '../theme';

/** Compact orbital mark used by the editorial Home wordmark. */
export function PearlBrandMark({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 34 34" fill="none" accessibilityElementsHidden>
      <Defs>
        <LinearGradient id="pearlBrandCore" x1="20" y1="20" x2="29" y2="29">
          <Stop offset="0" stopColor="#FFFDF9" />
          <Stop offset="0.56" stopColor="#E4D8C8" />
          <Stop offset="1" stopColor={colors.accentGold} />
        </LinearGradient>
      </Defs>
      <Circle cx="17" cy="17" r="13.4" stroke={colors.accentGold} strokeWidth="1.25" />
      <Path
        d="M8.1 7 A13.4 13.4 0 0 1 30.25 18.5"
        stroke={colors.accentDeep}
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <Circle cx="24.2" cy="24" r="5.1" fill="url(#pearlBrandCore)" />
      <Circle cx="22.7" cy="22.5" r="1.25" fill="#FFFFFF" fillOpacity="0.76" />
    </Svg>
  );
}
