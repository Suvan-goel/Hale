import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MovementSafetyProfile } from '../adherence';
import {
  Card,
  PrimaryButton,
  Screen,
  SectionHeader,
  SettingsIconButton,
  StatusBadge,
} from '../components/ui';
import {
  getEquipmentSetupSummary,
  getExtraSessionCards,
  getLearnCards,
  getMovementLadderCards,
} from '../haleFlow';
import type { AppSettings } from '../profile';
import type { EquipmentProfile, LadderProgress } from '../training';
import { colors, fonts, radius, spacing, type } from '../theme';

export function ExploreScreen({
  equipment,
  safetyProfile,
  settings,
  ladderProgressById,
  onStartExtraSession,
  onOpenLadder,
  onOpenLearn,
  onOpenSettings,
}: {
  equipment: EquipmentProfile;
  safetyProfile?: MovementSafetyProfile | null;
  settings: AppSettings;
  ladderProgressById: Record<string, LadderProgress>;
  onStartExtraSession: (presetId: string) => void;
  onOpenLadder: (ladderId: string) => void;
  onOpenLearn: (articleId: string) => void;
  onOpenSettings: () => void;
}) {
  const extraSessions = React.useMemo(
    () => getExtraSessionCards({ equipment, safetyProfile, ladderProgressById }),
    [equipment, ladderProgressById, safetyProfile]
  );
  const ladders = React.useMemo(
    () => getMovementLadderCards({ ladderProgressById }),
    [ladderProgressById]
  );
  const learnCards = React.useMemo(() => getLearnCards(), []);
  const equipmentSummary = React.useMemo(
    () => getEquipmentSetupSummary({ equipment, safetyProfile, settings }),
    [equipment, safetyProfile, settings]
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Explore</Text>
          <Text style={styles.subtitle}>
            Optional practice and short guides. Today is still the place to press Start.
          </Text>
        </View>
        <SettingsIconButton onPress={onOpenSettings} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Extra Sessions" />
        <Text style={styles.sectionBody}>Focused sessions for reset days, restarts, or a little extra practice.</Text>
        <View style={styles.grid}>
          {extraSessions.map((session) => (
            <ExtraSessionTile
              key={session.id}
              title={session.title}
              body={session.body}
              durationLabel={session.durationLabel}
              focusLabel={session.focusLabel}
              equipmentLabel={session.equipmentLabel}
              disabled={session.disabled}
              disabledReason={session.disabledReason}
              onStart={() => onStartExtraSession(session.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Movement Ladders" />
        <Text style={styles.sectionBody}>See your current level and how Hale progresses each movement.</Text>
        <View style={styles.grid}>
          {ladders.map((ladder) => (
            <LadderTile
              key={ladder.id}
              title={ladder.title}
              body={ladder.body}
              currentLevelName={ladder.currentLevelName}
              domainLabel={ladder.domainLabel}
              equipmentLabel={ladder.equipmentLabel}
              measurementLabel={ladder.measurementLabel}
              onOpen={() => onOpenLadder(ladder.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Learn" />
        <View style={styles.list}>
          {learnCards.map((article) => (
            <LearnTile
              key={article.id}
              title={article.title}
              body={article.body}
              readTimeLabel={article.readTimeLabel}
              onOpen={() => onOpenLearn(article.id)}
            />
          ))}
        </View>
      </View>

      <Card>
        <View style={styles.equipmentHead}>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Equipment setup</Text>
            <Text style={styles.sectionBody}>Available: {equipmentSummary.availableLabel}.</Text>
            <Text style={styles.sectionBody}>Not marked: {equipmentSummary.missingOptionalLabel}.</Text>
            <Text style={styles.sectionBody}>{equipmentSummary.phoneStandLabel}.</Text>
          </View>
          <StatusBadge label="On device" tone="gold" />
        </View>
        <View style={styles.actionWrap}>
          <PrimaryButton title="Open equipment settings" onPress={onOpenSettings} />
        </View>
      </Card>
    </Screen>
  );
}

function ExtraSessionTile({
  title,
  body,
  durationLabel,
  focusLabel,
  equipmentLabel,
  disabled,
  disabledReason,
  onStart,
}: {
  title: string;
  body: string;
  durationLabel: string;
  focusLabel: string;
  equipmentLabel: string;
  disabled: boolean;
  disabledReason?: string;
  onStart: () => void;
}) {
  return (
    <View style={[styles.tile, disabled && styles.tileDisabled]}>
      <View style={styles.tileCopy}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileBody}>{body}</Text>
      </View>
      <View style={styles.badgeRow}>
        <StatusBadge label={durationLabel} tone="gold" />
        <StatusBadge label={focusLabel} tone="neutral" />
      </View>
      <Text style={styles.tileMeta}>{equipmentLabel}</Text>
      {disabled ? (
        <View style={styles.disabledAction}>
          <Text style={styles.disabledText}>{disabledReason}</Text>
        </View>
      ) : (
        <SmallAction label="Start" accessibilityLabel={`Start ${title}`} onPress={onStart} />
      )}
    </View>
  );
}

function LadderTile({
  title,
  body,
  currentLevelName,
  domainLabel,
  equipmentLabel,
  measurementLabel,
  onOpen,
}: {
  title: string;
  body: string;
  currentLevelName: string;
  domainLabel: string;
  equipmentLabel: string;
  measurementLabel: string;
  onOpen: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${title} ladder`}
    >
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileBody}>{body}</Text>
      <View style={styles.badgeRow}>
        <StatusBadge label={domainLabel} tone="neutral" />
        <StatusBadge label={measurementLabel} tone="gold" />
      </View>
      <Text style={styles.tileMeta}>Current: {currentLevelName}</Text>
      <Text style={styles.tileMeta}>Equipment: {equipmentLabel}</Text>
    </Pressable>
  );
}

function LearnTile({
  title,
  body,
  readTimeLabel,
  onOpen,
}: {
  title: string;
  body: string;
  readTimeLabel: string;
  onOpen: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.learnRow, pressed && styles.pressed]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.learnCopy}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileBody}>{body}</Text>
      </View>
      <StatusBadge label={readTimeLabel} tone="gold" />
    </Pressable>
  );
}

function SmallAction({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={styles.smallActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1 },
  title: { ...type.display },
  subtitle: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm },
  section: { gap: spacing.sm },
  sectionBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.lg },
  list: { gap: spacing.md, marginTop: spacing.lg },
  tile: {
    minHeight: 178,
    minWidth: 168,
    flexGrow: 1,
    flexBasis: '45%',
    padding: spacing.lg,
    borderRadius: radius.input,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
  },
  tileDisabled: { opacity: 0.72 },
  tileCopy: { flex: 1 },
  tileTitle: { ...type.h3 },
  tileBody: { ...type.caption, marginTop: spacing.xs },
  tileMeta: { ...type.caption, color: colors.textSecondary },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  smallAction: {
    minHeight: 42,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
  },
  smallActionText: { ...type.button, fontFamily: fonts.sansMedium },
  disabledAction: {
    minHeight: 42,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  disabledText: { ...type.caption, color: colors.textSecondary, textAlign: 'center' },
  learnRow: {
    minHeight: 94,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.input,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  learnCopy: { flex: 1 },
  equipmentHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { ...type.h2 },
  actionWrap: { marginTop: spacing.lg },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
