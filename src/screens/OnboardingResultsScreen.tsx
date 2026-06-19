import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CheckUp } from '../checkup';
import { Card, HealthMetricRow, MaterialCard, PrimaryButton, Screen, StatusBadge, Typography } from '../components/ui';
import { getAssessmentResultState } from '../haleFlow/assessmentResultState';
import {
  bandLabel,
  onboardingDomainSummaries,
  onboardingFocusCopy,
  onboardingFocusDomain,
} from '../onboarding/results';
import { scoreCheckUp } from '../scoring';
import { colors, spacing } from '../theme';

const ICONS = {
  strength_power: 'S',
  balance_stability: 'B',
  mobility_flexibility: 'M',
} as const;

export function OnboardingResultsScreen({
  checkUp,
  onCreateBlock,
  onRetake,
}: {
  checkUp: CheckUp;
  onCreateBlock: () => void;
  onRetake: () => void;
}) {
  const score = React.useMemo(() => scoreCheckUp(checkUp), [checkUp]);
  const resultState = React.useMemo(() => getAssessmentResultState({ score }), [score]);
  const focus = resultState.canCreateBlock ? onboardingFocusDomain(score) : null;
  const summaries = onboardingDomainSummaries(score);
  return (
    <Screen>
      <View style={styles.header}>
        <Typography variant="label" color={colors.accentDeep}>Step 8 of 10</Typography>
        <Typography variant="display">Your Movement Check-Up results</Typography>
        <Typography variant="body" color={colors.textSecondary}>Here is the simple picture from today’s baseline.</Typography>
      </View>

      {focus ? (
        <MaterialCard>
          <Typography variant="label" color={colors.accentDeep}>Your main opportunity</Typography>
          <Typography variant="h1" style={styles.focusValue}>{onboardingFocusCopy(focus)}</Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.body}>
            Hale will use this to shape your first 4-week block.
          </Typography>
        </MaterialCard>
      ) : (
        <MaterialCard>
          <Typography variant="label" color={colors.accentDeep}>Retake needed</Typography>
          <Typography variant="h1" style={styles.focusValue}>{resultState.recoveryTitle}</Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.body}>
            {resultState.recoveryBody}
          </Typography>
        </MaterialCard>
      )}

      <Card style={styles.card}>
        {summaries.map((domain) => (
          <HealthMetricRow
            key={domain.key}
            icon={ICONS[domain.key]}
            label={domain.title}
            value={bandLabel(domain.band)}
            status={focus && domain.key === focus ? 'Main focus' : 'Baseline'}
          />
        ))}
      </Card>

      {resultState.canCreateBlock ? (
        <Card style={styles.card}>
          <View style={styles.noteHead}>
            <Typography variant="h2">What happens next</Typography>
            <StatusBadge label="4-week block" tone="gold" />
          </View>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.body}>
            You will get three calm Hale Sessions each week, then re-test in 4 weeks to see what changed.
          </Typography>
        </Card>
      ) : null}

      {resultState.canCreateBlock ? (
        <PrimaryButton title="Create my 4-week block" onPress={onCreateBlock} />
      ) : (
        <PrimaryButton title="Retake Movement Check-Up" onPress={onRetake} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.sm },
  focusValue: { marginTop: spacing.sm },
  body: { marginTop: spacing.sm },
  card: { gap: spacing.md },
  noteHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
});
