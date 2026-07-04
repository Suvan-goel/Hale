import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HeaderLogo } from '../components/HeaderLogo';
import { Card, PrimaryButton, Screen } from '../components/ui';
import type { CheckUp } from '../checkup/types';
import {
  ACTIVE_SHOULDER_REACH_V2_ID,
  BALANCE_EYES_OPEN_V2_ID,
  CHAIR_RISE_V2_ID,
  ONE_LEG_BALANCE_V2_ID,
  type ActiveShoulderReachV2Result,
  type BalanceEyesOpenV2Result,
  type ChairRiseV2Result,
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
          <Text style={styles.title}>Your check-in today</Text>
        </View>
        <Text style={styles.subtitle}>
          Here is how today went. Your Movement Profile and plan are unchanged.
        </Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <View style={styles.rowStack}>
          {rows.length === 0 ? (
            <Text style={styles.rowLabel}>No measurements were captured this time.</Text>
          ) : (
            rows.map((row, index) => (
              <View key={row.label} style={[styles.row, index > 0 && styles.rowDivider]}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))
          )}
        </View>
      </Card>

      <Text style={styles.note}>
        This was a one-time look at today. Your official check-ups are what update your plan.
      </Text>
      <PrimaryButton title="Done" onPress={onDone} />
    </Screen>
  );
}

// Only what was actually measured, in plain units — no "Not captured" filler rows and
// no internal metrics (rise velocity in body units means nothing without a trend).
function practiceRows(checkUp: CheckUp): ResultRow[] {
  const rows: ResultRow[] = [];
  const chair = resultFor<ChairRiseV2Result>(checkUp, CHAIR_RISE_V2_ID);
  const balanceEyesOpen = resultFor<BalanceEyesOpenV2Result>(checkUp, BALANCE_EYES_OPEN_V2_ID);
  const balanceLegacy = resultFor<OneLegBalanceV2Result>(checkUp, ONE_LEG_BALANCE_V2_ID);
  const shoulder = resultFor<ActiveShoulderReachV2Result>(checkUp, ACTIVE_SHOULDER_REACH_V2_ID);

  if (chair && Number.isFinite(chair.reps)) {
    rows.push({ label: 'Chair rises', value: `${chair.reps} in 30 seconds` });
  }
  if (balanceEyesOpen && Number.isFinite(balanceEyesOpen.totalMaintainedMs)) {
    rows.push({ label: 'Balance', value: `${Math.round(balanceEyesOpen.totalMaintainedMs / 1000)} sec total` });
  } else if (balanceLegacy && Number.isFinite(balanceLegacy.bestHoldSec)) {
    rows.push({ label: 'Balance', value: `${Math.round(balanceLegacy.bestHoldSec)} sec best hold` });
  }
  if (shoulder && Number.isFinite(shoulder.peakFlexionDeg)) {
    rows.push({ label: 'Shoulder reach', value: `${Math.round(shoulder.peakFlexionDeg)}°` });
  }
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
