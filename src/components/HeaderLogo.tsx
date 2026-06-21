import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';

const HALE_LOGO_MARK = require('../../assets/hale-logo-mark.png');

export function HeaderLogo({
  size = 34,
  style,
}: {
  size?: number;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={HALE_LOGO_MARK}
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
  },
});
