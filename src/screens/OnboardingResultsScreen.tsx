import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import type { CheckUp } from '../checkup';
import type { MovementAssessment } from '../adherence';
import { Card, HealthMetricRow, MaterialCard, PrimaryButton, Screen, ScreenHeader, StatusBadge, Typography } from '../components/ui';
import { getAssessmentResultState } from '../haleFlow/assessmentResultState';
import {
  bandLabel,
  onboardingDomainSummaries,
  onboardingFocusCopy,
  onboardingFocusDomain,
} from '../onboarding/results';
import { DOMAIN_LABEL, selectFocusFromScore, type CheckUpScore, type ScoreFocusSelection, type VersionedCheckUpScoreSnapshot } from '../scoring';
import { colors, spacing } from '../theme';

const ICONS = {
  strength_power: 'S',
  balance_stability: 'B',
  mobility_flexibility: 'M',
} as const;

export function OnboardingResultsScreen({
  checkUp: _checkUp,
  assessment,
  score,
  scoreSnapshot,
  onCreateBlock,
  onRetake,
}: {
  checkUp: CheckUp;
  assessment?: MovementAssessment | null;
  score?: CheckUpScore | null;
  scoreSnapshot?: VersionedCheckUpScoreSnapshot | null;
  onCreateBlock: () => void;
  onRetake: () => void;
}) {
  const resultState = React.useMemo(() => getAssessmentResultState({ score: score ?? null, scoreSnapshot, assessment }), [assessment, score, scoreSnapshot]);
  const focusSelection = React.useMemo(
    () => scoreSnapshot?.focusSelection ?? selectFocusFromScore(score, { activeFocusDomain: score?.weakestDomain }),
    [score, scoreSnapshot]
  );
  const closelyMatched = focusSelection?.kind === 'exact_tie' || focusSelection?.kind === 'near_tie';
  const focus = resultState.canCreateBlock && score ? onboardingFocusDomain(score) : null;
  const summaries = score ? onboardingDomainSummaries(score) : [];
  return (
    <Screen>
      <View style={styles.header}>
        <ScreenHeader
          eyebrow="Step 8 of 10"
          title="Your Movement Check-Up results"
          subtitle="Here is the simple picture from today’s home estimate."
        />
      </View>

      {focus ? (
        <MaterialCard>
          <Typography variant="label" color={colors.accentDeep}>{closelyMatched ? 'Closely matched starting point' : 'Suggested first focus'}</Typography>
          <Typography variant="h1" style={styles.focusValue}>
            {closelyMatched ? tiedDomainLabels(focusSelection) : onboardingFocusCopy(focus)}
          </Typography>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.body}>
            {closelyMatched
              ? `${onboardingFocusCopy(focus)} is the suggested first focus because these home estimates were closely matched.`
              : 'Hale will use this home estimate as a starting point for your first 4-week block.'}
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

      {summaries.length > 0 ? (
        <Card style={styles.card}>
          {summaries.map((domain) => (
            <HealthMetricRow
              key={domain.key}
              icon={ICONS[domain.key]}
              label={domain.title}
              value={bandLabel(domain.band)}
              status={focus && domain.key === focus ? 'Suggested focus' : closelyMatched && domainIsTied(domain.key, focusSelection) ? 'Closely matched' : 'Home estimate'}
            />
          ))}
        </Card>
      ) : null}

      {resultState.canCreateBlock ? (
        <Card style={styles.card}>
          <View style={styles.noteHead}>
            <Typography variant="h2">What happens next</Typography>
            <StatusBadge label="4-week block" tone="gold" />
          </View>
          <Typography variant="bodySmall" color={colors.textSecondary} style={styles.body}>
            You will get three calm Hale Sessions each week, then repeat the check-up in 4 weeks to add another data point.
          </Typography>
        </Card>
      ) : null}

      {resultState.canCreateBlock ? (
        <PrimaryButton title="Create my 4-week block" onPress={onCreateBlock} />
      ) : resultState.canRetake ? (
        <PrimaryButton title="Retake Movement Check-Up" onPress={onRetake} />
      ) : (
        <PrimaryButton title="Done" onPress={onRetake} />
      )}
    </Screen>
  );
}

function tiedDomainLabels(focusSelection: ScoreFocusSelection | null | undefined): string {
  if (!focusSelection) return '';
  return focusSelection.tiedDomains.map((domain) => DOMAIN_LABEL[domain]).join(' + ');
}

function domainIsTied(
  domain: 'strength_power' | 'balance_stability' | 'mobility_flexibility',
  focusSelection: ScoreFocusSelection | null | undefined
): boolean {
  if (!focusSelection) return false;
  if (domain === 'strength_power') return focusSelection.tiedDomains.includes('strength');
  if (domain === 'balance_stability') return focusSelection.tiedDomains.includes('balance');
  return focusSelection.tiedDomains.includes('mobility');
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs },
  focusValue: { marginTop: spacing.sm },
  body: { marginTop: spacing.sm },
  card: { gap: spacing.md },
  noteHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, flexWrap: 'wrap' },
});
