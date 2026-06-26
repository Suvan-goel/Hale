import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HeaderLogo } from '../components/HeaderLogo';
import { Card, PrimaryButton, Screen } from '../components/ui';
import type { CheckUp } from '../checkup/types';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  BALANCE_EYES_OPEN_V2_ID,
  CHAIR_RISE_V2_ID,
  HINGE_REACH_ID,
  ONE_LEG_BALANCE_V2_ID,
  type ActiveShoulderReachV2Result,
  type BalanceEyesOpenV2Result,
  type ChairRiseV2Result,
  type HingeReachResult,
  type OneLegBalanceV2Result,
} from '../movements';
import { colors, spacing, type } from '../theme';

interface ResultRow {
  label: string;
  value: string;
}

export function MovementProfileV2PracticeResultsScreen({
  checkUp,
  onDone,
}: {
  checkUp: CheckUp;
  onDone: () => void;
}) {
  const rows = React.useMemo(() => practiceRows(checkUp), [checkUp]);
  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <HeaderLogo />
          <Text style={styles.title}>Optional check-up saved</Text>
        </View>
        <Text style={styles.subtitle}>
          This full Movement Check-Up is for your reference only. It did not update your Movement Profile or plan.
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Captured today</Text>
        <View style={styles.rowStack}>
          {rows.map((row, index) => (
            <View key={row.label} style={[styles.row, index > 0 && styles.rowDivider]}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={styles.note}>
        Optional check-ups stay separate from your official history, plan timing, and block reports.
      </Text>
      <PrimaryButton title="Done" onPress={onDone} />
    </Screen>
  );
}

function practiceRows(checkUp: CheckUp): ResultRow[] {
  const rows: ResultRow[] = [];
  const chair = resultFor<ChairRiseV2Result>(checkUp, CHAIR_RISE_V2_ID);
  const balanceEyesOpen = resultFor<BalanceEyesOpenV2Result>(checkUp, BALANCE_EYES_OPEN_V2_ID);
  const balanceLegacy = resultFor<OneLegBalanceV2Result>(checkUp, ONE_LEG_BALANCE_V2_ID);
  const shoulder = resultFor<ActiveShoulderReachV2Result>(checkUp, ACTIVE_SHOULDER_REACH_V2_ID);
  const hinge = resultFor<HingeReachResult>(checkUp, HINGE_REACH_ID);

  rows.push({
    label: 'Chair rises',
    value: chair && Number.isFinite(chair.reps) ? `${chair.reps} in 30 seconds` : 'Not captured',
  });
  rows.push({
    label: 'Rise velocity',
    value: chair && Number.isFinite(chair.sessionMeanVel) ? `${chair.sessionMeanVel.toFixed(2)} body units/sec` : 'Not captured',
  });
  rows.push({
    label: 'Balance',
    value: balanceEyesOpen && Number.isFinite(balanceEyesOpen.totalMaintainedMs)
      ? `${Math.round(balanceEyesOpen.totalMaintainedMs / 1000)} sec total`
      : balanceLegacy && Number.isFinite(balanceLegacy.bestHoldSec)
      ? `${Math.round(balanceLegacy.bestHoldSec)} sec best hold`
      : 'Not captured',
  });
  rows.push({
    label: 'Shoulder reach',
    value: shoulder && Number.isFinite(shoulder.peakFlexionDeg)
      ? `${Math.round(shoulder.peakFlexionDeg)} deg`
      : 'Not captured',
  });
  rows.push({
    label: 'Hinge reach',
    value: hinge && typeof hinge.reachBu === 'number' && Number.isFinite(hinge.reachBu)
      ? `${hinge.reachBu.toFixed(2)} body units`
      : 'Not captured',
  });
  return rows;
}

function resultFor<T>(checkUp: CheckUp, movementId: string): T | null {
  const item = checkUp.items.find((entry) => entry.movementId === movementId && entry.status === 'measured');
  return item?.result ? (item.result as T) : null;
}

const styles = StyleSheet.create({
  screen: {
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  title: {
    ...type.pageTitle,
    flexShrink: 1,
  },
  subtitle: {
    ...type.body,
    color: colors.textSecondary,
  },
  card: {
    gap: spacing.md,
  },
  cardTitle: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  rowStack: {
    gap: 0,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderHairline,
  },
  rowLabel: {
    ...type.cardBody,
    color: colors.textSecondary,
    flex: 1,
  },
  rowValue: {
    ...type.cardBody,
    color: colors.textPrimary,
    textAlign: 'right',
    flexShrink: 0,
  },
  note: {
    ...type.caption,
    color: colors.textSecondary,
  },
});
