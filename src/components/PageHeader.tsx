import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { MenuIcon } from '../navigation/icons';
import { colors, fonts, radius, spacing } from '../theme';
import { BackArrowButton } from './BackArrowButton';
import { PearlBrandMark } from './PearlBrandMark';

/**
 * Pearl's shared top navigation treatment. Every page names itself; nested
 * pages replace the Pearl mark with Back while keeping the title in place.
 */
export function PageHeader({
  title,
  onBack,
  backAccessibilityLabel = 'Back',
  onOpenSettings,
  brandMarkSize = 30,
  style,
}: {
  title: string;
  onBack?: () => void;
  backAccessibilityLabel?: string;
  onOpenSettings?: () => void;
  brandMarkSize?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.titleRow}>
        {onBack ? (
          <BackArrowButton accessibilityLabel={backAccessibilityLabel} onPress={onBack} />
        ) : (
          <PearlBrandMark size={brandMarkSize} />
        )}
        <Text
          style={styles.title}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {title}
        </Text>
      </View>

      {onOpenSettings ? (
        <Pressable
          style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <MenuIcon size={24} color={colors.textPrimary} strokeWidth={1.55} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontFamily: fonts.sansRegular,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0.4,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
});
