import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  Card,
  EmptyState,
  HealthMetricRow,
  MetricCard,
  PrimaryButton,
  Screen,
  SectionHeader,
  SettingsIconButton,
  StatusBadge,
} from '../components/ui';
import type { MovementSnapshot, MovementSnapshotBand } from '../haleFlow';
import type { StoredCheckUp } from '../history';
import { CheckUpScore, Domain } from '../scoring';
import { colors, spacing, type } from '../theme';

type SnapshotKey = keyof MovementSnapshot;

const DOMAIN_INITIAL: Record<Domain, string> = {
  strength: 'S',
  balance: 'B',
  mobility: 'M',
};

const DOMAIN_TITLES: Record<Domain, string> = {
  strength: 'Strength / Power',
  balance: 'Balance',
  mobility: 'Mobility',
};

const SNAPSHOT_ROWS: readonly { key: SnapshotKey; title: string }[] = [
  { key: 'strengthPower', title: 'Strength / Power' },
  { key: 'balance', title: 'Balance' },
  { key: 'mobility', title: 'Mobility' },
];

export function ProgressScreen({
  latestCheckUp,
  score,
  movementSnapshot,
  checkUpCount,
  onBeginCheckUp,
  onViewLatest,
  onOpenSettings,
}: {
  latestCheckUp: StoredCheckUp | null;
  score: CheckUpScore | null;
  movementSnapshot?: MovementSnapshot;
  checkUpCount: number;
  onBeginCheckUp: () => void;
  onViewLatest: () => void;
  onOpenSettings: () => void;
}) {
  const measured = score ? score.domains.filter((domain) => domain.measured) : [];
  const snapshotCount = SNAPSHOT_ROWS.filter((row) => movementSnapshot?.[row.key]).length;
  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Movement Progress</Text>
          <Text style={styles.subtitle}>Your Movement Check-Up history and block progress build here.</Text>
        </View>
        <SettingsIconButton onPress={onOpenSettings} />
      </View>

      <Card>
        <View style={styles.latestHead}>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Latest Movement Check-Up</Text>
            <Text style={styles.cardBody}>
              {latestCheckUp
                ? `Saved ${formatDate(latestCheckUp.checkUp.startedAt)}`
                : 'Complete your first Movement Check-Up to see your baseline.'}
            </Text>
          </View>
          <StatusBadge label={latestCheckUp ? 'Baseline saved' : 'Not started'} tone={latestCheckUp ? 'good' : 'gold'} />
        </View>
        <View style={styles.actionWrap}>
          <PrimaryButton title={latestCheckUp ? 'View latest' : 'Start Movement Check-Up'} onPress={latestCheckUp ? onViewLatest : onBeginCheckUp} />
        </View>
      </Card>

      <View style={styles.metricGrid}>
        <MetricCard
          label="Check-ups"
          value={`${checkUpCount}`}
          detail={checkUpCount > 0 ? 'trend building' : 'clean slate'}
        />
        <MetricCard
          label="Domains"
          value={`${snapshotCount || measured.length}/3`}
          detail={snapshotCount > 0 || measured.length > 0 ? 'measured' : 'baseline pending'}
        />
      </View>

      <Card>
        <SectionHeader title="Movement snapshot" />
        {movementSnapshot ? (
          SNAPSHOT_ROWS.map((row) => {
            const band = movementSnapshot[row.key];
            return (
              <HealthMetricRow
                key={row.key}
                label={row.title}
                value={band ? bandValue(band) : 'Baseline pending'}
                status={band ? bandStatus(band) : 'Movement Check-Up'}
              />
            );
          })
        ) : (
          <Text style={styles.cardBody}>Complete your first Movement Check-Up to see Strength / Power, Balance, and Mobility.</Text>
        )}
      </Card>

      <Card>
        <SectionHeader title="Movement ages" />
        {score ? (
          score.domains.map((domain) => (
            <HealthMetricRow
              key={domain.domain}
              icon={DOMAIN_INITIAL[domain.domain]}
              label={DOMAIN_TITLES[domain.domain]}
              value={domain.measured ? `Age ${domain.ageLow}-${domain.ageHigh}` : 'Baseline pending'}
              status={domain.measured ? (domain.estimated ? 'Estimate' : 'Measured') : 'Next check-up'}
            />
          ))
        ) : (
          <Text style={styles.cardBody}>Movement-age ranges appear after a completed check-up.</Text>
        )}
      </Card>

      <EmptyState
        title="Ladder progress"
        body="Exercise ladder levels will appear as Hale connects completed sessions with progression history."
      />

      <EmptyState
        title="Re-test history"
        body="Monthly re-tests will show how your 4-week blocks are helping you stay capable."
      />
    </Screen>
  );
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

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'recently';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
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
  latestHead: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  cardTitle: { ...type.h2 },
  cardBody: { ...type.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  actionWrap: { marginTop: spacing.lg },
  metricGrid: { flexDirection: 'row', gap: spacing.md },
});
