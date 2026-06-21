import * as React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../theme';

export function BackArrowButton({
  accessibilityLabel = 'Back',
  color = colors.accentDeep,
  onPress,
  style,
}: {
  accessibilityLabel?: string;
  color?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 10, right: 16, bottom: 10, left: 12 }}
    >
      <Svg width={9} height={17} viewBox="0 0 8 16" accessibilityElementsHidden>
        <Path
          d="M7 1L1 8L7 15"
          fill="none"
          stroke={color}
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 9,
    height: 24,
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
