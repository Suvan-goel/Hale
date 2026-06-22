import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BackArrowButton } from '../components/BackArrowButton';
import { PrimaryButton, Screen, ScreenHeader, SecondaryButton } from '../components/ui';
import { colors, fonts, radius, shadow, spacing, type } from '../theme';

const CHECKUP_POINTS = [
  {
    title: 'Four short movements',
    body: 'You will do chair stands, balance, shoulder reach, and a bend-and-reach movement.',
  },
  {
    title: "Listen for Hale's voice",
    body: 'Hale tells you when to start, rest, and move on.',
  },
  {
    title: 'No mirror',
    body: 'You will see a simple outline, not a live camera view.',
  },
  {
    title: 'You stay in control',
    body: 'You can pause, stop, or retry if something does not feel right.',
  },
] as const;

const PRIVACY_POINTS = [
  {
    title: 'Saved on this phone',
    body: 'Hale saves your movement results and settings on this device.',
  },
  {
    title: 'No public profile',
    body: 'Hale does not create social feeds, public profiles, or medical labels.',
  },
] as const;

export function CameraExplanationScreen({
  permissionGranted,
  onRequestPermission,
  onContinue,
  onBack,
}: {
  permissionGranted: boolean;
  onRequestPermission: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <Screen>
      <BackArrowButton accessibilityLabel="Back" onPress={onBack} />
      <ScreenHeader
        eyebrow="Camera and audio"
        title="How the check-up works"
        subtitle="Hale talks you through each step. You will not see a live video of yourself."
      />

      <InfoSection
        title="Movement Check-Up"
        meta={permissionGranted ? 'Camera ready' : 'Permission needed'}
        tone={permissionGranted ? 'ready' : 'attention'}
      >
        <View style={styles.pointList}>
          {CHECKUP_POINTS.map((point, index) => (
            <InfoPoint
              key={point.title}
              index={index + 1}
              title={point.title}
              body={point.body}
            />
          ))}
        </View>
      </InfoSection>

      <InfoSection title="Private by design" meta="On this phone">
        <View style={styles.pointList}>
          {PRIVACY_POINTS.map((point, index) => (
            <InfoPoint
              key={point.title}
              index={index + 1}
              title={point.title}
              body={point.body}
            />
          ))}
        </View>
      </InfoSection>

      <View style={styles.actions}>
        {permissionGranted ? (
          <PrimaryButton title="Continue" onPress={onContinue} />
        ) : (
          <PrimaryButton title="Allow camera" onPress={onRequestPermission} />
        )}
        {!permissionGranted ? <SecondaryButton title="Set up phone first" onPress={onContinue} /> : null}
      </View>
    </Screen>
  );
}

function InfoSection({
  title,
  meta,
  tone = 'neutral',
  children,
}: {
  title: string;
  meta: string;
  tone?: 'neutral' | 'ready' | 'attention';
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View
          style={[
            styles.sectionMetaPill,
            tone === 'ready' && styles.sectionMetaPillReady,
            tone === 'attention' && styles.sectionMetaPillAttention,
          ]}
        >
          <Text
            style={[
              styles.sectionMetaText,
              tone === 'ready' && styles.sectionMetaTextReady,
              tone === 'attention' && styles.sectionMetaTextAttention,
            ]}
          >
            {meta}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function InfoPoint({
  index,
  title,
  body,
}: {
  index: number;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.point}>
      <View style={styles.pointMark}>
        <Text style={styles.pointMarkText}>{index}</Text>
      </View>
      <View style={styles.pointCopy}>
        <Text style={styles.pointTitle}>{title}</Text>
        <Text style={styles.pointBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.background,
  },
  sectionMetaPillReady: {
    backgroundColor: colors.bgGold,
  },
  sectionMetaPillAttention: {
    backgroundColor: colors.bgGold,
  },
  sectionMetaText: {
    ...type.cardCaption,
    color: colors.accentDeep,
    fontFamily: fonts.sansMedium,
    lineHeight: 16,
  },
  sectionMetaTextReady: {
    color: colors.accentDeep,
  },
  sectionMetaTextAttention: {
    color: colors.accentDeep,
  },
  pointList: {
    gap: spacing.sm,
  },
  point: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderRadius: radius.input,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background,
  },
  pointMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
  },
  pointMarkText: {
    ...type.cardCaption,
    fontFamily: fonts.sansMedium,
    color: colors.accentDeep,
    fontVariant: ['tabular-nums'],
  },
  pointCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  pointTitle: {
    ...type.bodySmall,
    color: colors.textPrimary,
    fontFamily: fonts.sansMedium,
  },
  pointBody: {
    ...type.caption,
    color: colors.textSecondary,
  },
  actions: { gap: spacing.md },
});
