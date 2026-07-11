import * as React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { colors } from '../theme';

/** Spotify-like true-black everyday canvas; active sessions keep their separate focus canvas. */
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
      <Rect width="100%" height="100%" fill={colors.bgBase} />
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
