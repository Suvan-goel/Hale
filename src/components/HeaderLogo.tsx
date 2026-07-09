import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

import { colors } from '../theme';

const PEARL_LOGO_MARK = require('../../assets/pearl-logo-mark.png');

export function HeaderLogo({
  size = 34,
  style,
}: {
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={PEARL_LOGO_MARK}
      style={[styles.logo, { width: size, height: size }, style]}
      resizeMode="contain"
      accessible={false}
      accessibilityIgnoresInvertColors
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    flexShrink: 0,
    tintColor: colors.accentDeep,
  },
});
