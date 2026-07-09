import * as React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { colors } from '../theme';

/** Fixed everyday canvas; active sessions use the solid focus canvas instead. */
export function AppBackground() {
  return (
    <Svg
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={styles.canvas}
    >
      <Defs>
        <LinearGradient id="appBackgroundGradient" x1="0%" y1="0%" x2="18%" y2="100%">
          <Stop offset="0%" stopColor={colors.bgGradientStart} />
          <Stop offset="18%" stopColor={colors.bgGradientWarm} />
          <Stop offset="52%" stopColor={colors.bgGradientMid} />
          <Stop offset="100%" stopColor={colors.bgGradientEnd} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#appBackgroundGradient)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});
