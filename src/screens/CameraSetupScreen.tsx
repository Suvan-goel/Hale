import * as React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const SETUP_HERO_IMAGE = require('../../assets/images/hale-camera-setup-hero-v4.png');

const SETUP_STEPS = [
  'Prop your phone at about hip height.',
  'Stand 2.5-3 m away with your full body visible.',
  'Turn your volume up so Hale can guide you.',
  'Use a stable chair and keep a wall or counter nearby.',
  'Turn on the main light if the room feels dim.',
  'Use this same spot for future check-ups when you can.',
] as const;

export function CameraSetupScreen({
  permissionGranted,
  onRequestPermission,
  onBegin,
  onDevSkipCheckUp,
  onCancel,
}: {
  permissionGranted: boolean;
  onRequestPermission: () => void;
  onBegin: () => void;
  onDevSkipCheckUp?: () => void;
  onCancel: () => void;
}) {
  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onCancel} />
      <ScreenHeader
        eyebrow="Camera and audio"
        title="Place your phone"
        subtitle="A steady setup helps Hale keep the check-up calm, clear, and repeatable next month."
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

      <View style={styles.expectCard}>
        <View style={styles.expectMark}>
          <Text style={styles.expectMarkText}>Go</Text>
        </View>
        <View style={styles.expectCopy}>
          <Text style={styles.expectTitle}>What to expect</Text>
          <Text style={styles.expectBody}>
            Hale will auto-start once you are framed, speak short rest cues, and move through the check-up without needing you to hold the phone.
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {permissionGranted ? (
          <PrimaryButton title="Begin Movement Check-Up" onPress={onBegin} />
        ) : (
          <PrimaryButton title="Allow camera" onPress={onRequestPermission} />
        )}
        {onDevSkipCheckUp ? <SecondaryButton title="dev: skip Movement Check-Up" onPress={onDevSkipCheckUp} /> : null}
      </View>
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
  return (
    <View style={styles.sectionCard}>
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
  return (
    <View style={styles.step}>
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
