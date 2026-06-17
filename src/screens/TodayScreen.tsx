import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Card,
  HealthMetricRow,
  MetricRing,
  Screen,
  SectionHeader,
  SettingsIconButton,
} from '../components/ui';
import type {
  HaleAppLifecycleResult,
  MovementSnapshot,
  MovementSnapshotBand,
  TodaySessionAdjustment,
} from '../haleFlow';
import type { UserProfile } from '../profile';
import type { PainArea } from '../training';
import { colors, radius, spacing, type } from '../theme';

type SnapshotKey = keyof MovementSnapshot;

const SNAPSHOT_ROWS: readonly { key: SnapshotKey; icon: string; title: string }[] = [
  { key: 'strengthPower', icon: 'S', title: 'Strength / Power' },
  { key: 'balance', icon: 'B', title: 'Balance' },
  { key: 'mobility', icon: 'M', title: 'Mobility' },
];

const PAIN_AREAS: readonly { label: string; value: PainArea }[] = [
  { label: 'Knee', value: 'knee' },
  { label: 'Hip', value: 'hip' },
  { label: 'Back', value: 'back' },
  { label: 'Shoulder', value: 'shoulder' },
  { label: 'Ankle', value: 'ankle' },
  { label: 'Neck', value: 'neck' },
  { label: 'Other', value: 'other' },
];

export function TodayScreen({
  profile,
  lifecycle,
  onPrimaryAction,
  onOpenSettings,
}: {
  profile: UserProfile;
  lifecycle: HaleAppLifecycleResult;
  onPrimaryAction: (preferences?: { adjustment?: TodaySessionAdjustment | null; painArea?: PainArea | null }) => void;
  onOpenSettings: () => void;
}) {
  const [adjustment, setAdjustment] = React.useState<TodaySessionAdjustment | null>(null);
  const [painArea, setPainArea] = React.useState<PainArea | null>(null);
  const block = lifecycle.activeBlockSummary;
  const snapshot = lifecycle.movementSnapshot;
  const measuredCount = SNAPSHOT_ROWS.filter((row) => snapshot?.[row.key]).length;
  const progress = block
    ? block.sessionsCompleteThisWeek / Math.max(1, block.sessionsTargetThisWeek)
    : measuredCount / SNAPSHOT_ROWS.length;
  const ringValue = block
    ? `${block.sessionsCompleteThisWeek}/${block.sessionsTargetThisWeek}`
    : `${measuredCount}/${SNAPSHOT_ROWS.length}`;
  const ringLabel = block ? 'this week' : 'domains';
  const canAdjustSession =
    lifecycle.state === 'first_session_ready' ||
    lifecycle.state === 'normal_training_day' ||
    lifecycle.state === 'inactive_restart' ||
    lifecycle.state === 'week_complete';
  const selectedPainArea = adjustment === 'something_hurts' ? painArea : null;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.greeting}>
            {greeting()}
            {profile.name ? `, ${profile.name}` : ''}
          </Text>
          <Text style={styles.tagline}>Hale knows what you need today. Press Start and listen.</Text>
        </View>
        <SettingsIconButton onPress={onOpenSettings} />
      </View>

      <Card style={styles.progressCard}>
        <View style={styles.progressHead}>
          <SectionHeader title="Daily Progress" />
          <Text style={styles.progressMeta}>{block ? block.focusTitle : 'Movement baseline'}</Text>
        </View>
        <View style={styles.progressBody}>
          <MetricRing size={118} progress={progress} value={ringValue} label={ringLabel} />
          <View style={styles.progressRows}>
            <MiniProgressRow label="Strength" value={snapshot?.strengthPower ? bandValue(snapshot.strengthPower) : 'Pending'} />
            <MiniProgressRow label="Balance" value={snapshot?.balance ? bandValue(snapshot.balance) : 'Pending'} />
            <MiniProgressRow label="Mobility" value={snapshot?.mobility ? bandValue(snapshot.mobility) : 'Pending'} />
          </View>
        </View>
      </Card>

      <View style={styles.featureCard}>
        <View style={styles.featureGlow} />
        <View style={styles.primaryCopy}>
          <Text style={styles.featureEyebrow}>Today’s movement session</Text>
          <Text style={styles.featureTitle}>{lifecycle.primaryAction.title}</Text>
          <Text style={styles.featureBody}>{lifecycle.primaryAction.subtitle}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.featureButton, pressed && styles.pressed]}
          onPress={() => onPrimaryAction({ adjustment, painArea: selectedPainArea })}
          accessibilityRole="button"
          accessibilityLabel={lifecycle.primaryAction.ctaLabel}
        >
          <Text style={styles.featureButtonText}>{lifecycle.primaryAction.ctaLabel}</Text>
        </Pressable>
        {canAdjustSession ? (
          <>
            <View style={styles.adjustments}>
              <AdjustmentButton
                label="Make it shorter"
                selected={adjustment === 'shorter'}
                onPress={() => setAdjustment((value) => (value === 'shorter' ? null : 'shorter'))}
              />
              <AdjustmentButton
                label="Make it gentler"
                selected={adjustment === 'gentler'}
                onPress={() => setAdjustment((value) => (value === 'gentler' ? null : 'gentler'))}
              />
              <AdjustmentButton
                label="No equipment today"
                selected={adjustment === 'no_equipment'}
                onPress={() => setAdjustment((value) => (value === 'no_equipment' ? null : 'no_equipment'))}
              />
              <AdjustmentButton
                label="Something hurts"
                selected={adjustment === 'something_hurts'}
                onPress={() => setAdjustment((value) => (value === 'something_hurts' ? null : 'something_hurts'))}
              />
            </View>
            {adjustment === 'something_hurts' ? (
              <View style={styles.painAreas}>
                {PAIN_AREAS.map((area) => (
                  <AdjustmentButton
                    key={area.value}
                    label={area.label}
                    selected={painArea === area.value}
                    onPress={() => setPainArea((value) => (value === area.value ? null : area.value))}
                  />
                ))}
              </View>
            ) : null}
            {adjustment ? (
              <Text style={styles.adjustmentNote}>{adjustmentCopy(adjustment)}</Text>
            ) : null}
          </>
        ) : null}
      </View>

      <Card>
        <SectionHeader title="Your 4-week block" />
        <View style={styles.blockRow}>
          <SnapshotTile label="Block" value={block ? `Week ${block.weekNumber} of ${block.totalWeeks}` : 'Ready after check-up'} />
          <SnapshotTile
            label="Re-test"
            value={block?.retestInDays !== undefined ? `In ${block.retestInDays} days` : 'After your block'}
          />
        </View>
        <Text style={styles.cardBody}>
          {block
            ? `${block.focusTitle}. ${block.sessionsCompleteThisWeek} of ${block.sessionsTargetThisWeek} sessions are done this week.`
            : 'Complete your Movement Check-Up to create a plan-led block.'}
        </Text>
      </Card>

      <Card>
        <SectionHeader title="Movement snapshot" />
        {SNAPSHOT_ROWS.map((row) => {
          const band = snapshot?.[row.key];
          return (
            <HealthMetricRow
              key={row.key}
              icon={row.icon}
              label={row.title}
              value={band ? bandValue(band) : 'Baseline pending'}
              status={band ? bandStatus(band) : 'Movement Check-Up'}
            />
          );
        })}
      </Card>
    </Screen>
  );
}

function MiniProgressRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniProgressRow}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.miniValue}>{value}</Text>
    </View>
  );
}

function AdjustmentButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.adjustment, selected && styles.adjustmentSelected, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.adjustmentText, selected && styles.adjustmentTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function SnapshotTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.snapshotTile}>
      <Text style={styles.snapshotValue}>{value}</Text>
      <Text style={styles.snapshotLabel}>{label}</Text>
    </View>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function adjustmentCopy(adjustment: TodaySessionAdjustment): string {
  if (adjustment === 'shorter') return 'Today will favor a shorter session length.';
  if (adjustment === 'gentler') return 'Today will keep the session calmer and more supported.';
  if (adjustment === 'no_equipment') return 'Today will prefer zero-equipment choices where possible.';
  return 'Move only in a comfortable range. You can stop at any time.';
}

function bandValue(band: MovementSnapshotBand): string {
  if (band === 'strong') return 'Strong';
  if (band === 'building') return 'Building';
  return 'Starting point';
}

function bandStatus(band: MovementSnapshotBand): string {
  if (band === 'strong') return 'Protect progress';
  if (band === 'building') return 'Keep building';
  return 'Fresh focus';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  headerCopy: { flex: 1 },
  greeting: { ...type.display },
  tagline: { ...type.body, color: colors.textSecondary, marginTop: spacing.sm },
  progressCard: { gap: spacing.lg },
  progressHead: { gap: spacing.xs },
  progressMeta: { ...type.caption, color: colors.textSecondary },
  progressBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  progressRows: { flex: 1, gap: spacing.sm },
  miniProgressRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.input,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.subtleBorder,
  },
  miniLabel: { ...type.caption, color: colors.textSecondary },
  miniValue: { ...type.bodySmall, color: colors.accentDeep, fontFamily: type.button.fontFamily },
  featureCard: {
    overflow: 'hidden',
    borderRadius: radius.panel,
    padding: spacing.xl,
    backgroundColor: colors.oliveSage,
    borderWidth: 1,
    borderColor: colors.oliveSage,
    gap: spacing.lg,
  },
  featureGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: radius.pill,
    right: -42,
    top: -52,
    backgroundColor: colors.warmStone,
    opacity: 0.22,
  },
  primaryCopy: { flex: 1 },
  featureEyebrow: { ...type.label, color: colors.textOnDark },
  featureTitle: { ...type.h1, color: colors.textOnDark, marginTop: spacing.sm },
  featureBody: { ...type.bodySmall, color: colors.textOnDark, opacity: 0.86, marginTop: spacing.sm },
  featureButton: {
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.elevatedCard,
  },
  featureButtonText: { ...type.button, color: colors.oliveSageDark },
  adjustments: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  painAreas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  adjustment: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.input,
    backgroundColor: colors.elevatedCard,
    borderWidth: 1,
    borderColor: colors.borderHairline,
  },
  adjustmentSelected: { backgroundColor: colors.sageMist, borderColor: colors.restorativeGreen },
  adjustmentText: { ...type.caption, color: colors.textSecondary },
  adjustmentTextSelected: { color: colors.accentDeep },
  adjustmentNote: { ...type.caption, color: colors.sageDeep, marginTop: spacing.sm },
  blockRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  snapshotTile: {
    flex: 1,
    minHeight: 82,
    borderRadius: radius.input,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderHairline,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  snapshotValue: { ...type.h3 },
  snapshotLabel: { ...type.caption, marginTop: 2 },
  cardBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.md },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
});
