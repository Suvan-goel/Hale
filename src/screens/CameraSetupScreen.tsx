import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';
import { useResponsiveLayout } from '../theme/responsive';

const SETUP_HERO_IMAGE = require('../../assets/images/hale-camera-setup-hero-v4.png');

const SETUP_STEPS = [
  'Set your phone somewhere steady. A shelf, table, phone stand, wall, or sturdy bottle is fine.',
  'Stand about 2 to 3 meters away, with your whole body in view.',
  'Turn your volume up so you can hear Hale.',
  'Keep your chair and a wall or counter nearby.',
  'Turn on the main light if the room is dim.',
  'Use this same spot for future check-ups when you can.',
] as const;

export function CameraSetupScreen({
  permissionGranted,
  onRequestPermission,
  onBegin,
  showBeginAction = true,
  onDoLater,
  onDevCompleteCheckup,
  onCancel,
}: {
  permissionGranted: boolean;
  onRequestPermission: () => void;
  onBegin: () => void;
  showBeginAction?: boolean;
  onDoLater?: () => void;
  onDevCompleteCheckup?: () => void;
  onCancel: () => void;
}) {
  const responsive = useResponsiveLayout();
  const showPrimaryAction = !permissionGranted || showBeginAction;
  const showActions = showPrimaryAction || !!onDevCompleteCheckup || !!onDoLater;

  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <ScreenHeader
        eyebrow="Camera and audio"
        title="Set up your phone"
        subtitle="Place your phone so Hale can see your full body and guide you clearly."
      />

      <View style={styles.setupImageCard}>
        <Image
          source={SETUP_HERO_IMAGE}
          style={styles.setupImage}
          resizeMode="contain"
          accessible={false}
          accessibilityIgnoresInvertColors
        />
      </View>

      <SetupSection
        title="Before you begin"
        meta={permissionGranted ? 'Camera ready' : 'Permission needed'}
      >
        <View style={styles.stepList}>
          {SETUP_STEPS.map((step, index) => (
            <SetupItem key={step} n={index + 1} text={step} />
          ))}
        </View>
      </SetupSection>

      <View style={[styles.expectCard, responsive.isCompactPhone && styles.compactCardPadding]}>
        <View style={styles.expectMark}>
          <Text style={styles.expectMarkText}>Go</Text>
        </View>
        <View style={styles.expectCopy}>
          <Text style={styles.expectTitle}>What to expect</Text>
          <Text style={styles.expectBody}>
            When Hale can see you clearly, the check-up will start. You will hear when to move, rest, and continue.
          </Text>
        </View>
      </View>

      {showActions ? (
        <View style={styles.actions}>
          {showPrimaryAction ? (
            permissionGranted ? (
              <PrimaryButton title="Start check-up" onPress={onBegin} />
            ) : (
              <PrimaryButton title="Allow camera" onPress={onRequestPermission} />
            )
          ) : null}
          {onDevCompleteCheckup ? (
            <SecondaryButton title="Dev: use sample check-up" onPress={onDevCompleteCheckup} />
          ) : null}
          {onDoLater ? <SecondaryButton title="Do this later" onPress={onDoLater} /> : null}
        </View>
      ) : null}
    </Screen>
  );
}

function SetupSection({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  const responsive = useResponsiveLayout();
  return (
    <View style={[styles.sectionCard, responsive.isCompactPhone && styles.compactCardPadding]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionMetaPill}>
          <Text style={styles.sectionMetaText}>{meta}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function SetupItem({ n, text }: { n: number; text: string }) {
  const responsive = useResponsiveLayout();
  return (
    <View style={[styles.step, responsive.isCompactPhone && styles.compactCardPadding]}>
      <View style={styles.stepMark}>
        <Text style={styles.stepMarkText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  setupImageCard: {
    aspectRatio: 16 / 9,
    overflow: 'hidden',
    borderRadius: radius.card,
    backgroundColor: colors.bgMaterial,
    ...shadow.card,
  },
  setupImage: {
    width: '100%',
    height: '100%',
  },
  sectionCard: {
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  compactCardPadding: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  sectionMetaPill: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.bgGold,
  },
  sectionMetaText: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    lineHeight: 16,
  },
  stepList: {
    gap: spacing.sm,
  },
  step: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  stepMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
  },
  stepMarkText: {
    ...type.cardCaption,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  stepText: {
    ...type.bodySmall,
    flex: 1,
    minWidth: 0,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  expectCard: {
    minHeight: 136,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    borderRadius: radius.card,
    backgroundColor: colors.bgSurface,
    ...shadow.card,
  },
  expectMark: {
    minWidth: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.bgGold,
  },
  expectMarkText: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
  },
  expectCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
  },
  expectTitle: {
    fontFamily: fonts.serifMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    color: colors.textPrimary,
  },
  expectBody: {
    ...type.bodySmall,
    color: colors.textSecondary,
  },
  actions: { gap: spacing.md },
});
